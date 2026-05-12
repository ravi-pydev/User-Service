import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';

/**
 * SignupPage — renders a signup form with client-side validation and
 * server-side error display.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
export default function SignupPage() {
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Field-level errors: { username: string, email: string, password: string, confirmPassword: string }
  const [fieldErrors, setFieldErrors] = useState({});
  // Generic banner for 5xx errors
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

    // Client-side validation: password must match confirmPassword
    if (fields.password !== fields.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: 'Passwords do not match.',
      }));
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
      // HTTP 201 — redirect to login
      navigate('/login');
    } catch (err) {
      if (err.status === 400) {
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
        <h1 className="auth-title">Create an account</h1>

        {genericError && (
          <p className="auth-error auth-error--generic" role="alert">
            {genericError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="auth-field">
            <label htmlFor="username" className="auth-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={fields.username}
              onChange={handleChange}
              disabled={loading}
              className={`auth-input${fieldErrors.username ? ' auth-input--error' : ''}`}
              aria-describedby={fieldErrors.username ? 'username-error' : undefined}
              required
            />
            {fieldErrors.username && (
              <span id="username-error" className="auth-field-error" role="alert">
                {fieldErrors.username}
              </span>
            )}
          </div>

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
              autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="auth-field">
            <label htmlFor="confirmPassword" className="auth-label">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={fields.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              className={`auth-input${fieldErrors.confirmPassword ? ' auth-input--error' : ''}`}
              aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              required
            />
            {fieldErrors.confirmPassword && (
              <span id="confirmPassword-error" className="auth-field-error" role="alert">
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
              <>
                <span className="auth-spinner" aria-hidden="true" />
                <span>Creating account…</span>
              </>
            ) : (
              'Sign up'
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
