// The AI astrologer. The conversation is driven from the phone: the chat server (worker/) only relays
// each step to the AI model, and whenever the model asks for a calculation (transits, dashas,
// Panchang) the app runs it here with its own engine and sends the result back.
import { DateTime } from 'luxon'
import { chartFor, computeMatch } from '../engine'
import { RASHI_LORD } from '../engine/constants'
import { runTool, saturnFromMoon } from '../engine/tools'
import { analyseChart, dashaFocus, isDashaQuestion, topicFocus, topicOf } from '../engine/analysis'
import { ApiError, toPayload } from './api'
import { findPlace } from './places'
import { readProfiles, samePerson } from './profiles'
import { buildFacts, checkAnswer, correctionRequest } from './factcheck'

const CHAT_URL = (import.meta.env.VITE_CHAT_URL || '').replace(/\/+$/, '')
const MAX_ROUNDS = 6

export const astrologerAvailable = !!CHAT_URL

/** A random id for this install, so the server can limit questions per phone. */
function deviceId() {
  try {
    let id = localStorage.getItem('km_device')
    if (!id) { id = crypto.randomUUID?.() || String(Math.random()).slice(2); localStorage.setItem('km_device', id) }
    return id
  } catch {
    return 'unknown'
  }
}

const title = s => s[0].toUpperCase() + s.slice(1)
const dms = deg => {
  let d = Math.floor(deg), m = Math.round((deg - d) * 60)
  if (m === 60) { d += 1; m = 0 }
  return `${d}°${String(m).padStart(2, '0')}'`
}
const day = iso => iso.slice(0, 10)

/** The birth chart as plain text for the model (same content as backend/ask.py). */
export function chartSummary(birth, chart, today) {
  const known = birth.time_known
  const asc = chart.ascendant
  const lines = [
    `Name: ${birth.name || 'not given'}`,
    `Gender: ${birth.gender || 'not given'}`,
    `Born: ${birth.date} at ${known ? birth.time : 'unknown time (noon used)'}, ${birth.place || 'place not named'} (lat ${birth.lat.toFixed(4)}, lon ${birth.lon.toFixed(4)}, ${birth.tz})`,
    `Ayanamsa: Lahiri ${chart.ayanamsa_degree.toFixed(4)}°`,
    known ? `Lagna: ${asc.sign} ${dms(asc.degree)}, ${asc.nakshatra} pada ${asc.pada}`
      : 'Lagna: not reliable (birth time unknown); use the Moon sign as the reference',
    `Grahas (sign, degree, nakshatra${known ? ', house from Lagna' : ''}):`,
  ]
  for (const [name, p] of Object.entries(chart.planets)) {
    const retro = p.retrograde && name !== 'rahu' && name !== 'ketu' ? ', retrograde' : ''
    lines.push(`  ${title(name)}: ${p.sign} ${dms(p.degree)}, ${p.nakshatra} pada ${p.pada}${known ? `, house ${p.house}` : ''}${retro}`)
  }
  lines.push(`Moon sign lord: ${title(RASHI_LORD[chart.planets.moon.sign_index])}`)
  const k = chart.manglik
  lines.push(`Kuja dosha (app's assessment): ${k.present ? k.strength : 'not present'}; ` + k.references.map(r =>
    `from ${r.from}: ${r.skipped ? 'skipped (time unknown)' : `Mars in house ${r.house}${r.dosha_house ? (r.active ? ' — dosha' : ` — exempt: ${r.cancelled_reason}`) : ''}`}`).join('; '))

  const { balance_at_birth: bal, periods } = chart.dasha
  lines.push(`Vimshottari dasha: balance at birth ${title(bal.lord)} ${bal.years.toFixed(2)} years`)
  lines.push('Mahadashas: ' + periods.map(m => `${title(m.lord)} ${day(m.start)} to ${day(m.end)}`).join('; '))
  const maha = periods.find(m => day(m.start) <= today && today < day(m.end))
  if (maha) {
    const antar = maha.antardashas.find(a => day(a.start) <= today && today < day(a.end))
    lines.push(`Running now: ${title(maha.lord)} mahadasha${antar ? `, ${title(antar.lord)} antardasha until ${day(antar.end)}` : ''}`)
    lines.push(`Antardashas of the ${title(maha.lord)} mahadasha: ` + maha.antardashas.map(a => `${title(a.lord)} ${day(a.start)} to ${day(a.end)}`).join('; '))
  }

  // today's slow planets and Saturn's periods, worked out here so the model can quote them as facts
  const sky = chartFor({ date: today, time: '12:00', lat: birth.lat, lon: birth.lon, tz: birth.tz })
  lines.push(`Transits today (${today}, calculated):`)
  for (const name of ['saturn', 'jupiter', 'rahu', 'ketu']) {
    const p = sky.planets[name]
    const fromMoon = ((p.sign_index - chart.planets.moon.sign_index + 12) % 12) + 1
    const fromLagna = ((p.sign_index - asc.sign_index + 12) % 12) + 1
    lines.push(`  ${title(name)}: ${p.sign}${p.retrograde && name !== 'rahu' && name !== 'ketu' ? ' (retrograde)' : ''}, house ${fromMoon} from the Moon${known ? `, house ${fromLagna} from the Lagna` : ''}`)
  }
  lines.push(...saturnFromMoon(birth, chart, today))
  lines.push('', ...analyseChart(birth, chart, today))
  return lines.join('\n')
}

