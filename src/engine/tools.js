// Calculations the AI astrologer can ask for while answering (transits, sign changes, dasha periods,
// Panchang). They run on the phone with the same engine as the rest of the app; only their
// descriptions (toolSpecs.js) go to the model. Same tools as backend/ask.py.
import { DateTime } from 'luxon'
import { RASHI, mod } from './constants'
import { ChartInputError, computeChart } from './chart'
import { computePanchang } from './panchang'
import { jdFromMillis, siderealLongitude } from './ephemeris'

export { TOOL_SPECS } from './toolSpecs'

export class ToolInputError extends Error {}

function parseDate(args, key) {
  const value = args?.[key]
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ToolInputError(`${key} must be a date as YYYY-MM-DD`)
  const d = DateTime.fromISO(value, { zone: 'utc' })
  if (!d.isValid) throw new ToolInputError(`${key} is not a real date: ${value}`)
  if (d.year < 1800 || d.year > 2200) throw new ToolInputError(`${key} must be between the years 1800 and 2200`)
  return d
}

const day = iso => iso.slice(0, 10)

function planetPositions(birth, natal, args) {
  const d = parseDate(args, 'date').toISODate()
  const sky = computeChart(d, '12:00', birth.lat, birth.lon, birth.tz)
  const asc = natal.ascendant.sign_index, moon = natal.planets.moon.sign_index
  const planets = {}
  for (const [name, p] of Object.entries(sky.planets)) {
    planets[name] = {
      sign: p.sign, degree: Math.round(p.degree * 100) / 100, nakshatra: p.nakshatra, pada: p.pada,
      retrograde: p.retrograde, house_from_moon: mod(p.sign_index - moon, 12) + 1,
      ...(birth.time_known ? { house_from_lagna: mod(p.sign_index - asc, 12) + 1 } : {}),
    }
  }
  return { date: d, planets }
}

const signAt = (jd, planet) => Math.floor((planet === 'ketu'
  ? mod(siderealLongitude(jd, 'rahu') + 180, 360)
  : siderealLongitude(jd, planet)) / 30)

// how far apart to sample; a planet never spends less than this in a sign, retrograde dips included
const STEP_DAYS = { moon: 1 / 24, sun: 1, mercury: 1, venus: 1, mars: 1, jupiter: 2, saturn: 2, rahu: 5, ketu: 5 }

function signChanges(birth, natal, args) {
  const planet = args?.planet
  if (!(planet in STEP_DAYS)) throw new ToolInputError('unknown planet')
  const start = parseDate(args, 'start_date'), end = parseDate(args, 'end_date')
  const span = end.diff(start, 'days').days
  const limit = planet === 'moon' ? 60 : 366 * 60
  if (!(span > 0 && span <= limit)) throw new ToolInputError(`end_date must be after start_date and at most ${limit} days later`)

  const zone = birth.tz
  const noon = DateTime.fromObject({ year: start.year, month: start.month, day: start.day, hour: 12 }, { zone })
  const jd0 = jdFromMillis(noon.toMillis())
  const step = STEP_DAYS[planet]
  let sign = signAt(jd0, planet)
  const starting = RASHI[sign]
  const changes = []
  for (let i = 1; i <= Math.round(span / step); i++) {
    const jd = jd0 + i * step
    const s = signAt(jd, planet)
    if (s === sign) continue
    // narrow the change down to about an hour
    let lo = jd - step, hi = jd
    while (hi - lo > 1 / 24) {
      const mid = (lo + hi) / 2
      if (signAt(mid, planet) === sign) lo = mid
      else hi = mid
    }
    const when = DateTime.fromMillis((hi - 2440587.5) * 86400000, { zone })
    changes.push({ date: when.toISODate(), ...(planet === 'moon' ? { approx_time: when.toFormat('HH:mm') } : {}), from: RASHI[sign], to: RASHI[s] })
    sign = s
  }
  return { planet, sign_on_start_date: starting, changes }
}

function dashaPeriods(birth, natal, args) {
  const start = parseDate(args, 'start_date').toISODate(), end = parseDate(args, 'end_date').toISODate()
  if (end < start) throw new ToolInputError('end_date must not be before start_date')
  const periods = natal.dasha.periods
    .filter(m => !(day(m.end) < start || day(m.start) > end))
    .map(m => ({
      mahadasha: m.lord, start: day(m.start), end: day(m.end),
      antardashas: m.antardashas.filter(a => !(day(a.end) < start || day(a.start) > end))
        .map(a => ({ lord: a.lord, start: day(a.start), end: day(a.end) })),
    }))
  return { periods }
}

function panchang(birth, natal, args) {
  const p = computePanchang(parseDate(args, 'date').toISODate(), birth.lat, birth.lon, birth.tz)
  delete p.location
  return { ...p, place: birth.place || 'birth place' }
}

const TOOLS = { get_planet_positions: planetPositions, find_sign_changes: signChanges, get_dasha_periods: dashaPeriods, get_panchang: panchang }

/** Run one tool call. Returns the text to send back to the model (errors included, so it can recover). */
export function runTool(name, rawArgs, birth, natal) {
  try {
    const func = TOOLS[name]
    if (!func) throw new ToolInputError(`unknown tool ${name}`)
    const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs || '{}') : rawArgs
    if (!args || typeof args !== 'object') throw new ToolInputError('arguments must be an object')
    return JSON.stringify(func(birth, natal, args))
  } catch (err) {
    if (err instanceof SyntaxError) return 'error: arguments were not valid JSON'
    return `error: ${err instanceof ToolInputError || err instanceof ChartInputError ? err.message : 'calculation failed'}`
  }
}
