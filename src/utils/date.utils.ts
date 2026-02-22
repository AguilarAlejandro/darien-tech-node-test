/**
 * Returns the start of a 1-minute window for a given timestamp.
 * e.g. 14:35:47 → 14:35:00
 */
export function getMinuteWindowStart(date: Date): Date {
  const d = new Date(date)
  d.setSeconds(0, 0)
  return d
}

/**
 * Returns the end of a 1-minute window for a given window start.
 */
export function getMinuteWindowEnd(windowStart: Date): Date {
  const d = new Date(windowStart)
  d.setMinutes(d.getMinutes() + 1)
  return d
}

/**
 * Returns the Monday (start) and Sunday (end) of the ISO week that contains `date`.
 */
export function getISOWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date)
  const dayOfWeek = d.getDay() // 0 = Sunday, 1 = Monday...
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const start = new Date(d)
  start.setDate(d.getDate() + daysToMonday)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

/**
 * Parses a "HH:mm" time string and returns hours and minutes.
 */
export function parseTimeString(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number)
  return { hours: h ?? 0, minutes: m ?? 0 }
}

/**
 * Given a date in UTC and office hours, determines if the moment is within
 * working hours for the configured timezone and working days.
 *
 * NOTE: Uses Intl.DateTimeFormat for timezone-aware time extraction.
 */
export function isWithinOfficeHours(
  officeHours: {
    apertura: string   // "HH:mm"
    cierre: string     // "HH:mm"
    timezone: string
    diasLaborales: number[]  // 1=Mon...7=Sun (ISO weekday)
  },
  utcDate: Date,
): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: officeHours.timezone,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'narrow',
    hour12: false,
  })

  const parts = formatter.formatToParts(utcDate)
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10)
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10)

  // Get local day of week (1=Mon ... 7=Sun using ISO convention)
  const localDayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: officeHours.timezone,
    weekday: 'long',
  })
  const localDayName = localDayFormatter.format(utcDate)
  const dayMap: Record<string, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  }
  const localIsoDay = dayMap[localDayName] ?? 0

  const isWorkDay = officeHours.diasLaborales.includes(localIsoDay)
  if (!isWorkDay) return false

  const currentMinutes = hour * 60 + minute
  const { hours: openH, minutes: openM } = parseTimeString(officeHours.apertura)
  const { hours: closeH, minutes: closeM } = parseTimeString(officeHours.cierre)

  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes
}

/**
 * Returns a Date N minutes ago from the given reference (default: now).
 */
export function minutesAgo(n: number, from: Date = new Date()): Date {
  return new Date(from.getTime() - n * 60 * 1000)
}
