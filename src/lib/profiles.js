import { useCallback, useEffect, useState } from 'react'

/**
 * A profile is a person's birth details:
 * { id, name, date: 'YYYY-MM-DD', time: 'HH:MM', timeUnknown, place, lat, lon, tz }
 * Saved profiles live in this browser only (localStorage).
 */
const KEY = 'km_profiles'
const EVENT = 'km-profiles-changed'

function read() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch { /* storage unavailable (private mode) — profiles just won't persist */ }
  window.dispatchEvent(new Event(EVENT))
}

export const sameBirth = (a, b) =>
  a.name === b.name && a.date === b.date && a.time === b.time && a.lat === b.lat && a.lon === b.lon

export function saveProfile(profile) {
  const list = read()
  const existing = list.find(p => sameBirth(p, profile))
  if (existing) return existing
  const saved = { ...profile, id: profile.id || crypto.randomUUID?.() || String(Date.now()), savedAt: Date.now() }
  write([saved, ...list])
  return saved
}

export function removeProfile(id) {
  write(read().filter(p => p.id !== id))
}

export function useProfiles() {
  const [profiles, setProfiles] = useState(read)
  useEffect(() => {
    const sync = () => setProfiles(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync) }
  }, [])
  const isSaved = useCallback(p => profiles.some(s => sameBirth(s, p)), [profiles])
  return { profiles, isSaved }
}
