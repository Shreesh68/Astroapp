// Sidereal positions on the phone, matching the conventions of the Swiss Ephemeris backend this
// replaced: Lahiri ayanamsa, geocentric apparent planets, mean lunar node, positions measured from
// the mean equinox of date minus the mean ayanamsa (what swe.calc_ut returns with FLG_SIDEREAL).
// Planet positions come from Astronomy Engine (MIT), accurate to well under an arcminute.
import * as Astronomy from 'astronomy-engine'
import { mod } from './constants'

const J2000 = 2451545.0
const UNIX_EPOCH_JD = 2440587.5
const DEG = Math.PI / 180

export const jdFromMillis = ms => ms / 86400000 + UNIX_EPOCH_JD
export const millisFromJd = jd => (jd - UNIX_EPOCH_JD) * 86400000

const time = jdUt => Astronomy.MakeTime(jdUt - J2000)

// Lahiri (Chitrapaksha): 23.245524743° at JD 2435553.5, carried forward by the general precession in
// longitude (IAU 2006).
const LAHIRI_T0 = (2435553.5 - J2000) / 36525
const LAHIRI_AT_T0 = 23.245524743
const precession = T => (5028.796195 * T + 1.1054348 * T ** 2 + 0.00007964 * T ** 3
  - 0.000023857 * T ** 4 - 0.0000000383 * T ** 5) / 3600

const centuriesTT = t => t.tt / 36525

/** Mean ayanamsa (degrees) at a moment given as Julian day (UT). */
export function ayanamsa(jdUt) {
  return LAHIRI_AT_T0 + precession(centuriesTT(time(jdUt))) - precession(LAHIRI_T0)
}

const BODIES = {
  sun: Astronomy.Body.Sun, moon: Astronomy.Body.Moon, mars: Astronomy.Body.Mars, mercury: Astronomy.Body.Mercury,
  jupiter: Astronomy.Body.Jupiter, venus: Astronomy.Body.Venus, saturn: Astronomy.Body.Saturn,
}

function meanNode(t) {
  // mean longitude of the Moon's ascending node, mean equinox of date (Chapront et al.)
  const T = centuriesTT(t)
  return mod(125.0445479 - 1934.1362891 * T + 0.0020754 * T ** 2 + T ** 3 / 467441 - T ** 4 / 60616000, 360)
}

function siderealAt(t, name, ayan, dpsi) {
  if (name === 'rahu') return mod(meanNode(t) - ayan, 360)
  // true ecliptic of date → mean equinox of date by removing the nutation in longitude
  const ecl = Astronomy.Ecliptic(Astronomy.GeoVector(BODIES[name], t, true))
  return mod(ecl.elon - dpsi - ayan, 360)
}

/** Sidereal longitude (degrees) of one graha ('sun' … 'saturn', 'rahu'). */
export function siderealLongitude(jdUt, name) {
  const t = time(jdUt)
  return siderealAt(t, name, ayanamsa(jdUt), Astronomy.e_tilt(t).dpsi / 3600)
}

/** { lon, retrograde } for each graha, Ketu excluded. */
export function grahaPositions(jdUt) {
  const out = {}
  const t = time(jdUt)
  const ayan = ayanamsa(jdUt)
  const dpsi = Astronomy.e_tilt(t).dpsi / 3600
  for (const name of ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu']) {
    const lon = siderealAt(t, name, ayan, dpsi)
    // direction of motion over an hour either side
    const before = siderealLongitude(jdUt - 1 / 24, name)
    const after = siderealLongitude(jdUt + 1 / 24, name)
    out[name] = { lon, retrograde: mod(after - before + 180, 360) - 180 < 0 }
  }
  return out
}

/** Sidereal Ascendant (degrees) for a moment and place. */
export function ascendant(jdUt, lat, lon) {
  const t = time(jdUt)
  const tilt = Astronomy.e_tilt(t)
  const ramc = mod(Astronomy.SiderealTime(t) * 15 + lon, 360) * DEG // apparent sidereal time
  const eps = tilt.tobl * DEG
  const tropical = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat * DEG) * Math.sin(eps))) / DEG
  return mod(tropical - tilt.dpsi / 3600 - ayanamsa(jdUt), 360)
}

/** Julian day (UT) of the next sunrise (direction +1) or sunset (-1) after jdUt, or null. */
export function sunEvent(jdUt, lat, lon, direction) {
  const found = Astronomy.SearchRiseSet(Astronomy.Body.Sun, new Astronomy.Observer(lat, lon, 0), direction, time(jdUt), 2)
  return found ? found.ut + J2000 : null
}
