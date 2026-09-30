export function getSaturdayStart(date = new Date()) {
  const start = new Date(date)
  const daysSinceSaturday = (start.getDay() + 1) % 7
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - daysSinceSaturday)
  return start
}

export function getFridayEnd(date = new Date()) {
  const start = getSaturdayStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}
