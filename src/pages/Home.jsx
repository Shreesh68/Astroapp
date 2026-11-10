import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { removeProfile, useProfiles } from '../lib/profiles'
import { accountsAvailable, useAccount } from '../lib/account'
import { chartPath, profileToParams } from '../lib/share'
import { fmtClock, fmtLongDate, fmtShortDate } from '../lib/dates'
import PanchangCard, { loadPanchangPlace, placeName, useMinuteTick, usePanchang, useToday } from '../components/PanchangCard'
import { Avatar } from '../components/BirthWizard'
import { astrologerAvailable } from '../lib/astrologer'

export default function Home(){
  const { t, lang } = useLanguage()
  const { profiles, self } = useProfiles()
  const { ready, user } = useAccount()
  const [place] = useState(loadPanchangPlace)
  const today = useToday(place.tz) // moves on at midnight and after a night in the background
  const panchang = usePanchang(today, place)
  const [confirming, setConfirming] = useState(null)

  return (
    <div className="space-y-8">
      {panchang.data && <TodayStrip data={panchang.data} place={place} />}
      <section className="hero-gradient stars relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12 sm:py-16 text-cream animate-rise">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-turmeric/20 blur-3xl" />
        <p className="eyebrow !text-turmeric">{t('home_eyebrow')}</p>
        {/* sized by screen width so a large phone font never splits a word ("explaine / d") */}
        <h1 className="mt-3 font-display text-[clamp(1.75rem,10vw,3rem)] font-bold leading-tight max-w-2xl">{t('home_title')}</h1>
        <p className="mt-4 max-w-xl text-cream/80 text-lg">{t('home_sub')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {astrologerAvailable && <Link to="/ask" className="btn-gold">✺ {t('home_cta_ai')} →</Link>}
          <Link to="/birth-chart" className={astrologerAvailable ? 'btn border border-white/30 text-cream hover:bg-white/10' : 'btn-gold'}>{t('home_cta_chart')}{astrologerAvailable ? '' : ' →'}</Link>
          <Link to="/matchmaking" className="btn border border-white/30 text-cream hover:bg-white/10">{t('home_cta_match')}</Link>
        </div>
      </section>

      {accountsAvailable && ready && (user && self ? (
        <Link to={chartPath(self)} className="card flex items-center gap-4 px-5 py-4 animate-rise hover:border-turmeric transition">
          <Avatar name={self.name} />
          <span className="min-w-0 flex-1">
            <span className="eyebrow block">{t('acc_mine')}</span>
            <span className="block font-semibold truncate">{self.name}</span>
            <span className="block text-xs text-ink-500 truncate">{fmtLongDate(self.date, lang)} · {self.place}</span>
          </span>
          <span aria-hidden className="text-xl text-ink-400">→</span>
        </Link>
      ) : (
        <Link to="/login" className="card flex items-center gap-4 px-5 py-4 animate-rise hover:border-turmeric transition">
          <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-100 text-xl">📱</span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t(user ? 'acc_mine_add' : 'login_cta_title')}</span>
            <span className="block text-sm text-ink-500">{t(user ? 'acc_mine_empty' : 'login_cta_sub')}</span>
          </span>
          <span aria-hidden className="text-xl text-ink-400">→</span>
        </Link>
      ))}


      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="card card-pad lg:col-span-3 animate-rise [animation-delay:80ms]">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h2 className="section-title !mb-0">{t('panchang_today')}</h2>
            <Link to="/panchang" className="text-sm font-semibold text-turmeric-700 hover:underline">{t('p_full')} →</Link>
          </div>
          <p className="text-sm text-ink-500 mb-4">{fmtLongDate(today, lang)} · {t('panchang_for', { place: placeName(place, lang) })}</p>
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
                      <span className="block text-xs text-ink-500 truncate">{fmtShortDate(p.date, lang)} · {p.place}</span>
                    </Link>
                    <Link to={`/matchmaking?${profileToParams(p, 'w')}`} aria-label={`${t('match_with')}: ${p.name}`}
                      className="-my-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-turmeric-800 hover:bg-cream">❦</Link>
                    <button onClick={() => setConfirming(p.id)} className="-my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-xl leading-none text-ink-400 hover:text-kumkum" aria-label={`${t('home_remove')} ${p.name}`}>×</button>
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

/**
 * The daily check, first: today's festival, Rahu kala (now / in how long / over) and the place it is
 * for, with a way to change it.
 */
function TodayStrip({ data, place }) {
  const { t, lang } = useLanguage()
  useMinuteTick()
  const now = Date.now()
  const start = Date.parse(data.rahu_kala.start), end = Date.parse(data.rahu_kala.end)
  const mins = Math.round((start - now) / 60000)
  const status = now >= start && now < end ? t('today_now')
    : now < start ? t('today_in', { t: mins >= 60 ? t('dur_hm', { h: Math.floor(mins / 60), m: mins % 60 }) : t('dur_m', { m: mins }) })
      : t('today_over')
  const live = now >= start && now < end
  return (
    <section className="card px-4 py-3 animate-rise" aria-label={t('today_title')}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-semibold">{t('today_title')} · {placeName(place, lang)}</p>
        <Link to="/panchang" className="text-sm font-semibold text-turmeric-800 hover:underline">{t('panchang_change_place')} →</Link>
      </div>
      {data.festivals?.length > 0 && (
        <p className="mt-1 text-sm font-semibold text-turmeric-800">🪔 {data.festivals.map(f => t(`fest_${f}`)).join(' · ')}</p>
      )}
      <p className={`mt-1 flex flex-wrap items-center gap-x-2 text-sm ${live ? 'text-kumkum' : 'text-ink-700'}`}>
        <span className="font-medium">{t('p_rahu')}</span>
        <span className="tabular-nums">{fmtClock(data.rahu_kala.start, lang)} – {fmtClock(data.rahu_kala.end, lang)}</span>
        <span className={live ? 'chip-bad' : 'text-ink-500'}>{status}</span>
      </p>
    </section>
  )
}
