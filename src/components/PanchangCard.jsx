import { useCallback, useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { useLanguage } from '../contexts/LanguageContext'
import { loadPanchang, prefetchAhead, readPanchang } from '../lib/panchangCache'
import { onResume } from '../lib/platform'
import { AYANAS_KN, KARANAS_KN, MAASAS_KN, YOGAS_KN, NAKSHATRAS, RUTUS_KN, SAMVATSARAS_KN, VARAS_KN, pick, tithiLabel } from '../lib/astro'
import { fmtClock, todayIn } from '../lib/dates'

const PLACE_KEY = 'km_panchang_place'
export const DEFAULT_PLACE = { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' }

export function loadPanchangPlace() {
  try {
    const p = JSON.parse(localStorage.getItem(PLACE_KEY))
    return p?.tz ? p : DEFAULT_PLACE
  } catch {
    return DEFAULT_PLACE
  }
}

export function savePanchangPlace(place) {
  try { localStorage.setItem(PLACE_KEY, JSON.stringify(place)) } catch { /* ignore */ }
}

/** Today's date in the place's time zone; rolls over at local midnight and when the app resumes. */
export function useToday(tz) {
  const [today, setToday] = useState(() => todayIn(tz))
  useEffect(() => {
    const check = () => setToday(todayIn(tz))
    check()
    let timer
    const scheduleMidnight = () => {
      const now = DateTime.now().setZone(tz)
      const ms = now.plus({ days: 1 }).startOf('day').diff(now).as('milliseconds') + 1000
      timer = setTimeout(() => { check(); scheduleMidnight() }, ms)
    }
    scheduleMidnight()
    // timers pause while the phone sleeps, so also re-check whenever the user returns
    const off = onResume(check)
    window.addEventListener('online', check)
    return () => { clearTimeout(timer); off(); window.removeEventListener('online', check) }
  }, [tz])
  return today
}

/** Re-render every minute (keeps "happening now" markers current). */
function useMinuteTick() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 60_000)
    const off = onResume(() => setTick(n => n + 1))
    return () => { clearInterval(id); off() }
  }, [])
}

const RETRY_MS = [5_000, 15_000, 30_000, 60_000]

/**
 * Panchang for a date and place: saved copy first (instant, offline), otherwise fetched.
 * Failed loads retry with back-off, and immediately when the connection or the app comes back.
 * Once a day is shown, the following week is saved in the background.
 */
export function usePanchang(date, place) {
  const [state, setState] = useState(() => {
    const saved = readPanchang(date, place)
    return { data: saved, error: null, loading: !saved }
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    let timer
    let inFlight = false
    let failures = 0

    function run() {
      if (inFlight) return
      inFlight = true
      clearTimeout(timer)
      setState(s => ({ ...s, loading: true }))
      loadPanchang(date, place)
        .then(data => {
          if (!alive) return
          setState({ data, error: null, loading: false })
          prefetchAhead(date, place)
        })
        .catch(error => {
          if (!alive) return
          setState({ data: null, error, loading: false })
          timer = setTimeout(run, RETRY_MS[Math.min(failures++, RETRY_MS.length - 1)])
        })
        .finally(() => { inFlight = false })
    }

    const saved = readPanchang(date, place)
    if (saved) {
      setState({ data: saved, error: null, loading: false })
      prefetchAhead(date, place)
    } else {
      setState({ data: null, error: null, loading: true }) // never show another day's data
      run()
    }
    const retryNow = () => { if (alive && !readPanchang(date, place)) { failures = 0; run() } }
    window.addEventListener('online', retryNow)
    const off = onResume(retryNow)
    return () => { alive = false; clearTimeout(timer); window.removeEventListener('online', retryNow); off() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, place.lat, place.lon, place.tz, attempt])

  const reload = useCallback(() => setAttempt(a => a + 1), [])
  return { ...state, reload }
}

/** Loading / offline / error states for a Panchang that isn't available yet. */
export function PanchangStatus({ loading, error, onRetry }) {
  const { t } = useLanguage()
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!loading) return
    setSlow(false)
    const id = setTimeout(() => setSlow(true), 5000)
    return () => clearTimeout(id)
  }, [loading])

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  return (
    <div role="status" aria-live="polite" className="rounded-xl bg-cream px-4 py-6 text-center text-sm">
      {loading && (
        <>
          <p className="font-medium text-ink-700 animate-pulse">{t('loading_panchang')}</p>
          {slow && <p className="mt-2 text-ink-500">{t('loading_wake')}</p>}
        </>
      )}
      {!loading && error && (
        <>
          <p className="font-medium text-ink-700">{offline ? t('p_offline') : t('p_failed')}</p>
          <p className="mt-1 text-ink-500">{t('p_auto_retry')}</p>
          <button onClick={onRetry} className="mt-3 font-semibold text-kumkum underline">{t('retry')}</button>
        </>
      )}
    </div>
  )
}

