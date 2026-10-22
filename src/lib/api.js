import { ChartInputError, chartFor, computeMatch, computePanchang } from '../engine'

// Only the AI astrologer (not shown in the app for now) still needs the server
const configured = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
// A bare host (as Render's `fromService` provides) is served over https
export const API_BASE = configured.includes('://') ? configured : `https://${configured}`

export class ApiError extends Error {}

/** Birth details (see profiles.js) → chart input */
export function toPayload(p) {
  return { date: p.date, time: p.timeUnknown ? '12:00' : p.time, lat: p.lat, lon: p.lon, tz: p.tz, time_known: !p.timeUnknown }
}

// Charts, matching and Panchang are calculated on the device (src/engine) — no server, works offline.
// They stay async so pages can keep treating them like any other load.
function local(compute) {
  return new Promise((resolve, reject) => {
    // yield first so a loading state can paint before the calculation runs
    setTimeout(() => {
      try {
        resolve(compute())
      } catch (err) {
        reject(err instanceof ChartInputError ? new ApiError(err.message) : err)
      }
    }, 0)
  })
}

export const getChart = (profile) => local(() => chartFor(toPayload(profile)))

export const getMatch = (groom, bride) => local(() => {
  const groomChart = chartFor(toPayload(groom))
  const brideChart = chartFor(toPayload(bride))
  return { groom_chart: groomChart, bride_chart: brideChart, match: computeMatch(groomChart, brideChart) }
})

export const getPanchang = ({ date, lat, lon, tz }) => local(() => computePanchang(date, +lat, +lon, tz))

/**
 * Ask the AI astrologer about a profile's chart. `messages` is the whole conversation
 * ([{ role: 'user' | 'assistant', content }], ending with the new question); the answer streams
 * back as events passed to `onEvent` — see backend/ask.py for their shapes.
 */
export async function askAstrologer({ profile, messages, lang, signal, onEvent }) {
  let res
  try {
    res = await fetch(`${API_BASE}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ birth: { ...toPayload(profile), name: profile.name, place: profile.place }, messages, lang }),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('unavailable')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(typeof body?.detail === 'string' ? body.detail : 'failed')
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    let chunk
    try {
      chunk = await reader.read()
    } catch (err) {
      if (err.name === 'AbortError') throw err
      throw new ApiError('unavailable')
    }
    if (chunk.done) break
    buffer += decoder.decode(chunk.value, { stream: true })
    let end
    while ((end = buffer.indexOf('\n\n')) >= 0) {
      const line = buffer.slice(0, end)
      buffer = buffer.slice(end + 2)
      if (line.startsWith('data: ')) onEvent(JSON.parse(line.slice(6)))
    }
  }
}
