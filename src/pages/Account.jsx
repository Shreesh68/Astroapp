import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { deleteAccount, logOut, useAccount } from '../lib/account'
import { PRIVACY_URL } from '../lib/contact'
import { astrologerAvailable } from '../lib/astrologer'
import { fmtLongDate } from '../lib/dates'
import { removeProfile, useProfiles } from '../lib/profiles'
import { chartPath, profileToParams } from '../lib/share'
import { Avatar } from '../components/BirthWizard'

/** The logged-in person's page: their own kundli, the other kundlis in their account, and log out. */
export default function Account() {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const { ready, user } = useAccount()
  const { profiles, self } = useProfiles()
  const [confirming, setConfirming] = useState(null) // a kundli id, 'logout' or 'delete'
  const [deleting, setDeleting] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)

  async function onDelete() {
    setDeleting(true)
    setDeleteFailed(false)
    try {
      await deleteAccount()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('delete account', err)
      setDeleteFailed(true)
    } finally {
      setDeleting(false)
    }
  }

  if (!ready) return null
  if (!user) return <Navigate to="/login" replace />
  const others = profiles.filter(p => !p.self)
  const number = user.phoneNumber ? `${user.phoneNumber.slice(0, 3)} ${user.phoneNumber.slice(3, 8)} ${user.phoneNumber.slice(8)}` : ''
  const who = user.name || user.email || number
  const detail = user.name ? (user.email || number) : (user.email ? number : '')

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="hero-gradient stars rounded-3xl px-6 py-7 text-cream animate-rise">
        <p className="eyebrow !text-turmeric">{t('acc_eyebrow')}</p>
        <p className="mt-1 font-display text-2xl font-semibold truncate">{who}</p>
        {detail && <p className="text-sm text-cream/75 truncate">{detail}</p>}
        <p className="mt-2 text-sm text-cream/75">{t('acc_sub', { n: profiles.length })}</p>
      </section>

      <section className="card card-pad">
        <h2 className="section-title">{t('acc_mine')}</h2>
        {self ? (
          <div className="flex items-center gap-3">
            <Avatar name={self.name} />
            <Link to={chartPath(self)} className="min-w-0 flex-1">
              <span className="block font-semibold truncate">{self.name}</span>
              <span className="block text-xs text-ink-500 truncate">{fmtLongDate(self.date, lang)} · {self.place}</span>
            </Link>
            <Link to={chartPath(self)} className="btn-outline !px-4 !py-2 text-sm">{t('acc_open')}</Link>
          </div>
        ) : (
          <div>
            <p className="text-sm text-ink-500 mb-3">{t('acc_mine_empty')}</p>
            <Link to="/login" className="btn-primary">{t('acc_mine_add')} →</Link>
          </div>
        )}
        {self && astrologerAvailable && (
          <Link to={`/ask?${profileToParams(self)}`} className="mt-4 flex items-center justify-between rounded-xl bg-cream px-4 py-3 text-sm font-semibold hover:bg-cream-100">
            ✺ {t('ai_chart_cta', { name: self.name.split(' ')[0] })} <span aria-hidden>→</span>
          </Link>
        )}
      </section>

      <section className="card card-pad">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h2 className="section-title !mb-0">{t('acc_others')}</h2>
          <Link to="/birth-chart" className="text-sm font-semibold text-turmeric-700">＋ {t('acc_add')}</Link>
        </div>
        {others.length === 0 && <p className="text-sm text-ink-500 mt-2">{t('acc_others_empty')}</p>}
        <ul className="divide-y divide-cream-100 -mx-2 mt-2">
          {others.map(p => (
            <li key={p.id} className="px-2 py-3">
              {confirming === p.id ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm">{t('home_confirm_remove', { name: p.name })}</span>
                  <span className="flex gap-2">
                    <button onClick={() => { removeProfile(p.id); setConfirming(null) }} className="chip-bad py-1.5">{t('yes_remove')}</button>
                    <button onClick={() => setConfirming(null)} className="chip bg-cream text-ink-700 py-1.5">{t('cancel')}</button>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} />
                  <Link to={chartPath(p)} className="min-w-0 flex-1">
                    <span className="block font-semibold truncate">{p.name}</span>
                    <span className="block text-xs text-ink-500 truncate">{p.date} · {p.place}</span>
                  </Link>
                  <button onClick={() => setConfirming(p.id)} className="text-ink-300 hover:text-kumkum text-lg leading-none px-1" aria-label={`${t('home_remove')} ${p.name}`}>×</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="text-center">
        {confirming === 'logout' ? (
          <div className="card card-pad">
            <p className="text-sm mb-3">{t('acc_logout_q')}</p>
            <div className="flex justify-center gap-2">
              <button onClick={async () => { await logOut(); navigate('/', { replace: true }) }} className="btn-primary">{t('acc_logout')}</button>
              <button onClick={() => setConfirming(null)} className="btn-ghost">{t('cancel')}</button>
            </div>
          </div>
        ) : confirming === 'delete' ? (
          <div className="card card-pad">
            <p className="text-sm mb-3">{t('acc_delete_q', { n: profiles.length })}</p>
            {deleteFailed && <p className="text-sm text-kumkum mb-3">{t('acc_delete_failed')}</p>}
            <div className="flex flex-wrap justify-center gap-2">
              <button disabled={deleting} onClick={onDelete} className="btn-primary !bg-kumkum">{deleting ? '…' : t('acc_delete_yes')}</button>
              <button disabled={deleting} onClick={() => { setConfirming(null); setDeleteFailed(false) }} className="btn-ghost">{t('cancel')}</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <button onClick={() => setConfirming('logout')} className="btn-ghost text-kumkum">{t('acc_logout')}</button>
            <button onClick={() => setConfirming('delete')} className="text-xs text-ink-500 underline py-2">{t('acc_delete')}</button>
            <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="text-xs text-ink-500 underline py-1">{t('about_privacy')}</a>
          </div>
        )}
      </section>
    </div>
  )
}
