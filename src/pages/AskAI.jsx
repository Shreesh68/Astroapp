import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DateTime } from 'luxon'
import { useLanguage } from '../contexts/LanguageContext'
import { askAstrologer } from '../lib/astrologer'
import { getChart } from '../lib/api'
import { nakName, planetName, rashiName } from '../lib/astro'
import { fmtLongDate, fmtTime } from '../lib/dates'
import { getTimezone } from '../lib/geocode'
import { saveEdits, saveProfile, useProfiles } from '../lib/profiles'
import { chartPath, paramsToProfile, profileToParams } from '../lib/share'
import { currentDasha } from '../components/DashaTimeline'
import { DateFields, TimeFields } from '../components/DateTimeFields'
import PlaceSearch from '../components/PlaceSearch'
import { Answer } from '../components/ChatText'

/**
 * "Ask AI": a WhatsApp-style chat with the AI astrologer. Without a person in the URL it first asks for
 * the birth details as a conversation and draws the chart; with one (?n=…&d=…) it goes straight to the
 * chat about that chart. The conversation for each chart is kept on this device.
 */
export default function AskAI() {
  const [params] = useSearchParams()
  const profile = paramsToProfile(params)
  return profile ? <ChartChat key={params.toString()} profile={profile} /> : <Intake />
}

const now = () => DateTime.now().toFormat('HH:mm')

// ── Shell: header, scrolling messages, composer ─────────────────────────

/** Keep the chat the height of the visible screen, so the composer stays above the keyboard. */
function useVisibleHeight() {
  const [height, setHeight] = useState(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setHeight(vv.height)
    update()
    vv.addEventListener('resize', update)
    return () => vv.removeEventListener('resize', update)
  }, [])
  return height
}

function Shell({ subtitle, actions, follow, children, composer }) {
  const { t, lang, setLang } = useLanguage()
  const navigate = useNavigate()
  const height = useVisibleHeight()
  const scroller = useRef(null)
  // stay pinned to the newest message while it streams in
  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [follow, height])

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex flex-col bg-[#EFE7DA]" style={{ height: height ? `${height}px` : '100dvh' }}>
      <header className="flex items-center gap-2 bg-ink px-2 pb-2 text-cream shadow" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
        <button type="button" onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))}
          className="rounded-full p-2 text-xl leading-none hover:bg-white/10" aria-label={t('wiz_back')}>←</button>
        <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-turmeric text-xl text-ink">✺</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{t('ai_name')}</p>
          <p className="truncate text-xs text-cream/70">{subtitle}</p>
        </div>
        {actions}
        <button type="button" onClick={() => setLang(lang === 'en' ? 'kn' : 'en')} lang={lang === 'en' ? 'kn' : 'en'}
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-cream/90 ring-1 ring-white/25 hover:bg-white/10">{t('lang_toggle')}</button>
      </header>
      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto px-3 py-4" aria-live="polite">
        <p className="mx-auto mb-3 max-w-xs rounded-lg bg-[#FFF5C4] px-3 py-1.5 text-center text-[11px] text-ink-700 shadow-sm">{t('ask_note')}</p>
        {children}
      </div>
      <div className="border-t border-black/5 bg-[#F6F1E7] px-2 pt-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
        {composer}
      </div>
    </div>
  )
}

