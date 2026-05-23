import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useMarketplace from '../hooks/useMarketplace.js';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../api/client.js', () => ({ apiFetch: vi.fn() }));
vi.mock('../hooks/useAuth.js', () => ({ default: vi.fn() }));

import { apiFetch } from '../api/client.js';
import mockUseAuth from '../hooks/useAuth.js';

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
// Unit tests — useMarketplace.runMockUpgrade
// ---------------------------------------------------------------------------

describe('useMarketplace.runMockUpgrade — login() integration', () => {
  it('calls login(token, user) when upgrade response has payment_status === "success"', async () => {
    const mockLogin = vi.fn();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      user: null,
      token: null,
      isAuthenticated: false,
    });

    const successResponse = {
      payment_status: 'success',
      token: 'new.jwt.token',
      user: { id: 1, username: 'alice', email: 'alice@example.com', is_premium: true },
      message: 'Premium unlocked successfully',
    };
    apiFetch.mockResolvedValueOnce(successResponse);

    const { result } = renderHook(() => useMarketplace());

    await act(async () => {
      await result.current.runMockUpgrade('success');
    });

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith(
      successResponse.token,
      successResponse.user
    );
  });

  it('does NOT call login() when upgrade response has payment_status === "failure"', async () => {
    const mockLogin = vi.fn();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      user: null,
      token: null,
      isAuthenticated: false,
    });

    const failureResponse = {
      payment_status: 'failure',
      message: 'Payment failed.',
    };
    apiFetch.mockResolvedValueOnce(failureResponse);

    const { result } = renderHook(() => useMarketplace());

    await act(async () => {
      await result.current.runMockUpgrade('failure');
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });
});
