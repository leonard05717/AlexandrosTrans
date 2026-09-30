import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'alexandros-attendance'

function getStoredAttendance() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveAttendance(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function getSaturday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const daysSinceSaturday = (day + 1) % 7
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysSinceSaturday)
  return d
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date)
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatHours(hours) {
  return Number(hours || 0).toFixed(2)
}

function App() {
  const [records, setRecords] = useState(getStoredAttendance)
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [employee] = useState({
    id: 'EMP-001',
    name: 'Demo Employee',
  })

  useEffect(() => {
    saveAttendance(records)
  }, [records])

  const currentRecord = records.find(
    (record) => record.employeeId === employee.id && !record.timeOut,
  )

  const week = useMemo(() => {
    const start = getSaturday(new Date())
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(date.getDate() + index)
      return date
    })

    const weeklyRecords = records.filter((record) => {
      const date = new Date(record.workDate)
      return (
        record.employeeId === employee.id &&
        date >= start &&
        date <= end
      )
    })

    const totalHours = weeklyRecords.reduce(
      (sum, record) => sum + Number(record.totalHours || 0),
      0,
    )

    return { start, end, days, weeklyRecords, totalHours }
  }, [records, employee.id])

  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
        },
        (error) => reject(new Error(error.message)),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      )
    })

  async function handleAttendance(action) {
    setBusy(true)
    setLocationError('')
    setMessage('Getting your current GPS location...')

    try {
      const gps = await getLocation()
      setLocation(gps)

      const now = new Date()
      const workDate = now.toISOString().slice(0, 10)

      if (action === 'in') {
        if (currentRecord) {
          setMessage('You are already timed in.')
          return
        }

        const newRecord = {
          id: crypto.randomUUID(),
          employeeId: employee.id,
          employeeName: employee.name,
          workDate,
          timeIn: now.toISOString(),
          timeOut: null,
          timeInLat: gps.lat,
          timeInLng: gps.lng,
          timeInAccuracy: gps.accuracy,
          timeOutLat: null,
          timeOutLng: null,
          timeOutAccuracy: null,
          totalHours: 0,
          status: 'Present',
        }

        setRecords((previous) => [newRecord, ...previous])
        setMessage('Time In recorded successfully.')
      } else {
        if (!currentRecord) {
          setMessage('You do not have an active Time In.')
          return
        }

        const hours = Math.max(
          0,
          (now.getTime() - new Date(currentRecord.timeIn).getTime()) /
            3600000,
        )

        setRecords((previous) =>
          previous.map((record) =>
            record.id === currentRecord.id
              ? {
                  ...record,
                  timeOut: now.toISOString(),
                  timeOutLat: gps.lat,
                  timeOutLng: gps.lng,
                  timeOutAccuracy: gps.accuracy,
                  totalHours: hours,
                }
              : record,
          ),
        )
        setMessage('Time Out recorded successfully.')
      }
    } catch (error) {
      setLocationError(
        `GPS location could not be recorded: ${error.message}`,
      )
      setMessage('')
    } finally {
      setBusy(false)
    }
  }

  function recordForDay(date) {
    const key = date.toISOString().slice(0, 10)
    return week.weeklyRecords.find((record) => record.workDate === key)
  }

  const mapRecord = currentRecord || week.weeklyRecords[0]
  const mapLat = location?.lat || mapRecord?.timeInLat
  const mapLng = location?.lng || mapRecord?.timeInLng

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">ALEXANDROS TRANS</span>
          <h1>Time Attendance</h1>
        </div>
        <div className="employee">
          <strong>{employee.name}</strong>
          <span>{employee.id}</span>
        </div>
      </header>

      <section className="dashboard-grid">
        <article className="card attendance-card">
          <div className="card-heading">
            <div>
              <span className="label">TODAY</span>
              <h2>{formatDate(new Date())}</h2>
            </div>
            <span className={currentRecord ? 'status active' : 'status'}>
              {currentRecord ? '● Working' : '● Not working'}
            </span>
          </div>

          <div className="clock">
            {new Intl.DateTimeFormat('en-PH', {
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date())}
          </div>

          <div className="actions">
            <button
              className="time-in"
              disabled={busy || Boolean(currentRecord)}
              onClick={() => handleAttendance('in')}
            >
              {busy ? 'Getting GPS...' : 'Time In'}
            </button>
            <button
              className="time-out"
              disabled={busy || !currentRecord}
              onClick={() => handleAttendance('out')}
            >
              {busy ? 'Getting GPS...' : 'Time Out'}
            </button>
          </div>

          {message && <p className="success-message">{message}</p>}
          {locationError && <p className="error-message">{locationError}</p>}

          {location && (
            <div className="location-box">
              <strong>Current GPS</strong>
              <span>
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </span>
              <small>Accuracy: ±{Math.round(location.accuracy)} m</small>
            </div>
          )}
        </article>

        <article className="card">
          <div className="card-heading">
            <div>
              <span className="label">GPS MAP</span>
              <h2>Attendance Locations</h2>
            </div>
          </div>

          {mapLat && mapLng ? (
            <iframe
              className="map"
              title="Attendance GPS map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - 0.01}%2C${mapLat - 0.01}%2C${mapLng + 0.01}%2C${mapLat + 0.01}&layer=mapnik&marker=${mapLat}%2C${mapLng}`}
            />
          ) : (
            <div className="map-placeholder">
              <span>📍</span>
              <p>Time In or Time Out to record a GPS location.</p>
            </div>
          )}

          {mapLat && mapLng && (
            <div className="coordinates">
              <span>Latitude: {mapLat.toFixed(6)}</span>
              <span>Longitude: {mapLng.toFixed(6)}</span>
            </div>
          )}
        </article>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>WORKED DAYS</span>
          <strong>{week.weeklyRecords.length}</strong>
          <small>Saturday – Friday</small>
        </article>
        <article className="stat-card">
          <span>TOTAL HOURS</span>
          <strong>{formatHours(week.totalHours)}</strong>
          <small>This work week</small>
        </article>
        <article className="stat-card">
          <span>WEEK PERIOD</span>
          <strong>{formatDate(week.start)}</strong>
          <small>to {formatDate(week.end)}</small>
        </article>
      </section>

      <section className="card weekly-card">
        <div className="card-heading">
          <div>
            <span className="label">WEEKLY REPORT</span>
            <h2>Saturday – Friday</h2>
          </div>
          <span className="week-range">
            {formatDate(week.start)} — {formatDate(week.end)}
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {week.days.map((day) => {
                const record = recordForDay(day)
                return (
                  <tr key={day.toISOString()}>
                    <td>{day.toLocaleDateString('en-PH', { weekday: 'long' })}</td>
                    <td>{formatDate(day)}</td>
                    <td>{record ? formatDateTime(record.timeIn) : '—'}</td>
                    <td>{record?.timeOut ? formatDateTime(record.timeOut) : '—'}</td>
                    <td>{record ? formatHours(record.totalHours) : '0.00'}</td>
                    <td>
                      <span className={record ? 'pill present' : 'pill absent'}>
                        {record ? record.status : 'No record'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card history-card">
        <div className="card-heading">
          <div>
            <span className="label">LOCATION LOG</span>
            <h2>GPS Audit Trail</h2>
          </div>
        </div>
        <div className="location-list">
          {week.weeklyRecords.length === 0 ? (
            <p className="empty">No attendance locations recorded this week.</p>
          ) : (
            week.weeklyRecords.map((record) => (
              <div className="location-row" key={record.id}>
                <div>
                  <strong>{formatDate(new Date(record.workDate))}</strong>
                  <span>
                    In: {record.timeInLat.toFixed(6)}, {record.timeInLng.toFixed(6)}
                  </span>
                </div>
                <div>
                  <strong>Time In</strong>
                  <span>{formatDateTime(record.timeIn)}</span>
                </div>
                <div>
                  <strong>Time Out</strong>
                  <span>
                    {record.timeOut
                      ? `${record.timeOutLat.toFixed(6)}, ${record.timeOutLng.toFixed(6)}`
                      : 'Not recorded'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <footer>
        GPS is captured only when Time In or Time Out is pressed. For production,
        replace localStorage with Supabase and protect attendance rows with RLS.
      </footer>
    </main>
  )
}

export default App