const isNow = ({ start, end }) => {
  const now = Date.now()
  return Date.parse(start) <= now && now < Date.parse(end)
}

export default function PanchangCard({ data, compact = false }) {
  const { t, lang } = useLanguage()
  useMinuteTick()
  if (!data) return null
  const vara = lang === 'kn' ? VARAS_KN[data.vara.index] : data.vara.name
  const until = iso => (iso ? t('p_until', { time: fmtClock(iso, lang) }) : '')

  const limbs = [
    { label: t('p_tithi'), value: tithiLabel(data.tithi, lang), sub: until(data.tithi.ends) },
    { label: t('p_nak'), value: pick(NAKSHATRAS[data.nakshatra.index], lang), sub: until(data.nakshatra.ends) },
    { label: t('p_yoga'), value: lang === 'kn' ? YOGAS_KN[data.yoga.index] : data.yoga.name, sub: until(data.yoga.ends) },
    { label: t('p_karana'), value: lang === 'kn' ? KARANAS_KN[data.karana.name] : data.karana.name, sub: until(data.karana.ends) },
  ]
  const bad = [
    { label: t('p_rahu'), ...data.rahu_kala },
    { label: t('p_yama'), ...data.yamaganda },
    { label: t('p_gulika'), ...data.gulika },
  ]
  const kn = lang === 'kn'
  const maasa = (kn ? MAASAS_KN[data.maasa.index] : data.maasa.name)
  const year = [
    { label: t('p_samvatsara'), value: kn ? SAMVATSARAS_KN[data.samvatsara.index] : data.samvatsara.name },
    { label: t('p_ayana'), value: kn ? AYANAS_KN[data.ayana.key] : data.ayana.name },
    { label: t('p_rutu'), value: kn ? RUTUS_KN[data.rutu.index] : data.rutu.name },
    { label: t('p_maasa'), value: data.maasa.adhika ? `${t('p_adhika')} ${maasa}` : maasa },
  ]
  const shownLimbs = compact ? limbs.slice(0, 2) : limbs
  const shownBad = compact ? bad.slice(0, 1) : bad

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
        <p className="font-display text-2xl font-semibold">{vara}</p>
        <p className="text-sm text-ink-500">
          ☀ {t('p_sunrise')} <b className="text-ink">{fmtClock(data.sunrise, lang)}</b>
          <span className="mx-2">·</span>
          {t('p_sunset')} <b className="text-ink">{fmtClock(data.sunset, lang)}</b>
        </p>
      </div>

      <dl className="mb-4 flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-cream-200 px-4 py-3 text-sm">
        {year.map(y => (
          <div key={y.label} className="flex items-baseline gap-1.5">
            <dt className="text-ink-500">{y.label}</dt>
            <dd className="font-semibold">{y.value}</dd>
          </div>
        ))}
      </dl>

      <dl className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {shownLimbs.map(l => (
          <div key={l.label} className="rounded-xl bg-cream px-4 py-3">
            <dt className="eyebrow">{l.label}</dt>
            <dd className="font-semibold mt-0.5">{l.value}</dd>
            <dd className="text-xs text-ink-500">{l.sub}</dd>
          </div>
        ))}
      </dl>

      {!compact && <p className="mt-2 text-xs text-ink-300">{t('p_amanta')}</p>}

      <div className="mt-4">
        {!compact && <h3 className="text-sm font-semibold text-ink-700 mb-2">{t('p_inauspicious')}</h3>}
        <ul className={`grid grid-cols-1 gap-2 ${compact ? '' : 'sm:grid-cols-3'}`}>
          {shownBad.map(b => {
            const now = isNow(b)
            return (
              <li key={b.label} className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 rounded-xl px-4 py-2.5 text-sm ${now ? 'bg-kumkum-50 ring-1 ring-kumkum' : 'bg-white ring-1 ring-cream-200'}`}>
                <span className="font-medium">{b.label}</span>
                <span className="text-ink-700 tabular-nums whitespace-nowrap">
                  {fmtClock(b.start, lang)} – {fmtClock(b.end, lang)}
                  {now && <span className="ml-2 chip-bad">{t('p_now')}</span>}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
