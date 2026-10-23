import { useCallback, useEffect, useState } from 'react'

/**
 * A profile is a person's birth details:
 * { id, name, gender: 'male' | 'female' | '' (older profiles), date: 'YYYY-MM-DD', time: 'HH:MM', timeUnknown, place, lat, lon, tz,
 *   self: true for the logged-in person's own kundli }
 * Saved profiles live on this device (localStorage). When someone is logged in, account.js mirrors
 * every change to their account and keeps this list in step with it.
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

// where changes are mirrored while logged in: { put(profile), remove(id) } (see account.js)
let cloud = null
export function setCloudSink(sink) { cloud = sink }

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
  cloud?.put(saved)
  return saved
}

const BIRTH_FIELDS = ['name', 'gender', 'date', 'time', 'timeUnknown', 'place', 'lat', 'lon', 'tz', 'display_name']

/** Write changes made to a saved person (e.g. a corrected birth time) back to their saved profile. */
export function saveEdits(profile) {
  if (!profile?.id) return rememberGender(profile)
  const saved = read().find(p => p.id === profile.id)
  if (!saved) return
  const patch = Object.fromEntries(BIRTH_FIELDS.filter(k => profile[k] !== undefined && profile[k] !== saved[k]).map(k => [k, profile[k]]))
  if (Object.keys(patch).length) updateProfile(profile.id, patch)
}

/** Store a gender learned later (e.g. picking someone as the groom) on a profile saved without one. */
export function rememberGender(profile) {
  if (!profile?.gender) return
  const saved = read().find(p => (profile.id ? p.id === profile.id : p.name === profile.name && samePerson(p, profile)))
  if (saved && saved.gender !== profile.gender) updateProfile(saved.id, { gender: profile.gender })
}

export function updateProfile(id, patch) {
  const list = read().map(p => (p.id === id ? { ...p, ...patch } : p))
  write(list)
  const updated = list.find(p => p.id === id)
  if (updated) cloud?.put(updated)
}

/** Mark one saved person as the logged-in user's own kundli ("My kundli"); only one can be. */
export function setSelf(id) {
  for (const p of read()) {
    if (p.id === id && !p.self) updateProfile(p.id, { self: true })
    else if (p.id !== id && p.self) updateProfile(p.id, { self: false })
  }
}

export const readProfiles = read

/** Replace the whole list with the account's copy (no echo back to the account). */
export function replaceProfiles(list) {
  write([...list].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)))
}

/** Same birth moment, whatever the name or spelling of the place — i.e. the same person. */
export const samePerson = (a, b) => !!a && !!b && a.date === b.date && a.time === b.time && !!a.timeUnknown === !!b.timeUnknown

export function removeProfile(id) {
  write(read().filter(p => p.id !== id))
  cloud?.remove(id)
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
  return { profiles, isSaved, self: profiles.find(p => p.self) || null }
}
