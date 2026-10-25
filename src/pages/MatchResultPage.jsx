import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { getMatch } from '../lib/api'
import { KOOTAS, VERDICTS, nakName, pick, planetName, rashiName, reasonText } from '../lib/astro'
import { chartPath, paramsToProfile } from '../lib/share'
import { samePerson } from '../lib/profiles'
import { useAsync } from '../lib/useAsync'
import GunaMeter from '../components/GunaMeter'
import SouthIndianChart from '../components/SouthIndianChart'
import LoadingOverlay, { ErrorState } from '../components/LoadingOverlay'
import ShareBar from '../components/ShareBar'
import { Avatar } from '../components/BirthWizard'

// Which per-person attribute explains each koota (shown as "groom · bride")
const KOOTA_ATTR = { varna: 'varna', vashya: 'vashya', yoni: 'yoni', gana: 'gana', nadi: 'nadi' }

export default function MatchResultPage() {
  const [params] = useSearchParams()
  const { t } = useLanguage()
  const groom = paramsToProfile(params, 'g')
  const bride = paramsToProfile(params, 'b')
  const key = params.toString()
  const { data, error, loading, retry } = useAsync(() => (groom && bride ? getMatch(groom, bride) : null), key)

  if (!groom || !bride) return <ErrorState message={t('not_found')} backTo="/matchmaking" />
  if (samePerson(groom, bride)) return <ErrorState message={t('match_same_person')} backTo="/matchmaking" />
  if (groom.gender === 'female' || bride.gender === 'male') return <ErrorState message={t('match_wrong_gender')} backTo="/matchmaking" />
  if (loading) return <LoadingOverlay message={t('loading_match')} />
  if (error) return <ErrorState message={error.message} onRetry={retry} backTo="/matchmaking" />
  return <MatchView groom={groom} bride={bride} data={data} />
}

