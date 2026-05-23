import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage.jsx';

// ---------------------------------------------------------------------------
// Mock apiFetch
// ---------------------------------------------------------------------------

vi.mock('../api/client.js', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../api/client.js';

// ---------------------------------------------------------------------------
// Mock useAuth
// ---------------------------------------------------------------------------

const mockLogin = vi.fn();

vi.mock('../hooks/useAuth.js', () => ({
  default: () => ({
    login: mockLogin,
    logout: vi.fn(),
    user: null,
    token: null,
    isAuthenticated: false,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Render LoginPage inside a MemoryRouter so useNavigate works.
 * Returns the user-event instance for interaction.
 */
function renderLoginPage(initialEntries = ['/login']) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <LoginPage />
    </MemoryRouter>
  );
  return { user };
}

/**
 * Fill in both form fields.
 */
async function fillForm(user, { email = 'alice@example.com', password = 'secret123' } = {}) {
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/password/i), password);
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 5.1 — Component renders email and password fields
// ---------------------------------------------------------------------------

describe('5.1 — LoginPage renders required fields', () => {
  it('renders an email field', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders a password field', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders a submit button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 5.2 — Successful login (200) stores token and redirects to /
// ---------------------------------------------------------------------------

describe('5.2 — Successful login stores token and redirects to /', () => {
  it('calls login() with token and user on HTTP 200', async () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.test.sig';
    const userData = { id: 1, username: 'alice', email: 'alice@example.com' };
    apiFetch.mockResolvedValueOnce({ token, user: userData });

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(token, userData);
    });
  });

  it('redirects to / after a successful login', async () => {
    apiFetch.mockResolvedValueOnce({
      token: 'test-token',
      user: { id: 1, username: 'alice', email: 'alice@example.com' },
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div data-testid="home-page">Home</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });

  it('calls apiFetch with correct payload on submit', async () => {
    apiFetch.mockResolvedValueOnce({
      token: 'test-token',
      user: { id: 1, username: 'alice', email: 'alice@example.com' },
    });

    const { user } = renderLoginPage();
    await fillForm(user, { email: 'alice@example.com', password: 'secret123' });
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        '/api/auth/login/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'alice@example.com',
            password: 'secret123',
          }),
        })
      );
    });
  });
});

// ---------------------------------------------------------------------------
// 5.3 — HTTP 401 displays generic "Invalid email or password." message
// ---------------------------------------------------------------------------

describe('5.3 — HTTP 401 displays generic error message', () => {
  it('shows "Invalid email or password." on a 401 response', async () => {
    apiFetch.mockRejectedValueOnce({ status: 401, payload: { detail: 'Invalid credentials.' } });

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('does NOT show field-level errors on a 401 response', async () => {
    apiFetch.mockRejectedValueOnce({ status: 401, payload: { detail: 'Invalid credentials.' } });

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await screen.findByText(/invalid email or password/i);

    // No field-level error spans should be present
    expect(screen.queryByText(/email.*error/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/password.*error/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 5.4 — HTTP 400 displays field-level errors adjacent to fields
// ---------------------------------------------------------------------------

describe('5.4 — HTTP 400 displays field-level errors', () => {
  it('shows email error adjacent to the email field', async () => {
    apiFetch.mockRejectedValueOnce({
      status: 400,
      payload: { email: ['Enter a valid email address.'] },
    });

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
  });

  it('shows password error adjacent to the password field', async () => {
    apiFetch.mockRejectedValueOnce({
      status: 400,
      payload: { password: ['This field is required.'] },
    });

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/this field is required/i)).toBeInTheDocument();
  });

  it('shows multiple field errors simultaneously', async () => {
    apiFetch.mockRejectedValueOnce({
      status: 400,
      payload: {
        email: ['Email is invalid.'],
        password: ['Password is required.'],
      },
    });

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/email is invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 5.5 — Loading state disables submit button and shows spinner
// ---------------------------------------------------------------------------

describe('5.5 — Loading state during in-flight request', () => {
  it('disables the submit button while the request is in-flight', async () => {
    // Never resolves — keeps loading state active
    apiFetch.mockReturnValueOnce(new Promise(() => {}));

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    });
  });

  it('shows a spinner (aria-busy) while the request is in-flight', async () => {
    apiFetch.mockReturnValueOnce(new Promise(() => {}));

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /logging in/i });
      expect(btn).toHaveAttribute('aria-busy', 'true');
    });
  });

  it('re-enables the submit button after the request completes', async () => {
    apiFetch.mockRejectedValueOnce({ status: 500, payload: {} });

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log in/i })).not.toBeDisabled();
    });
  });
});

// ---------------------------------------------------------------------------
// 5.6 — Link to /signup is present
// ---------------------------------------------------------------------------

describe('5.6 — Link to /signup is present', () => {
  it('renders a link that points to /signup', () => {
    renderLoginPage();

    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
  });
});

// ---------------------------------------------------------------------------
// 5.7 — HTTP 5xx shows generic error message
// ---------------------------------------------------------------------------

describe('5.7 — HTTP 5xx shows generic error message', () => {
  it('shows a generic error banner on a 500 response', async () => {
    apiFetch.mockRejectedValueOnce({ status: 500, payload: {} });

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(/something went wrong/i)
    ).toBeInTheDocument();
  });

  it('shows a generic error banner on a 503 response', async () => {
    apiFetch.mockRejectedValueOnce({ status: 503, payload: {} });

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(/something went wrong/i)
    ).toBeInTheDocument();
  });

  it('re-enables the submit button after a 5xx response', async () => {
    apiFetch.mockRejectedValueOnce({ status: 500, payload: {} });

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await screen.findByText(/something went wrong/i);

    expect(screen.getByRole('button', { name: /log in/i })).not.toBeDisabled();
  });

  it('does NOT show field-level errors on a 5xx response', async () => {
    apiFetch.mockRejectedValueOnce({ status: 500, payload: {} });

    const { user } = renderLoginPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await screen.findByText(/something went wrong/i);

    // No field-level error spans should be present
    const alerts = screen.queryAllByRole('alert');
    // Only the generic banner should be present (not field-level errors)
    expect(alerts).toHaveLength(1);
  });
});
