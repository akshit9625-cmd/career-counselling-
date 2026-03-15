const BASE = '/api/v1'
async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}
export const api = {
  createUser: (name, email) => req('/profile/users', { method: 'POST', body: JSON.stringify({ name, email }) }),
  saveProfile: (userId, profile) => req(`/profile/users/${userId}/profile`, { method: 'PUT', body: JSON.stringify(profile) }),
  getProfile: (userId) => req(`/profile/users/${userId}/profile`),
  getSessions: (userId) => req(`/sessions/user/${userId}`),
  createSession: (userId, title = 'Career Counselling Session') => req('/sessions/', { method: 'POST', body: JSON.stringify({ user_id: userId, title }) }),
  getSession: (sessionId) => req(`/sessions/${sessionId}`),
  deleteSession: (sessionId) => req(`/sessions/${sessionId}`, { method: 'DELETE' }),
  sendMessage: (sessionId, userId, message) => req('/chat/', { method: 'POST', body: JSON.stringify({ session_id: sessionId, user_id: userId, message }) }),
}