import { Share } from '@capacitor/share'
import { isNativeApp, publicUrl } from './platform'

/**
 * Birth details ⇄ URL query params, so result pages survive refresh and can be shared.
 * Keys are short to keep links WhatsApp-friendly; `prefix` lets two people share one URL.
 */
const FIELDS = { n: 'name', d: 'date', t: 'time', p: 'place', lat: 'lat', lon: 'lon', tz: 'tz' }

export function profileToParams(profile, prefix = '', params = new URLSearchParams()) {
  for (const [k, field] of Object.entries(FIELDS)) {
    const v = profile[field]
    if (v != null && v !== '') params.set(prefix + k, field === 'lat' || field === 'lon' ? Number(v).toFixed(4) : v)
  }
  if (profile.timeUnknown) params.set(prefix + 'u', '1')
  return params
}

export function paramsToProfile(params, prefix = '') {
  const get = k => params.get(prefix + k)
  const profile = {
    name: get('n') || '',
    date: get('d'),
    time: get('t') || '12:00',
    timeUnknown: get('u') === '1',
    place: get('p') || '',
    lat: parseFloat(get('lat')),
    lon: parseFloat(get('lon')),
    tz: get('tz'),
  }
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(profile.date || '') && /^\d{2}:\d{2}$/.test(profile.time)
    && Number.isFinite(profile.lat) && Number.isFinite(profile.lon) && !!profile.tz
  return valid ? profile : null
}

export const chartPath = profile => `/birth-chart/result?${profileToParams(profile)}`

export function matchPath(groom, bride) {
  const params = profileToParams(groom, 'g')
  profileToParams(bride, 'b', params)
  return `/matchmaking/result?${params}`
}

export async function shareLink({ title, text, url = publicUrl() }) {
  if (isNativeApp) {
    try {
      await Share.share({ title, text, url, dialogTitle: title })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export const whatsappUrl = (text, url = publicUrl()) =>
  `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`
