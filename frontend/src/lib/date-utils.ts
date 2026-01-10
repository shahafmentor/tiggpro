/**
 * Date utility functions for calendar and date-related operations
 */

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Get start of week (Sunday)
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

// Get end of week (Saturday)
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return end
}

// Get start of month
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Get end of month
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

// Get calendar grid for month view (includes padding days from prev/next month)
export function getMonthCalendarDays(date: Date): Date[] {
  const monthStart = getMonthStart(date)
  const monthEnd = getMonthEnd(date)

  // Start from the Sunday of the week containing the 1st
  const calendarStart = getWeekStart(monthStart)

  // End on the Saturday of the week containing the last day
  const lastDayOfMonth = new Date(monthEnd)
  const calendarEnd = getWeekEnd(lastDayOfMonth)

  const days: Date[] = []
  const current = new Date(calendarStart)

  while (current <= calendarEnd) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return days
}

// Get week days starting from a date
export function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = []
  const current = new Date(startDate)
  for (let i = 0; i < 7; i++) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return days
}

// Get day name
export function getDayName(date: Date, locale: string = 'en', short: boolean = false): string {
  return date.toLocaleDateString(locale, { weekday: short ? 'narrow' : 'short' })
}

// Check if same day
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2)
}

// Check if today
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

// Check if same month
export function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth()
}

// Get week day headers (S, M, T, W, T, F, S)
export function getWeekDayHeaders(locale: string = 'en'): string[] {
  const days: string[] = []
  const date = new Date(2024, 0, 7) // A Sunday
  for (let i = 0; i < 7; i++) {
    days.push(getDayName(date, locale, true))
    date.setDate(date.getDate() + 1)
  }
  return days
}
