import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SignupPage from '../pages/SignupPage.jsx';

// ---------------------------------------------------------------------------
// Mock apiFetch
// ---------------------------------------------------------------------------

vi.mock('../api/client.js', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../api/client.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Render SignupPage inside a MemoryRouter so useNavigate works.
 * Returns the user-event instance for interaction.
 */
function renderSignupPage(initialEntries = ['/signup']) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <SignupPage />
    </MemoryRouter>
  );
  return { user };
}

/**
 * Fill in all four form fields and optionally submit.
 */
async function fillForm(user, { username = 'alice', email = 'alice@example.com', password = 'secret123', confirmPassword = 'secret123' } = {}) {
  await user.type(screen.getByLabelText(/username/i), username);
  await user.type(screen.getByLabelText(/email/i), email);
  // Use the first password field (label "Password"), then "Confirm password"
  const [passwordInput, confirmInput] = screen.getAllByLabelText(/password/i);
  await user.type(passwordInput, password);
  await user.type(confirmInput, confirmPassword);
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
// 4.1 — Component renders all four fields
// ---------------------------------------------------------------------------

describe('4.1 — SignupPage renders all required fields', () => {
  it('renders username, email, password, and confirmPassword fields', () => {
    renderSignupPage();

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

    // There are two password-related labels: "Password" and "Confirm password"
    const passwordFields = screen.getAllByLabelText(/password/i);
    expect(passwordFields).toHaveLength(2);
  });

  it('renders a submit button', () => {
    renderSignupPage();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4.2 — Successful signup (201) redirects to /login
// ---------------------------------------------------------------------------

describe('4.2 — Successful signup redirects to /login', () => {
  it('navigates to /login after a 201 response', async () => {
    apiFetch.mockResolvedValueOnce({ id: 1, username: 'alice', email: 'alice@example.com' });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    const [pwInput, confirmInput] = screen.getAllByLabelText(/password/i);
    await user.type(pwInput, 'secret123');
    await user.type(confirmInput, 'secret123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('calls apiFetch with correct payload on submit', async () => {
    apiFetch.mockResolvedValueOnce({ id: 1, username: 'alice', email: 'alice@example.com' });

    const { user } = renderSignupPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        '/api/auth/signup/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            username: 'alice',
            email: 'alice@example.com',
            password: 'secret123',
          }),
        })
      );
    });
  });
});

// ---------------------------------------------------------------------------
// 4.4 — Password mismatch shows client-side error without API call
// ---------------------------------------------------------------------------

describe('4.4 — Password mismatch is caught client-side', () => {
  it('shows a confirmPassword error when passwords do not match', async () => {
    const { user } = renderSignupPage();
    await fillForm(user, { password: 'secret123', confirmPassword: 'different456' });
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('does NOT call apiFetch when passwords do not match', async () => {
    const { user } = renderSignupPage();
    await fillForm(user, { password: 'secret123', confirmPassword: 'different456' });
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    // Give any async work a chance to run
    await waitFor(() => {
      expect(apiFetch).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// 4.3 — HTTP 400 displays field-level errors adjacent to fields
// ---------------------------------------------------------------------------

describe('4.3 — HTTP 400 displays field-level errors', () => {
  it('shows username error adjacent to the username field', async () => {
    apiFetch.mockRejectedValueOnce({
      status: 400,
      payload: { username: ['A user with that username already exists.'] },
    });

    const { user } = renderSignupPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/a user with that username already exists/i)).toBeInTheDocument();
  });

  it('shows email error adjacent to the email field', async () => {
    apiFetch.mockRejectedValueOnce({
      status: 400,
      payload: { email: ['This email is already registered.'] },
    });

    const { user } = renderSignupPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/this email is already registered/i)).toBeInTheDocument();
  });

  it('shows password error adjacent to the password field', async () => {
    apiFetch.mockRejectedValueOnce({
      status: 400,
      payload: { password: ['This password is too short.'] },
    });

    const { user } = renderSignupPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/this password is too short/i)).toBeInTheDocument();
  });

  it('shows multiple field errors simultaneously', async () => {
    apiFetch.mockRejectedValueOnce({
      status: 400,
      payload: {
        username: ['Username is taken.'],
        email: ['Email is taken.'],
      },
    });

    const { user } = renderSignupPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/username is taken/i)).toBeInTheDocument();
    expect(screen.getByText(/email is taken/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4.5 — Loading state disables submit button and shows spinner
// ---------------------------------------------------------------------------

describe('4.5 — Loading state during in-flight request', () => {
  it('disables the submit button while the request is in-flight', async () => {
    // Never resolves during the test — keeps loading state active
    apiFetch.mockReturnValueOnce(new Promise(() => {}));

    const { user } = renderSignupPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    // Button should now be disabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });
  });

  it('shows a spinner (aria-busy) while the request is in-flight', async () => {
    apiFetch.mockReturnValueOnce(new Promise(() => {}));

    const { user } = renderSignupPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /creating account/i });
      expect(btn).toHaveAttribute('aria-busy', 'true');
    });
  });

  it('re-enables the submit button after the request completes', async () => {
    apiFetch.mockRejectedValueOnce({ status: 500, payload: {} });

    const { user } = renderSignupPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign up/i })).not.toBeDisabled();
    });
  });
});

