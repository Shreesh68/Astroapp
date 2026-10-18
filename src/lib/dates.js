import { DateTime } from 'luxon'

const locale = lang => (lang === 'kn' ? 'kn' : 'en-IN')

/** 'YYYY-MM-DD' → "Saturday, 19 February 2000" */
export const fmtLongDate = (date, lang) =>
  DateTime.fromISO(date).setLocale(locale(lang)).toLocaleString({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const fmtShortDate = (date, lang) =>
  DateTime.fromISO(date).setLocale(locale(lang)).toLocaleString({ day: 'numeric', month: 'short', year: 'numeric' })

export const weekdayOf = (date, lang) => {
  const dt = DateTime.fromISO(date)
  return dt.isValid ? dt.setLocale(locale(lang)).toLocaleString({ weekday: 'long' }) : ''
}

/** 'HH:MM' → "1:10 am" */
export const fmtTime = (time, lang) =>
  DateTime.fromFormat(time, 'HH:mm').setLocale(locale(lang)).toLocaleString(DateTime.TIME_SIMPLE)

/** ISO timestamp with offset → local clock time in that offset, e.g. "6:10 am" */
export const fmtClock = (iso, lang) =>
  iso ? DateTime.fromISO(iso, { setZone: true }).setLocale(locale(lang)).toLocaleString(DateTime.TIME_SIMPLE) : '—'

/** ISO timestamp → "Mar 2027" in the given zone */
export const fmtMonthYear = (iso, tz, lang) =>
  DateTime.fromISO(iso, { zone: 'utc' }).setZone(tz || 'Asia/Kolkata').setLocale(locale(lang)).toLocaleString({ month: 'short', year: 'numeric' })

export const yearOf = (iso, tz) => DateTime.fromISO(iso, { zone: 'utc' }).setZone(tz || 'Asia/Kolkata').year

export const todayIn = tz => DateTime.now().setZone(tz || 'Asia/Kolkata').toISODate()

export const shiftDate = (date, days) => DateTime.fromISO(date).plus({ days }).toISODate()
