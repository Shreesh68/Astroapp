import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// An answer must survive the connection breaking (Android cuts the network of an app put in the
// background): the app fetches the step the server finished and kept, without repeating text.
const sse = pieces => pieces.map(p => `data: ${JSON.stringify({ choices: [{ delta: { content: p } }] })}\n\n`).join('')
const FULL = ['Namaste. ', 'Saturn teaches ', 'patience and steady effort.']
const KEPT = `${sse(FULL)}data: [DONE]\n\n`

/** A streamed response that sends `pieces` and then breaks (or just ends, without [DONE]). */
function brokenStream(pieces, { error = true } = {}) {
  const enc = new TextEncoder()
  return new Response(new ReadableStream({
    start(c) {
      c.enqueue(enc.encode(sse(pieces)))
      if (error) setTimeout(() => c.error(new TypeError('network connection was lost')), 5)
      else c.close()
    },
  }), { status: 200 })
}

const pooja = { name: 'Pooja', gender: 'female', date: '2001-08-20', time: '11:55', lat: 14.4271622, lon: 74.4117058, tz: 'Asia/Kolkata', place: 'Kumta' }

async function run(fetchImpl) {
  vi.stubEnv('VITE_CHAT_URL', 'https://chat.test')
  vi.resetModules()
  globalThis.fetch = vi.fn(fetchImpl)
  const { askAstrologer } = await import('../src/lib/astrologer')
  let text = ''
  await askAstrologer({ profile: pooja, lang: 'en', messages: [{ role: 'user', content: 'Tell me something kind' }], onEvent: e => { if (e.type === 'text') text += e.text } })
  return text
}

const isPost = (url, init) => init?.method === 'POST'
const stepOf = init => JSON.parse(init.body).step

describe('answers survive the app going to the background', () => {
  const realFetch = globalThis.fetch
  beforeEach(() => vi.useRealTimers())
  afterEach(() => { globalThis.fetch = realFetch; vi.unstubAllEnvs() })

  it('the stream breaks half-way: the kept step finishes the answer, nothing shown twice', async () => {
    let posted = null, polls = 0
    const text = await run(async (url, init) => {
      if (isPost(url, init)) { posted = stepOf(init); return brokenStream(FULL.slice(0, 2)) }
      expect(url).toBe(`https://chat.test/chat/step?id=${posted}`)
      return ++polls === 1 ? new Response('{}', { status: 202 }) : new Response(KEPT, { status: 200 })
    })
    expect(text).toBe(FULL.join(''))
    expect(polls).toBe(2)
  })

  it('a stream that stops without [DONE] counts as cut off', async () => {
    const text = await run(async (url, init) => (isPost(url, init) ? brokenStream(FULL.slice(0, 1), { error: false }) : new Response(KEPT)))
    expect(text).toBe(FULL.join(''))
  })

  it('the question never reached the server: it is sent again once', async () => {
    let posts = 0
    const text = await run(async (url, init) => {
      if (isPost(url, init)) {
        if (++posts === 1) throw new TypeError('Failed to fetch')
        return new Response(KEPT)
      }
      return new Response('{}', { status: 404 })
    })
    expect(posts).toBe(2)
    expect(text).toBe(FULL.join(''))
  })

  it('other failures are reported as before (no retry loop)', async () => {
    let posts = 0
    await expect(run(async () => { posts++; return new Response(JSON.stringify({ error: 'daily_limit' }), { status: 429 }) })).rejects.toThrow('daily_limit')
    expect(posts).toBe(1)
  })
})
