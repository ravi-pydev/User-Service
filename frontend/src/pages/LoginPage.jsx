import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import useAuth from '../hooks/useAuth';

/**
 * LoginPage — renders a login form with server-side error display.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fields, setFields] = useState({
    email: '',
    password: '',
  });

  // Field-level errors: { email: string, password: string }
  const [fieldErrors, setFieldErrors] = useState({});
  // Generic banner for 401 and 5xx errors
  const [genericError, setGenericError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear the error for this field as the user types
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
        body: JSON.stringify({
          email: fields.email,
          password: fields.password,
        }),
      });
      // HTTP 200 — store token and redirect to home
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      if (err.status === 401) {
        // Generic message to prevent user enumeration
        setGenericError('Invalid email or password.');
      } else if (err.status === 400) {
        // Field-level errors from the API: { field: ["message", ...] }
        const apiErrors = {};
        for (const [field, messages] of Object.entries(err.payload ?? {})) {
          apiErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        }
        setFieldErrors(apiErrors);
      } else {
        // 5xx or unexpected errors
        setGenericError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Log in</h1>

        {genericError && (
          <p className="auth-error auth-error--generic" role="alert">
            {genericError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={fields.email}
              onChange={handleChange}
              disabled={loading}
              className={`auth-input${fieldErrors.email ? ' auth-input--error' : ''}`}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              required
            />
            {fieldErrors.email && (
              <span id="email-error" className="auth-field-error" role="alert">
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={fields.password}
              onChange={handleChange}
              disabled={loading}
              className={`auth-input${fieldErrors.password ? ' auth-input--error' : ''}`}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              required
            />
            {fieldErrors.password && (
              <span id="password-error" className="auth-field-error" role="alert">
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
              <>
                <span className="auth-spinner" aria-hidden="true" />
                <span>Logging in…</span>
              </>
            ) : (
              'Log in'
            )}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="auth-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
