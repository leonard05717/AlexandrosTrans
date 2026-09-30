const API_URL = import.meta.env.VITE_SUPABASE_URL
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export function configured() {
  return Boolean(API_URL && API_KEY)
}

async function request(path, options = {}, token = '') {
  const response = await fetch(API_URL + path, {
    ...options,
    headers: {
      apikey: API_KEY,
      Authorization: 'Bearer ' + (token || API_KEY),
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let body
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!response.ok) throw new Error(body?.message || body?.msg || body?.error_description || 'Request failed')
  return body
}

export async function login(email, password) {
  return request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getEmployee(userId, token) {
  const rows = await request('/rest/v1/employees?user_id=eq.' + encodeURIComponent(userId) + '&active=eq.true&select=*', {}, token)
  if (!rows?.[0]) throw new Error('No active employee profile is linked to this account.')
  return rows[0]
}

export async function getAttendance(employeeId, token) {
  return request('/rest/v1/attendance?employee_id=eq.' + encodeURIComponent(employeeId) + '&select=*&order=work_date.desc,time_in.desc', {}, token)
}

export async function insertAttendance(record, token) {
  return request('/rest/v1/attendance', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(record),
  }, token)
}

export async function updateAttendance(id, record, token) {
  const rows = await request('/rest/v1/attendance?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(record),
  }, token)
  return rows?.[0]
}

export async function recordAuthActivity(activity, token) {
  return request('/rest/v1/auth_activity', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(activity),
  }, token)
}

export async function logout(token) {
  await fetch(API_URL + '/auth/v1/logout', {
    method: 'POST',
    headers: { apikey: API_KEY, Authorization: 'Bearer ' + token },
  })
}
