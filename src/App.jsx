function AdminMonitor({ session, employee, logout }) {
  const [data, setData] = useState({ inspectors: [], attendance: [] })
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function refresh() {
    setRefreshing(true)
    try {
      const inspectors = await request('/rest/v1/employees?role=eq.inspector&active=eq.true&select=id,employee_code,full_name,department', {}, session.access_token)
      const attendance = await request('/rest/v1/attendance?select=*&order=work_date.desc,time_in.desc', {}, session.access_token)
      setData({ inspectors: inspectors || [], attendance: attendance || [] })
      setError('')
    } catch (e) { setError(e.message) }
    finally { setRefreshing(false) }
  }

  useEffect(() => { refresh() }, [])

  const latest = data.inspectors.map(inspector => {
    const rows = data.attendance.filter(r => r.employee_id === inspector.id)
    return { inspector, record: rows.find(r => !r.time_out) || rows[0] }
  })

  const inspectorById = new Map(data.inspectors.map(i => [i.id, i]))
  const formatDateTime = value => value
    ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : '—'
  const gpsText = (lat, lng) =>
    lat != null && lng != null
      ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`
      : '—'

  return <main className="app-shell">
    <header className="topbar">
      <div><span className="eyebrow">ALEXTRANSPO</span><h1>Inspector Monitoring</h1><p>Monitor all inspector accounts, Time In / Time Out and GPS locations</p></div>
      <div className="employee"><strong>{employee.full_name}</strong><span>Administrator</span><button onClick={logout}>Sign out</button></div>
    </header>

    <section className="stats-grid">
      <article className="stat-card"><span>INSPECTOR ACCOUNTS</span><strong>{data.inspectors.length}</strong><small>Active inspector accounts</small></article>
      <article className="stat-card"><span>WORKING NOW</span><strong>{latest.filter(x => x.record && !x.record.time_out).length}</strong><small>Open Time In records</small></article>
      <article className="stat-card"><span>ATTENDANCE RECORDS</span><strong>{data.attendance.length}</strong><small>All recorded Time In / Out entries</small></article>
    </section>

    <section className="card">
      <div className="card-heading"><div><span className="label">INSPECTOR MONITOR</span><h2>All Inspector Accounts</h2></div><button onClick={refresh} disabled={refreshing}>{refreshing ? 'Refreshing...' : 'Refresh'}</button></div>
      {error && <p className="error-message">{error}</p>}
      <div className="table-wrap"><table><thead><tr><th>Inspector</th><th>Status</th><th>Latest Time In</th><th>Latest Time Out</th><th>Time In GPS</th><th>Time Out GPS</th></tr></thead>
      <tbody>{latest.map(({ inspector, record }) => <tr key={inspector.id}>
        <td><strong>{inspector.full_name}</strong><br /><small>{inspector.employee_code}</small></td>
        <td><span className={record && !record.time_out ? 'pill present' : 'pill absent'}>{record && !record.time_out ? 'Working' : 'Not working'}</span></td>
        <td>{formatDateTime(record?.time_in)}</td>
        <td>{formatDateTime(record?.time_out)}</td>
        <td>{gpsText(record?.time_in_lat, record?.time_in_lng)}</td>
        <td>{gpsText(record?.time_out_lat, record?.time_out_lng)}</td>
      </tr>)}</tbody></table></div>
    </section>

    <section className="card history-card">
      <div className="card-heading"><div><span className="label">ATTENDANCE HISTORY</span><h2>All Time In / Time Out GPS Records</h2></div></div>
      <div className="table-wrap"><table><thead><tr><th>Inspector</th><th>Work Date</th><th>Time In</th><th>Time In GPS</th><th>Time Out</th><th>Time Out GPS</th><th>Hours</th></tr></thead>
      <tbody>
        {data.attendance.map(record => {
          const inspector = inspectorById.get(record.employee_id)
          return <tr key={record.id}>
            <td><strong>{inspector?.full_name || 'Unknown inspector'}</strong><br /><small>{inspector?.employee_code || record.employee_id}</small></td>
            <td>{record.work_date || '—'}</td>
            <td>{formatDateTime(record.time_in)}</td>
            <td>{gpsText(record.time_in_lat, record.time_in_lng)}</td>
            <td>{formatDateTime(record.time_out)}</td>
            <td>{gpsText(record.time_out_lat, record.time_out_lng)}</td>
            <td>{Number(record.total_hours || 0).toFixed(2)}</td>
          </tr>
        })}
      </tbody></table></div>
      {data.attendance.length === 0 && <p className="empty">No attendance records have been recorded yet.</p>}
    </section>

    <section className="card history-card"><div className="card-heading"><div><span className="label">GPS MAP</span><h2>Latest Inspector Time In</h2></div></div>
      {(() => {
        const item = latest.find(x => x.record?.time_in_lat != null && x.record?.time_in_lng != null)
        if (!item) return <div className="map-placeholder"><span>📍</span><p>No inspector GPS location recorded yet.</p></div>
        const lat = Number(item.record.time_in_lat), lng = Number(item.record.time_in_lng)
        return <><iframe className="map" title="Inspector GPS map" src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - .01}%2C${lat - .01}%2C${lng + .01}%2C${lat + .01}&layer=mapnik&marker=${lat}%2C${lng}`} /><div className="coordinates"><span>{item.inspector.full_name}</span><span>Latitude: {lat.toFixed(6)}</span><span>Longitude: {lng.toFixed(6)}</span></div></>
      })()}
    </section>
  </main>
}

