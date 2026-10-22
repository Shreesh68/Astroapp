const configured = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
// A bare host (as Render's `fromService` provides) is served over https
export const API_BASE = configured.includes('://') ? configured : `https://${configured}`

export class ApiError extends Error {}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    })
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = body?.detail
    const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : `Server error (${res.status})`
    throw new ApiError(msg)
  }
  return body
}

/** Birth details (see profiles.js) → backend chart payload */
export function toPayload(p) {
  return { date: p.date, time: p.timeUnknown ? '12:00' : p.time, lat: p.lat, lon: p.lon, tz: p.tz, time_known: !p.timeUnknown }
}

export const getChart = (profile) =>
  request('/api/chart', { method: 'POST', body: JSON.stringify(toPayload(profile)) })

export const getMatch = (groom, bride) =>
  request('/api/match', { method: 'POST', body: JSON.stringify({ groom: toPayload(groom), bride: toPayload(bride) }) })

export const getPanchang = ({ date, lat, lon, tz }) =>
  request(`/api/panchang?${new URLSearchParams({ date, lat, lon, tz })}`)

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

/** Free-tier hosts sleep when idle; poke the server early so it is awake by the time it's needed. */
export function warmUp() {
  fetch(`${API_BASE}/`).catch(() => {})
}
