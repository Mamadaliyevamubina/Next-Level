const TOKEN_KEY = 'nl-token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => (token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Small fetch wrapper: adds the login token, sends JSON, and turns errors into ApiError.
export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('Cannot reach the server. Is it running?', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A 401 means the session is gone; a "pending" 403 means a teacher has not approved (or re-approved) the account.
    if (res.status === 401 && token) window.dispatchEvent(new Event('nl-logout'));
    if (res.status === 403 && data.code === 'pending') window.dispatchEvent(new Event('nl-refresh'));
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}