import { useEffect, useState } from 'react'
import './App.css'
import LoginPage from './LoginPage'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kpzkjielasziitnpszsn.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_j2czXIhkabpD5oj2UE_wew_l-CeTZEw'

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
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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
    setError('')
    try {
      const p = await gps()
      const row = await request('/rest/v1/attendance', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          employee_id: employee.id,
          work_date: new Date().toISOString().slice(0, 10),
          time_in: new Date().toISOString(),
          time_in_lat: p.lat,
          time_in_lng: p.lng,
          time_in_accuracy: p.accuracy,
          status: 'Present',
        }),
      }, session.access_token)
      setRecords([...(row || []), ...records])
    } catch (e) { setError(e.message) }
  }

  async function timeOut() {
    setError('')
    const current = records.find(r => !r.time_out)
    if (!current) return setError('There is no open Time In.')
    try {
      const p = await gps()
      const nowValue = new Date()
      const hours = Math.max(0, (nowValue - new Date(current.time_in)) / 3600000)
      const row = await request('/rest/v1/attendance?id=eq.' + current.id, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          time_out: nowValue.toISOString(),
          time_out_lat: p.lat,
          time_out_lng: p.lng,
          time_out_accuracy: p.accuracy,
          total_hours: Number(hours.toFixed(2)),
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
      await fetch(SUPABASE_URL + '/auth/v1/logout', {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + session.access_token },
      })
      localStorage.removeItem('alextranspo-session')
      setSession(null)
      setEmployee(null)
      setRecords([])
    }
  }

  if (!session) return <LoginPage onLogin={login} error={error} />
  if (!employee) return <main className="center-page"><section className="card"><h1>Employee profile required</h1><p>{error || 'Loading your employee profile...'}</p><button onClick={logout}>Sign out</button></section></main>
  if (employee.role === 'admin') return <AdminMonitor session={session} employee={employee} logout={logout} />

  const open = records.find(r => !r.time_out)
  const weekStart = new Date(now)
  const daysSinceSaturday = (weekStart.getDay() + 1) % 7
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - daysSinceSaturday)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const weekRecords = records.filter(r => {
    const d = new Date(r.work_date + 'T00:00:00')
    return d >= weekStart && d <= weekEnd
  })
  const workedDays = weekRecords.length
  const totalHours = weekRecords.reduce((sum, r) => sum + Number(r.total_hours || 0), 0)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
  const recordForDay = d => {
    const key = d.toISOString().slice(0, 10)
    return weekRecords.find(r => r.work_date === key)
  }
  const mapRecord = open || records[0]
  const mapLat = mapRecord?.time_in_lat
  const mapLng = mapRecord?.time_in_lng
  const formatDate = d => new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: '2-digit' }).format(d)
  const formatDateTime = value => new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  const formatHours = value => Number(value || 0).toFixed(2)

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">ALEXTRANSPO</span>
          <h1>Inspector Time Attendance</h1>
          <p>GPS attendance and weekly work report</p>
        </div>
        <div className="employee">
          <strong>{employee.full_name}</strong>
          <span>{employee.employee_code}</span>
          <span>{employee.department || 'Inspection'}</span>
          <button onClick={logout}>Sign out</button>
        </div>
      </header>

      <section className="dashboard-grid">
        <article className="card attendance-card">
          <div className="card-heading">
            <div>
              <span className="label">TODAY</span>
              <h2>{formatDate(now)}</h2>
            </div>
            <span className={open ? 'status active' : 'status'}>{open ? '● Working' : '● Not working'}</span>
          </div>

          <div className="clock">
            {new Intl.DateTimeFormat('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now)}
          </div>

          <div className="actions">
            <button className="time-in" disabled={Boolean(open)} onClick={timeIn}>Time In</button>
            <button className="time-out" disabled={!open} onClick={timeOut}>Time Out</button>
          </div>

          {error && <p className="error-message">{error}</p>}
          <div className="location-box">
            <strong>GPS Tracking</strong>
            <span>{mapLat != null && mapLng != null ? `${Number(mapLat).toFixed(6)}, ${Number(mapLng).toFixed(6)}` : 'No location recorded yet'}</span>
            <small>GPS is captured only when Time In or Time Out is pressed.</small>
          </div>
        </article>

        <article className="card">
          <div className="card-heading">
            <div>
              <span className="label">GPS MAP</span>
              <h2>Attendance Locations</h2>
            </div>
          </div>

          {mapLat != null && mapLng != null ? (
            <iframe
              className="map"
              title="Attendance GPS map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(mapLng) - 0.01}%2C${Number(mapLat) - 0.01}%2C${Number(mapLng) + 0.01}%2C${Number(mapLat) + 0.01}&layer=mapnik&marker=${Number(mapLat)}%2C${Number(mapLng)}`}
            />
          ) : (
            <div className="map-placeholder"><span>📍</span><p>Time In to record a GPS location and place the pin on the map.</p></div>
          )}

          {mapLat != null && mapLng != null && (
            <div className="coordinates">
              <span>Latitude: {Number(mapLat).toFixed(6)}</span>
              <span>Longitude: {Number(mapLng).toFixed(6)}</span>
            </div>
          )}
        </article>
      </section>

      <section className="stats-grid">
        <article className="stat-card"><span>WORKED DAYS</span><strong>{workedDays}</strong><small>Saturday – Friday</small></article>
        <article className="stat-card"><span>TOTAL HOURS</span><strong>{formatHours(totalHours)}</strong><small>This work week</small></article>
        <article className="stat-card"><span>WEEK PERIOD</span><strong>{formatDate(weekStart)}</strong><small>to {formatDate(weekEnd)}</small></article>
      </section>

      <section className="card weekly-card">
        <div className="card-heading">
          <div><span className="label">WEEKLY REPORT</span><h2>Saturday – Friday</h2></div>
          <span className="week-range">{formatDate(weekStart)} — {formatDate(weekEnd)}</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Day</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {weekDays.map(day => {
                const record = recordForDay(day)
                return (
                  <tr key={day.toISOString()}>
                    <td>{day.toLocaleDateString('en-PH', { weekday: 'long' })}</td>
                    <td>{formatDate(day)}</td>
                    <td>{record ? formatDateTime(record.time_in) : '—'}</td>
                    <td>{record?.time_out ? formatDateTime(record.time_out) : '—'}</td>
                    <td>{record ? formatHours(record.total_hours) : '0.00'}</td>
                    <td><span className={record ? 'pill present' : 'pill absent'}>{record ? record.status : 'No record'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card history-card">
        <div className="card-heading">
          <div><span className="label">LOCATION LOG</span><h2>GPS Audit Trail</h2></div>
        </div>
        <div className="location-list">
          {weekRecords.length === 0 ? (
            <p className="empty">No attendance locations recorded this week.</p>
          ) : (
            weekRecords.map(record => (
              <div className="location-row" key={record.id}>
                <div>
                  <strong>{formatDate(new Date(record.work_date + 'T00:00:00'))}</strong>
                  <span>In: {record.time_in_lat != null && record.time_in_lng != null ? `${Number(record.time_in_lat).toFixed(6)}, ${Number(record.time_in_lng).toFixed(6)}` : '—'}</span>
                </div>
                <div><strong>Time In</strong><span>{formatDateTime(record.time_in)}</span></div>
                <div><strong>Time Out</strong><span>{record.time_out && record.time_out_lat != null && record.time_out_lng != null ? `${Number(record.time_out_lat).toFixed(6)}, ${Number(record.time_out_lng).toFixed(6)}` : 'Not recorded'}</span></div>
              </div>
            ))
          )}
        </div>
      </section>

      <footer>GPS is captured only when Time In or Time Out is pressed. Attendance data is stored securely in Supabase.</footer>
    </main>
  )
}
