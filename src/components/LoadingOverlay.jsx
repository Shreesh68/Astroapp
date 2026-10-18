import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

/** Full-page loading state. After a few seconds it explains that the server may be waking up. */
export default function LoadingOverlay({ message }) {
  const { t } = useLanguage()
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 5000)
    return () => clearTimeout(id)
  }, [])

  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-6 py-24 text-center animate-rise">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 96 96" className="absolute inset-0 animate-spin [animation-duration:1.8s]">
          <circle cx="48" cy="48" r="42" fill="none" stroke="#E0A526" strokeWidth="5" strokeDasharray="66 200" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 96 96" className="absolute inset-0 animate-spin [animation-direction:reverse] [animation-duration:2.6s]">
          <circle cx="48" cy="48" r="30" fill="none" stroke="#9E1B32" strokeWidth="3" strokeDasharray="40 150" strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-3xl text-turmeric-700" aria-hidden>ॐ</span>
      </div>
      <p className="font-display text-xl text-ink">{message}</p>
      {slow && <p className="max-w-sm text-sm text-ink-500 animate-rise">{t('loading_wake')}</p>}
    </div>
  )
}

export function ErrorState({ message, onRetry, backTo }) {
  const { t } = useLanguage()
  return (
    <div role="alert" className="card card-pad max-w-md mx-auto text-center my-16 animate-rise">
      <p className="text-4xl mb-3" aria-hidden>🪔</p>
      <h2 className="font-display text-xl font-semibold mb-2">{t('error_title')}</h2>
      <p className="text-ink-500 mb-6">{message}</p>
      <div className="flex justify-center gap-3 flex-wrap">
        {onRetry && <button onClick={onRetry} className="btn-primary">{t('retry')}</button>}
        {backTo && <Link to={backTo} className="btn-outline">{t('start_over')}</Link>}
      </div>
    </div>
  )
}
