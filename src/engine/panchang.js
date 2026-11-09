// Daily Panchang for a place: the five limbs at local sunrise, plus Rahu Kala & co.
// Same rules and result shape as the original Python backend (backend/panchang.py).
import { DateTime } from 'luxon'
import { NAKSHATRA, NAKSHATRA_SPAN, mod } from './constants'
import { ChartInputError } from './chart'
import { jdFromMillis, millisFromJd, siderealLongitude, sunEvent } from './ephemeris'

const TITHI_NAMES = ['Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami',
  'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi']
const YOGA_NAMES = ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti',
  'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata',
  'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti']
const MOVABLE_KARANA = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti']
const VARA_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Amanta lunar months (Karnataka spelling), Chaitra first
const MAASA_NAMES = ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwayuja',
  'Kartika', 'Margashira', 'Pushya', 'Magha', 'Phalguna']
// Chandramana rutus: two lunar months each, starting with Chaitra
const RUTU_NAMES = ['Vasanta', 'Grishma', 'Varsha', 'Sharad', 'Hemanta', 'Shishira']
const SAMVATSARA_NAMES = [
  'Prabhava', 'Vibhava', 'Shukla', 'Pramoduta', 'Prajotpatti', 'Angirasa', 'Shrimukha', 'Bhava', 'Yuva', 'Dhatu',
  'Ishvara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vrisha', 'Chitrabhanu', 'Svabhanu', 'Tarana', 'Parthiva', 'Vyaya',
  'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikriti', 'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukhi',
  'Hevilambi', 'Vilambi', 'Vikari', 'Sharvari', 'Plava', 'Shubhakrit', 'Shobhakrit', 'Krodhi', 'Vishvavasu', 'Parabhava',
  'Plavanga', 'Kilaka', 'Saumya', 'Sadharana', 'Virodhikrit', 'Paridhavi', 'Pramadicha', 'Ananda', 'Rakshasa', 'Nala',
  'Pingala', 'Kalayukti', 'Siddharthi', 'Raudri', 'Durmati', 'Dundubhi', 'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Akshaya',
]
const PRABHAVA_YEAR = 1987 // a Prabhava samvatsara began at Ugadi 1987

// 1-based eighth of the daytime (sunrise→sunset) for each weekday, Sunday first
const RAHU_KALA = [8, 2, 7, 5, 6, 4, 3]
const YAMAGANDA = [5, 4, 3, 2, 1, 7, 6]
const GULIKA = [7, 6, 5, 4, 3, 2, 1]

function limbs(jd) {
  const sun = siderealLongitude(jd, 'sun'), moon = siderealLongitude(jd, 'moon')
  const diff = mod(moon - sun, 360)
  return {
    tithi: Math.floor(diff / 12), // 0..29
    nakshatra: Math.floor(moon / NAKSHATRA_SPAN) % 27, // 0..26
    yoga: Math.floor(mod(sun + moon, 360) / NAKSHATRA_SPAN), // 0..26
    karana: Math.floor(diff / 6), // 0..59
  }
}

/** First moment after jdStart when limb `key` changes value (bisection, ~1 minute precision). */
function endTime(jdStart, key, maxDays = 2) {
  const startVal = limbs(jdStart)[key]
  const step = 1 / 24
  let lo = jdStart
  let hi = jdStart + step
  while (limbs(hi)[key] === startVal) {
    lo = hi
    hi += step
    if (hi - jdStart > maxDays) return null
  }
  while (hi - lo > 1 / 1440) {
    const mid = (lo + hi) / 2
    if (limbs(mid)[key] === startVal) lo = mid
    else hi = mid
  }
  return hi
}

const MEAN_ELONGATION_RATE = 12.190749 // degrees per day the Moon gains on the Sun

const elongation = jd => mod(siderealLongitude(jd, 'moon') - siderealLongitude(jd, 'sun'), 360)

/** Refine a guess to the exact new moon (Sun–Moon conjunction) nearest to it. */
function newMoon(guess) {
  let jd = guess
  for (let i = 0; i < 8; i++) {
    const e = mod(elongation(jd) + 180, 360) - 180 // signed, near 0 at new moon
    jd -= e / MEAN_ELONGATION_RATE
  }
  return jd
}

/**
 * Amanta month containing jd: named by the Sun's sidereal sign at the new moon that began it.
 * A month in which the Sun changes no sign (no sankranti) is Adhika, named after the month that follows.
 */
