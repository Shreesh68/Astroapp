import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { confirmCode, indianMobile, loginError, phoneLoginAvailable, sendCode, signInWithGoogle, useAccount } from '../lib/account'
import { saveProfile, setSelf, useProfiles } from '../lib/profiles'
import { chartPath } from '../lib/share'
import BirthWizard from '../components/BirthWizard'

const RESEND_AFTER = 60 // seconds

/**
 * Login: "Continue with Google" (or, when switched on, a mobile number + 6-digit SMS code), then — the
 * first time — the person's own birth details, which become "My kundli". Optional: the app works without it.
 */
export default function Login() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { user } = useAccount()
  const { self } = useProfiles()
  const [step, setStep] = useState('start') // start | number | confirm | code | me
  const [number, setNumber] = useState('')
  const [code, setCode] = useState('')
  const [verificationId, setVerificationId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [wait, setWait] = useState(0)
  const stopRef = useRef(null)
  const phone = indianMobile(number)

  useEffect(() => () => stopRef.current?.(), [])
  useEffect(() => {
    if (!wait) return
    const id = setTimeout(() => setWait(w => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])
  // logged in (by the code, or by Android reading the SMS): ask for their own details once
  useEffect(() => {
    if (!user) return
    stopRef.current?.()
    if (self) navigate('/account', { replace: true })
    else setStep('me')
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function send(resend = false) {
    if (!phone) return setError('bad_number')
    setError(null)
    setBusy(true)
    stopRef.current?.()
    stopRef.current = await sendCode(phone, {
      onCodeSent: id => { setVerificationId(id); setStep('code'); setBusy(false); setWait(RESEND_AFTER) },
      onVerified: () => setBusy(true), // Android confirmed the number itself; the login lands via useAccount
      onFailed: message => { setBusy(false); setError(loginError(message)); setStep(s => (s === 'confirm' ? 'number' : s)) },
    }, { resend })
  }

  async function verify(e) {
    e?.preventDefault()
    if (code.length !== 6 || !verificationId) return
    setBusy(true)
    setError(null)
    try {
      await confirmCode(verificationId, code)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function google() {
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle() // the login lands via useAccount
    } catch (err) {
      setBusy(false)
      if (err.message !== 'cancelled') setError(err.message)
    }
  }

  function saveMe(profile) {
    const saved = saveProfile(profile)
    setSelf(saved.id)
    navigate(chartPath(saved), { replace: true })
  }

  if (step === 'me') {
    return (
      <div className="mx-auto max-w-xl">
        <p className="eyebrow mb-2">{t('login_me_eyebrow')}</p>
        <p className="mb-4 text-ink-500">{t('login_me_sub')}</p>
        <BirthWizard role="self" initialName={user?.name || ''} onSubmit={saveMe} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card card-pad sm:p-8 animate-rise">
        <span aria-hidden className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-2xl text-turmeric">✺</span>
        {step === 'start' ? (
          <div>
            <h1 className="font-display text-2xl font-semibold">{t('login_title')}</h1>
            <p className="mt-1 mb-6 text-ink-500">{t('login_sub')}</p>
            <button type="button" onClick={google} disabled={busy}
              className="btn w-full border border-cream-200 bg-white text-ink shadow-sm hover:border-turmeric">
              <GoogleMark /> {busy ? t('login_checking') : t('login_google')}
            </button>
            {phoneLoginAvailable && (
              <button type="button" onClick={() => { setError(null); setStep('number') }} disabled={busy} className="btn-ghost mt-2 w-full">
                📱 {t('login_with_mobile')}
              </button>
            )}
            <p className="mt-4 text-xs text-ink-300">{t('login_google_note')}</p>
          </div>
        ) : step === 'confirm' ? (
          <div>
            <h1 className="font-display text-2xl font-semibold">{t('login_confirm_title')}</h1>
            <p className="mt-1 text-ink-500">{t('login_confirm_sub')}</p>
            <p className="my-5 whitespace-nowrap text-center font-display text-3xl font-semibold tracking-wide">
              +91 {number.slice(0, 5)} {number.slice(5)}
            </p>
            <button type="button" onClick={() => send()} disabled={busy} className="btn-primary w-full">
              {busy ? t('login_sending') : t('login_confirm_yes')}
            </button>
            <button type="button" onClick={() => { setStep('number'); setError(null) }} disabled={busy} className="btn-ghost mt-2 w-full">
              ✎ {t('login_confirm_edit')}
            </button>
          </div>
        ) : step === 'number' ? (
          <form onSubmit={e => { e.preventDefault(); if (phone) { setError(null); setStep('confirm') } else setError('bad_number') }}>
            <h1 className="font-display text-2xl font-semibold">{t('login_mobile_title')}</h1>
            <p className="mt-1 mb-5 text-ink-500">{t('login_mobile_sub')}</p>
            <label className="block text-sm font-medium text-ink-700 mb-1" htmlFor="mobile">{t('login_number')}</label>
            <div className="flex items-stretch gap-2">
              {/* never let the code shrink or wrap next to the number */}
              <span className="flex shrink-0 items-center whitespace-nowrap rounded-xl border border-cream-200 bg-cream px-3 text-lg font-semibold text-ink-700">+91</span>
              <input id="mobile" className="input min-w-0 flex-1 text-lg tracking-wider" type="tel" inputMode="numeric" autoComplete="tel-national" autoFocus
                placeholder="9876543210" value={number}
                // keep only digits, at most 10 (no maxLength: it would count the spaces in a pasted "98765 43210")
                onChange={e => { setNumber(e.target.value.replace(/\D/g, '').replace(/^(?:91|0)(?=\d{10})/, '').slice(0, 10)); setError(null) }} />
            </div>
            <button type="submit" disabled={number.length !== 10} className="btn-primary mt-5 w-full">
              {t('login_send')}
            </button>
            <p className="mt-3 text-xs text-ink-300">{t('login_sms_note')}</p>
          </form>
        ) : (
          <form onSubmit={verify}>
            <h1 className="font-display text-2xl font-semibold">{t('login_code_title')}</h1>
            <p className="mt-1 mb-5 text-ink-500">{t('login_code_sub', { number: `+91 ${phone?.slice(3, 8)} ${phone?.slice(8)}` })}</p>
            <input className="input text-center text-2xl font-semibold tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code"
              autoFocus maxLength={6} placeholder="••••••" value={code} aria-label={t('login_code_title')}
              onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setCode(v); setError(null) }} />
            <button type="submit" disabled={code.length !== 6 || busy} className="btn-primary mt-5 w-full">
              {busy ? t('login_checking') : t('login_verify')}
            </button>
            <div className="mt-4 flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setStep('number'); setCode(''); setError(null) }} className="font-semibold text-turmeric-700">
                ← {t('login_change_number')}
              </button>
              <button type="button" disabled={wait > 0 || busy} onClick={() => send(true)} className="font-semibold text-turmeric-700 disabled:text-ink-300">
                {wait > 0 ? t('login_resend_in', { s: wait }) : t('login_resend')}
              </button>
            </div>
          </form>
        )}
        {error && <p role="alert" className="mt-4 rounded-xl bg-kumkum-50 px-4 py-3 text-sm text-kumkum">{t(`login_err_${error}`)}</p>}
        <div id="recaptcha-box" />
      </div>
      <p className="mt-4 text-center text-sm text-ink-500">{t('login_optional')}</p>
    </div>
  )
}

/** Google's "G" mark, as Google's sign-in branding asks for on the button. */
function GoogleMark() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  )
}
