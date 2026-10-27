// Checks an AI answer against what the app actually calculated, before the person relies on it.
// Three kinds of claim are checked, in English and Kannada:
//   lordships  — "your 10th lord, the Moon" / "10ನೇ ಮನೆಯ ಅಧಿಪತಿ ಚಂದ್ರ"
//   placements — "Saturn in your 7th house" / "ಶನಿ … 7ನೇ ಮನೆಯಲ್ಲಿ" (houses counted from the Moon are skipped)
//   dates      — "June 2027" / "ಜೂನ್ 2027": each must be within a month of a date the model was given
// Anything else in the answer is left alone: only claims the app can verify are checked.
import { RASHI_LORD } from '../engine/constants'

const PLANETS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']
const EN_PLANET = '(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)'
const KN_PLANET = '(ರವಿ|ಸೂರ್ಯ|ಚಂದ್ರ|ಕುಜ|ಮಂಗಳ|ಬುಧ|ಗುರು|ಶುಕ್ರ|ಶನಿ|ರಾಹು|ಕೇತು)'
const KN_TO = { ರವಿ: 'sun', ಸೂರ್ಯ: 'sun', ಚಂದ್ರ: 'moon', ಕುಜ: 'mars', ಮಂಗಳ: 'mars', ಬುಧ: 'mercury', ಗುರು: 'jupiter', ಶುಕ್ರ: 'venus', ಶನಿ: 'saturn', ರಾಹು: 'rahu', ಕೇತು: 'ketu' }
const EN_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const KN_MONTHS = ['ಜನವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್', 'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್']
const ORDINAL = '(\\d{1,2})(?:st|nd|rd|th)'
const title = s => s[0].toUpperCase() + s.slice(1)

/** Month index (year*12 + month) for every date in a text: 2027-06-03, "Jun 2027", "3 June 2027", "ಜೂನ್ 2027". */
export function monthsIn(text) {
  const out = []
  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-\d{2}\b/g)) out.push(+m[1] * 12 + (+m[2] - 1))
  for (const m of text.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?(?:\s+\d{1,2},?)?\s+(\d{4})\b/gi)) {
    out.push(+m[2] * 12 + EN_MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()))
  }
  KN_MONTHS.forEach((name, i) => {
    for (const m of text.matchAll(new RegExp(`${name}\\s*(?:\\d{1,2}\\s*,?\\s*)?(\\d{4})`, 'g'))) out.push(+m[1] * 12 + i)
    for (const m of text.matchAll(new RegExp(`(\\d{4})\\s*ರ?\\s*${name}`, 'g'))) out.push(+m[1] * 12 + i)
  })
  return out
}

/**
 * What the app knows for this conversation. context: every text the model was given (chart summary,
 * focus sheet, tool results) — a planet may be cited in any house those texts put it in (natal or transit).
 */
export function buildFacts(birth, chart, context) {
  const ascSign = birth.time_known === false ? chart.planets.moon.sign_index : chart.ascendant.sign_index
  const lordOf = h => RASHI_LORD[(ascSign + h - 1) % 12]
  const houses = Object.fromEntries(PLANETS.map(p => [p, new Set([((chart.planets[p].sign_index - ascSign + 12) % 12) + 1])]))
  // houses the context puts each planet in — only lines that are about that planet:
  //   "  Mars: Vrischika in house 2 …"            (natal, from the analysis or summary)
  //   "  Saturn transit: now in Meena (house 6 …" (transits)
  //   "  Saturn in your 7th house (Meena): …"     (focus sheet)
  //   "  Jupiter aspecting your 7th house from your 11th" → Jupiter is in the 11th
  // never "rules house N" (lordship) or "house N from the Moon" (another reference point)
  for (const line of context.join('\n').split('\n')) {
    const subject = line.match(new RegExp(`^\\s*${EN_PLANET}(?:\\s+transit)?\\s*:`, 'i'))
    if (subject) {
      const p = subject[1].toLowerCase()
      for (const m of line.matchAll(/(?<!rules\s)(?<!rules houses?\s[\d& ]*)\bhouse\s+(\d{1,2})(?!\s+from\s+(?:the\s+)?Moon)/gi)) houses[p].add(+m[1])
      continue
    }
    const focus = line.match(new RegExp(`^\\s*${EN_PLANET}\\s+(in|aspecting)\\s+your\\s+${ORDINAL}\\s+house(?:\\s+from\\s+your\\s+${ORDINAL})?`, 'i'))
    if (focus) houses[focus[1].toLowerCase()].add(+(focus[2].toLowerCase() === 'in' ? focus[3] : focus[4]))
  }
  return { lordOf, houses, months: new Set(monthsIn(context.join('\n'))) }
}

