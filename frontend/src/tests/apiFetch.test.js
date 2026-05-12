import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { apiFetch } from '../api/client.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal structurally-valid JWT string (no real signature).
 * Three base64url-encoded parts separated by dots.
 */
function buildFakeJwt(payload = {}) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const body = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${header}.${body}.fakesig`;
}

/**
 * Create a minimal Response-like object that global.fetch can return.
 */
function makeResponse(status, body = {}, contentType = 'application/json') {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name) => (name === 'content-type' ? contentType : null),
    },
    json: () => Promise.resolve(body),
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  // Reset window.location.href to a neutral value before each test
  delete window.location;
  window.location = { href: 'http://localhost/' };
});

afterEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Property-based test
// Feature: user-auth, Property 13: Auth_Client attaches Bearer header when token is present
// ---------------------------------------------------------------------------

describe('Property 13: Auth_Client attaches Bearer header when token is present', () => {
  /**
   * Validates: Requirements 3.4
   *
   * For any API call made via apiFetch while a JWT is stored in localStorage,
   * the outgoing HTTP request SHALL include an Authorization: Bearer <token>
   * header whose value matches the stored token.
   */
  it('attaches Authorization: Bearer <token> header for any stored token', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random JWT-like strings (three dot-separated base64url segments)
        fc.record({
          user_id: fc.integer({ min: 1, max: 1_000_000 }),
          exp: fc.integer({ min: Math.floor(Date.now() / 1000) + 3600, max: Math.floor(Date.now() / 1000) + 86400 }),
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
    // Ensure localStorage is empty
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

// ---------------------------------------------------------------------------
// Property-based test
// Feature: user-auth, Property 16: 401 response clears token and redirects
// ---------------------------------------------------------------------------

describe('Property 16: 401 response clears token and redirects', () => {
  /**
   * Validates: Requirements 6.3
   *
   * For any authenticated API request that receives an HTTP 401 response,
   * the Auth_Client SHALL remove the JWT from localStorage and redirect the
   * user to /login.
   */
  it('removes token from localStorage and redirects to /login on any 401 response', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random JWT-like tokens
        fc.record({
          user_id: fc.integer({ min: 1, max: 1_000_000 }),
          exp: fc.integer({ min: Math.floor(Date.now() / 1000) + 3600, max: Math.floor(Date.now() / 1000) + 86400 }),
        }).map((payload) => buildFakeJwt(payload)),
        async (token) => {
          localStorage.setItem('auth_token', token);

          // Reset location for each iteration
          delete window.location;
          window.location = { href: 'http://localhost/' };

          vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
            Promise.resolve(makeResponse(401, { detail: 'Authentication credentials were not provided.' }))
          );

          // apiFetch throws on 401 — catch it
          await expect(apiFetch('/api/protected/')).rejects.toMatchObject({ status: 401 });

          // Token must be removed
          expect(localStorage.getItem('auth_token')).toBeNull();

          // Must redirect to /login
          expect(window.location.href).toBe('/login');

          localStorage.clear();
          vi.restoreAllMocks();
        }
      ),
      { numRuns: 100 }
    );
  });
});