function lunarMonth(jd) {
  let start = newMoon(jd - elongation(jd) / MEAN_ELONGATION_RATE)
  if (start > jd) start = newMoon(start - 29.5) // refinement overshot into the next lunation
  const end = newMoon(start + 29.53)
  const sunStart = Math.floor(siderealLongitude(start, 'sun') / 30)
  const sunEnd = Math.floor(siderealLongitude(end, 'sun') / 30)
  return { index: (sunStart + 1) % 12, adhika: sunStart === sunEnd } // Sun in Meena at the new moon → Chaitra
}

function karanaName(k) {
  if (k === 0) return 'Kimstughna'
  if (k >= 57) return ['Shakuni', 'Chatushpada', 'Naga'][k - 57]
  return MOVABLE_KARANA[(k - 1) % 7]
}

function tithiName(t) {
  const paksha = t < 15 ? 'Shukla' : 'Krishna'
  const n = t % 15
  if (n === 14) return [paksha, paksha === 'Shukla' ? 'Purnima' : 'Amavasya']
  return [paksha, TITHI_NAMES[n]]
}

// ── Festivals ─────────────────────────────────────────────────────────────
// A festival falls on the first day whose deciding time of day ("kala") has the festival's tithi, in
// the festival's amanta month (never in an Adhika month). If the tithi starts and ends between two
// such times (kshaya), it goes to the day it began. Tithi index: Shukla Prathama 0 … Purnima 14,
// Krishna Prathama 15 … Amavasya 29. Maasa: Chaitra 0 … Phalguna 11.
const FESTIVALS = [
  { key: 'ugadi', maasa: 0, tithi: 0, kala: 'sunrise' },
  { key: 'rama_navami', maasa: 0, tithi: 8, kala: 'madhyahna' },
  { key: 'akshaya_tritiya', maasa: 1, tithi: 2, kala: 'sunrise' },
  { key: 'nagara_panchami', maasa: 4, tithi: 4, kala: 'sunrise' },
  { key: 'krishna_janmashtami', maasa: 4, tithi: 22, kala: 'nishita' },
  { key: 'ganesha_chaturthi', maasa: 5, tithi: 3, kala: 'madhyahna' },
  { key: 'mahalaya_amavasya', maasa: 5, tithi: 29, kala: 'aparahna' },
  { key: 'navaratri', maasa: 6, tithi: 0, kala: 'sunrise' },
  { key: 'vijayadashami', maasa: 6, tithi: 9, kala: 'aparahna' },
  { key: 'naraka_chaturdashi', maasa: 6, tithi: 28, kala: 'arunodaya' },
  { key: 'deepavali', maasa: 6, tithi: 29, kala: 'pradosha' },
  { key: 'bali_padyami', maasa: 7, tithi: 0, kala: 'sunrise' },
  { key: 'utthana_dwadashi', maasa: 7, tithi: 11, kala: 'sunrise' },
  { key: 'maha_shivaratri', maasa: 10, tithi: 28, kala: 'nishita' },
  { key: 'holi', maasa: 11, tithi: 14, kala: 'pradosha' },
  { key: 'ekadashi', maasa: null, tithi: [10, 25], kala: 'sunrise' },
]

/** The deciding moments of one day, from its sunrise, sunset and the next sunrise. */
function kalas(sunrise, sunset, nextSunrise) {
  const day = sunset - sunrise
  return {
    arunodaya: sunrise - 0.0667, // about 96 minutes before sunrise
    sunrise,
    madhyahna: sunrise + day * 0.5,
    aparahna: sunrise + day * 0.7,
    pradosha: sunset + 0.05, // about 72 minutes after sunset
    nishita: (sunset + nextSunrise) / 2,
  }
}

// Observed the day before another festival, as in Karnataka
const EVE_OF = { gowri_habba: 'ganesha_chaturthi', mahanavami: 'vijayadashami' }