/**
 * Read one streamed model step. Calls onText with each piece of the answer and returns the
 * collected text and tool calls. Understands both the OpenAI-style chunks and Workers AI's own.
 */
async function readStep(res, onText) {
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = '', text = ''
  const calls = []
  const handle = data => {
    if (data === '[DONE]') return
    let chunk
    try { chunk = JSON.parse(data) } catch { return }
    if (chunk.error) throw new ApiError('failed')
    const delta = chunk.choices?.[0]?.delta ?? chunk.choices?.[0]?.message
    const piece = delta?.content ?? chunk.response
    if (typeof piece === 'string' && piece) { text += piece; onText(piece) }
    for (const tc of delta?.tool_calls ?? chunk.tool_calls ?? []) {
      const i = tc.index ?? calls.length
      const call = (calls[i] ??= { id: '', name: '', args: '' })
      if (tc.id) call.id = tc.id
      const f = tc.function ?? tc
      if (f.name) call.name = f.name
      if (f.arguments != null) call.args += typeof f.arguments === 'string' ? f.arguments : JSON.stringify(f.arguments)
    }
  }
  for (;;) {
    let chunk
    try {
      chunk = await reader.read()
    } catch (err) {
      if (err.name === 'AbortError') throw err
      throw new ApiError('unavailable')
    }
    if (chunk.done) break
    buffer += decoder.decode(chunk.value, { stream: true })
    let end
    while ((end = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, end).trim()
      buffer = buffer.slice(end + 1)
      if (line.startsWith('data:')) handle(line.slice(5).trim())
    }
  }
  if (buffer.trim().startsWith('data:')) handle(buffer.trim().slice(5).trim())
  return { text, calls: calls.filter(c => c && c.name) }
}

/**
 * Ask the AI astrologer about a profile's chart. `messages` is the text conversation
 * ([{ role: 'user' | 'assistant', content }], ending with the new question). Events passed to
 * onEvent: { type: 'text', text } | { type: 'tool', name } | { type: 'reset' } (discard the draft: a corrected
 * answer follows) | { type: 'done', factcheck: { issues, corrected } }; failures throw ApiError
 * with a short code (busy, daily_limit, unavailable, failed, too_many_steps, not_configured).
 */
