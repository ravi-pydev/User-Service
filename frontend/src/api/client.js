const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

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
  const res = await fetch(`${BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : {};
  if (!res.ok) throw { status: res.status, payload };
  return payload;
}
