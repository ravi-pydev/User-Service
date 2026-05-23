import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

// ---------------------------------------------------------------------------
// Mock useAuth
// ---------------------------------------------------------------------------

let mockIsAuthenticated = false;

vi.mock('../hooks/useAuth.js', () => ({
  default: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockIsAuthenticated ? { id: 1, username: 'alice', email: 'alice@example.com' } : null,
    token: mockIsAuthenticated ? 'test-token' : null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Render ProtectedRoute inside a MemoryRouter with a /login route so
 * Navigate redirects can be observed.
 */
function renderProtectedRoute(children, initialPath = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/protected"
          element={<ProtectedRoute>{children}</ProtectedRoute>}
        />
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// 6.1 — ProtectedRoute renders children when authenticated
// ---------------------------------------------------------------------------

describe('ProtectedRoute — authenticated user', () => {
  it('renders children when isAuthenticated is true', () => {
    mockIsAuthenticated = true;

    renderProtectedRoute(<div data-testid="protected-content">Protected Content</div>);

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('does NOT redirect to /login when isAuthenticated is true', () => {
    mockIsAuthenticated = true;

    renderProtectedRoute(<div data-testid="protected-content">Protected Content</div>);

    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('renders nested children correctly when authenticated', () => {
    mockIsAuthenticated = true;

    renderProtectedRoute(
      <div>
        <h1>Dashboard</h1>
        <p data-testid="nested-child">Welcome back</p>
      </div>
    );

    expect(screen.getByTestId('nested-child')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 6.1 — ProtectedRoute redirects to /login when unauthenticated
// ---------------------------------------------------------------------------

describe('ProtectedRoute — unauthenticated user', () => {
  it('redirects to /login when isAuthenticated is false', () => {
    mockIsAuthenticated = false;

    renderProtectedRoute(<div data-testid="protected-content">Protected Content</div>);

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('does NOT render children when isAuthenticated is false', () => {
    mockIsAuthenticated = false;

    renderProtectedRoute(<div data-testid="protected-content">Protected Content</div>);

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});
