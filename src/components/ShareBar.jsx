import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { shareLink, whatsappUrl } from '../lib/share'
import { isNativeApp } from '../lib/platform'

/** Share / WhatsApp / Save-as-PDF actions, plus any extra buttons passed as children. */
export default function ShareBar({ title, text, children }) {
  const { t } = useLanguage()
  const [note, setNote] = useState('')

  async function share() {
    const r = await shareLink({ title, text })
    if (r === 'copied') {
      setNote(t('copied'))
      setTimeout(() => setNote(''), 2500)
    }
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button onClick={share} className="btn-outline">↗ {t('act_share')}</button>
      <a href={whatsappUrl(text)} target={isNativeApp ? undefined : '_blank'} rel="noreferrer" className="btn-outline">💬 {t('act_whatsapp')}</a>
      {/* the Android WebView has no print dialog */}
      {!isNativeApp && <button onClick={() => window.print()} className="btn-outline">⎙ {t('act_print')}</button>}
      {children}
      <span aria-live="polite" className="text-sm font-medium text-leaf">{note}</span>
    </div>
  )
}