export async function askAstrologer({ profile, messages, lang, signal, onEvent }) {
  if (!CHAT_URL) throw new ApiError('not_configured')
  const birth = { ...toPayload(profile), name: profile.name, place: profile.place, gender: profile.gender }
  const natal = chartFor(birth)
  const today = DateTime.now().setZone(birth.tz).toISODate()

  const convo = messages.map(m => ({ role: m.role, content: m.content }))
  const saved = readProfiles().filter(p => !samePerson(p, profile))
  const savedLine = saved.length
    ? `\n\nPeople saved in the app (for matchmaking, call check_match with just the name): ${saved.map(p => `${p.name} (${p.gender || 'gender not set'})`).join(', ')}`
    : ''
  convo[0] = {
    role: 'user',
    content: `Birth chart of the person asking (calculated by the app; today is ${today}):\n${chartSummary(birth, natal, today)}${savedLine}\n\nQuestion: ${convo[0].content}`,
  }

  // the newest question gets a short exact fact sheet for its topic, so the model quotes rather than computes
  const last = convo.length - 1
  const question = messages[messages.length - 1].content
  const topic = topicOf(question)
  // everything the model is given, so its final answer can be checked against it
  const context = [convo[0].content]
  // a life area gets its own sheet (with its periods); a question only about the dasha gets the dasha sheet
  const dasha = !topic && isDashaQuestion(question)
  // the extra sheets help the answer, but a problem preparing one must never stop the question being answered
  const safely = (what, fn, fallback) => { try { return fn() } catch (err) { console.warn(`${what} skipped:`, err); return fallback } }
  const focus = (topic || dasha) && safely('focus sheet', () => (topic ? topicFocus(birth, natal, today, topic) : dashaFocus(birth, natal, today)), null)
  if (focus?.length) {
    convo[last] = { ...convo[last], content: `${convo[last].content}\n\n${focus.join('\n')}` }
    context.push(focus.join('\n'))
  } else if (!/sade|sati|shani|saturn|jupiter|guru|rahu|ketu|transit|panchang|muhurt|ಸಾಡೇ|ಶನಿ|ಗುರು|ರಾಹು|ಕೇತು|ಗೋಚಾರ|ಪಂಚಾಂಗ|ಮುಹೂರ್ತ/i.test(question)) {
    // a general question (not about one planet or transit either): overview, then ask which area
    convo[last] = { ...convo[last], content: `${convo[last].content}\n\n[No specific area of life is named: give a short overview from the analysis and the coming periods, then end by asking which area — career, marriage, money, health, studies — they would like to look at in detail.]` }
  }

  let wroteText = false
  let correction = null // the issues found in the first draft, once a correction has been asked for
  for (let round = 0; round < MAX_ROUNDS; round++) {
    let res
    try {
      res = await fetch(`${CHAT_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: convo, lang, device: deviceId() }),
        signal,
      })
    } catch (err) {
      if (err.name === 'AbortError') throw err
      throw new ApiError('unavailable')
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new ApiError(typeof body?.error === 'string' ? body.error : 'failed')
    }

    let first = true
    const { text, calls } = await readStep(res, piece => {
      if (first && wroteText) onEvent({ type: 'text', text: '\n\n' })
      first = false
      wroteText = true
      onEvent({ type: 'text', text: piece })
    })
    if (!calls.length) {
      // fact check: claims about lordships, placements and dates must match what the app calculated
      const issues = safely('fact check', () => checkAnswer(text, buildFacts(birth, natal, context)), [])
      if (issues.length && !correction) {
        correction = issues
        onEvent({ type: 'reset' })
        onEvent({ type: 'tool', name: 'fact_check' })
        wroteText = false
        convo.push({ role: 'assistant', content: text }, { role: 'user', content: correctionRequest(issues) })
        continue
      }
      onEvent({ type: 'done', factcheck: { issues: correction || issues, remaining: correction ? issues : [], corrected: !!correction } })
      return
    }

    const toolCalls = calls.map((c, i) => ({ id: c.id || `call_${round}_${i}`, type: 'function', function: { name: c.name, arguments: c.args || '{}' } }))
    convo.push({ role: 'assistant', content: text || '', tool_calls: toolCalls })
    for (const call of toolCalls) {
      onEvent({ type: 'tool', name: call.function.name })
      const content = call.function.name === 'check_match'
        ? await checkMatch(call.function.arguments, profile, natal, signal)
        : runTool(call.function.name, call.function.arguments, birth, natal)
      convo.push({ role: 'tool', tool_call_id: call.id, content })
      context.push(content)
    }
  }
  throw new ApiError('too_many_steps')
}

// ── Matchmaking from the chat ─────────────────────────────

const lower = s => String(s || '').trim().toLowerCase()
// partners checked in this session, by name, so a follow-up call (e.g. "yes, go ahead" after the
// older-bride question) can give just the name: the chat only keeps the text of earlier turns
const recentPartners = new Map()

/**
 * The check_match tool: the person asking and a partner (saved in the app, or details given in the chat),
 * groom and bride by gender. With an older bride it asks for confirmation unless allow_elder_bride is set.
 */
export async function checkMatch(rawArgs, profile, natal, signal) {
  let args
  try { args = typeof rawArgs === 'string' ? JSON.parse(rawArgs || '{}') : rawArgs || {} } catch { return 'error: arguments were not valid JSON' }
  const gender = profile.gender || args.asker_gender
  if (!['male', 'female'].includes(gender)) {
    return 'error: the gender of the person asking is not known — ask whether they are male or female, then call again with asker_gender'
  }
  const name = String(args.partner_name || '').trim()
  if (!name) return 'error: partner_name is required'

  let partner = !args.birth_date && (readProfiles().find(p => lower(p.name) === lower(name) && !samePerson(p, profile)) || recentPartners.get(lower(name)))
  let placeFound = null
  if (!partner) {
    const missing = ['birth_date', 'birth_time', 'birth_place'].filter(k => !args[k])
    if (missing.length) return `error: ${name} is not saved in the app; ask the person for the ${missing.join(', ').replace(/_/g, ' ')}`
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.birth_date)) return 'error: birth_date must be YYYY-MM-DD'
    const unknownTime = /unknown|not known|don't know/i.test(args.birth_time)
    if (!unknownTime && !/^\d{1,2}:\d{2}$/.test(args.birth_time)) return 'error: birth_time must be HH:MM (24-hour) or "unknown"'
    let place
    try { place = await findPlace(args.birth_place, signal) } catch (err) { if (err.name === 'AbortError') throw err }
    if (!place) return `error: could not find the place "${args.birth_place}" — ask for a nearby town or the district`
    placeFound = place.display_name
    partner = {
      name, date: args.birth_date, time: unknownTime ? '12:00' : args.birth_time.padStart(5, '0'), timeUnknown: unknownTime,
      place: place.name, lat: place.lat, lon: place.lon, tz: place.tz,
    }
    recentPartners.set(lower(name), { ...partner, placeFound })
  }
  placeFound ??= partner.placeFound

  let partnerChart
  try { partnerChart = chartFor(toPayload(partner)) } catch (err) { return `error: ${err.message}` }
  const groomIsAsker = gender === 'male'
  const [groom, bride] = groomIsAsker ? [profile, partner] : [partner, profile]
  const m = computeMatch(groomIsAsker ? natal : partnerChart, groomIsAsker ? partnerChart : natal)
  const gap = Math.abs(m.ages.groom_older_months)
  const gapText = gap >= 12 ? `${Math.floor(gap / 12)} years ${gap % 12} months` : `${gap} months`

  if (m.ages.bride_older && !args.allow_elder_bride) {
    return JSON.stringify({
      needs_confirmation: true,
      message: `${bride.name} (bride) is ${gapText} older than ${groom.name} (groom). Tradition prefers an older groom. Ask whether they still want the match checked; if yes, call again with allow_elder_bride true.`,
    })
  }
  const person = (p, side) => ({ name: p.name, age: m.ages[side], moon_sign: m[side].rashi, nakshatra: `${m[side].nakshatra} pada ${m[side].pada}`, birth_time_unknown: !!p.timeUnknown })
  return JSON.stringify({
    groom: person(groom, 'groom'), bride: person(bride, 'bride'),
    ages: m.ages.bride_older ? `bride is ${gapText} older (matched on request)` : gap === 0 ? 'same age' : `groom is ${gapText} older`,
    partner_place_found: placeFound || `${partner.place} (saved in the app)`,
    partner_birth: `${partner.date} ${partner.timeUnknown ? '(time unknown)' : partner.time}`,
    gunas: `${m.total} of 36`,
    kootas: Object.fromEntries(m.kootas.map(k => [k.key, `${k.score}/${k.max}`])),
    verdict: m.verdict.replace('_', ' '),
    verdict_reasons: m.verdict_reasons.map(r => `${r.key} (${r.severity})`),
    doshas: m.doshas.map(d => `${d.key}: ${d.cancelled_reason ? `cancelled — ${d.cancelled_reason}` : 'present'}`),
    south_indian: {
      rajju: m.south.rajju.ok ? `agrees (groom ${m.south.rajju.groom}, bride ${m.south.rajju.bride})` : `DOSHA — both ${m.south.rajju.groom}`,
      vedha: m.south.vedha.ok ? 'agrees' : 'DOSHA',
      mahendra: `${m.south.mahendra.ok ? 'agrees' : 'not met'} (count ${m.south.mahendra.count})`,
      stree_deergha: `${m.south.stree_deergha.level.replace('_', ' ')} (count ${m.south.stree_deergha.count})`,
    },
    kuja_dosha: `${m.manglik.status}${m.manglik.ok ? ' — no mismatch' : ' — one-sided, not balanced'}`,
    note: (groom.timeUnknown || bride.timeUnknown) ? 'a birth time is unknown (noon used): the nakshatra may be off if the Moon was near a boundary' : undefined,
  })
}
