import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { removeProfile, useProfiles } from '../lib/profiles'
import { chartPath, profileToParams } from '../lib/share'
import { todayIn, fmtLongDate } from '../lib/dates'
import PanchangCard, { loadPanchangPlace, usePanchang } from '../components/PanchangCard'
import { Avatar } from '../components/BirthWizard'

export default function Home(){
  const { t, lang } = useLanguage()
  const { profiles } = useProfiles()
  const [place] = useState(loadPanchangPlace)
  const today = todayIn(place.tz)
  const panchang = usePanchang(today, place)
  const [confirming, setConfirming] = useState(null)

  return (
    <div className="space-y-8">
      <section className="hero-gradient stars relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12 sm:py-16 text-cream animate-rise">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-turmeric/20 blur-3xl" />
        <p className="eyebrow !text-turmeric">{t('home_eyebrow')}</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-bold leading-tight max-w-2xl">{t('home_title')}</h1>
        <p className="mt-4 max-w-xl text-cream/80 text-lg">{t('home_sub')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/birth-chart" className="btn-gold">{t('home_cta_chart')} →</Link>
          <Link to="/matchmaking" className="btn border border-white/30 text-cream hover:bg-white/10">{t('home_cta_match')}</Link>
        </div>
      </section>

      <div className="grid lg:grid-cols-5 gap-6">
        <section className="card card-pad lg:col-span-3 animate-rise [animation-delay:80ms]">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h2 className="section-title !mb-0">{t('panchang_today')}</h2>
            <Link to="/panchang" className="text-sm font-semibold text-turmeric-700 hover:underline">{t('p_full')} →</Link>
          </div>
          <p className="text-sm text-ink-500 mb-4">{fmtLongDate(today, lang)} · {t('panchang_for', { place: place.name })}</p>
          {panchang.loading && <div className="h-40 rounded-xl bg-cream animate-pulse" />}
          {panchang.error && (
            <p className="text-sm text-ink-500">{panchang.error.message} <button onClick={panchang.reload} className="font-semibold text-kumkum underline">{t('retry')}</button></p>
          )}
          {panchang.data && <PanchangCard data={panchang.data} compact />}
        </section>

        <section className="card card-pad lg:col-span-2 animate-rise [animation-delay:160ms]">
          <h2 className="section-title">{t('home_people')}</h2>
          {profiles.length === 0 && <p className="text-sm text-ink-500">{t('home_people_empty')}</p>}
          <ul className="divide-y divide-cream-100 -mx-2">
            {profiles.map(p => (
              <li key={p.id} className="px-2 py-3">
                {confirming === p.id ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 animate-rise">
                    <span className="text-sm">{t('home_confirm_remove', { name: p.name })}</span>
                    <span className="flex gap-2">
                      <button onClick={() => { removeProfile(p.id); setConfirming(null) }} className="chip-bad py-1.5">{t('yes_remove')}</button>
                      <button onClick={() => setConfirming(null)} className="chip bg-cream text-ink-700 py-1.5">{t('cancel')}</button>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} />
                    <Link to={chartPath(p)} className="min-w-0 flex-1 group">
                      <span className="block font-semibold truncate group-hover:text-kumkum">{p.name}</span>
                      <span className="block text-xs text-ink-500 truncate">{p.date} · {p.place}</span>
                    </Link>
                    <Link to={`/matchmaking?${profileToParams(p, 'w')}`} className="text-xs font-semibold text-turmeric-700 hover:underline">{t('match_with')}</Link>
                    <button onClick={() => setConfirming(p.id)} className="text-ink-300 hover:text-kumkum text-lg leading-none px-1" aria-label={`${t('home_remove')} ${p.name}`}>×</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