function Bubble({ from, time, children }) {
  const mine = from === 'me'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-rise`}>
      <div className={`relative max-w-[85%] rounded-xl px-3 pb-1.5 pt-2 text-[15px] leading-relaxed text-ink shadow-sm
        ${mine ? 'rounded-tr-none bg-[#D9FDD3]' : 'rounded-tl-none bg-white'}`}>
        {children}
        {time && <span className="mt-0.5 block text-right text-[10px] text-ink-500">{time}</span>}
      </div>
    </div>
  )
}

function Typing({ label }) {
  return (
    <Bubble from="bot">
      <span className="flex items-center gap-1 py-1" aria-label={label}>
        {[0, 150, 300].map(d => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-ink-300" style={{ animationDelay: `${d}ms` }} />)}
        {label && <span className="ml-2 text-sm text-ink-500">{label}</span>}
      </span>
    </Bubble>
  )
}

function Chips({ options }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 pb-2">
      {options.map(o => (
        <button key={o.label} type="button" onClick={o.onClick}
          className={`rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition ${o.primary ? 'border-leaf bg-leaf text-white' : 'border-cream-200 bg-white text-ink-700 hover:border-turmeric'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SendButton({ disabled, label }) {
  return (
    <button type="submit" disabled={disabled} aria-label={label}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-leaf text-xl text-white shadow disabled:opacity-40">➤</button>
  )
}

// ── Intake: the birth details as a conversation ─────────────────────────

const EMPTY = { name: '', gender: '', date: '', time: '', timeUnknown: false, place: '', lat: null, lon: null, tz: null }

function Intake() {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const { profiles } = useProfiles()
  const [data, setData] = useState(EMPTY)
  const [log, setLog] = useState(() => [
    { from: 'bot', key: 'ai_hello', at: now() },
    { from: 'bot', key: profiles.length ? 'ai_ask_who' : 'ai_ask_name', at: now() },
  ])
  const [step, setStep] = useState(profiles.length ? 'who' : 'name')
  const [returnTo, setReturnTo] = useState(null) // 'confirm' while changing one detail
  const [draft, setDraft] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const name = data.name || '…'
  const add = (...msgs) => setLog(l => [...l, ...msgs.map(m => ({ ...m, at: now() }))])
  // messages are kept as what they mean ({ key, vars } / { date } / { time } / { confirm } / { text }) and
  // worded at render time, so switching language rewords the whole conversation
  const question = (s, d = data) => ({ from: 'bot', key: `ai_ask_${s}`, vars: { name: d.name } })
  const confirm = d => ({ from: 'bot', confirm: d })
  const wording = m => m.key ? t(m.key, m.vars) : m.date ? fmtLongDate(m.date, lang) : m.time ? fmtTime(m.time, lang)
    : m.confirm ? `${t('ai_confirm_intro')}\n${summary(m.confirm)}\n\n${t('ai_confirm_q')}` : m.text

  function summary(d) {
    return [
      `${t('ai_f_name')}: ${d.name}`,
      `${t('ai_f_gender')}: ${d.gender ? t(`gender_${d.gender}`) : t('gender_unset')}`,
      `${t('ai_f_date')}: ${fmtLongDate(d.date, lang)}`,
      `${t('ai_f_time')}: ${d.timeUnknown ? t('time_unknown_short') : fmtTime(d.time, lang)}`,
      `${t('ai_f_place')}: ${d.place}`,
    ].join('\n')
  }

  // move on after an answer: back to the summary when changing one detail, else the next question
  function next(after, d) {
    const order = ['name', 'gender', 'date', 'time', 'place', 'confirm']
    const target = returnTo || order[order.indexOf(after) + 1]
    setReturnTo(null)
    setStep(target)
    add(target === 'confirm' ? confirm(d) : question(target, d))
  }

  function answer(reply, patch, after) {
    const d = { ...data, ...patch }
    setData(d)
    add({ from: 'me', ...reply })
    next(after, d)
  }

  function pickSaved(p) {
    const d = { ...EMPTY, ...p }
    setData(d)
    add({ from: 'me', text: p.name })
    if (!p.gender) { setStep('gender'); setReturnTo('confirm'); add(question('gender', d)) }
    else { setStep('confirm'); add(confirm(d)) }
  }

  function draw() {
    add({ from: 'me', key: 'ai_yes' })
    const profile = { ...data, time: data.timeUnknown ? '12:00' : data.time }
    let saved = profile
    if (profile.id) saveEdits(profile)
    else saved = saveProfile(profile)
    navigate(`/ask?${profileToParams(saved)}`, { replace: true })
  }

  function change(field) {
    add({ from: 'me', key: `ai_f_${field}` })
    setReturnTo('confirm')
    setStep(field)
    if (field === 'date') setDate(data.date)
    if (field === 'time') setTime(data.time)
    if (field === 'name') setDraft(data.name)
    add(question(field))
  }

  function onPlace(loc) {
    if (!loc) return
    answer({ text: loc.name }, { place: loc.name, lat: loc.lat, lon: loc.lon, tz: getTimezone(loc.lat, loc.lon), display_name: loc.display_name }, 'place')
  }

  function submitText(e) {
    e.preventDefault()
    if (step === 'name' && draft.trim()) { answer({ text: draft.trim() }, { name: draft.trim() }, 'name'); setDraft('') }
    if (step === 'date') {
      const dt = DateTime.fromISO(date)
      if (!date || !dt.isValid || dt.year < 1800) return add({ from: 'bot', key: 'err_date' })
      if (dt > DateTime.now()) return add({ from: 'bot', key: 'err_future' })
      answer({ date }, { date }, 'date')
    }
    if (step === 'time') {
      if (!/^\d{2}:\d{2}$/.test(time)) return add({ from: 'bot', key: 'err_time' })
      answer({ time }, { time, timeUnknown: false }, 'time')
    }
  }

  let composer
  if (step === 'who') {
    composer = <Chips options={[...profiles.map(p => ({ label: p.name, onClick: () => pickSaved(p) })),
      { label: `+ ${t('ai_someone_new')}`, primary: true, onClick: () => { add({ from: 'me', key: 'ai_someone_new' }, question('name')); setStep('name') } }]} />
  } else if (step === 'gender') {
    composer = <Chips options={['male', 'female'].map(g => ({ label: t(`gender_${g}`), onClick: () => answer({ key: `gender_${g}` }, { gender: g }, 'gender') }))} />
  } else if (step === 'confirm') {
    composer = <Chips options={[{ label: t('ai_yes'), primary: true, onClick: draw },
      ...['name', 'gender', 'date', 'time', 'place'].map(f => ({ label: `✎ ${t(`ai_f_${f}`)}`, onClick: () => change(f) }))]} />
  } else if (step === 'place') {
    composer = <div className="pb-1"><PlaceSearch autoFocus onLocationSelect={onPlace} /></div>
  } else {
    composer = (
      <form onSubmit={submitText} className="flex items-end gap-2">
        <div className="min-w-0 flex-1 rounded-3xl bg-white px-3 py-2 shadow-sm">
          {step === 'name' && <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} placeholder={t('wiz_name_ph')}
            className="w-full bg-transparent py-1 text-base outline-none" autoComplete="name" />}
          {step === 'date' && <DateFields autoFocus value={date} onChange={setDate} />}
          {step === 'time' && (
            <>
              <TimeFields autoFocus value={time} onChange={setTime} />
              <button type="button" onClick={() => answer({ key: 'ai_time_unknown' }, { timeUnknown: true, time: '12:00' }, 'time')}
                className="mt-2 text-sm font-semibold text-turmeric-700">{t('ai_time_unknown')}</button>
            </>
          )}
        </div>
        <SendButton label={t('ai_send')} disabled={step === 'name' ? !draft.trim() : step === 'date' ? !date : !time} />
      </form>
    )
  }

  return (
    <Shell subtitle={t('ai_online')} follow={`${log.length}-${step}`} composer={composer}>
      {log.map((m, i) => (
        <Bubble key={i} from={m.from} time={m.at}><p className="whitespace-pre-line">{wording(m)}</p></Bubble>
      ))}
    </Shell>
  )
}

// ── Chat about one chart ─────────────────────────────────────────────────

// the server accepts a bounded conversation; an odd count keeps the history starting with a question
const HISTORY_TURNS = 39
const ERRORS = ['refused', 'busy', 'daily_limit', 'unavailable', 'failed', 'too_long', 'too_many_steps', 'not_configured']

// conversations are kept per chart on this device; also used by the chart page's "Ask AI" link
const storageKey = p => `km_chat_${p.date}_${p.timeUnknown ? 'x' : p.time}_${(+p.lat).toFixed(4)}_${(+p.lon).toFixed(4)}`

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

function ChartChat({ profile }) {
  const { t, lang } = useLanguage()
  const key = storageKey(profile)
  const [chart, setChart] = useState(null)
  const [messages, setMessages] = useState(() => load(key))
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(null) // { text, status } while an answer is coming in
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const first = profile.name.split(' ')[0]

  useEffect(() => { getChart(profile).then(setChart, () => setChart(false)) }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => store(key, messages), [key, messages])
  useEffect(() => () => abortRef.current?.abort(), [])

  async function send(raw) {
    const question = raw.trim()
    if (!question || pending) return
    const history = [...messages, { role: 'user', content: question, time: now() }]
    setMessages(history)
    setDraft('')
    setError(null)
    setPending({ text: '', status: 'thinking' })

    const ctrl = new AbortController()
    abortRef.current = ctrl
    let text = ''
    let failed = null
    try {
      await askAstrologer({
        profile, lang, signal: ctrl.signal,
        messages: history.slice(-HISTORY_TURNS).map(({ role, content }) => ({ role, content })),
        onEvent: ev => {
          if (ev.type === 'text') { text += ev.text; setPending({ text, status: null }) }
          else if (ev.type === 'tool') setPending({ text, status: ev.name })
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
    setMessages([...history, { role: 'assistant', content: text.trim(), time: now() }])
  }

  const status = pending?.status && t(pending.status === 'thinking' ? 'ask_thinking' : `ask_tool_${pending.status}`)
  const running = chart && currentDasha(chart.dasha)

  const composer = (
    <>
      {messages.length === 0 && !pending && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['ask_s1', 'ask_s2', 'ask_s3', 'ask_s4'].map(k => (
            <button key={k} type="button" onClick={() => send(t(k))}
              className="shrink-0 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-sm text-ink-700 shadow-sm">{t(k)}</button>
          ))}
        </div>
      )}
      <form className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); send(draft) }}>
        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={1} maxLength={4000}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(draft) } }}
          placeholder={t('ai_type')} aria-label={t('ai_type')} disabled={!!pending}
          className="max-h-32 min-h-[3rem] min-w-0 flex-1 resize-none rounded-3xl border-0 bg-white px-4 py-3 text-base shadow-sm outline-none" />
        {pending
          ? <button type="button" onClick={() => abortRef.current?.abort()} className="h-12 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-kumkum shadow">{t('ask_stop')}</button>
          : <SendButton label={t('ai_send')} disabled={!draft.trim()} />}
      </form>
    </>
  )

  const actions = (
    <>
      <Link to={chartPath(profile)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-cream/90 ring-1 ring-white/25 hover:bg-white/10">{t('ai_open_chart')}</Link>
      {messages.length > 0 && !pending && (
        <button type="button" onClick={() => { setMessages([]); setError(null) }} aria-label={t('ask_clear')}
          className="rounded-full p-2 text-lg leading-none hover:bg-white/10">⟲</button>
      )}
    </>
  )

  return (
    <Shell subtitle={pending ? t('ai_typing') : t('ai_about', { name: first })} actions={actions} composer={composer}
      follow={`${messages.length}-${pending?.text.length ?? -1}-${!!error}-${!!chart}`}>
      <Bubble from="bot">
        <p>{t('ai_chart_ready', { name: first })}</p>
        {chart && (
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-cream px-3 py-2 text-sm">
            {!profile.timeUnknown && <><dt className="text-ink-500">{t('key_lagna')}</dt><dd className="font-semibold">{rashiName(chart.ascendant.sign_index, lang)}</dd></>}
            <dt className="text-ink-500">{t('key_moon')}</dt><dd className="font-semibold">{rashiName(chart.planets.moon.sign_index, lang)}</dd>
            <dt className="text-ink-500">{t('key_nak')}</dt><dd className="font-semibold">{nakName(chart.planets.moon.nakshatra_index, lang)}</dd>
            {running && <><dt className="text-ink-500">{t('key_dasha')}</dt><dd className="font-semibold">{planetName(running.maha.lord, lang)} / {planetName(running.antar?.lord, lang)}</dd></>}
          </dl>
        )}
      </Bubble>
      {messages.map((m, i) => (
        <Bubble key={i} from={m.role === 'user' ? 'me' : 'bot'} time={m.time}>
          {m.role === 'user' ? <p className="whitespace-pre-wrap">{m.content}</p> : <Answer text={m.content} />}
        </Bubble>
      ))}
      {pending && (pending.text
        ? <Bubble from="bot"><Answer text={pending.text} />{status && <p className="text-sm text-ink-500 animate-pulse">{status}</p>}</Bubble>
        : <Typing label={status} />)}
      {error && (
        <p role="alert" className="mx-auto max-w-xs rounded-lg bg-kumkum-50 px-3 py-2 text-center text-sm text-kumkum">
          {ERRORS.includes(error) ? t(`ask_err_${error}`) : error}
        </p>
      )}
    </Shell>
  )
}
