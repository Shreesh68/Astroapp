import { useState } from 'react'
import { PLANETS, planetName } from '../lib/astro'
import { fmtMonthYear, yearOf } from '../lib/dates'
import { useLanguage } from '../contexts/LanguageContext'

export const DASHA_COLORS = {
  sun: '#E0A526', moon: '#9A94BC', mars: '#C2410C', mercury: '#2F7D4F', jupiter: '#C78A12',
  venus: '#C2577E', saturn: '#2D2756', rahu: '#5B557E', ketu: '#8B6B4E',
}

const ms = iso => Date.parse(iso)

/** The mahadasha and antardasha running at `when` (default now) */
export function currentDasha(dasha, when = Date.now()) {
  const maha = dasha?.periods?.find(p => ms(p.start) <= when && when < ms(p.end))
  const antar = maha?.antardashas.find(a => ms(a.start) <= when && when < ms(a.end))
  return maha ? { maha, antar } : null
}

export default function DashaTimeline({ dasha, tz }) {
  const { t, lang } = useLanguage()
  const now = Date.now()
  const periods = dasha?.periods || []
  const current = currentDasha(dasha, now)
  const [open, setOpen] = useState(current?.maha?.start ?? null)
  if (!periods.length) return null

  const start = ms(periods[0].start)
  const end = ms(periods[periods.length - 1].end)
  const pct = x => ((x - start) / (end - start)) * 100
  const nowPct = now > start && now < end ? pct(now) : null
  const selected = periods.find(p => p.start === open)

  return (
    <div>
      {current && (
        <p className="mb-4 text-ink-700">
          {t('dasha_now', {
            maha: planetName(current.maha.lord, lang),
            antar: planetName(current.antar?.lord, lang),
            until: fmtMonthYear(current.antar?.end || current.maha.end, tz, lang),
          })}
        </p>
      )}

      <div className="relative pt-6">
        {nowPct != null && (
          <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: `${nowPct}%` }}>
            <span className="absolute -translate-x-1/2 -top-0.5 text-[10px] font-bold uppercase tracking-wide text-kumkum whitespace-nowrap">{t('you_are_here')}</span>
            <span className="absolute top-4 bottom-0 w-0.5 -translate-x-1/2 bg-kumkum" />
          </div>
        )}
        <div className="flex h-11 rounded-xl overflow-hidden ring-1 ring-cream-200">
          {periods.map(p => {
            const w = pct(ms(p.end)) - pct(ms(p.start))
            const isOpen = p.start === open
            return (
              <button key={p.start} type="button" onClick={() => setOpen(isOpen ? null : p.start)}
                aria-pressed={isOpen}
                aria-label={`${planetName(p.lord, lang)} ${fmtMonthYear(p.start, tz, lang)} – ${fmtMonthYear(p.end, tz, lang)}`}
                className={`relative h-full border-r border-white/60 last:border-0 transition-[filter,transform] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${isOpen ? 'brightness-110' : open ? 'opacity-60' : ''}`}
                style={{ width: `${w}%`, background: DASHA_COLORS[p.lord] }}>
                {w > 5 && <span className="text-[11px] font-bold text-white drop-shadow">{PLANETS[p.lord].short[lang === 'kn' ? 'kn' : 'en']}</span>}
              </button>
            )
          })}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-ink-500">
          <span>{yearOf(periods[0].start, tz)}</span>
          <span>{yearOf(periods[periods.length - 1].end, tz)}</span>
        </div>
      </div>

      <p className="mt-2 text-xs text-ink-500 no-print">{t('dasha_tap')}</p>

      {selected && (
        <div key={selected.start} className="mt-4 rounded-xl border border-cream-200 p-4 animate-rise">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <h4 className="font-semibold">
              <span className="inline-block h-3 w-3 rounded-full mr-2 align-middle" style={{ background: DASHA_COLORS[selected.lord] }} />
              {planetName(selected.lord, lang)} — {t('dasha_years', { n: selected.years })}
            </h4>
            <span className="text-xs text-ink-500">{fmtMonthYear(selected.start, tz, lang)} – {fmtMonthYear(selected.end, tz, lang)}</span>
          </div>
          <p className="text-sm text-ink-500 mb-3">{PLANETS[selected.lord].means[lang === 'kn' ? 'kn' : 'en']}</p>
          <ol className="grid sm:grid-cols-3 gap-2">
            {selected.antardashas.map(a => {
              const active = ms(a.start) <= now && now < ms(a.end)
              return (
                <li key={a.start} className={`rounded-lg px-3 py-2 text-sm ${active ? 'bg-kumkum-50 ring-1 ring-kumkum font-semibold' : 'bg-cream'}`}>
                  <span className="block">{planetName(a.lord, lang)}</span>
                  <span className="block text-xs text-ink-500 font-normal">{fmtMonthYear(a.start, tz, lang)} – {fmtMonthYear(a.end, tz, lang)}</span>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