// "ಹತ್ತನೇ ಮನೆ" and "೧೦ನೇ ಮನೆ" are checked like "10ನೇ ಮನೆ"
const KN_ORDINALS = ['ಮೊದಲನೇ|ಒಂದನೇ', 'ಎರಡನೇ', 'ಮೂರನೇ', 'ನಾಲ್ಕನೇ', 'ಐದನೇ', 'ಆರನೇ', 'ಏಳನೇ', 'ಎಂಟನೇ', 'ಒಂಬತ್ತನೇ', 'ಹತ್ತನೇ', 'ಹನ್ನೊಂದನೇ', 'ಹನ್ನೆರಡನೇ']
export function normaliseKannada(text) {
  let out = text.replace(/[೦-೯]/g, d => String('೦೧೨೩೪೫೬೭೮೯'.indexOf(d)))
  KN_ORDINALS.forEach((words, i) => { out = out.replace(new RegExp(`(?:${words})`, 'g'), `${i + 1}ನೇ`) })
  return out
}

/** The claims in an answer that contradict the app's facts: [{ kind, claim, truth }]. */
export function checkAnswer(raw, facts) {
  const text = normaliseKannada(raw)
  const issues = []
  const add = (kind, claim, truth) => { if (!issues.some(i => i.claim === claim)) issues.push({ kind, claim, truth }) }

  // lordships
  const lordClaim = (house, planet, claim) => {
    const h = +house
    if (h < 1 || h > 12 || planet === 'rahu' || planet === 'ketu') return
    if (facts.lordOf(h) !== planet) add('lordship', claim, `the lord of the ${h}${h === 1 ? 'st' : h === 2 ? 'nd' : h === 3 ? 'rd' : 'th'} house is ${title(facts.lordOf(h))}`)
  }
  for (const m of text.matchAll(new RegExp(`\\b${ORDINAL}[ -](?:house\\s+)?lord(?:\\s*\\([^)]{0,40}\\))?\\s*(?:,|is|—|-|:)?\\s*(?:the\\s+)?${EN_PLANET}`, 'gi'))) lordClaim(m[1], m[2].toLowerCase(), m[0])
  for (const m of text.matchAll(new RegExp(`lord of (?:your |the )?${ORDINAL} house(?:\\s*\\([^)]{0,40}\\))?\\s*,?\\s*(?:is\\s+)?(?:the\\s+)?${EN_PLANET}`, 'gi'))) lordClaim(m[1], m[2].toLowerCase(), m[0])
  for (const m of text.matchAll(new RegExp(`(\\d{1,2})ನೇ\\s*(?:ಮನೆಯ|ಭಾವದ)\\s*ಅಧಿಪತಿ\\S*\\s*${KN_PLANET}`, 'g'))) lordClaim(m[1], KN_TO[m[2]], m[0])

  // placements (skip houses counted from the Moon or a sign)
  const placeClaim = (planet, house, claim) => {
    const h = +house
    if (h >= 1 && h <= 12 && !facts.houses[planet].has(h)) add('placement', claim, `${title(planet)} is not in house ${h} in this chart or its listed transits`)
  }
  const notAnotherPlanet = `(?:(?!${EN_PLANET.slice(1, -1).split('|').map(p => `\\b${p}\\b`).join('|')})[^.\\n]){0,40}?`
  for (const m of text.matchAll(new RegExp(`\\b${EN_PLANET}\\b${notAnotherPlanet}\\b(?:in|into|placed in|sits in|sitting in|transiting|transits)\\s+(?:your\\s+|the\\s+)?${ORDINAL} house(?!\\s+(?:counted\\s+)?from)`, 'gi'))) placeClaim(m[1].toLowerCase(), m[2], m[0])
  for (const m of text.matchAll(new RegExp(`${KN_PLANET}(?:(?!${KN_PLANET.slice(1, -1)})[^.\\n]){0,30}?(\\d{1,2})ನೇ\\s*(?:ಮನೆ|ಭಾವ)(?:ಯಲ್ಲಿ|ದಲ್ಲಿ)`, 'g'))) {
    if (/ಚಂದ್ರನಿಂದ|ರಾಶಿಯಿಂದ|ಲಗ್ನದಿಂದ ಅಲ್ಲ/.test(m[0])) continue
    placeClaim(KN_TO[m[1]], m[2], m[0])
  }

  // dates: within a month of something the model was given
  const near = idx => [idx - 1, idx, idx + 1].some(i => facts.months.has(i))
  for (const idx of monthsIn(text)) {
    if (!near(idx)) add('date', `${EN_MONTHS[idx % 12]} ${Math.floor(idx / 12)}`, 'no period, transit or date in the calculated data is near this month')
  }
  return issues
}

/** The message that asks the model to correct itself. */
export function correctionRequest(issues) {
  return `[Fact check by the app] Your answer contradicts the calculated chart:\n${issues.map(i => `- "${i.claim}" — ${i.truth}`).join('\n')}\n` +
    'Rewrite the whole answer, fixing only these points and quoting the chart analysis exactly. Do not mention this check.'
}
