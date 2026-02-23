import {
  getMinuteWindowStart,
  getMinuteWindowEnd,
  getISOWeekRange,
  parseTimeString,
  isWithinOfficeHours,
  minutesAgo,
} from '../../src/utils/date.utils'

describe('date.utils', () => {
  describe('getMinuteWindowStart', () => {
    it('rounds down to the nearest minute', () => {
      const d = new Date('2024-01-15T14:32:45.123Z')
      const result = getMinuteWindowStart(d)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
      expect(result.getUTCMinutes()).toBe(32)
      expect(result.getUTCHours()).toBe(14)
    })

    it('already-aligned date stays the same', () => {
      const d = new Date('2024-01-15T10:00:00.000Z')
      expect(getMinuteWindowStart(d).toISOString()).toBe(d.toISOString())
    })
  })

  describe('getMinuteWindowEnd', () => {
    it('adds exactly 1 minute to windowStart', () => {
      const start = new Date('2024-01-15T10:05:00.000Z')
      const end = getMinuteWindowEnd(start)
      expect(end.toISOString()).toBe('2024-01-15T10:06:00.000Z')
    })
  })

  describe('getISOWeekRange', () => {
    it('returns Monday start and Sunday end for a Wednesday', () => {
      // 2024-01-17 is a Wednesday
      const { start, end } = getISOWeekRange(new Date('2024-01-17T12:00:00Z'))
      expect(start.getDay()).toBe(1) // Monday (local time)
      expect(end.getDay()).toBe(0)   // Sunday (local time)
    })

    it('start is before end', () => {
      const { start, end } = getISOWeekRange(new Date('2024-06-05T00:00:00Z'))
      expect(start.getTime()).toBeLessThan(end.getTime())
    })
  })

  describe('parseTimeString', () => {
    it('parses "09:30" correctly', () => {
      expect(parseTimeString('09:30')).toEqual({ hours: 9, minutes: 30 })
    })

    it('parses "18:00" correctly', () => {
      expect(parseTimeString('18:00')).toEqual({ hours: 18, minutes: 0 })
    })
  })

  describe('isWithinOfficeHours', () => {
    const officeHours = {
      openTime: '09:00',
      closeTime: '18:00',
      timezone: 'America/Mexico_City',
      workDays: [1, 2, 3, 4, 5], // Mon-Fri
    }

    it('returns true for a Monday at 10:00 CDT (UTC-5 → UTC 15:00)', () => {
      // 2024-06-03 is a Monday. 10:00 CDT = 15:00 UTC
      const utcDate = new Date('2024-06-03T15:00:00Z')
      expect(isWithinOfficeHours(officeHours, utcDate)).toBe(true)
    })

    it('returns false for a Saturday', () => {
      // 2024-06-01 is a Saturday at 10:00 CDT
      const utcDate = new Date('2024-06-01T15:00:00Z')
      expect(isWithinOfficeHours(officeHours, utcDate)).toBe(false)
    })

    it('returns false before office hours', () => {
      // Monday at 08:00 CDT = 13:00 UTC
      const utcDate = new Date('2024-06-03T13:00:00Z')
      expect(isWithinOfficeHours(officeHours, utcDate)).toBe(false)
    })

    it('returns false after closing', () => {
      // Monday at 19:00 CDT = 00:00 UTC next day
      const utcDate = new Date('2024-06-04T00:00:00Z')
      expect(isWithinOfficeHours(officeHours, utcDate)).toBe(false)
    })
  })

  describe('minutesAgo', () => {
    it('returns a date N minutes before now', () => {
      const before = Date.now()
      const result = minutesAgo(3)
      const after = Date.now()
      const diff = Math.round((Date.now() - result.getTime()) / 60000)
      expect(diff).toBeGreaterThanOrEqual(2)
      expect(diff).toBeLessThanOrEqual(4)
    })

    it('uses provided `from` date', () => {
      const from = new Date('2024-01-01T12:00:00Z')
      const result = minutesAgo(5, from)
      expect(result.toISOString()).toBe('2024-01-01T11:55:00.000Z')
    })
  })
})
