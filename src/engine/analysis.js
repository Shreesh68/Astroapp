// Chart analysis for the AI astrologer: the Parashari groundwork (dignity, lordships, aspects, yogas,
// what each life area depends on, and what the coming dashas and transits switch on) worked out
// exactly here, so the model reads this chart instead of falling back on generalities.
import { DateTime } from 'luxon'
import { RASHI, RASHI_LORD, mod, relation } from './constants'
import { signChanges } from './tools'

const GRAHAS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']
const SEVEN = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']
const title = s => s[0].toUpperCase() + s.slice(1)

const EXALT = { sun: 0, moon: 1, mars: 9, mercury: 5, jupiter: 3, venus: 11, saturn: 6 }
const OWN = { sun: [4], moon: [3], mars: [0, 7], mercury: [2, 5], jupiter: [8, 11], venus: [1, 6], saturn: [9, 10] }
// moolatrikona: sign and degree range
const MOOLA = { sun: [4, 0, 20], moon: [1, 4, 30], mars: [0, 0, 12], mercury: [5, 16, 20], jupiter: [8, 0, 10], venus: [6, 0, 15], saturn: [10, 0, 20] }
// within this many degrees of the Sun a planet is combust (Mercury and Venus less when retrograde)
const COMBUST = { moon: 12, mars: 17, mercury: 14, jupiter: 11, venus: 10, saturn: 15 }
const SPECIAL_ASPECTS = { mars: [4, 8], jupiter: [5, 9], saturn: [3, 10] }

const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12]
const HOUSE_THEME = ['self, body, temperament', 'wealth, family, speech', 'courage, siblings, efforts', 'home, mother, property, peace of mind',
  'children, intelligence, studies, past merit', 'health issues, debts, rivals, service', 'marriage, partners, business',
  'longevity, sudden changes, hidden matters', 'fortune, father, dharma, higher learning', 'career, status, actions',
  'gains, income, friends, wishes', 'expenses, losses, foreign lands, moksha']

// life areas: main house, supporting houses, natural significators (karakas)
const TOPICS = {
  career: { house: 10, also: [6, 2, 11], karaka: ['sun', 'saturn', 'mercury'] },
  marriage: { house: 7, also: [2, 11], karaka: g => (g === 'female' ? ['jupiter', 'venus'] : ['venus']) },
  money: { house: 2, also: [11, 5, 9], karaka: ['jupiter'] },
  health: { house: 1, also: [6, 8], karaka: ['sun', 'moon'] },
  education: { house: 4, also: [5, 9], karaka: ['mercury', 'jupiter'] },
  children: { house: 5, also: [9], karaka: ['jupiter'] },
  home_property: { house: 4, also: [], karaka: ['mars', 'moon', 'venus'] },
  foreign_travel: { house: 12, also: [9, 3], karaka: ['rahu'] },
  spirituality: { house: 9, also: [12, 5], karaka: ['jupiter', 'ketu'] },
}

function dignity(name, p) {
  if (name === 'rahu' || name === 'ketu') return null
  const s = p.sign_index
  if (EXALT[name] === s) return 'exalted'
  if (mod(EXALT[name] + 6, 12) === s) return 'debilitated'
  const [ms, lo, hi] = MOOLA[name]
  if (ms === s && p.degree >= lo && p.degree < hi) return 'moolatrikona'
  if (OWN[name].includes(s)) return 'own sign'
  const r = relation(name, RASHI_LORD[s])
  return r === 'friend' ? "friend's sign" : r === 'enemy' ? "enemy's sign" : 'neutral sign'
}

/** Houses (1–12) a planet aspects from its house, by graha drishti. */
const aspectedHouses = (name, house) => [7, ...(SPECIAL_ASPECTS[name] || [])].map(n => mod(house + n - 1 - 1, 12) + 1)

