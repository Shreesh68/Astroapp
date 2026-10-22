// Saved Panchang days. A given date + place always gives the same Panchang, so saved
// entries never go stale: they are shown instantly and work offline.
import { getPanchang } from './api'
import { shiftDate } from './dates'

const KEY = 'km_panchang_cache'
const MAX_ENTRIES = 60

export const placeKey = p => `${(+p.lat).toFixed(3)},${(+p.lon).toFixed(3)},${p.tz}`
const entryKey = (date, place) => `${date}|${placeKey(place)}`

function readAll() {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}')
    return all && typeof all === 'object' ? all : {}
  } catch {
    return {}
  }
}

export function readPanchang(date, place) {
  return readAll()[entryKey(date, place)]?.data ?? null
}

export function savePanchang(date, place, data) {
  const all = readAll()
  all[entryKey(date, place)] = { data, savedAt: Date.now() }
  // keep the most recently saved entries only
  const keys = Object.keys(all).sort((a, b) => all[b].savedAt - all[a].savedAt)
  for (const k of keys.slice(MAX_ENTRIES)) delete all[k]
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* storage full or unavailable */ }
}

/** Fetch (and save) one day, using the saved copy when there is one. */
export async function loadPanchang(date, place) {
  const saved = readPanchang(date, place)
  if (saved) return saved
  const data = await getPanchang({ date, lat: place.lat, lon: place.lon, tz: place.tz })
  savePanchang(date, place, data)
  return data
}

const prefetched = new Set()

/** Quietly save the next `days` days so the coming week works offline. Stops at the first failure. */
export async function prefetchAhead(fromDate, place, days = 7) {
  const tag = `${fromDate}|${placeKey(place)}`
  if (prefetched.has(tag) || (typeof navigator !== 'undefined' && navigator.onLine === false)) return
  prefetched.add(tag)
  for (let i = 1; i <= days; i++) {
    try {
      await loadPanchang(shiftDate(fromDate, i), place)
    } catch {
      prefetched.delete(tag) // try again next time
      return
    }
  }
}
