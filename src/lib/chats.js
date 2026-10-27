// Conversations with the AI astrologer, kept per chart on this device. A question keeps being answered
// even if the person leaves the chat screen: the answer is saved into the chat history when it arrives,
// and an event lets the app show "Jyotishi has answered" wherever the person is.
import { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { askAstrologer } from './astrologer'

// the server accepts a bounded conversation; an odd count keeps the history starting with a question
const HISTORY_TURNS = 39
const CHANGED = 'km-chat-changed'
export const REPLIED = 'km-chat-replied'

export const chatKey = p => `km_chat_${p.date}_${p.timeUnknown ? 'x' : p.time}_${(+p.lat).toFixed(4)}_${(+p.lon).toFixed(4)}`
const now = () => DateTime.now().toFormat('HH:mm')

export function loadChat(key) {
  try {
    const list = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function saveChat(key, messages) {
  try {
    if (messages.length) localStorage.setItem(key, JSON.stringify(messages))
    else localStorage.removeItem(key)
  } catch { /* storage unavailable — the conversation just won't persist */ }
}

// answers being written right now, by chat: { text, status, profile }
const running = new Map()
const notify = key => window.dispatchEvent(new CustomEvent(CHANGED, { detail: key }))

/** Messages of one chat and the answer being written for it, kept up to date. */
export function useChat(key) {
  const read = () => ({ messages: loadChat(key), pending: running.get(key) || null })
  const [state, setState] = useState(read)
  useEffect(() => {
    setState(read())
    const onChange = e => { if (!e.detail || e.detail === key) setState(read()) }
    window.addEventListener(CHANGED, onChange)
    return () => window.removeEventListener(CHANGED, onChange)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return state
}

function update(key, fn) {
  saveChat(key, fn(loadChat(key)))
  notify(key)
}

/**
 * Ask a question about a chart. Runs to the end even if the chat screen is closed.
 * The question is saved straight away with status 'sent' (✓), becomes 'read' (✓✓) when the answer starts,
 * or 'failed' with the reason if it could not be answered.
 */
export async function ask(profile, lang, question) {
  const key = chatKey(profile)
  if (running.has(key) || !question.trim()) return
  const asked = { role: 'user', content: question.trim(), time: now(), status: 'sent' }
  const history = [...loadChat(key).filter(m => m.status !== 'failed'), asked]
  saveChat(key, history)
  running.set(key, { text: '', status: 'thinking', profile })
  notify(key)

  const setRunning = patch => { running.set(key, { ...running.get(key), ...patch }); notify(key) }
  const markAsked = patch => update(key, list => list.map((m, i) => (i === list.length - 1 && m.role === 'user' ? { ...m, ...patch } : m)))
  let text = ''
  let read = false
  try {
    await askAstrologer({
      profile, lang,
      messages: history.slice(-HISTORY_TURNS).map(({ role, content }) => ({ role, content })),
      onEvent: ev => {
        if (!read && (ev.type === 'text' || ev.type === 'tool')) { read = true; markAsked({ status: 'read' }) }
        if (ev.type === 'text') { text += ev.text; setRunning({ text, status: null }) }
        else if (ev.type === 'reset') { text = ''; setRunning({ text, status: 'thinking' }) } // a corrected answer follows
        else if (ev.type === 'tool') setRunning({ status: ev.name })
      },
    })
    if (!text.trim()) throw new Error('failed')
    running.delete(key)
    update(key, list => [...list.map(m => (m === list.at(-1) && m.role === 'user' ? { ...m, status: 'read' } : m)), { role: 'assistant', content: text.trim(), time: now() }])
    window.dispatchEvent(new CustomEvent(REPLIED, { detail: { key, profile } }))
  } catch (err) {
    running.delete(key)
    markAsked({ status: 'failed', error: err.message || 'failed' })
  }
}

export function clearChat(profile) {
  const key = chatKey(profile)
  if (running.has(key)) return
  saveChat(key, [])
  notify(key)
}

/** Whether an answer is being written for this chat right now. */
export const isRunning = profile => running.has(chatKey(profile))