export function analyseChart(birth, chart, today) {
  const known = birth.time_known
  // with an unknown birth time the Moon's sign stands in for the Lagna (Chandra lagna)
  const ascSign = known ? chart.ascendant.sign_index : chart.planets.moon.sign_index
  const houseOf = sign => mod(sign - ascSign, 12) + 1
  const signOfHouse = h => mod(ascSign + h - 1, 12)
  const P = Object.fromEntries(GRAHAS.map(n => [n, { ...chart.planets[n], house: houseOf(chart.planets[n].sign_index) }]))
  const lordOf = h => RASHI_LORD[signOfHouse(h)]
  const rules = name => [...Array(12).keys()].map(i => i + 1).filter(h => lordOf(h) === name)
  const occupants = h => GRAHAS.filter(n => P[n].house === h)
  const aspectsOn = h => SEVEN.filter(n => aspectedHouses(n, P[n].house).includes(h))
  const sep = (a, b) => Math.abs(mod(P[a].lon - P[b].lon + 180, 360) - 180)

  const lines = []
  lines.push(`CHART ANALYSIS (calculated by the app — rely on it; houses counted from ${known ? 'the Lagna' : 'the Moon sign (birth time unknown)'})`)

  // ── planets: dignity, house, lordship, combustion
  lines.push('Planets:')
  for (const n of GRAHAS) {
    const p = P[n]
    const bits = [`${RASHI[p.sign_index]} in house ${p.house} (${HOUSE_THEME[p.house - 1].split(',')[0]})`]
    const d = dignity(n, p); if (d) bits.push(d)
    if (p.retrograde && n !== 'rahu' && n !== 'ketu') bits.push('retrograde')
    if (COMBUST[n] && sep(n, 'sun') < COMBUST[n] - (p.retrograde && (n === 'mercury' || n === 'venus') ? 2 : 0)) bits.push('combust (close to the Sun)')
    const r = rules(n); if (r.length) bits.push(`rules house${r.length > 1 ? 's' : ''} ${r.join(' & ')}`)
    const conj = GRAHAS.filter(m => m !== n && P[m].house === p.house); if (conj.length) bits.push(`with ${conj.map(title).join(', ')}`)
    const asp = aspectsOn(p.house).filter(m => m !== n && P[m].house !== p.house); if (asp.length) bits.push(`aspected by ${asp.map(title).join(', ')}`)
    lines.push(`  ${title(n)}: ${bits.join('; ')}`)
  }

  // ── yogas actually present (each with its condition)
  const yogas = []
  const fromMoon = n => mod(P[n].sign_index - P.moon.sign_index, 12) + 1
  if (KENDRA.includes(fromMoon('jupiter'))) yogas.push(`Gajakesari yoga — Jupiter in house ${fromMoon('jupiter')} from the Moon (respect, wisdom, support)`)
  if (P.sun.house === P.mercury.house) yogas.push(`Budhaditya yoga — Sun and Mercury together in house ${P.sun.house} (intelligence, communication)`)
  for (const [n, name] of [['mars', 'Ruchaka'], ['mercury', 'Bhadra'], ['jupiter', 'Hamsa'], ['venus', 'Malavya'], ['saturn', 'Shasha']]) {
    const d = dignity(n, P[n])
    if (KENDRA.includes(P[n].house) && ['exalted', 'own sign', 'moolatrikona'].includes(d)) yogas.push(`${name} yoga (Pancha Mahapurusha) — ${title(n)} ${d} in kendra house ${P[n].house}`)
  }
  if (P.moon.house === P.mars.house) yogas.push(`Chandra-Mangala yoga — Moon with Mars (drive to earn)`)
  const kendraLords = new Set(KENDRA.map(lordOf)), trikonaLords = new Set(TRIKONA.map(lordOf))
  const together = (a, b) => P[a].house === P[b].house || aspectedHouses(a, P[a].house).includes(P[b].house) && aspectedHouses(b, P[b].house).includes(P[a].house)
  const exchange = (a, b) => RASHI_LORD[P[a].sign_index] === b && RASHI_LORD[P[b].sign_index] === a
  const seen = new Set()
  for (const a of SEVEN) for (const b of SEVEN) {
    if (a >= b) continue
    const key = `${a}-${b}`
    if (exchange(a, b)) { yogas.push(`Parivartana (sign exchange) — ${title(a)} and ${title(b)} swap signs, linking houses ${P[a].house} and ${P[b].house}`); seen.add(key) }
    const raja = (kendraLords.has(a) && trikonaLords.has(b)) || (kendraLords.has(b) && trikonaLords.has(a))
    if (raja && a !== b && (together(a, b) || exchange(a, b)) && !(rules(a).some(h => DUSTHANA.includes(h)) && rules(b).some(h => DUSTHANA.includes(h)))) {
      yogas.push(`Raja yoga — ${title(a)} (lord of ${rules(a).join('&')}) and ${title(b)} (lord of ${rules(b).join('&')}) ${exchange(a, b) ? 'exchange signs' : P[a].house === P[b].house ? `join in house ${P[a].house}` : 'aspect each other'}`)
    }
    const dhana = h => [2, 11].includes(h), luck = h => [5, 9].includes(h)
    if ((rules(a).some(dhana) && rules(b).some(luck) || rules(b).some(dhana) && rules(a).some(luck)) && together(a, b)) {
      yogas.push(`Dhana yoga — wealth lord and fortune lord (${title(a)}, ${title(b)}) connected`)
    }
  }
  for (const h of DUSTHANA) {
    const l = lordOf(h)
    if (DUSTHANA.includes(P[l].house) && P[l].house !== h) yogas.push(`Viparita Raja yoga — lord of house ${h} (${title(l)}) sits in house ${P[l].house} (rise after difficulty)`)
  }
  for (const n of SEVEN) {
    if (dignity(n, P[n]) !== 'debilitated') continue
    const disp = RASHI_LORD[P[n].sign_index]
    const ex = Object.keys(EXALT).find(k => mod(EXALT[k], 12) === P[n].sign_index)
    const cancel = KENDRA.includes(P[disp].house) || KENDRA.includes(fromMoon(disp)) || (ex && (KENDRA.includes(P[ex].house)))
    yogas.push(cancel ? `Neecha-bhanga — ${title(n)} is debilitated but its weakness is cancelled (dispositor ${title(disp)} strong in a kendra)` : `${title(n)} is debilitated without cancellation — its matters need effort`)
  }
  for (const n of SEVEN) {
    const r = rules(n)
    if (r.some(h => [4, 7, 10].includes(h)) && r.some(h => [5, 9].includes(h))) yogas.push(`Yogakaraka — ${title(n)} rules both kendra and trikona houses (${r.join(' & ')}); its periods and placement (house ${P[n].house}) are especially fruitful`)
  }
  const nextToMoon = GRAHAS.filter(n => !['sun', 'rahu', 'ketu', 'moon'].includes(n) && [2, 12].includes(fromMoon(n)))
  if (!nextToMoon.length) yogas.push('Kemadruma — no planet beside the Moon (2nd/12th); can show phases of feeling alone, eased by other strengths')
  lines.push('Yogas present:', ...(yogas.length ? [...new Set(yogas)].map(y => `  ${y}`) : ['  none of the common ones']))

  // ── life areas
  const gender = birth.gender
  lines.push('Life areas (main house · its lord · occupants · aspects · significator):')
  for (const [topic, t] of Object.entries(TOPICS)) {
    const h = t.house, l = lordOf(h)
    const occ = occupants(h), asp = aspectsOn(h).filter(n => !occ.includes(n))
    const kar = (typeof t.karaka === 'function' ? t.karaka(gender) : t.karaka)
      .map(k => `${title(k)} ${RASHI[P[k].sign_index]} h${P[k].house}${dignity(k, P[k]) ? ` ${dignity(k, P[k])}` : ''}`).join(', ')
    lines.push(`  ${topic.replace('_', ' ')}: house ${h} ${RASHI[signOfHouse(h)]}; lord ${title(l)} in house ${P[l].house} (${dignity(l, P[l])})` +
      `; occupants ${occ.map(title).join(', ') || 'none'}; aspected by ${asp.map(title).join(', ') || 'none'}; significator ${kar}` +
      `${t.also.length ? `; also houses ${t.also.join(', ')}` : ''}`)
  }

  // ── what the next three years switch on
  const until = DateTime.fromISO(today).plus({ years: 3 }).toISODate()
  const day = iso => iso.slice(0, 10)
  const topicsFor = n => Object.entries(TOPICS).filter(([, t]) => [t.house, ...t.also].some(h => rules(n).includes(h) || P[n].house === h)).map(([k]) => k.replace('_', ' '))
  lines.push(`Coming periods (to ${until}):`)
  for (const m of chart.dasha.periods) {
    if (day(m.end) <= today || day(m.start) > until) continue
    for (const a of m.antardashas) {
      if (day(a.end) <= today || day(a.start) > until) continue
      lines.push(`  ${day(a.start) < today ? today : day(a.start)} to ${day(a.end)}: ${title(m.lord)}–${title(a.lord)} — ${title(a.lord)} rules ${rules(a.lord).join('&') || 'no house'}, sits in house ${P[a.lord].house}; touches ${topicsFor(a.lord).join(', ') || 'general matters'}`)
    }
  }
  const birthLike = { ...birth }
  for (const planet of ['jupiter', 'saturn', 'rahu']) {
    const res = signChanges(birthLike, chart, { planet, start_date: today, end_date: until })
    const stays = [{ sign: res.sign_on_start_date, from: today }, ...res.changes.map(c => ({ sign: c.to, from: c.date }))]
    lines.push(`  ${title(planet)} transit: ` + stays.map(s => {
      const i = RASHI.indexOf(s.sign)
      return `${s.from === today ? 'now' : `from ${s.from}`} in ${s.sign} (house ${houseOf(i)} from ${known ? 'Lagna' : 'Moon'}, ${mod(i - P.moon.sign_index, 12) + 1} from Moon)`
    }).join('; '))
  }
  return lines
}

