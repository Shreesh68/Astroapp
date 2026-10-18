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

/** Free-tier hosts sleep when idle; poke the server early so it is awake by the time it's needed. */
export function warmUp() {
  fetch(`${API_BASE}/`).catch(() => {})
}
