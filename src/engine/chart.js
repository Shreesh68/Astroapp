// Sidereal birth chart, Vimshottari dasha and Kuja dosha — computed on the device.
// Same rules and result shape as the original Python backend (backend/chart.py, dasha.py, kuja.py).
import { DateTime } from 'luxon'
import { DASHA_ORDER, DASHA_YEARS, NAKSHATRA, RASHI, RASHI_LORD, mod, nakshatraOf, rashiIndex } from './constants'
import { ascendant, ayanamsa, grahaPositions, jdFromMillis } from './ephemeris'

export class ChartInputError extends Error {}

/** Local date + time at a place → luxon DateTime in UTC. */
export function localToUtc(date, time, tz) {
  if (!DateTime.now().setZone(tz).isValid) throw new ChartInputError(`unknown time zone: '${tz}'`)
  const dt = DateTime.fromISO(`${date}T${time}`, { zone: tz })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !dt.isValid) throw new ChartInputError('date must be YYYY-MM-DD and time HH:MM')
  return dt.toUTC()
}

/** Describe an ecliptic longitude: rashi, degree in rashi, nakshatra and pada. */
export function point(lon) {
  const r = rashiIndex(lon)
  const [nak, pada] = nakshatraOf(lon)
  return { lon, sign: RASHI[r], sign_index: r, degree: mod(lon, 30), nakshatra: NAKSHATRA[nak], nakshatra_index: nak, pada }
}

export function computeChart(date, time, lat, lon, tz, timeKnown = true) {
  if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) throw new ChartInputError('latitude/longitude out of range')
  const utc = localToUtc(date, time, tz)
  const jd = jdFromMillis(utc.toMillis())

  const planets = {}
  for (const [name, p] of Object.entries(grahaPositions(jd))) planets[name] = { ...point(p.lon), retrograde: p.retrograde }
  planets.rahu.retrograde = true // nodes always move backwards (mean node)
  planets.ketu = { ...point(mod(planets.rahu.lon + 180, 360)), retrograde: true }

  const asc = point(ascendant(jd, lat, lon))
  for (const p of Object.values(planets)) p.house = mod(p.sign_index - asc.sign_index, 12) + 1 // whole-sign houses

  const moon = planets.moon
  const signs = Object.fromEntries(Object.entries(planets).map(([name, p]) => [name, p.sign_index]))
  return {
    requested: { date, time, lat, lon, tz, ayanamsa: 'lahiri', time_known: timeKnown },
    utc: utc.toISO(),
    jd_ut: jd,
    ayanamsa_degree: ayanamsa(jd),
    ascendant: asc,
    planets,
    moon_nakshatra: { index: moon.nakshatra_index, name: moon.nakshatra, pada: moon.pada },
    moon_sign_lord: RASHI_LORD[moon.sign_index],
    manglik: kujaDosha(signs, asc.sign_index, timeKnown),
    dosha_samya: samyaPlanets(signs, asc.sign_index, timeKnown),
    dasha: vimshottari(moon.lon, utc.toMillis()),
  }
}

// ── Vimshottari dasha (120-year cycle) from the Moon's sidereal longitude ──

const DAY_MS = 86400000
const YEAR_DAYS = 365.25
const TOTAL_YEARS = 120
const iso = ms => new Date(ms).toISOString().slice(0, 16) + 'Z'

/** Antardashas within a mahadasha: same sequence starting from the mahadasha lord. */
function subPeriods(lord, start, years) {
  const out = []
  const i = DASHA_ORDER.indexOf(lord)
  let t = start
  for (let k = 0; k < 9; k++) {
    const sub = DASHA_ORDER[(i + k) % 9]
    const span = (years * DASHA_YEARS[sub] / TOTAL_YEARS) * YEAR_DAYS * DAY_MS
    out.push({ lord: sub, start: t, end: t + span })
    t += span
  }
  return out
}

/**
 * Mahadashas covering 120 years from birth. The first one is partial (the 'balance' at birth).
 * Times are UTC ISO strings. The first mahadasha's antardashas are computed from its theoretical
 * start (before birth) so sub-period boundaries are correct, then clipped to birth.
 */
export function vimshottari(moonLon, birth) {
  const [nak, , frac] = nakshatraOf(moonLon)
  const first = DASHA_ORDER[nak % 9]
  let t = birth - DASHA_YEARS[first] * frac * YEAR_DAYS * DAY_MS
  const endOfLife = birth + TOTAL_YEARS * YEAR_DAYS * DAY_MS

  const periods = []
  let i = DASHA_ORDER.indexOf(first)
  while (t < endOfLife) {
    const lord = DASHA_ORDER[i % 9]
    const years = DASHA_YEARS[lord]
    const end = t + years * YEAR_DAYS * DAY_MS
    const antardashas = subPeriods(lord, t, years).filter(s => s.end > birth)
      .map(s => ({ lord: s.lord, start: iso(Math.max(s.start, birth)), end: iso(s.end) }))
    periods.push({ lord, years, start: iso(Math.max(t, birth)), end: iso(end), antardashas })
    t = end
    i++
  }
  return {
    balance_at_birth: { lord: first, years: Math.round(DASHA_YEARS[first] * (1 - frac) * 10000) / 10000 },
    periods,
  }
}

// ── Kuja (Mangal) dosha, as reckoned in South India ──
// Mars in the 2nd, 4th, 7th, 8th or 12th house (whole-sign) from the Lagna, the Moon or Venus gives the
// dosha; the more references that show it, the stronger. Exemptions are reported with their reason.

