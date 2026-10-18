import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { getPanchang } from '../lib/api'
import { AYANAS_KN, KARANAS_KN, MAASAS_KN, YOGAS_KN, NAKSHATRAS, RUTUS_KN, SAMVATSARAS_KN, VARAS_KN, pick, tithiLabel } from '../lib/astro'
import { fmtClock } from '../lib/dates'

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

export function usePanchang(date, place) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const load = useCallback(() => {
    let alive = true
    setState(s => ({ ...s, loading: true, error: null }))
    getPanchang({ date, lat: place.lat, lon: place.lon, tz: place.tz })
      .then(data => alive && setState({ data, error: null, loading: false }))
      .catch(error => alive && setState({ data: null, error, loading: false }))
    return () => { alive = false }
  }, [date, place.lat, place.lon, place.tz])
  useEffect(load, [load])
  return { ...state, reload: load }
}

const isNow = ({ start, end }) => {
  const now = Date.now()
  return Date.parse(start) <= now && now < Date.parse(end)
}

export default function PanchangCard({ data, compact = false }) {
  const { t, lang } = useLanguage()
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
        <ul className={`grid gap-2 ${compact ? '' : 'sm:grid-cols-3'}`}>
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
