import { useEffect, useState } from 'react'
import './App.css'
import LoginPage from './LoginPage'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function request(path, options = {}, token = SUPABASE_KEY) {
  if (!SUPABASE_URL) throw new Error('Supabase URL is missing. Check VITE_SUPABASE_URL in your deployment environment.')
  if (!SUPABASE_KEY) throw new Error('Supabase API key is missing. Check VITE_SUPABASE_ANON_KEY in your deployment environment.')

  const response = await fetch(SUPABASE_URL + path, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const responseText = await response.text()
  let data = null
  try {
    data = responseText ? JSON.parse(responseText) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    const detail =
      data?.msg ||
      data?.message ||
      data?.error_description ||
      data?.error ||
      responseText ||
      'Unknown Supabase error'
    throw new Error(`Supabase request failed (${response.status}): ${detail}`)
  }

  return data
}

function gps() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation is not supported.'))
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      e => reject(new Error(e.message)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  })
}

export default function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alextranspo-session') || 'null') } catch { return null }
  })
  const [employee, setEmployee] = useState(null)
  const [records, setRecords] = useState([])
  const [error, setError] = useState('')

  async function login(email, password) {
    setError('')
    try {
      const s = await request('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      localStorage.setItem('alextranspo-session', JSON.stringify(s))
      setSession(s)
      await request('/rest/v1/auth_activity', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ user_id: s.user.id, email, action: 'login' }),
      }, s.access_token)
    } catch (e) { setError(e.message) }
  }

  async function load(token, userId) {
    const employees = await request('/rest/v1/employees?user_id=eq.' + encodeURIComponent(userId) + '&active=eq.true&select=*', {}, token)
    if (!employees?.[0]) throw new Error('No active employee profile is linked to this account.')
    setEmployee(employees[0])
    const data = await request('/rest/v1/attendance?employee_id=eq.' + employees[0].id + '&select=*&order=work_date.desc,time_in.desc', {}, token)
    setRecords(data || [])
  }

  useEffect(() => {
    if (!session?.access_token || !session?.user?.id) return
    load(session.access_token, session.user.id).catch(e => setError(e.message))
  }, [session])

  async function timeIn() {
    try {
      const p = await gps()
      const row = await request('/rest/v1/attendance', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          employee_id: employee.id, work_date: new Date().toISOString().slice(0, 10),
          time_in: new Date().toISOString(), time_in_lat: p.lat, time_in_lng: p.lng,
          time_in_accuracy: p.accuracy, status: 'Present',
        }),
      }, session.access_token)
      setRecords([...(row || []), ...records])
    } catch (e) { setError(e.message) }
  }

  async function timeOut() {
    const current = records.find(r => !r.time_out)
    if (!current) return setError('There is no open Time In.')
    try {
      const p = await gps()
      const now = new Date()
      const hours = Math.max(0, (now - new Date(current.time_in)) / 3600000)
      const row = await request('/rest/v1/attendance?id=eq.' + current.id, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          time_out: now.toISOString(), time_out_lat: p.lat, time_out_lng: p.lng,
          time_out_accuracy: p.accuracy, total_hours: Number(hours.toFixed(2)),
        }),
      }, session.access_token)
      setRecords(records.map(r => r.id === current.id ? row[0] : r))
    } catch (e) { setError(e.message) }
  }

  async function logout() {
    try {
      await request('/rest/v1/auth_activity', {
        method: 'POST',
        body: JSON.stringify({ user_id: session.user.id, email: session.user.email, action: 'logout' }),
      }, session.access_token)
    } finally {
      await fetch(SUPABASE_URL + '/auth/v1/logout', { method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + session.access_token } })
      localStorage.removeItem('alextranspo-session')
      setSession(null); setEmployee(null); setRecords([])
    }
  }

  if (!session) return <LoginPage onLogin={login} error={error} />
  if (!employee) return <main className="center-page"><section className="card"><h1>Employee profile required</h1><p>{error || 'Loading your employee profile...'}</p><button onClick={logout}>Sign out</button></section></main>

  const open = records.find(r => !r.time_out)
  return <main className="app-shell">
    <header className="topbar"><div><span className="eyebrow">ALEXTRANSPO</span><h1>Attendance Dashboard</h1><p>{employee.full_name} · {employee.employee_code}</p></div><button onClick={logout}>Sign out</button></header>
    <section className="card"><h2>Time Attendance</h2><p>GPS is captured only when you record Time In or Time Out.</p>
      <div className="actions"><button className="time-in" disabled={!!open} onClick={timeIn}>Time In</button><button className="time-out" disabled={!open} onClick={timeOut}>Time Out</button></div>
      {error && <p className="error-message">{error}</p>}
    </section>
    <section className="card"><h2>Attendance Records</h2><div className="table-wrap"><table><thead><tr><th>Date</th><th>Time In</th><th>Time Out</th><th>Hours</th><th>GPS</th></tr></thead><tbody>{records.map(r => <tr key={r.id}><td>{r.work_date}</td><td>{new Date(r.time_in).toLocaleString()}</td><td>{r.time_out ? new Date(r.time_out).toLocaleString() : 'Open'}</td><td>{r.total_hours}</td><td>{r.time_in_lat.toFixed(6)}, {r.time_in_lng.toFixed(6)}</td></tr>)}</tbody></table></div></section>
  </main>
}