import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, AuthProvider } from '../auth/AuthContext';
import { useContext } from 'react';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal JWT with the given payload (no real signature).
 * The token is structurally valid (3 base64url parts) but not cryptographically signed.
 */
function buildFakeJwt(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const body = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${header}.${body}.fakesig`;
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

/** Renders AuthProvider inside a MemoryRouter and returns the context value. */
function renderAuthProvider(initialEntries = ['/']) {
  let ctx;
  function Consumer() {
    ctx = useContext(AuthContext);
    return null;
  }
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    </MemoryRouter>
  );
  return () => ctx;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('AuthProvider — initial state (no stored token)', () => {
  it('starts unauthenticated when localStorage is empty', () => {
    const getCtx = renderAuthProvider();
    const ctx = getCtx();
    expect(ctx.user).toBeNull();
    expect(ctx.token).toBeNull();
    expect(ctx.isAuthenticated).toBe(false);
  });

  it('exposes login and logout functions', () => {
    const getCtx = renderAuthProvider();
    const ctx = getCtx();
    expect(typeof ctx.login).toBe('function');
    expect(typeof ctx.logout).toBe('function');
  });
});

describe('AuthProvider — restoring session from localStorage', () => {
  it('restores a valid non-expired token on mount', () => {
    const payload = {
      user_id: 1,
      username: 'alice',
      email: 'alice@example.com',
      is_premium: false,
      iat: nowSec() - 100,
      exp: nowSec() + 3600,
    };
    localStorage.setItem('auth_token', buildFakeJwt(payload));

    const getCtx = renderAuthProvider();
    const ctx = getCtx();

    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.user).toMatchObject({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      is_premium: false,
    });
    expect(ctx.token).toBeTruthy();
  });

  it('discards an expired token on mount', () => {
    const payload = {
      user_id: 2,
      username: 'bob',
      email: 'bob@example.com',
      iat: nowSec() - 7200,
      exp: nowSec() - 3600, // already expired
    };
    localStorage.setItem('auth_token', buildFakeJwt(payload));

    const getCtx = renderAuthProvider();
    const ctx = getCtx();

    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.user).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('discards a malformed token on mount', () => {
    localStorage.setItem('auth_token', 'not.a.valid.jwt.at.all');

    const getCtx = renderAuthProvider();
    const ctx = getCtx();

    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.user).toBeNull();
  });
});

describe('AuthProvider — login()', () => {
  it('stores token to localStorage and updates state', () => {
    const getCtx = renderAuthProvider();
    const newUser = { id: 3, username: 'carol', email: 'carol@example.com', is_premium: true };
    const newToken = 'some.jwt.token';

    act(() => {
      getCtx().login(newToken, newUser);
    });

    const ctx = getCtx();
    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.user).toEqual(newUser);
    expect(ctx.token).toBe(newToken);
    expect(localStorage.getItem('auth_token')).toBe(newToken);
  });
});

describe('AuthProvider — logout()', () => {
  it('clears localStorage and resets state', () => {
    const payload = {
      user_id: 4,
      username: 'dave',
      email: 'dave@example.com',
      iat: nowSec() - 10,
      exp: nowSec() + 3600,
    };
    localStorage.setItem('auth_token', buildFakeJwt(payload));

    const getCtx = renderAuthProvider();

    act(() => {
      getCtx().logout();
    });

    const ctx = getCtx();
    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.user).toBeNull();
    expect(ctx.token).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Property-based test
// Feature: user-auth, Property 18: App initialises session from stored token
// ---------------------------------------------------------------------------

describe('Property 18: App initialises session from stored token', () => {
  /**
   * Validates: Requirements 6.1
   *
   * For any valid, non-expired JWT present in localStorage at application load
   * time, the Auth_Client SHALL treat the user as authenticated without
   * requiring a new login.
   */
  it('sets isAuthenticated=true for any valid non-expired token payload', () => {
    fc.assert(
      fc.property(
        // Generate valid user payloads
        fc.record({
          user_id: fc.integer({ min: 1, max: 1_000_000 }),
          username: fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
          email: fc.emailAddress(),
          is_premium: fc.boolean(),
        }),
        (userFields) => {
          localStorage.clear();

          const payload = {
            ...userFields,
            iat: nowSec() - 60,
            exp: nowSec() + 3600, // valid for 1 hour
          };
          localStorage.setItem('auth_token', buildFakeJwt(payload));

          let ctx;
          function Consumer() {
            ctx = useContext(AuthContext);
            return null;
          }

          const { unmount } = render(
            <MemoryRouter>
              <AuthProvider>
                <Consumer />
              </AuthProvider>
            </MemoryRouter>
          );

          expect(ctx.isAuthenticated).toBe(true);
          expect(ctx.user).not.toBeNull();
          expect(ctx.user.id).toBe(userFields.user_id);

          unmount();
          localStorage.clear();
        }
      ),
      { numRuns: 50 }
    );
  });
});
