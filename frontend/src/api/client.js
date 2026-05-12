const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Optional callback registered by the app to open the login modal when a
 * 401 is received. Set via registerOn401.
 */
let _on401 = null;

/**
 * Register a callback that is invoked when any API call returns 401.
 * The app uses this to open the login modal instead of hard-navigating.
 * @param {function} fn
 */
export function registerOn401(fn) {
  _on401 = fn;
}

/**
 * Centralised fetch wrapper for the Django REST API.
 * When VITE_API_BASE_URL is not set (local dev with Vite proxy), BASE is ''
 * and all requests go to the same origin, which the proxy forwards to Django.
 *
 * @param {string} url - API path, e.g. '/api/templates/'
 * @param {RequestInit} options - fetch options
 * @returns {Promise<any>} parsed JSON response
 * @throws {{ status: number, payload: any }} on non-2xx responses
 */
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    if (_on401) {
      _on401();
    }
    throw { status: 401, payload: {} };
  }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : {};
  if (!res.ok) throw { status: res.status, payload };
  return payload;
}
