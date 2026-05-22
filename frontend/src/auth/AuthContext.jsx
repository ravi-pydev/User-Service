import { createContext, useState, useCallback, useRef } from 'react';

export const AuthContext = createContext(null);

/**
 * Decode the payload of a JWT without verifying the signature.
 * Returns the parsed payload object, or null if decoding fails.
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Returns true if the JWT payload's exp claim is in the future.
 */
function isTokenValid(payload) {
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp > Math.floor(Date.now() / 1000);
}

/**
 * Read and validate the stored token synchronously.
 * Returns { token, user } or { token: null, user: null } if invalid/absent.
 */
function readStoredSession() {
  try {
    const stored = localStorage.getItem('auth_token');
    if (!stored) return { token: null, user: null };

    const payload = decodeJwtPayload(stored);
    if (!isTokenValid(payload)) {
      localStorage.removeItem('auth_token');
      return { token: null, user: null };
    }

    return {
      token: stored,
      user: {
        id: payload.user_id,
        username: payload.username,
        email: payload.email,
        is_premium: payload.is_premium ?? false,
      },
    };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  // Initialize synchronously from localStorage — no flash of logged-out state on refresh
  const [token, setToken] = useState(() => readStoredSession().token);
  const [user, setUser] = useState(() => readStoredSession().user);

  // Ref to an optional callback that opens the login modal on logout
  const openLoginRef = useRef(null);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    // Merge is_premium from JWT payload if not present in newUser
    const payload = decodeJwtPayload(newToken);
    const enrichedUser = {
      ...newUser,
      is_premium: newUser.is_premium ?? payload?.is_premium ?? false,
    };
    setUser(enrichedUser);
  }, []);

  const logout = useCallback(async () => {
    // Best-effort call to backend logout endpoint
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      try {
        await fetch('/api/auth/logout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedToken}`,
          },
          credentials: 'include',
        });
      } catch {
        // Ignore network errors — always clear local state
      }
    }
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    openLoginRef.current?.();
  }, []);

  /** Called by App to register the modal opener so AuthContext doesn't need navigate. */
  const registerOpenLogin = useCallback((fn) => {
    openLoginRef.current = fn;
  }, []);

  const value = {
    user,
    token,
    login,
    logout,
    registerOpenLogin,
    isAuthenticated: Boolean(user && token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
