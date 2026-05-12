import { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';

/**
 * useAuth — returns the current auth context value.
 * Must be used inside an <AuthProvider> tree.
 *
 * Returns: { user, token, login, logout, isAuthenticated }
 */
export default function useAuth() {
  const ctx = useContext(AuthContext);
  // Return safe defaults if used outside AuthProvider
  if (!ctx) {
    return {
      user: null,
      token: null,
      login: () => {},
      logout: () => {},
      registerOpenLogin: () => {},
      isAuthenticated: false,
    };
  }
  return ctx;
}
