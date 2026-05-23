import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import useAuth from '../hooks/useAuth';

/**
 * AuthModal — a single modal that hosts both Login and Signup views.
 *
 * Props:
 *   isOpen        {boolean}           - whether the modal is visible
 *   initialView   {'login'|'signup'}  - which form to show first
 *   onClose       {function}          - called when the modal is dismissed
 */
export default function AuthModal({ isOpen = false, initialView = 'login', onClose }) {
  const { login } = useAuth();
  const [view, setView] = useState(initialView);
  // Increments each time the modal opens — used as a key to remount forms and clear state
  const [openCount, setOpenCount] = useState(0);

  // Sync view and bump openCount when the modal opens
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setOpenCount((c) => c + 1);
    }
  }, [isOpen, initialView]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Key includes openCount so forms fully remount on each open, clearing typed values.
  const resetKey = `${view}-${openCount}`;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={view === 'login' ? 'Log in' : 'Create an account'}
      onClick={handleOverlayClick}
    >
      <div className="auth-modal">
        <button
          type="button"
          className="auth-modal__close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        {view === 'login' ? (
          <LoginForm
            key={resetKey}
            onSuccess={onClose}
            onSwitchToSignup={() => setView('signup')}
            login={login}
          />
        ) : (
          <SignupForm
            key={resetKey}
            onSuccess={() => setView('login')}
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </div>
    </div>
  );
}

/* ── Login form ─────────────────────────────────────────────────────── */

function LoginForm({ onSuccess, onSwitchToSignup, login }) {
  const [fields, setFields] = useState({ identifier: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [genericError, setGenericError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setGenericError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setGenericError('');
    setLoading(true);

    try {
      const data = await apiFetch('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ identifier: fields.identifier, password: fields.password }),
      });
      login(data.token, data.user);
      onSuccess?.();
    } catch (err) {
      if (err.status === 401) {
        setGenericError('Invalid credentials.');
      } else if (err.status === 400) {
        const apiErrors = {};
        for (const [field, messages] of Object.entries(err.payload ?? {})) {
          apiErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        }
        setFieldErrors(apiErrors);
      } else {
        setGenericError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="auth-modal__title">Log in</h2>

      {genericError && (
        <p className="auth-error auth-error--generic" role="alert">
          {genericError}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="login-identifier" className="auth-label">
            Email or username
          </label>
          <input
            id="login-identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="you@example.com or your_username"
            value={fields.identifier}
            onChange={handleChange}
            disabled={loading}
            className={`auth-input${fieldErrors.identifier ? ' auth-input--error' : ''}`}
            aria-describedby={fieldErrors.identifier ? 'login-identifier-error' : undefined}
            required
          />
          {fieldErrors.identifier && (
            <span id="login-identifier-error" className="auth-field-error" role="alert">
              {fieldErrors.identifier}
            </span>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="login-password" className="auth-label">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={fields.password}
            onChange={handleChange}
            disabled={loading}
            className={`auth-input${fieldErrors.password ? ' auth-input--error' : ''}`}
            aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
            required
          />
          {fieldErrors.password && (
            <span id="login-password-error" className="auth-field-error" role="alert">
              {fieldErrors.password}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-submit"
          aria-busy={loading}
        >
          {loading ? (
            <><span className="auth-spinner" aria-hidden="true" /><span>Logging in…</span></>
          ) : 'Log in'}
        </button>
      </form>

      <p className="auth-footer">
        Don&apos;t have an account?{' '}
        <button type="button" className="auth-link-btn" onClick={onSwitchToSignup}>
          Sign up
        </button>
      </p>
    </>
  );
}

/* ── Signup form ────────────────────────────────────────────────────── */

function SignupForm({ onSuccess, onSwitchToLogin }) {
  const [fields, setFields] = useState({
    username: '', email: '', password: '', confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [genericError, setGenericError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setGenericError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (fields.password !== fields.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
      return;
    }

    setFieldErrors({});
    setGenericError('');
    setLoading(true);

    try {
      await apiFetch('/api/auth/signup/', {
        method: 'POST',
        body: JSON.stringify({
          username: fields.username,
          email: fields.email,
          password: fields.password,
        }),
      });
      // Switch to login view on success
      onSuccess?.();
    } catch (err) {
      if (err.status === 400) {
        const apiErrors = {};
        for (const [field, messages] of Object.entries(err.payload ?? {})) {
          apiErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        }
        setFieldErrors(apiErrors);
      } else {
        setGenericError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="auth-modal__title">Create an account</h2>

      {genericError && (
        <p className="auth-error auth-error--generic" role="alert">
          {genericError}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="signup-username" className="auth-label">Username</label>
          <input
            id="signup-username"
            name="username"
            type="text"
            autoComplete="username"
            value={fields.username}
            onChange={handleChange}
            disabled={loading}
            className={`auth-input${fieldErrors.username ? ' auth-input--error' : ''}`}
            aria-describedby={fieldErrors.username ? 'signup-username-error' : undefined}
            required
          />
          {fieldErrors.username && (
            <span id="signup-username-error" className="auth-field-error" role="alert">
              {fieldErrors.username}
            </span>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="signup-email" className="auth-label">Email</label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={handleChange}
            disabled={loading}
            className={`auth-input${fieldErrors.email ? ' auth-input--error' : ''}`}
            aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
            required
          />
          {fieldErrors.email && (
            <span id="signup-email-error" className="auth-field-error" role="alert">
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="signup-password" className="auth-label">Password</label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={fields.password}
            onChange={handleChange}
            disabled={loading}
            className={`auth-input${fieldErrors.password ? ' auth-input--error' : ''}`}
            aria-describedby={fieldErrors.password ? 'signup-password-error' : undefined}
            required
          />
          {fieldErrors.password && (
            <span id="signup-password-error" className="auth-field-error" role="alert">
              {fieldErrors.password}
            </span>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="signup-confirmPassword" className="auth-label">Confirm password</label>
          <input
            id="signup-confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={fields.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            className={`auth-input${fieldErrors.confirmPassword ? ' auth-input--error' : ''}`}
            aria-describedby={fieldErrors.confirmPassword ? 'signup-confirmPassword-error' : undefined}
            required
          />
          {fieldErrors.confirmPassword && (
            <span id="signup-confirmPassword-error" className="auth-field-error" role="alert">
              {fieldErrors.confirmPassword}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-submit"
          aria-busy={loading}
        >
          {loading ? (
            <><span className="auth-spinner" aria-hidden="true" /><span>Creating account…</span></>
          ) : 'Sign up'}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account?{' '}
        <button type="button" className="auth-link-btn" onClick={onSwitchToLogin}>
          Log in
        </button>
      </p>
    </>
  );
}