// ---------------------------------------------------------------------------
// 4.6 — Link to /login is present
// ---------------------------------------------------------------------------

describe('4.6 — Link to /login is present', () => {
  it('renders a link that points to /login', () => {
    renderSignupPage();

    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});

// ---------------------------------------------------------------------------
// 4.7 — HTTP 5xx shows generic error message
// ---------------------------------------------------------------------------

describe('4.7 — HTTP 5xx shows generic error message', () => {
  it('shows a generic error banner on a 500 response', async () => {
    apiFetch.mockRejectedValueOnce({ status: 500, payload: {} });

    const { user } = renderSignupPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(
      await screen.findByText(/something went wrong/i)
    ).toBeInTheDocument();
  });

  it('shows a generic error banner on a 503 response', async () => {
    apiFetch.mockRejectedValueOnce({ status: 503, payload: {} });

    const { user } = renderSignupPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(
      await screen.findByText(/something went wrong/i)
    ).toBeInTheDocument();
  });

  it('does NOT show field-level errors on a 5xx response', async () => {
    apiFetch.mockRejectedValueOnce({ status: 500, payload: {} });

    const { user } = renderSignupPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await screen.findByText(/something went wrong/i);

    // No field-level error spans should be present
    expect(screen.queryByRole('alert', { name: /username/i })).not.toBeInTheDocument();
  });
});

// Feature: user-auth, Property 15: Mismatched passwords are caught client-side
// Validates: Requirements 4.4

describe('Property 15 — Mismatched passwords are caught client-side', () => {
  it('always shows a validation error and never calls apiFetch for any pair of non-identical passwords', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .tuple(
            fc.stringMatching(/^[a-zA-Z0-9!@#$%^&*_+=:;,.?~-]{8,20}$/),
            fc.stringMatching(/^[a-zA-Z0-9!@#$%^&*_+=:;,.?~-]{8,20}$/)
          )
          .filter(([a, b]) => a !== b),
        async ([password, confirmPassword]) => {
          // Clean up any previous render before starting
          cleanup();
          vi.clearAllMocks();

          const user = userEvent.setup();
          render(
            <MemoryRouter initialEntries={['/signup']}>
              <SignupPage />
            </MemoryRouter>
          );

          await user.type(screen.getByLabelText(/username/i), 'testuser');
          await user.type(screen.getByLabelText(/email/i), 'test@example.com');
          const [passwordInput, confirmInput] = screen.getAllByLabelText(/password/i);
          await user.type(passwordInput, password);
          await user.type(confirmInput, confirmPassword);
          await user.click(screen.getByRole('button', { name: /sign up/i }));

          // Validation error must be visible
          const errorEl = await screen.findByText(/passwords do not match/i);
          expect(errorEl).toBeInTheDocument();

          // No API call should have been made
          expect(apiFetch).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 25 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: Signup form displays all server field errors
// Feature: user-auth, Property 14: Signup form displays all server field errors
// ---------------------------------------------------------------------------

import * as fc from 'fast-check';

describe('Property 14 — Signup form displays all server field errors', () => {
  it('displays each field error from HTTP 400 response adjacent to corresponding field', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a record with subsets of { username, email, password } fields
        fc.record(
          {
            username: fc.array(fc.string({ minLength: 1, maxLength: 80 }), { minLength: 1, maxLength: 1 }),
            email: fc.array(fc.string({ minLength: 1, maxLength: 80 }), { minLength: 1, maxLength: 1 }),
            password: fc.array(fc.string({ minLength: 1, maxLength: 80 }), { minLength: 1, maxLength: 1 }),
          },
          { requiredKeys: [] } // Allow any subset of fields
        ).filter((errors) => Object.keys(errors).length > 0), // Ensure at least one field has errors
        async (generatedErrors) => {
          // Mock apiFetch to throw HTTP 400 with generated errors
          apiFetch.mockRejectedValueOnce({
            status: 400,
            payload: generatedErrors,
          });

          const user = userEvent.setup();
          const { container } = render(
            <MemoryRouter initialEntries={['/signup']}>
              <SignupPage />
            </MemoryRouter>
          );

          // Scope all queries to this render's container to avoid cross-iteration conflicts
          const scope = within(container);

          await user.type(scope.getByLabelText(/username/i), 'alice');
          await user.type(scope.getByLabelText(/email/i), 'alice@example.com');
          const [passwordInput, confirmInput] = scope.getAllByLabelText(/password/i);
          await user.type(passwordInput, 'secret123');
          await user.type(confirmInput, 'secret123');
          await user.click(scope.getByRole('button', { name: /sign up/i }));

          // Wait for apiFetch to be called
          await waitFor(() => {
            expect(apiFetch).toHaveBeenCalled();
          });

          // Verify each field in the generated errors appears in the DOM
          for (const [, messages] of Object.entries(generatedErrors)) {
            const errorMessage = Array.isArray(messages) ? messages[0] : messages;
            // Find all alert elements in this render's container
            const alertElements = container.querySelectorAll('[role="alert"]');
            const found = Array.from(alertElements).some((el) =>
              el.textContent === errorMessage
            );
            expect(found).toBe(true);
          }

          // Clean up DOM and mocks for next iteration
          cleanup();
          vi.clearAllMocks();
        }
      ),
      { numRuns: 25 }
    );
  }, 60000); // 60s timeout for property-based test with 25 runs
});
