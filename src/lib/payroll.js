export const BASE_SHIFT_HOURS = 9;
export const DEFAULT_BASE_PAY_PHP = 700;
export const DEFAULT_OVERTIME_RATE_PHP = 86;

export function calculatePay(startedAt, endedAt = new Date(), settings = {}) {
  const baseHours = Number(settings.base_shift_hours ?? BASE_SHIFT_HOURS);
  const basePay = Number(settings.base_pay_php ?? DEFAULT_BASE_PAY_PHP);
  const overtimeRate = Number(settings.overtime_hourly_php ?? DEFAULT_OVERTIME_RATE_PHP);
  const elapsedMinutes = Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000));
  const overtimeMinutes = Math.max(0, elapsedMinutes - baseHours * 60);
  const earnedBase = elapsedMinutes >= baseHours * 60 ? basePay : elapsedMinutes / (baseHours * 60) * basePay;
  const overtimePay = Math.round((overtimeMinutes / 60) * overtimeRate * 100) / 100;
  return {
    elapsedMinutes,
    regularHours: Math.min(baseHours, elapsedMinutes / 60),
    overtimeMinutes,
    basePay: Math.round(earnedBase * 100) / 100,
    overtimePay,
    total: Math.round((earnedBase + overtimePay) * 100) / 100,
  };
}

export function getPayrollPeriod(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const start = new Date(year, month, day <= 15 ? 1 : 16);
  const end = day <= 15 ? new Date(year, month, 15) : new Date(year, month + 1, 0);
  const format = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { start: format(start), end: format(end), label: `${start.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}–${end.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}` };
}
