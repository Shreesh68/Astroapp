// The AI astrologer. The conversation is driven from the phone: the chat server (worker/) only relays
// each step to the AI model, and whenever the model asks for a calculation (transits, dashas,
// Panchang) the app runs it here with its own engine and sends the result back.
import { DateTime } from 'luxon'
import { chartFor } from '../engine'
import { RASHI_LORD } from '../engine/constants'
import { runTool, saturnFromMoon } from '../engine/tools'
import { analyseChart, topicFocus, topicOf } from '../engine/analysis'
import { ApiError, toPayload } from './api'

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
 * onEvent: { type: 'text', text } | { type: 'tool', name } | { type: 'done' }; failures throw ApiError
 * with a short code (busy, daily_limit, unavailable, failed, too_many_steps, not_configured).
 */
export async function askAstrologer({ profile, messages, lang, signal, onEvent }) {
  if (!CHAT_URL) throw new ApiError('not_configured')
  const birth = { ...toPayload(profile), name: profile.name, place: profile.place }
  const natal = chartFor(birth)
  const today = DateTime.now().setZone(birth.tz).toISODate()

  const convo = messages.map(m => ({ role: m.role, content: m.content }))
  convo[0] = {
    role: 'user',
    content: `Birth chart of the person asking (calculated by the app; today is ${today}):\n${chartSummary(birth, natal, today)}\n\nQuestion: ${convo[0].content}`,
  }

  // the newest question gets a short exact fact sheet for its topic, so the model quotes rather than computes
  const last = convo.length - 1
  const topic = topicOf(messages[messages.length - 1].content)
  if (topic) {
    const focus = topicFocus(birth, natal, today, topic)
    convo[last] = { ...convo[last], content: `${convo[last].content}\n\n${focus.join('\n')}` }
  }

  let wroteText = false
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
      onEvent({ type: 'done' })
      return
    }

    const toolCalls = calls.map((c, i) => ({ id: c.id || `call_${round}_${i}`, type: 'function', function: { name: c.name, arguments: c.args || '{}' } }))
    convo.push({ role: 'assistant', content: text || '', tool_calls: toolCalls })
    for (const call of toolCalls) {
      onEvent({ type: 'tool', name: call.function.name })
      convo.push({ role: 'tool', tool_call_id: call.id, content: runTool(call.function.name, call.function.arguments, birth, natal) })
    }
  }
  throw new ApiError('too_many_steps')
}