function festivalsOn(date, lat, lon, tz, eves = true) {
  const dayKalas = d => {
    const jd0 = jdFromMillis(DateTime.fromISO(date, { zone: tz }).plus({ days: d }).startOf('day').toMillis())
    const rise = sunEvent(jd0, lat, lon, +1)
    const set = sunEvent(rise, lat, lon, -1)
    return kalas(rise, set, sunEvent(set, lat, lon, +1))
  }
  const [prev, today, next] = [-1, 0, 1].map(dayKalas)
  const tithiAt = jd => limbs(jd).tithi
  const found = []
  // the festival's month is the one the tithi runs in: for a skipped tithi, the month just after this kala
  const inMonth = (f, jd) => {
    const month = lunarMonth(jd)
    return !month.adhika && (f.maasa == null || month.index === f.maasa)
  }
  for (const f of FESTIVALS) {
    const at = today[f.kala]
    for (const target of [].concat(f.tithi)) {
      const now = tithiAt(at)
      const first = now === target && tithiAt(prev[f.kala]) !== target && inMonth(f, at)
      const skipped = now === mod(target - 1, 30) && tithiAt(next[f.kala]) === mod(target + 1, 30) && inMonth(f, (at + next[f.kala]) / 2)
      if (first || skipped) found.push(f.key)
    }
  }
  // Makara Sankranti: the Sun enters sidereal Makara between this sunrise and the next
  const sign = jd => Math.floor(siderealLongitude(jd, 'sun') / 30)
  if (sign(today.sunrise) === 8 && sign(next.sunrise) === 9) found.push('makara_sankranti')
  if (eves) {
    const tomorrow = festivalsOn(DateTime.fromISO(date).plus({ days: 1 }).toISODate(), lat, lon, tz, false)
    for (const [eve, of] of Object.entries(EVE_OF)) if (tomorrow.includes(of)) found.unshift(eve)
  }
  return found
}

export function computePanchang(date, lat, lon, tz) {
  if (!DateTime.now().setZone(tz).isValid) throw new ChartInputError(`unknown time zone: '${tz}'`)
  const day = DateTime.fromISO(date, { zone: tz })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !day.isValid) throw new ChartInputError('date must be YYYY-MM-DD')

  const jd0 = jdFromMillis(day.startOf('day').toMillis())
  const toLocal = jd => jd == null ? null
    : DateTime.fromMillis(Math.round(millisFromJd(jd)), { zone: tz }).toFormat("yyyy-MM-dd'T'HH:mmZZ")

  const sunrise = sunEvent(jd0, lat, lon, +1)
  if (sunrise == null) throw new ChartInputError('no sunrise at this latitude on this date')
  const sunset = sunEvent(sunrise, lat, lon, -1)
  const l = limbs(sunrise)
  const maasa = lunarMonth(sunrise)
  const sunSign = Math.floor(siderealLongitude(sunrise, 'sun') / 30)
  const ends = Object.fromEntries(['tithi', 'nakshatra', 'yoga', 'karana'].map(k => [k, endTime(sunrise, k)]))

  const weekday = day.weekday % 7 // luxon Monday=1 … Sunday=7 → Sunday=0
  const eighth = (sunset - sunrise) / 8
  const segment = part => {
    const s = sunrise + (part - 1) * eighth
    return { start: toLocal(s), end: toLocal(s + eighth) }
  }

  const [paksha, tithi] = tithiName(l.tithi)
  // Chandramana year begins at Ugadi (Chaitra Shukla Prathama, Mar–Apr). Pushya–Phalguna falling
  // early in the Gregorian year still belong to the previous samvatsara.
  const year = maasa.index < 9 || day.month >= 6 ? day.year : day.year - 1
  const samvatsara = mod(year - PRABHAVA_YEAR, 60)
  const rutu = Math.floor(maasa.index / 2)
  const uttarayana = sunSign >= 9 || sunSign <= 2 // Sun from Makara through Mithuna
  return {
    date,
    location: { lat, lon, tz },
    samvatsara: { index: samvatsara, name: SAMVATSARA_NAMES[samvatsara] },
    ayana: { key: uttarayana ? 'uttarayana' : 'dakshinayana', name: uttarayana ? 'Uttarayana' : 'Dakshinayana' },
    rutu: { index: rutu, name: RUTU_NAMES[rutu] },
    maasa: { index: maasa.index, name: MAASA_NAMES[maasa.index], adhika: maasa.adhika, system: 'amanta' },
    vara: { index: weekday, name: VARA_NAMES[weekday] },
    sunrise: toLocal(sunrise),
    sunset: toLocal(sunset),
    tithi: { index: l.tithi, paksha, name: tithi, ends: toLocal(ends.tithi) },
    nakshatra: { index: l.nakshatra, name: NAKSHATRA[l.nakshatra], ends: toLocal(ends.nakshatra) },
    yoga: { index: l.yoga, name: YOGA_NAMES[l.yoga], ends: toLocal(ends.yoga) },
    karana: { index: l.karana, name: karanaName(l.karana), ends: toLocal(ends.karana) },
    rahu_kala: segment(RAHU_KALA[weekday]),
    yamaganda: segment(YAMAGANDA[weekday]),
    gulika: segment(GULIKA[weekday]),
    festivals: festivalsOn(date, lat, lon, tz),
  }
}
