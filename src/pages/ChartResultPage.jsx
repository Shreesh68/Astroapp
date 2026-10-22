import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { getChart } from '../lib/api'
import { HOUSES, NAKSHATRAS, PLANETS, PLANET_ORDER, RASHIS, dms, nakName, pick, planetName, rashiName, reasonText } from '../lib/astro'
import { fmtLongDate, fmtTime } from '../lib/dates'
import { saveProfile, useProfiles } from '../lib/profiles'
import { paramsToProfile, profileToParams } from '../lib/share'
import { useAsync } from '../lib/useAsync'
import SouthIndianChart, { planetsBySign } from '../components/SouthIndianChart'
import DashaTimeline, { currentDasha } from '../components/DashaTimeline'
import LoadingOverlay, { ErrorState } from '../components/LoadingOverlay'
import ShareBar from '../components/ShareBar'
import AskAstrologer from '../components/AskAstrologer'

export default function ChartResultPage() {
  const [params] = useSearchParams()
  const { t } = useLanguage()
  const profile = paramsToProfile(params)
  const key = params.toString()
  const { data: chart, error, loading, retry } = useAsync(() => (profile ? getChart(profile) : null), key)

  if (!profile) return <ErrorState message={t('not_found')} backTo="/birth-chart" />
  if (loading) return <LoadingOverlay message={t('loading_chart')} />
  if (error) return <ErrorState message={error.message} onRetry={retry} backTo="/birth-chart" />
  return <ChartView key={key} profile={profile} chart={chart} />
}

