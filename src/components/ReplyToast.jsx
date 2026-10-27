import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { REPLIED, chatKey } from '../lib/chats'
import { paramsToProfile, profileToParams } from '../lib/share'

/** "Jyotishi has answered about …" when an answer arrives while the person is on another screen. */
export default function ReplyToast() {
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [reply, setReply] = useState(null)

  useEffect(() => {
    const onReply = e => {
      const { key, profile } = e.detail
      const here = location.pathname === '/ask' && paramsToProfile(new URLSearchParams(location.search))
      if (here && chatKey(here) === key) return // they are looking at that chat already
      setReply(profile)
    }
    window.addEventListener(REPLIED, onReply)
    return () => window.removeEventListener(REPLIED, onReply)
  }, [location])

  useEffect(() => {
    if (!reply) return
    const id = setTimeout(() => setReply(null), 8000)
    return () => clearTimeout(id)
  }, [reply])

  if (!reply) return null
  return (
    <div role="status" className="fixed inset-x-3 z-[60] mx-auto max-w-md animate-rise" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 64px)' }}>
      <div className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-cream shadow-lg">
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-turmeric text-ink">✺</span>
        <p className="min-w-0 flex-1 text-sm">{t('ask_replied', { name: reply.name.split(' ')[0] })}</p>
        <button type="button" onClick={() => { setReply(null); navigate(`/ask?${profileToParams(reply)}`) }}
          className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">{t('ask_open')}</button>
      </div>
    </div>
  )
}
