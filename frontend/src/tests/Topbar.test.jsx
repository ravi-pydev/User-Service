import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Topbar from '../components/Topbar.jsx';

// ---------------------------------------------------------------------------
// Mock useAuth
// ---------------------------------------------------------------------------

const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../hooks/useAuth.js', () => ({
  default: () => mockUseAuth(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Render Topbar inside a MemoryRouter so useNavigate works.
 * Accepts props to pass to Topbar.
 */
function renderTopbar(props = {}) {
  const defaultProps = {
    topbarStatus: null,
    onShowAll: vi.fn(),
    onShowPremium: vi.fn(),
    theme: 'light',
    onToggleTheme: vi.fn(),
  };
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Topbar {...defaultProps} {...props} />
    </MemoryRouter>
  );
  return { user };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockLogout.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 6.5 — Topbar shows login and register buttons when unauthenticated
// ---------------------------------------------------------------------------

describe('6.5 — Topbar shows login and register buttons when unauthenticated', () => {
  beforeEach(() => {
    // Mock unauthenticated state
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: mockLogout,
      isAuthenticated: false,
    });
  });

  it('renders a "Log in" button when unauthenticated', () => {
    renderTopbar();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('renders a "Sign up" button when unauthenticated', () => {
    renderTopbar();
    // The Sign up button has aria-label="Create account"
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('does NOT render username when unauthenticated', () => {
    renderTopbar();
    expect(screen.queryByText(/alice/i)).not.toBeInTheDocument();
  });

  it('does NOT render logout button when unauthenticated', () => {
    renderTopbar();
    expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 6.4 — Topbar shows username and logout button when authenticated
// ---------------------------------------------------------------------------

describe('6.4 — Topbar shows username and logout button when authenticated', () => {
  beforeEach(() => {
    // Mock authenticated state
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'alice', email: 'alice@example.com', is_premium: false },
      token: 'test-token',
      login: vi.fn(),
      logout: mockLogout,
      isAuthenticated: true,
    });
  });

  it('renders the username when authenticated', () => {
    renderTopbar();
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('renders a "Log out" button when authenticated', () => {
    renderTopbar();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('does NOT render "Log in" button when authenticated', () => {
    renderTopbar();
    expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument();
  });

  it('does NOT render "Sign up" button when authenticated', () => {
    renderTopbar();
    // The Sign up button has aria-label="Create account"
    expect(screen.queryByRole('button', { name: /create account/i })).not.toBeInTheDocument();
  });

  it('displays "Free" tier badge for non-premium user', () => {
    renderTopbar();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('displays "Premium" tier badge for premium user', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, username: 'bob', email: 'bob@example.com', is_premium: true },
      token: 'test-token',
      login: vi.fn(),
      logout: mockLogout,
      isAuthenticated: true,
    });
    renderTopbar();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 6.2 — Logout button calls useAuth().logout()
// ---------------------------------------------------------------------------

describe('6.2 — Logout button calls useAuth().logout()', () => {
  beforeEach(() => {
    // Mock authenticated state
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'alice', email: 'alice@example.com', is_premium: false },
      token: 'test-token',
      login: vi.fn(),
      logout: mockLogout,
      isAuthenticated: true,
    });
  });

  it('calls logout() when the logout button is clicked', async () => {
    const { user } = renderTopbar();
    const logoutButton = screen.getByRole('button', { name: /log out/i });

    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('does not call logout() on initial render', () => {
    renderTopbar();
    expect(mockLogout).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Feature: user-auth, Property 17: Topbar reflects authentication state
// Validates: Requirements 6.4
// ---------------------------------------------------------------------------

import fc from 'fast-check';
import { cleanup } from '@testing-library/react';

describe('Property 17: Topbar reflects authentication state', () => {
  /**
   * For any authenticated user object, the Topbar SHALL display that user's
   * username and a logout control, and SHALL NOT display the login or register
   * buttons.
   *
   * Validates: Requirements 6.4
   */
  it('displays username and logout control, hides login/register buttons for any authenticated user', () => {
    fc.assert(
      fc.property(
        // Generate valid user objects with realistic constraints
        fc.record({
          id: fc.integer({ min: 1, max: 1_000_000 }),
          username: fc
            .string({ minLength: 1, maxLength: 80 })
            .filter((s) => s.trim().length > 0 && s.trim() === s),
          email: fc.emailAddress(),
          is_premium: fc.boolean(),
        }),
        (generatedUser) => {
          // Clean up any previous render before starting this iteration
          cleanup();

          // Configure the module-level useAuth mock to return the generated user
          mockUseAuth.mockReturnValue({
            user: generatedUser,
            token: 'fake.jwt.token',
            isAuthenticated: true,
            login: vi.fn(),
            logout: vi.fn(),
          });

          renderTopbar();

          // Username must be displayed
          expect(screen.getByText(generatedUser.username)).toBeInTheDocument();

          // Logout control must be present
          expect(
            screen.getByRole('button', { name: /log out/i })
          ).toBeInTheDocument();

          // Login button must NOT be present
          expect(
            screen.queryByRole('button', { name: /log in/i })
          ).not.toBeInTheDocument();

          // Register / Sign up button must NOT be present (aria-label="Create account")
          expect(
            screen.queryByRole('button', { name: /create account/i })
          ).not.toBeInTheDocument();
        }
      ),
      { numRuns: 100 }
    );
  });
});
