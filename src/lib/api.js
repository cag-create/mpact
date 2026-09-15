// Thin client for the Mpact server API. Session = { token, user } in localStorage.
const SESSION_KEY = 'hub_session'
export function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null } }
export function setSession(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)) } catch {} }
export function clearSession() { try { localStorage.removeItem(SESSION_KEY) } catch {} }

async function call(path, { method = 'GET', body } = {}) {
  const s = getSession()
  const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json', ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  let data = null
  try { data = await res.json() } catch {}
  if (!res.ok) { const err = new Error(data?.error || `Request failed (${res.status})`); err.status = res.status; throw err }
  return data
}

export const api = {
  login:          (email, password) => call('/api/auth/login', { method: 'POST', body: { email, password } }),
  register:       (payload)         => call('/api/auth/register', { method: 'POST', body: payload }),
  me:             ()                => call('/api/auth/me'),
  changePassword: (oldPassword, newPassword) => call('/api/auth/change-password', { method: 'POST', body: { oldPassword, newPassword } }),
  getState:       ()                => call('/api/state'),
  putState:       (key, value)      => call(`/api/state/${key}`, { method: 'PUT', body: { value } }),
}