export { HOUSE_THEME }

// ── Focus for one question ─────────────────────────────────────────────────

const TOPIC_WORDS = {
  career: /\b(job|jobs|career|work|working|promotion|business|office|naukri|employ\w*|profession|salary hike|transfer)\b|ಉದ್ಯೋಗ|ಕೆಲಸ|ವ್ಯಾಪಾರ|ಬಡ್ತಿ|ವೃತ್ತಿ|ನೌಕರಿ/i,
  marriage: /\b(marr\w*|wedding|spouse|husband|wife|partner|love|relationship|kalyana|maduve)\b|ಮದುವೆ|ವಿವಾಹ|ಗಂಡ|ಹೆಂಡತಿ|ಸಂಗಾತಿ|ಕಲ್ಯಾಣ|ಪ್ರೀತಿ/i,
  money: /\b(money|wealth|financ\w*|income|salary|loan|debt|savings|rich|invest\w*)\b|ಹಣ|ಸಂಪತ್ತು|ಆದಾಯ|ಸಾಲ|ಆರ್ಥಿಕ|ದುಡ್ಡು/i,
  health: /\b(health|illness|disease|sick|surgery|hospital|fitness)\b|ಆರೋಗ್ಯ|ಕಾಯಿಲೆ|ಅನಾರೋಗ್ಯ/i,
  education: /\b(study|studies|exam|exams|education|college|degree|school|course|marks)\b|ಓದು|ವಿದ್ಯೆ|ಶಿಕ್ಷಣ|ಪರೀಕ್ಷೆ|ವಿದ್ಯಾಭ್ಯಾಸ/i,
  children: /\b(child|children|kids?|baby|son|daughter|pregnan\w*|santana)\b|ಮಕ್ಕಳ|ಮಗು|ಸಂತಾನ|ಮಗ\b|ಮಗಳು/i,
  home_property: /\b(house|home|property|land|flat|apartment|plot|car|vehicle)\b|ಮನೆ|ಆಸ್ತಿ|ಜಮೀನು|ವಾಹನ|ನಿವೇಶನ/i,
  foreign_travel: /\b(abroad|foreign|visa|overseas|settle|migrat\w*|usa|uk|canada|australia|germany|dubai)\b|ವಿದೇಶ|ಪರದೇಶ/i,
  spirituality: /\b(spiritual\w*|god|temple|meditation|moksha|dharma|puja)\b|ಆಧ್ಯಾತ್ಮ|ದೇವರು|ದೇವಸ್ಥಾನ|ಧ್ಯಾನ/i,
}

