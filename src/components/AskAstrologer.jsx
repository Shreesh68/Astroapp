import { Fragment, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { askAstrologer } from '../lib/astrologer'

// the server accepts up to 40 turns; an odd count keeps the history starting with a question
const HISTORY_TURNS = 39
const ERRORS = ['refused', 'busy', 'daily_limit', 'unavailable', 'failed', 'too_long', 'too_many_steps', 'not_configured']

// Conversations are kept per chart on this device, so they survive leaving the page
const storageKey = p => `km_chat_${p.date}_${p.timeUnknown ? 'x' : p.time}_${p.lat}_${p.lon}`

function load(key) {
  try {
    const list = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function store(key, messages) {
  try {
    if (messages.length) localStorage.setItem(key, JSON.stringify(messages))
    else localStorage.removeItem(key)
  } catch { /* storage unavailable — the conversation just won't persist */ }
}

/** Chat with the AI astrologer about one person's chart; answers stream in as they are written. */
export default function AskAstrologer({ profile }) {
  const { t, lang } = useLanguage()
  const key = storageKey(profile)
  const [messages, setMessages] = useState(() => load(key))
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(null) // { text, status } while an answer is coming in
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const lastRef = useRef(null)

  useEffect(() => store(key, messages), [key, messages])
  useEffect(() => () => abortRef.current?.abort(), [])

  async function send(raw) {
    const question = raw.trim()
    if (!question || pending) return
    const history = [...messages, { role: 'user', content: question }]
    setMessages(history)
    setDraft('')
    setError(null)
    setPending({ text: '', status: 'thinking' })
    requestAnimationFrame(() => lastRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))

    const ctrl = new AbortController()
    abortRef.current = ctrl
    let text = ''
    let failed = null
    try {
      await askAstrologer({
        profile, lang, signal: ctrl.signal, messages: history.slice(-HISTORY_TURNS),
        onEvent: ev => {
          if (ev.type === 'text') { text += ev.text; setPending({ text, status: null }) }
          else if (ev.type === 'tool') setPending({ text, status: ev.name })
          else if (ev.type === 'reset') { text = ''; setPending({ text: '', status: 'thinking' }) }
          else if (ev.type === 'error') failed = ev.message
        },
      })
    } catch (err) {
      failed = err.name === 'AbortError' ? 'stopped' : err.message
    }
    abortRef.current = null
    setPending(null)

    if (failed || !text.trim()) {
      // give the question back so it can be sent again
      setMessages(history.slice(0, -1))
      setDraft(question)
      if (failed !== 'stopped') setError(failed || 'failed')
      return
    }
    setMessages([...history, { role: 'assistant', content: text.trim() }])
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(draft)
    }
  }

  const first = profile.name.split(' ')[0]
  const status = pending?.status && t(pending.status === 'thinking' ? 'ask_thinking' : `ask_tool_${pending.status}`)

  return (
    <section className="card card-pad no-print">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="section-title !mb-1">✦ {t('ask_title')}</h2>
          <p className="text-sm text-ink-500">{t('ask_sub', { name: first })}</p>
        </div>
        {messages.length > 0 && !pending && (
          <button type="button" onClick={() => { setMessages([]); setError(null) }} className="btn-ghost shrink-0 !px-3 !py-1.5 text-sm">
            {t('ask_clear')}
          </button>
        )}
      </div>

      {messages.length === 0 && !pending && (
        <div className="mt-4 flex flex-wrap gap-2">
          {['ask_s1', 'ask_s2', 'ask_s3', 'ask_s4'].map(k => (
            <button key={k} type="button" onClick={() => send(t(k))}
              className="rounded-full border border-cream-200 bg-cream px-3 py-1.5 text-sm text-ink-700 text-left hover:border-turmeric transition">
              {t(k)}
            </button>
          ))}
        </div>
      )}

      {(messages.length > 0 || pending) && (
        <ol className="mt-4 space-y-4" aria-live="polite">
          {messages.map((m, i) => (
            <li key={i} ref={i === messages.length - 1 && pending ? lastRef : null}>
              <Bubble role={m.role} text={m.content} />
            </li>
          ))}
          {pending && (
            <li>
              <Bubble role="assistant" text={pending.text} status={status} />
            </li>
          )}
        </ol>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-kumkum-50 px-4 py-3 text-sm text-kumkum">
          {ERRORS.includes(error) ? t(`ask_err_${error}`) : error}
        </p>
      )}

      <form className="mt-4 flex items-end gap-2" onSubmit={e => { e.preventDefault(); send(draft) }}>
        <textarea value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={onKeyDown}
          rows={2} maxLength={4000} placeholder={t('ask_ph')} aria-label={t('ask_ph')}
          className="input min-h-[3rem] resize-none" disabled={!!pending} />
        {pending
          ? <button type="button" onClick={() => abortRef.current?.abort()} className="btn-outline shrink-0">{t('ask_stop')}</button>
          : <button type="submit" disabled={!draft.trim()} className="btn-primary shrink-0">{t('ask_send')}</button>}
      </form>
      <p className="mt-2 text-xs text-ink-300">{t('ask_note')}</p>
    </section>
  )
}

function Bubble({ role, text, status }) {
  const { t } = useLanguage()
  const mine = role === 'user'
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <span className="eyebrow mb-1">{mine ? t('ask_you') : t('ask_astrologer')}</span>
      <div className={`max-w-[92%] rounded-2xl px-4 py-3 ${mine ? 'bg-ink text-cream rounded-tr-sm' : 'bg-cream text-ink rounded-tl-sm'}`}>
        {mine ? <p className="whitespace-pre-wrap">{text}</p> : <Answer text={text} />}
        {status && <p className="text-sm text-ink-500 animate-pulse">{status}</p>}
      </div>
    </div>
  )
}

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/

/** Just enough Markdown for the astrologer's answers: paragraphs, lists, headings and **bold**. */
function Answer({ text }) {
  if (!text) return null
  return (
    <div className="space-y-2 leading-relaxed">
      {text.split(/\n{2,}/).map((block, i) => {
        const lines = block.split('\n').filter(l => l.trim())
        if (lines.length && lines.every(l => BULLET.test(l))) {
          const ordered = /^\s*\d/.test(lines[0])
          const List = ordered ? 'ol' : 'ul'
          return (
            <List key={i} className={`${ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-1`}>
              {lines.map((l, j) => <li key={j}><Inline text={l.replace(BULLET, '')} /></li>)}
            </List>
          )
        }
        return (
          <p key={i}>
            {lines.map((l, j) => {
              const heading = /^#{1,6}\s+/.test(l)
              const content = <Inline text={l.replace(/^#{1,6}\s+/, '')} />
              return <Fragment key={j}>{j > 0 && <br />}{heading ? <strong>{content}</strong> : content}</Fragment>
            })}
          </p>
        )
      })}
    </div>
  )
}

function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part)
}