function MatchView({ groom, bride, data }) {
  const { t, lang } = useLanguage()
  const m = data.match
  const verdict = VERDICTS[m.verdict]
  const doshaCount = m.doshas.length + (m.manglik.ok ? 0 : 1)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Couple + score */}
      <section className="card card-pad sm:p-10 text-center animate-rise">
        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
          <Person profile={groom} role={t('match_groom')} moon={m.groom} />
          <span className="text-3xl text-kumkum animate-pop [animation-delay:300ms]" aria-hidden>❦</span>
          <Person profile={bride} role={t('match_bride')} moon={m.bride} />
        </div>
        <GunaMeter score={m.total} max={m.max} tone={verdict.tone} label={t('match_points')} />
        <p className={`mt-4 font-display text-2xl font-semibold ${verdict.tone === 'good' ? 'text-leaf' : verdict.tone === 'bad' ? 'text-kumkum' : 'text-turmeric-700'}`}>
          {pick(verdict, lang)}
        </p>
        {m.verdict_reasons?.length > 0 && (
          <ul className="mt-3 mx-auto max-w-lg space-y-2 text-left text-sm">
            {m.verdict_reasons.map(r => (
              <li key={r.key} className={`rounded-xl px-4 py-3 ${r.severity === 'serious' ? 'bg-kumkum-50 text-kumkum' : 'bg-cream text-turmeric-700'}`}>
                {r.severity === 'serious' ? '✕ ' : '! '}
                {t(`why_${r.key}`, { nak: nakName(m.groom.nakshatra_index, lang), part: t(`rajju_${m.south.rajju.groom}`) })}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-sm text-ink-500 max-w-lg mx-auto">{t('match_disclaimer')}</p>
      </section>

      {/* Kootas */}
      <section>
        <h2 className="section-title">{t('match_kootas')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {m.kootas.map((k, i) => {
            const info = KOOTAS[k.key]
            const frac = k.score / k.max
            const tone = frac >= 0.75 ? 'bg-leaf' : frac >= 0.4 ? 'bg-turmeric' : 'bg-kumkum'
            const attr = KOOTA_ATTR[k.key]
            const detail = attr ? `${m.groom[attr]} · ${m.bride[attr]}`
              : k.key === 'graha_maitri' ? `${planetName(m.groom.rashi_lord, lang)} · ${planetName(m.bride.rashi_lord, lang)}`
              : k.detail
            return (
              <article key={k.key} className="card p-4 animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{pick(info, lang)}</h3>
                  <span className="tabular-nums font-bold">{k.score}<span className="text-ink-300 font-normal">/{k.max}</span></span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-cream-100 overflow-hidden">
                  <div className={`h-full rounded-full ${tone} transition-[width] duration-700`} style={{ width: `${Math.max(frac * 100, 3)}%` }} />
                </div>
                <p className="mt-2 text-xs text-ink-500">{pick(info.about, lang)}</p>
                <p className="mt-1 text-xs font-medium text-ink-700">{detail}</p>
              </article>
            )
          })}
        </div>
      </section>

      {/* South Indian checks */}
      <section className="card card-pad">
        <h2 className="section-title !mb-1">{t('south_title')}</h2>
        <p className="text-sm text-ink-500 mb-4">{t('south_intro')}</p>
        <ul className="space-y-2">
          {[
            { key: 'rajju', ok: m.south.rajju.ok, detail: `${t('match_groom')}: ${t(`rajju_${m.south.rajju.groom}`)} · ${t('match_bride')}: ${t(`rajju_${m.south.rajju.bride}`)}` },
            { key: 'vedha', ok: m.south.vedha.ok, detail: t(m.south.vedha.ok ? 'vedha_ok' : 'vedha_bad') },
            { key: 'mahendra', ok: m.south.mahendra.ok, soft: true, detail: t('south_count', { n: m.south.mahendra.count }) },
            { key: 'stree_deergha', ok: m.south.stree_deergha.level === 'good', mid: m.south.stree_deergha.level === 'moderate', soft: true, detail: t('south_count', { n: m.south.stree_deergha.count }) },
          ].map(c => (
            <li key={c.key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream px-4 py-3">
              <span className="min-w-0">
                <span className="block font-semibold">{t(`south_${c.key}`)}</span>
                <span className="block text-xs text-ink-500">{t(`south_${c.key}_about`)} · {c.detail}</span>
              </span>
              <span className={c.ok ? 'chip-good' : c.mid || c.soft ? 'chip-warn' : 'chip-bad'}>
                {t(c.ok ? 'south_ok' : c.mid ? 'south_moderate' : c.soft ? 'south_not_met' : 'south_dosha')}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-300">{t('south_note')}</p>
      </section>

      {/* Doshas */}
      <section className="card card-pad">
        <h2 className="section-title">{t('match_doshas')}</h2>
        {doshaCount === 0 && <p className="text-leaf font-medium">✓ {t('match_no_doshas')}</p>}
        <ul className="space-y-2">
          {m.doshas.map(d => (
            <li key={d.key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream px-4 py-3">
              <span className="font-semibold">{t(`dosha_${d.key}`)}</span>
              {d.cancelled_reason
                ? <span className="chip-good !whitespace-normal">{t('dosha_cancelled', { reason: reasonText(d.cancelled_reason, lang) })}</span>
                : <span className="chip-bad">{t('dosha_active')}</span>}
            </li>
          ))}
          <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream px-4 py-3">
            <span className="font-semibold">{t('match_manglik')}</span>
            <span className={`${m.manglik.ok ? 'chip-good' : 'chip-bad'} !whitespace-normal`}>{manglikText(m.manglik, t, lang)}</span>
            <span className="basis-full text-sm text-ink-500">
              {t('mm_each', { groom: t(`kuja_${data.groom_chart.manglik.strength}`), bride: t(`kuja_${data.bride_chart.manglik.strength}`) })}
            </span>
          </li>
        </ul>
      </section>

      {/* Charts */}
      <section className="card card-pad">
        <h2 className="section-title">{t('match_charts')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[[groom, data.groom_chart, t('match_groom')], [bride, data.bride_chart, t('match_bride')]].map(([p, c, role]) => (
            <div key={role}>
              <SouthIndianChart ephem={c} lang={lang} title={p.name} />
              <p className="mt-2 text-center text-sm">
                <span className="text-ink-500">{role} · </span>
                <Link to={chartPath(p)} className="font-semibold text-turmeric-700 hover:underline no-print">{t('nav_chart')} →</Link>
              </p>
            </div>
          ))}
        </div>
      </section>

      <ShareBar title={t('match_title')} text={t('share_text_match', { groom: groom.name, bride: bride.name, score: m.total })} />
    </div>
  )
}

function manglikText(mk, t, lang) {
  if (mk.balanced_by?.length && (mk.status === 'groom' || mk.status === 'bride')) {
    const planets = [...new Set(mk.balanced_by.map(b => planetName(b.planet, lang)))].join(', ')
    return t(`mm_${mk.status}_balanced`, { planets })
  }
  return t(`mm_${mk.status}`)
}

function Person({ profile, role, moon }) {
  const { lang } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-1 min-w-0 max-w-[40%]">
      <Avatar name={profile.name} className="!h-14 !w-14 text-xl animate-pop" />
      <p className="font-semibold truncate max-w-full">{profile.name}</p>
      <p className="text-xs text-ink-500">{role}</p>
      <p className="text-xs text-ink-700">{rashiName(moon.rashi_index, lang)} · {nakName(moon.nakshatra_index, lang)}</p>
    </div>
  )
}
