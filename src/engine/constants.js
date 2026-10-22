// Shared Jyotish constants. Indexes are 0-based everywhere (Mesha = 0, Ashwini = 0).

export const RASHI = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena']

export const NAKSHATRA = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
]

export const NAKSHATRA_SPAN = 360 / 27 // 13°20'

// Lord of each rashi
export const RASHI_LORD = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
  'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter']

// Naisargika (natural) relationships, Parashara
const FRIENDS = {
  sun: ['moon', 'mars', 'jupiter'],
  moon: ['sun', 'mercury'],
  mars: ['sun', 'moon', 'jupiter'],
  mercury: ['sun', 'venus'],
  jupiter: ['sun', 'moon', 'mars'],
  venus: ['mercury', 'saturn'],
  saturn: ['mercury', 'venus'],
}
const ENEMIES = {
  sun: ['venus', 'saturn'],
  moon: [],
  mars: ['mercury'],
  mercury: ['moon'],
  jupiter: ['mercury', 'venus'],
  venus: ['sun', 'moon'],
  saturn: ['sun', 'moon', 'mars'],
}

/** How planet `a` regards planet `b`: 'friend' | 'neutral' | 'enemy' (same planet counts as friend). */
export function relation(a, b) {
  if (a === b || FRIENDS[a].includes(b)) return 'friend'
  if (ENEMIES[a].includes(b)) return 'enemy'
  return 'neutral'
}

// Vimshottari dasha sequence and years; nakshatra N is ruled by DASHA_ORDER[N % 9]
export const DASHA_ORDER = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury']
export const DASHA_YEARS = { ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17 }

/** Modulo that is never negative, like Python's % */
export const mod = (a, n) => ((a % n) + n) % n

export const rashiIndex = lon => Math.floor(lon / 30) % 12

/** [index, pada 1-4, fraction of nakshatra elapsed] */
export function nakshatraOf(lon) {
  const idx = Math.floor(lon / NAKSHATRA_SPAN) % 27
  const frac = mod(lon, NAKSHATRA_SPAN) / NAKSHATRA_SPAN
  return [idx, Math.min(Math.floor(frac * 4) + 1, 4), frac]
}
