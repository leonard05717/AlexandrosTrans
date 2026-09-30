const STORAGE_KEY = 'alexandros-attendance'

export function getAttendance() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
}

export function saveAttendance(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function getSaturday(date = new Date()) {
  const start = new Date(date)
  const daysSinceSaturday = (start.getDay() + 1) % 7
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - daysSinceSaturday)
  return start
}

export function getWorkWeek(date = new Date()) {
  const start = getSaturday(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function calculateHours(timeIn, timeOut) {
  if (!timeIn || !timeOut) return 0
  return Math.max(0, (new Date(timeOut) - new Date(timeIn)) / 3600000)
}
