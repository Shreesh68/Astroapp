// Runs the AI evaluation set against the live chat server and scores every answer.
//   npm run eval:ai              all cases
//   npm run eval:ai -- career    only cases whose id contains "career"
// Writes eval/reports/<time>.json and prints a summary. Each run uses roughly 40 questions of the free daily allowance.
import { build } from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(fs.readFileSync(path.join(here, '../.env.android'), 'utf8').split('\n')
  .filter(l => /^VITE_CHAT_URL=/.test(l)).map(l => l.split('=')))
const chatUrl = env.VITE_CHAT_URL
if (!chatUrl) throw new Error('VITE_CHAT_URL is missing from .env.android')

// bundle the app's own chat code exactly as the phone runs it
const outfile = path.join(here, '.astrologer.bundle.mjs')
await build({
  stdin: { contents: "export { askAstrologer } from '../src/lib/astrologer.js'", resolveDir: here, loader: 'js' },
  bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'warning',
  define: { 'import.meta.env.VITE_CHAT_URL': JSON.stringify(chatUrl) },
})
const store = new Map()
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) }
globalThis.window = { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} }
const { askAstrologer } = await import(outfile)
const { CASES, PEOPLE, REFUSAL, SAVED, WHY_WHEN } = await import('./cases.mjs')

const filter = process.argv[2]
const cases = CASES.filter(c => !filter || c.id.includes(filter))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const kannada = s => (s.match(/[ಀ-೿]/g) || []).length
const latin = s => (s.match(/[A-Za-z]/g) || []).length

async function runCase(c) {
  store.set('km_profiles', JSON.stringify(SAVED))
  const messages = c.messages || [{ role: 'user', content: c.q }]
  let text = ''; const tools = []; let factcheck = null; let error = null
  const t0 = Date.now()
  try {
    await askAstrologer({
      profile: PEOPLE[c.who], lang: c.lang, messages,
      onEvent: e => {
        if (e.type === 'text') text += e.text
        else if (e.type === 'reset') text = ''
        else if (e.type === 'tool') tools.push(e.name)
        else if (e.type === 'done') factcheck = e.factcheck
      },
    })
  } catch (e) { error = e.message }
  text = text.trim()
  const ex = c.expect, checks = {}
  if (error) checks.no_error = false
  // language: Kannada answers mostly Kannada letters; English answers essentially no Kannada
  const k = kannada(text), l = latin(text)
  checks.language = c.lang === 'kn' ? k > 4 * l : k <= 3
  if (ex.refusal) checks.refusal = REFUSAL[ex.refusal].test(text)
  else {
    checks.facts = !factcheck || factcheck.remaining.length === 0
    if (ex.format) checks.format = WHY_WHEN[c.lang].every(r => r.test(text))
    if (ex.match) checks.expected = ex.match.every(r => r.test(text))
    if (ex.avoid) checks.avoided = !ex.avoid.some(r => r.test(text))
    if (ex.tools) checks.tools = ex.tools.every(t => tools.includes(t))
  }
  const pass = Object.values(checks).every(Boolean)
  return {
    id: c.id, lang: c.lang, pass, checks, tools: tools.filter(t => t !== 'fact_check'),
    factcheck: factcheck && { first_draft_issues: factcheck.issues.length, corrected: factcheck.corrected, remaining: factcheck.remaining.length, issues: factcheck.issues },
    error, seconds: Math.round((Date.now() - t0) / 100) / 10, answer: text,
  }
}

const results = []
for (const c of cases) {
  const r = await runCase(c)
  results.push(r)
  const failed = Object.entries(r.checks).filter(([, v]) => !v).map(([k]) => k)
  const fc = r.factcheck?.first_draft_issues ? ` (fact check: ${r.factcheck.first_draft_issues} issue(s) in draft${r.factcheck.corrected ? `, corrected, ${r.factcheck.remaining} left` : ''})` : ''
  console.log(`${r.pass ? '✓' : '✗'} ${r.id.padEnd(24)} ${String(r.seconds).padStart(5)}s${failed.length ? `  FAILED: ${failed.join(', ')}` : ''}${r.error ? `  [${r.error}]` : ''}${fc}`)
  await sleep(2500) // stay well inside the server's per-phone rate limit
}

const by = key => results.filter(r => key in r.checks)
const rate = key => { const rs = by(key); return rs.length ? `${rs.filter(r => r.checks[key]).length}/${rs.length}` : '–' }
const drafts = results.filter(r => r.factcheck)
console.log(`\nPassed ${results.filter(r => r.pass).length}/${results.length} cases`)
console.log(`  language ${rate('language')} · facts ${rate('facts')} · format ${rate('format')} · expected ${rate('expected')} · avoided ${rate('avoided')} · tools ${rate('tools')} · refusals ${rate('refusal')}`)
console.log(`  fact check: ${drafts.filter(r => r.factcheck.first_draft_issues).length} of ${drafts.length} first drafts had issues; ${drafts.filter(r => r.factcheck.corrected && !r.factcheck.remaining).length} fully corrected`)
fs.mkdirSync(path.join(here, 'reports'), { recursive: true })
const file = path.join(here, 'reports', `${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
fs.writeFileSync(file, JSON.stringify({ date: new Date().toISOString(), results }, null, 2))
console.log(`  report: ${path.relative(process.cwd(), file)}`)
fs.rmSync(outfile, { force: true })
