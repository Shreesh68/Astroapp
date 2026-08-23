import { DateTime } from 'luxon'

export function getSunSignFromDate(date) {
  // date: JS Date instance — reads local date components
  // Returns Western tropical Sun sign (NOT Vedic rashi; rashi = Moon's sidereal sign)
  const day = date.getDate()
  const month = date.getMonth() + 1

  // Each entry: [endMonth, endDay, signName]
  // The sign is active from after the previous cutoff until this endDay of endMonth.
  const cutoffs = [
    [1, 20, 'Capricorn'],
    [2, 19, 'Aquarius'],
    [3, 21, 'Pisces'],
    [4, 20, 'Aries'],
    [5, 21, 'Taurus'],
    [6, 21, 'Gemini'],
    [7, 23, 'Cancer'],
    [8, 23, 'Leo'],
    [9, 23, 'Virgo'],
    [10, 23, 'Libra'],
    [11, 22, 'Scorpio'],
    [12, 22, 'Sagittarius'],
  ]

  // If date is on or before the cutoff day of its month, return that sign
  for (const [m, d, sign] of cutoffs) {
    if (month === m && day <= d) return sign
  }

  // Date is after the cutoff day of its month — belongs to the next sign
  const idx = cutoffs.findIndex(([m]) => m === month)
  if (idx !== -1) return cutoffs[(idx + 1) % 12][2]

  return 'Unknown'
}

export function formatDateInput(dateISO, timeHHMM, timeZone){
  // dateISO: 'YYYY-MM-DD', timeHHMM: 'HH:MM', timeZone: IANA timezone like 'Asia/Kolkata'
  if(!dateISO) return null
  const timePart = timeHHMM ? timeHHMM : '00:00'
  const iso = `${dateISO}T${timePart}`
  try{
    if(timeZone){
      const dt = DateTime.fromISO(iso, { zone: timeZone })
      if(!dt.isValid) return null
      return dt.toJSDate()
    } else {
      // Fallback: parse as local
      const dt = DateTime.fromISO(iso)
      if(!dt.isValid) return null
      return dt.toJSDate()
    }
  }catch(e){
    console.error('formatDateInput error', e)
    return null
  }
}

