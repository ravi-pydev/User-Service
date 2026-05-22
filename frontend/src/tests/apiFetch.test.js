import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { apiFetch, registerOn401 } from '../api/client.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildFakeJwt(payload = {}) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const body = btoa(JSON.stringify(payload))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.fakesig`;
}

function makeResponse(status, body = {}, contentType = 'application/json') {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name) => (name === 'content-type' ? contentType : null) },
    json: () => Promise.resolve(body),
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  registerOn401(null);
});

afterEach(() => {
  localStorage.clear();
  registerOn401(null);
});

// ---------------------------------------------------------------------------
// Unit tests — Task 5.4: apiFetch 401 handling
// ---------------------------------------------------------------------------

describe('apiFetch — 401 handling', () => {
  it('removes auth_token from localStorage when a 401 response is received', async () => {
    const fakeToken = buildFakeJwt({ user_id: 1, exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem('auth_token', fakeToken);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      makeResponse(401, { detail: 'Authentication credentials were not provided.' })
    );

    await expect(apiFetch('/api/protected/')).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('invokes the registered on401 callback when a 401 response is received', async () => {
    const on401 = vi.fn();
    registerOn401(on401);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      makeResponse(401, { detail: 'Unauthorized' })
    );

    await expect(apiFetch('/api/protected/')).rejects.toMatchObject({ status: 401 });

    expect(on401).toHaveBeenCalledTimes(1);
  });

  it('does not throw when no on401 callback is registered', async () => {
    // registerOn401(null) already called in beforeEach
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      makeResponse(401, { detail: 'Unauthorized' })
    );

    await expect(apiFetch('/api/protected/')).rejects.toMatchObject({ status: 401 });
  });

  it('throws an error object with status: 401 when a 401 response is received', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      makeResponse(401, { detail: 'Unauthorized' })
    );

    let thrown;
    try {
      await apiFetch('/api/protected/');
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeDefined();
    expect(thrown.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Property-based test — Task 5.5
// Feature: user-auth, Property 9: 401 response always clears token and triggers callback
// ---------------------------------------------------------------------------

describe('Property 9: 401 response always clears token and triggers callback', () => {
  /**
   * Validates: Requirements 8.1, 8.2, 8.3
   *
   * For any API call via apiFetch that receives HTTP 401, the Auth_Client SHALL:
   * - remove auth_token from localStorage
   * - invoke the registered on401 callback
   * - throw an error object with status: 401
   */
  it('always clears token, calls on401, and throws {status:401} for any stored token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.integer({ min: 1, max: 1_000_000 }),
          exp: fc.integer({
            min: Math.floor(Date.now() / 1000) + 3600,
            max: Math.floor(Date.now() / 1000) + 86400,
          }),
        }).map((payload) => buildFakeJwt(payload)),
        async (token) => {
          localStorage.setItem('auth_token', token);

          const on401 = vi.fn();
          registerOn401(on401);

          vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            makeResponse(401, { detail: 'Unauthorized' })
          );

          let thrown;
          try {
            await apiFetch('/api/protected/');
          } catch (err) {
            thrown = err;
          }

          expect(localStorage.getItem('auth_token')).toBeNull();
          expect(on401).toHaveBeenCalledTimes(1);
          expect(thrown).toBeDefined();
          expect(thrown.status).toBe(401);

          localStorage.clear();
          registerOn401(null);
          vi.restoreAllMocks();
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property-based test
// Feature: user-auth, Property 13: Auth_Client attaches Bearer header when token is present
// ---------------------------------------------------------------------------

describe('Property 13: Auth_Client attaches Bearer header when token is present', () => {
  /**
   * Validates: Requirements 3.4
   *
   * For any API call via apiFetch while a JWT is stored in localStorage,
   * the outgoing request SHALL include Authorization: Bearer <token>.
   */
  it('attaches Authorization: Bearer <token> header for any stored token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.integer({ min: 1, max: 1_000_000 }),
          exp: fc.integer({
            min: Math.floor(Date.now() / 1000) + 3600,
            max: Math.floor(Date.now() / 1000) + 86400,
          }),
        }).map((payload) => buildFakeJwt(payload)),
        async (token) => {
          localStorage.setItem('auth_token', token);

          let capturedHeaders;
          vi.spyOn(globalThis, 'fetch').mockImplementation((url, init) => {
            capturedHeaders = init?.headers ?? {};
            return Promise.resolve(makeResponse(200, { ok: true }));
          });

          await apiFetch('/api/test/');

          expect(capturedHeaders['Authorization']).toBe(`Bearer ${token}`);

          localStorage.clear();
          vi.restoreAllMocks();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does NOT attach Authorization header when no token is stored', async () => {
    localStorage.removeItem('auth_token');

    let capturedHeaders;
    vi.spyOn(globalThis, 'fetch').mockImplementation((url, init) => {
      capturedHeaders = init?.headers ?? {};
      return Promise.resolve(makeResponse(200, { ok: true }));
    });

    await apiFetch('/api/test/');

    expect(capturedHeaders['Authorization']).toBeUndefined();
  });
});
