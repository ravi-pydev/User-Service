import { useEffect } from 'react';
import useAuth from '../hooks/useAuth';

/**
 * ProtectedRoute — wraps a route element and opens the login modal for
 * unauthenticated users instead of navigating away.
 *
 * Props:
 *   children      {ReactNode} - the protected content
 *   onOpenLogin   {function}  - callback to open the login modal
 */
export default function ProtectedRoute({ children, onOpenLogin }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      onOpenLogin?.();
    }
  }, [isAuthenticated, onOpenLogin]);

  if (!isAuthenticated) {
    // Render nothing while the modal opens
    return null;
  }

  return children;
}