/** The life area a question is about, or null for a general question. */
export function topicOf(question) {
  return Object.keys(TOPIC_WORDS).find(k => TOPIC_WORDS[k].test(question)) || null
}

const fmtMonth = iso => DateTime.fromISO(iso).toFormat('LLL yyyy')
const ord = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`
/** A date range, with days when it is short enough that months alone would read "Oct 2026 – Oct 2026". */
const span = (from, to) => {
  const a = DateTime.fromISO(from), b = DateTime.fromISO(to)
  return b.diff(a, 'days').days < 62 ? `${a.toFormat('d LLL yyyy')} – ${b.toFormat('d LLL yyyy')}` : `${fmtMonth(from)} – ${fmtMonth(to)}`
}

/**
 * A short, exact fact sheet for one life area: the house and its lord, which coming periods switch it
 * on, when Jupiter and Saturn occupy or aspect it, and the "double transit" windows when both do.
 */
export function topicFocus(birth, chart, today, topic, years = 3) {
  const t = TOPICS[topic]
  if (!t) return []
  const known = birth.time_known
  const ascSign = known ? chart.ascendant.sign_index : chart.planets.moon.sign_index
  const houseOf = sign => mod(sign - ascSign, 12) + 1
  const signOfHouse = h => mod(ascSign + h - 1, 12)
  const lordOf = h => RASHI_LORD[signOfHouse(h)]
  const P = Object.fromEntries(GRAHAS.map(n => [n, { ...chart.planets[n], house: houseOf(chart.planets[n].sign_index) }]))
  const rules = n => [...Array(12).keys()].map(i => i + 1).filter(h => lordOf(h) === n)
  const until = DateTime.fromISO(today).plus({ years }).toISODate()
  const houses = [t.house, ...t.also]
  const lord = lordOf(t.house)
  const karakas = typeof t.karaka === 'function' ? t.karaka(birth.gender) : t.karaka
  const name = topic.replace('_', ' ')
  const lines = [`FOCUS FOR THIS QUESTION — ${name} (calculated by the app; quote these, do not recompute)`]
  lines.push(`  Main house: ${t.house}${known ? '' : ' (from the Moon sign)'}, ${RASHI[signOfHouse(t.house)]}. Its lord ${title(lord)} sits in house ${P[lord].house} in ${RASHI[P[lord].sign_index]} (${dignity(lord, P[lord]) || 'node'}).`)
  const occ = GRAHAS.filter(n => P[n].house === t.house)
  lines.push(`  In that house: ${occ.map(title).join(', ') || 'no planets'}. Significator${karakas.length > 1 ? 's' : ''}: ${karakas.map(k => `${title(k)} in house ${P[k].house}${dignity(k, P[k]) ? ` (${dignity(k, P[k])})` : ''}`).join(', ')}.`)

  // dasha periods that switch the area on
  const day = iso => iso.slice(0, 10)
  const periods = []
  for (const m of chart.dasha.periods) {
    if (day(m.end) <= today || day(m.start) > until) continue
    for (const a of m.antardashas) {
      if (day(a.end) <= today || day(a.start) > until) continue
      const why = []
      if (a.lord === lord || m.lord === lord) why.push(`${title(lord)} is your ${ord(t.house)} lord`)
      if (P[a.lord].house === t.house) why.push(`${title(a.lord)} sits in your ${ord(t.house)} house`)
      if (karakas.includes(a.lord)) why.push(`${title(a.lord)} is the significator`)
      const supporting = rules(a.lord).filter(h => t.also.includes(h))
      if (supporting.length) why.push(`${title(a.lord)} rules supporting house ${supporting.join('&')}`)
      if (why.length) periods.push(`  ${span(day(a.start) < today ? today : day(a.start), day(a.end))}: ${title(m.lord)}–${title(a.lord)} period (${why.join('; ')})`)
    }
  }
  lines.push(periods.length ? 'Periods that activate it:' : 'Periods that activate it: none strongly in this span.', ...periods)

  // transits: when Jupiter / Saturn occupy or aspect the main house (from the Lagna)
  const influence = planet => {
    const res = signChanges(birth, chart, { planet, start_date: today, end_date: until })
    const stays = [{ sign: RASHI.indexOf(res.sign_on_start_date), from: today }, ...res.changes.map(c => ({ sign: RASHI.indexOf(c.to), from: c.date }))]
    return stays.map((s, i) => ({ ...s, to: stays[i + 1]?.from || until, house: houseOf(s.sign) }))
      .map(s => ({ ...s, hits: s.house === t.house ? `in your ${ord(t.house)} house` : aspectedHouses(planet, s.house).includes(t.house) ? `aspecting your ${ord(t.house)} house from your ${ord(s.house)}` : null }))
  }
  const jup = influence('jupiter'), sat = influence('saturn')
  const show = (planet, list) => list.filter(s => s.hits).map(s => `  ${title(planet)} ${s.hits} (${RASHI[s.sign]}): ${span(s.from, s.to)}`)
  const transitLines = [...show('jupiter', jup), ...show('saturn', sat)]
  lines.push(transitLines.length ? 'Transits touching it:' : 'Transits touching it: neither Jupiter nor Saturn in this span.', ...transitLines)

  // double transit: both at once
  const windows = []
  for (const j of jup.filter(s => s.hits)) for (const s of sat.filter(x => x.hits)) {
    const from = j.from > s.from ? j.from : s.from, to = j.to < s.to ? j.to : s.to
    if (from < to) windows.push(`  ${span(from, to)}`)
  }
  lines.push(windows.length ? 'Double transit (Jupiter and Saturn both on it — traditionally the strongest windows):' : 'Double transit: none in this span.', ...windows)
  return lines
}