function ChartView({ profile, chart }) {
  const { t, lang } = useLanguage()
  const { isSaved } = useProfiles()
  const [selected, setSelected] = useState(chart.ascendant.sign_index)
  const moon = chart.planets.moon
  const asc = chart.ascendant
  const nak = NAKSHATRAS[moon.nakshatra_index]
  const running = currentDasha(chart.dasha)
  const saved = isSaved(profile)
  const first = profile.name.split(' ')[0]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="print-only mb-4">
        <p className="text-sm">{t('brand')} · {window.location.host}</p>
      </div>

      {/* Story */}
      <section className="hero-gradient stars rounded-3xl px-6 py-8 sm:px-10 sm:py-10 text-cream animate-rise print:text-ink print:bg-none">
        <p className="eyebrow !text-turmeric">{t('chart_of')}</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">{profile.name}</h1>
        <p className="mt-2 text-cream/75 print:text-ink-500">
          {t('story_born', {
            date: fmtLongDate(profile.date, lang),
            time: profile.timeUnknown ? t('time_unknown_short') : fmtTime(profile.time, lang),
            place: profile.place,
          })}
        </p>
        <div className="mt-6 space-y-3 text-lg leading-relaxed max-w-3xl">
          <p>{t('story_moon', { name: first, rashi: rashiName(moon.sign_index, lang), nak: nakName(moon.nakshatra_index, lang), pada: moon.pada, trait: pick(RASHIS[moon.sign_index].trait, lang) })}</p>
          <p className="text-cream/85 print:text-ink">{t('story_nak', { nak: nakName(moon.nakshatra_index, lang), symbol: nak.symbol.toLowerCase(), deity: nak.deity, trait: pick(nak.trait, lang) })}</p>
          {profile.timeUnknown
            ? <p className="text-base rounded-xl bg-white/10 px-4 py-3">⚠ {t('story_lagna_unknown')}</p>
            : <p className="text-cream/85 print:text-ink">{t('story_lagna', { rashi: rashiName(asc.sign_index, lang), trait: pick(RASHIS[asc.sign_index].trait, lang) })}</p>}
        </div>
      </section>

      {/* Key facts */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t('key_lagna'), value: rashiName(asc.sign_index, lang), sub: dms(asc.degree), dim: profile.timeUnknown },
          { label: t('key_moon'), value: rashiName(moon.sign_index, lang), sub: dms(moon.degree) },
          { label: t('key_nak'), value: nakName(moon.nakshatra_index, lang), sub: `${t('pada')} ${moon.pada}` },
          running && { label: t('key_dasha'), value: `${planetName(running.maha.lord, lang)} / ${planetName(running.antar?.lord, lang)}`, sub: lang === 'kn' ? 'ಮಹಾದಶೆ / ಭುಕ್ತಿ' : 'mahadasha / bhukti' },
        ].filter(Boolean).map((f, i) => (
          <div key={f.label} className={`card px-4 py-4 animate-rise ${f.dim ? 'opacity-60' : ''}`} style={{ animationDelay: `${100 + i * 60}ms` }}>
            <p className="eyebrow">{f.label}</p>
            <p className="font-display text-xl font-semibold mt-1">{f.value}</p>
            <p className="text-xs text-ink-500">{f.sub}</p>
          </div>
        ))}
      </section>

      <AskAstrologer profile={profile} />

      {/* Interactive chart */}
      <section className="card card-pad grid md:grid-cols-2 gap-6 items-start">
        <div>
          <h2 className="section-title">{t('chart_title')}</h2>
          <SouthIndianChart ephem={chart} lang={lang} size="lg" selected={selected} onSelect={setSelected} />
          <p className="no-print mt-3 text-center text-xs text-ink-500">{t('chart_tap')}</p>
        </div>
        <HouseDetail chart={chart} sign={selected} />
      </section>

      {/* Dasha */}
      <section className="card card-pad">
        <h2 className="section-title">{t('dasha_title')}</h2>
        <DashaTimeline dasha={chart.dasha} tz={profile.tz} />
      </section>

      {/* Manglik */}
      <ManglikCard manglik={chart.manglik} />

      {/* Table */}
      <details className="card card-pad group" open={false}>
        <summary className="section-title !mb-0 cursor-pointer list-none flex items-center justify-between">
          {t('table_title')} <span className="text-ink-300 transition group-open:rotate-180" aria-hidden>▾</span>
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-turmeric-700 border-b-2 border-cream-200">
                {['th_planet', 'th_rashi', 'th_deg', 'th_nak', 'th_house'].map(h => <th key={h} className="py-2 pr-4 font-semibold">{t(h)}</th>)}
              </tr>
            </thead>
            <tbody>
              {[['lagna', asc], ...PLANET_ORDER.map(p => [p, chart.planets[p]])].map(([k, p]) => (
                <tr key={k} className="border-b border-cream-100">
                  <td className="py-2 pr-4 font-medium">
                    {k === 'lagna' ? t('key_lagna') : planetName(k, lang)}
                    {p.retrograde && k !== 'rahu' && k !== 'ketu' && <span className="ml-1 text-xs text-kumkum">({t('retro')})</span>}
                  </td>
                  <td className="py-2 pr-4">{rashiName(p.sign_index, lang)}</td>
                  <td className="py-2 pr-4 tabular-nums">{dms(p.degree)}</td>
                  <td className="py-2 pr-4">{nakName(p.nakshatra_index, lang)} {p.pada}</td>
                  <td className="py-2 pr-4">{p.house ?? 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <ShareBar title={profile.name} text={t('share_text_chart', { name: profile.name })}>
        <button onClick={() => saveProfile(profile)} disabled={saved} className="btn-outline">
          {saved ? `✓ ${t('act_saved')}` : `☆ ${t('act_save')}`}
        </button>
        <Link to={`/matchmaking?${profileToParams(profile, 'w')}`} className="btn-primary">❦ {t('act_match', { name: first })}</Link>
      </ShareBar>

      <p className="text-center text-xs text-ink-300">{t('footnote')} · {chart.ayanamsa_degree.toFixed(4)}°</p>
    </div>
  )
}

function HouseDetail({ chart, sign }) {
  const { t, lang } = useLanguage()
  const house = ((sign - chart.ascendant.sign_index + 12) % 12) + 1
  const planets = planetsBySign(chart.planets)[sign] || []
  const isLagna = sign === chart.ascendant.sign_index

  return (
    <div key={sign} className="animate-rise md:pt-10" aria-live="polite">
      <p className="eyebrow">{t('house_n', { n: house })}{isLagna ? ` · ${t('key_lagna')}` : ''}</p>
      <h3 className="font-display text-2xl font-semibold mt-1">
        {rashiName(sign, lang)} <span className="text-base font-normal text-ink-500">({RASHIS[sign].west})</span>
      </h3>
      <p className="mt-2 text-ink-700">{pick(HOUSES[house - 1], lang)}</p>

      <ul className="mt-5 space-y-3">
        {planets.length === 0 && <li className="text-sm text-ink-500 italic">{t('house_empty')}</li>}
        {planets.map(p => (
          <li key={p.key} className="rounded-xl bg-cream px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">
                {planetName(p.key, lang)}
                {p.retrograde && p.key !== 'rahu' && p.key !== 'ketu' && <span className="ml-2 chip-bad">{t('retro')}</span>}
              </span>
              <span className="text-sm tabular-nums text-ink-500">{dms(p.degree)}</span>
            </div>
            <p className="text-sm text-ink-500 mt-0.5">
              {nakName(p.nakshatra_index, lang)} · {t('pada')} {p.pada} — {pick(PLANETS[p.key].means, lang)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ManglikCard({ manglik: m }) {
  const { t, lang } = useLanguage()
  const chip = { none: 'chip-good', mild: 'chip-warn', moderate: 'chip-bad', strong: 'chip-bad' }[m.strength]

  function status(r) {
    if (r.skipped) return { text: t('kuja_row_skipped'), tone: 'text-ink-300' }
    if (r.active) return { text: t('kuja_row_active'), tone: 'text-kumkum font-semibold' }
    if (r.dosha_house) return { text: t('kuja_row_exempt', { reason: reasonText(r.cancelled_reason, lang) }), tone: 'text-leaf' }
    return { text: t('kuja_row_clear'), tone: 'text-ink-500' }
  }

  return (
    <section className="card card-pad">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="section-title !mb-0">{t('manglik_title')}</h2>
        <span className={chip}>{t(`kuja_${m.strength}`)}</span>
      </div>
      <p className="text-sm text-ink-500 mb-4">{t('kuja_intro')}</p>
      <ul className="grid sm:grid-cols-3 gap-3">
        {m.references.map(r => {
          const s = status(r)
          return (
            <li key={r.from} className={`rounded-xl px-4 py-3 ${r.active ? 'bg-kumkum-50 ring-1 ring-kumkum/40' : 'bg-cream'}`}>
              <p className="eyebrow">{t(`kuja_ref_${r.from}`)}</p>
              {r.house != null && <p className="font-semibold mt-0.5">{t('kuja_house', { n: r.house })}</p>}
              <p className={`text-sm mt-0.5 ${s.tone}`}>{s.text}</p>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-ink-300">{t('kuja_note')}</p>
    </section>
  )
}