const DOSHA_HOUSES = [2, 4, 7, 8, 12]
const REFERENCES = ['lagna', 'moon', 'venus']
const [MESHA, VRISHABHA, MITHUNA, KARKA, SIMHA, KANYA, TULA, VRISCHIKA, DHANU, MAKARA, KUMBHA, MEENA] = RASHI.keys()

// No dosha when Mars, in the given house, occupies one of these signs
const HOUSE_SIGN_EXEMPTIONS = {
  2: [[MITHUNA, KANYA], 'Mars in the 2nd house in Mithuna or Kanya'],
  4: [[MESHA, VRISCHIKA], 'Mars in the 4th house in Mesha or Vrischika'],
  7: [[KARKA, MAKARA], 'Mars in the 7th house in Karka or Makara'],
  8: [[DHANU, MEENA], 'Mars in the 8th house in Dhanu or Meena'],
  12: [[VRISHABHA, TULA], 'Mars in the 12th house in Vrishabha or Tula'],
}

// Malefics whose presence in dosha houses of the other chart balances Kuja dosha (dosha samya)
const SAMYA_PLANETS = ['saturn', 'rahu', 'ketu']

const houseFrom = (sign, refSign) => mod(sign - refSign, 12) + 1

/** Graha drishti between signs: all planets aspect the 7th; Mars 4/8, Jupiter 5/9, Saturn 3/10 too. */
function aspects(planet, fromSign, toSign) {
  const h = houseFrom(toSign, fromSign)
  const special = { mars: [4, 8], jupiter: [5, 9], saturn: [3, 10] }[planet] || []
  return h === 7 || special.includes(h)
}

/**
 * Exemptions that hold whichever house Mars occupies (Jataka Parijata: Jupiter or Mercury with or
 * aspecting Mars; Karka/Simha Lagna, for which Mars is a yogakaraka). ascSign is null when the
 * birth time is unknown. Mars in its own or exalted sign cancels only where the house table says so.
 */
function generalExemption(signs, ascSign) {
  const mars = signs.mars
  if (ascSign === KARKA || ascSign === SIMHA) return 'Lagna is Karka or Simha, for which Mars is a yogakaraka'
  for (const [p, label] of [['jupiter', 'Jupiter'], ['mercury', 'Mercury']]) {
    if (signs[p] === mars) return `Mars is conjunct ${label}`
  }
  for (const [p, label] of [['jupiter', 'Jupiter'], ['mercury', 'Mercury']]) {
    if (aspects(p, signs[p], mars)) return `Mars is aspected by ${label}`
  }
  return null
}

export function kujaDosha(signs, ascSign, timeKnown = true) {
  const mars = signs.mars
  const general = generalExemption(signs, timeKnown ? ascSign : null)
  const refs = REFERENCES.map(ref => {
    if (ref === 'lagna' && !timeKnown) {
      return { from: ref, house: null, dosha_house: false, active: false, cancelled_reason: null, skipped: 'birth time unknown' }
    }
    const h = houseFrom(mars, ref === 'lagna' ? ascSign : signs[ref])
    const inHouse = DOSHA_HOUSES.includes(h)
    let reason = null
    if (inHouse) {
      const [exemptSigns, why] = HOUSE_SIGN_EXEMPTIONS[h]
      reason = exemptSigns.includes(mars) ? why : general
    }
    return { from: ref, house: h, dosha_house: inHouse, active: inHouse && reason === null, cancelled_reason: reason }
  })

  const active = refs.filter(r => r.active).map(r => r.from)
  const inHouses = refs.filter(r => r.dosha_house)
  const byRef = Object.fromEntries(refs.map(r => [r.from, r]))
  return {
    present: active.length > 0,
    // 'cancelled': Mars is in a dosha house, but every one of them is exempt
    strength: active.length ? ['none', 'mild', 'moderate', 'strong'][active.length] : inHouses.length ? 'cancelled' : 'none',
    active_from: active,
    references: refs,
    // first exemption that removed an otherwise-present dosha (when no reference stays active)
    cancelled_reason: active.length || !inHouses.length ? null : inHouses[0].cancelled_reason,
    mars_house_from_lagna: byRef.lagna.house,
    mars_house_from_moon: byRef.moon.house,
    mars_house_from_venus: byRef.venus.house,
  }
}

/** Malefics sitting in dosha houses from Lagna or Moon — they counterbalance the partner's dosha. */
export function samyaPlanets(signs, ascSign, timeKnown = true) {
  const found = []
  const refs = timeKnown ? [['lagna', ascSign], ['moon', signs.moon]] : [['moon', signs.moon]]
  for (const p of SAMYA_PLANETS) {
    for (const [ref, refSign] of refs) {
      const h = houseFrom(signs[p], refSign)
      if (DOSHA_HOUSES.includes(h)) { found.push({ planet: p, from: ref, house: h }); break }
    }
  }
  return found
}

/** groom/bride: { kuja: kujaDosha(...), samya: samyaPlanets(...) } */
export function kujaCompatibility(groom, bride) {
  const g = groom.kuja.present, b = bride.kuja.present
  if (g && b) return { status: 'both', ok: true, balanced_by: [] }
  if (!g && !b) return { status: 'none', ok: true, balanced_by: [] }
  const [who, other] = g ? ['groom', bride] : ['bride', groom]
  return { status: who, ok: other.samya.length > 0, balanced_by: other.samya }
}
