import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DateTime } from 'luxon'
import { useLanguage } from '../contexts/LanguageContext'
import { ask, chatKey, clearChat, resume, useChat } from '../lib/chats'
import { reportLink } from '../lib/contact'
import { getChart } from '../lib/api'
import { NAKSHATRAS, RASHIS, deityName, nakName, pick, planetName, rashiName } from '../lib/astro'
import { fmtLongDate, fmtMonthYear, fmtTime } from '../lib/dates'
import { getTimezone } from '../lib/geocode'
import { saveEdits, saveProfile, useProfiles } from '../lib/profiles'
import { chartPath, paramsToProfile, profileToParams } from '../lib/share'
import { currentDasha } from '../components/DashaTimeline'
import { DateFields, TimeFields } from '../components/DateTimeFields'
import PlaceSearch from '../components/PlaceSearch'
import SouthIndianChart from '../components/SouthIndianChart'
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

function Bubble({ from, time, ticks, extra, children }) {
  const mine = from === 'me'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-rise`}>
      <div className={`relative max-w-[85%] rounded-xl px-3 pb-1.5 pt-2 text-[15px] leading-relaxed text-ink shadow-sm
        ${mine ? 'rounded-tr-none bg-[#D9FDD3]' : 'rounded-tl-none bg-white'}`}>
        {children}
        {time && <span className="mt-0.5 flex items-center justify-end gap-2 text-[10px] text-ink-500">{extra}<span className="flex items-center">{time}{ticks}</span></span>}
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

// Kannada script: someone writing in Kannada gets the chat (summary and answers) in Kannada
const KANNADA = /[\u0C80-\u0CFF]/

function Intake() {
  const { t, lang, setLang } = useLanguage()
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
    if (step === 'name' && draft.trim()) {
      if (lang === 'en' && KANNADA.test(draft)) setLang('kn')
      answer({ text: draft.trim() }, { name: draft.trim() }, 'name')
      setDraft('')
    }
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
    composer = <div className="pb-1"><PlaceSearch autoFocus dropUp onLocationSelect={onPlace} /></div>
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
        <Bubble key={i} from={m.from} time={m.at} ticks={m.from === 'me' ? <Ticks status="read" /> : null}><p className="whitespace-pre-line">{wording(m)}</p></Bubble>
      ))}
    </Shell>
  )
}

// ── Chat about one chart ─────────────────────────────────────────────────

const ERRORS = ['refused', 'busy', 'daily_limit', 'unavailable', 'failed', 'too_long', 'too_many_steps', 'not_configured']

/** WhatsApp-style ticks on the person's own messages: ✓ sent, blue ✓✓ read (the answer has started). */
function Ticks({ status }) {
  if (status === 'read') return <span className="ml-1 text-[13px] tracking-[-0.35em] text-sky-500" aria-label="read">✓✓</span>
  if (status === 'sent') return <span className="ml-1 text-[13px] text-ink-300" aria-label="sent">✓</span>
  return null
}

function ChartChat({ profile }) {
  const { t, lang, setLang } = useLanguage()
  const key = chatKey(profile)
  const [chart, setChart] = useState(null)
  // the conversation lives in lib/chats, so an answer keeps coming even if this screen is closed
  const { messages, pending } = useChat(key)
  const [draft, setDraft] = useState('')
  const first = profile.name.split(' ')[0]

  useEffect(() => { getChart(profile).then(setChart, () => setChart(false)) }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  // a question left unanswered because Android closed the app is answered now
  useEffect(() => { resume(profile, lang) }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  function send(raw) {
    const question = raw.trim()
    if (!question || pending) return
    setDraft('')
    // a question typed in Kannada is answered in Kannada, and the chat switches with it
    const replyIn = lang === 'en' && KANNADA.test(question) ? 'kn' : lang
    if (replyIn !== lang) setLang(replyIn)
    ask(profile, replyIn, question)
  }

  const status = pending?.status && t(pending.status === 'thinking' ? 'ask_thinking' : `ask_tool_${pending.status}`)
  const failed = messages.at(-1)?.status === 'failed' ? messages.at(-1) : null

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
        {/* the next question can be typed while an answer is coming; it is sent once the answer is done */}
        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={1} maxLength={4000}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(draft) } }}
          placeholder={t('ai_type')} aria-label={t('ai_type')}
          className="max-h-32 min-h-[3rem] min-w-0 flex-1 resize-none rounded-3xl border-0 bg-white px-4 py-3 text-base shadow-sm outline-none" />
        <SendButton label={t('ai_send')} disabled={!draft.trim() || !!pending} />
      </form>
    </>
  )

  const actions = (
    <>
      <Link to={chartPath(profile)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-cream/90 ring-1 ring-white/25 hover:bg-white/10">{t('ai_open_chart')}</Link>
      {messages.length > 0 && !pending && (
        <button type="button" onClick={() => clearChat(profile)} aria-label={t('ask_clear')}
          className="rounded-full p-2 text-lg leading-none hover:bg-white/10">⟲</button>
      )}
    </>
  )

  return (
    <Shell subtitle={pending ? t('ai_typing') : t('ai_about', { name: first })} actions={actions} composer={composer}
      follow={`${messages.length}-${pending?.text.length ?? -1}-${!!failed}-${!!chart}`}>
      <Bubble from="bot">
        {chart ? <KundliSummary profile={profile} chart={chart} /> : <p>{t('ai_chart_ready', { name: first })}</p>}
      </Bubble>
      {messages.map((m, i) => (
        <Bubble key={i} from={m.role === 'user' ? 'me' : 'bot'} time={m.time} ticks={m.role === 'user' && m.status !== 'failed' ? <Ticks status={m.status || 'read'} /> : null}
          extra={m.role === 'assistant' && <a href={reportLink(messages[i - 1]?.content, m.content)} className="mr-auto underline">⚑ {t('ask_report')}</a>}>
          {m.role === 'user' ? <p className="whitespace-pre-wrap">{m.content}</p> : <Answer text={m.content} />}
        </Bubble>
      ))}
      {pending && (pending.text
        ? <Bubble from="bot"><Answer text={pending.text} />{status && <p className="text-sm text-ink-500 animate-pulse">{status}</p>}</Bubble>
        : <Typing label={status} />)}
      {failed && (
        <div role="alert" className="mx-auto max-w-xs rounded-lg bg-kumkum-50 px-3 py-2 text-center text-sm text-kumkum">
          <p>! {ERRORS.includes(failed.error) ? t(`ask_err_${failed.error}`) : t('ask_err_failed')}</p>
          <button type="button" onClick={() => send(failed.content)} className="mt-1 font-semibold underline">{t('ask_retry')}</button>
        </div>
      )}
    </Shell>
  )
}

/**
 * The first message of a chart's chat: the kundli drawn as a South Indian chart and a short reading of
 * it — Moon sign and nakshatra, Lagna, the running dasha and Kuja dosha — in the chat's language, before
 * the person asks their questions.
 */
function KundliSummary({ profile, chart }) {
  const { t, lang } = useLanguage()
  const first = profile.name.split(' ')[0]
  const moon = chart.planets.moon
  const asc = chart.ascendant
  const nak = NAKSHATRAS[moon.nakshatra_index]
  const running = currentDasha(chart.dasha)
  return (
    <div className="space-y-2">
      <p>{t('ai_kundli_intro', { name: first })}</p>
      <div className="rounded-lg bg-cream p-2">
        <SouthIndianChart ephem={chart} lang={lang} />
      </div>
      <p>{t('story_moon', { name: first, rashi: rashiName(moon.sign_index, lang), nak: nakName(moon.nakshatra_index, lang), pada: moon.pada, trait: pick(RASHIS[moon.sign_index].trait, lang) })}</p>
      <p>{t('story_nak', { nak: nakName(moon.nakshatra_index, lang), symbol: nak.symbol.toLowerCase(), deity: deityName(nak.deity, lang), trait: pick(nak.trait, lang) })}</p>
      <p>{profile.timeUnknown ? `⚠ ${t('story_lagna_unknown')}` : t('story_lagna', { rashi: rashiName(asc.sign_index, lang), trait: pick(RASHIS[asc.sign_index].trait, lang) })}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-cream px-3 py-2 text-sm">
        {!profile.timeUnknown && <><dt className="text-ink-500">{t('key_lagna')}</dt><dd className="font-semibold">{rashiName(asc.sign_index, lang)}</dd></>}
        <dt className="text-ink-500">{t('key_moon')}</dt><dd className="font-semibold">{rashiName(moon.sign_index, lang)}</dd>
        <dt className="text-ink-500">{t('key_nak')}</dt><dd className="font-semibold">{nakName(moon.nakshatra_index, lang)} · {t('pada')} {moon.pada}</dd>
        {running && <><dt className="text-ink-500">{t('key_dasha')}</dt><dd className="font-semibold">{planetName(running.maha.lord, lang)} / {planetName(running.antar?.lord, lang)}
          {running.antar && <span className="block text-xs font-normal text-ink-500">{t('ai_until', { when: fmtMonthYear(running.antar.end, profile.tz, lang) })}</span>}</dd></>}
        <dt className="text-ink-500">{t('manglik_title')}</dt><dd className="font-semibold">{t(`kuja_${chart.manglik.strength}`)}</dd>
      </dl>
      <p>{t('ai_ask_next', { name: first })}</p>
    </div>
  )
}
