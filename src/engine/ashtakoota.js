// Ashtakoota (Guna Milan) — the 36-point compatibility check — plus the South Indian checks families in
// Karnataka weigh most (Rajju, Vedha, Mahendra, Stree Deergha), all from each person's Moon.
// Point tables follow OnlineJyotish's published bride × groom tables (onlinejyotish.com, marriage matching).
import { NAKSHATRA, RASHI, RASHI_LORD, mod, nakshatraOf, rashiIndex, relation } from './constants'

// 1. Varna (1): water signs Brahmin, fire Kshatriya, earth Vaishya, air Shudra
const VARNA_NAMES = ['Shudra', 'Vaishya', 'Kshatriya', 'Brahmin'] // rank 0..3
const VARNA_OF_RASHI = [2, 1, 0, 3, 2, 1, 0, 3, 2, 1, 0, 3]

// 2. Vashya (2) — rows = BRIDE's group, columns = GROOM's group
const VASHYA_NAMES = ['Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Keeta']
const VASHYA_TABLE = [
  [2, 1, 1, 0, 1],
  [1, 2, 0.5, 0, 1],
  [1, 0.5, 2, 1, 1],
  [0, 0, 1, 2, 0],
  [1, 0, 1, 0, 2],
]

function vashyaGroup(lon) {
  const r = rashiIndex(lon), deg = mod(lon, 30)
  if (r === 0 || r === 1) return 0 // Mesha, Vrishabha
  if ([2, 5, 6, 10].includes(r)) return 1 // Mithuna, Kanya, Tula, Kumbha
  if (r === 3 || r === 11) return 2 // Karka, Meena
  if (r === 4) return 3 // Simha
  if (r === 7) return 4 // Vrischika
  if (r === 8) return deg < 15 ? 1 : 0 // Dhanu: first half human, second half quadruped
  return deg < 15 ? 0 : 2 // Makara: first half quadruped, second half aquatic
}

// 3. Tara (3)
const TARA_NAMES = ['Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyari', 'Sadhaka', 'Vadha', 'Mitra', 'Ati-Mitra']
const BAD_TARAS = [2, 4, 6] // Vipat, Pratyari, Vadha (0-based)
/** Tara (0-based) of nakshatra b counted from nakshatra a. */
const taraFrom = (a, b) => mod(b - a, 27) % 9

// 4. Yoni (4) — symmetric; sworn enemies score 0
const YONI_NAMES = ['Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat',
  'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion']
const YONI_OF_NAKSHATRA = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1]
const YONI_TABLE = [
  // Ho El Sh Se Do Ca Ra Co Bu Ti De Mo Mn Li
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 1, 3, 2, 1], // Horse
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0], // Elephant
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1], // Sheep
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2], // Serpent
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1], // Dog
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1], // Cat
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2], // Rat
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1], // Cow
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1], // Buffalo
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1], // Tiger
  [1, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1], // Deer
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2], // Monkey
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2], // Mongoose
  [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4], // Lion
]

// 5. Graha Maitri (5)
const RELATION_ORDER = ['friend', 'neutral', 'enemy']
const MAITRI_POINTS = {
  'friend,friend': 5, 'friend,neutral': 4, 'neutral,neutral': 3,
  'friend,enemy': 1, 'neutral,enemy': 0.5, 'enemy,enemy': 0,
}
function maitri(a, b) {
  const pair = [relation(a, b), relation(b, a)].sort((x, y) => RELATION_ORDER.indexOf(x) - RELATION_ORDER.indexOf(y))
  return MAITRI_POINTS[pair.join(',')]
}

// 6. Gana (6) — rows = BRIDE's gana, columns = GROOM's gana
const GANA_NAMES = ['Deva', 'Manushya', 'Rakshasa']
const GANA_OF_NAKSHATRA = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0]
const GANA_TABLE = [
  [6, 6, 0],
  [5, 6, 0],
  [1, 0, 6],
]

// 7. Bhakoot (7)
const BAD_BHAKOOT = ['2,12', '12,2', '5,9', '9,5', '6,8', '8,6']

// 8. Nadi (8)
const NADI_NAMES = ['Adi', 'Madhya', 'Antya']
const NADI_OF_NAKSHATRA = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2]

// Ekanakshatra: a shared birth star is discouraged. It is tolerated only for these nakshatras, and only
// when the padas differ (Rohini, Ardra, Pushya, Magha, Vishakha, Shravana, Uttara Bhadrapada, Revati).
const SHARED_STAR_PERMITTED = [3, 5, 7, 9, 15, 21, 25, 26]

// ── South Indian checks ──
// Rajju: the 27 stars on five parts of a body; both stars in one part is Rajju dosha (Siro most serious)
const RAJJU_NAMES = ['Pada', 'Kati', 'Nabhi', 'Kantha', 'Siro']
const RAJJU_OF_NAKSHATRA = [0, 1, 2, 3, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 3, 2, 1, 0]
// Vedha: stars that obstruct each other (Mrigashira, Chitra and Dhanishta all with one another)
const VEDHA_PAIRS = [[0, 17], [1, 16], [2, 15], [3, 14], [5, 21], [6, 20], [7, 19], [8, 18], [9, 26], [10, 25], [11, 24], [12, 23], [4, 13], [4, 22], [13, 22]]
const vedha = (a, b) => VEDHA_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
// counts are from the bride's star (her star = 1) to the groom's
const MAHENDRA_COUNTS = [4, 7, 10, 13, 16, 19, 22, 25]

const title = s => s[0].toUpperCase() + s.slice(1)

function describeMoon(lon) {
  const [nak, pada] = nakshatraOf(lon)
  const r = rashiIndex(lon)
  return {
    rashi: RASHI[r], rashi_index: r, rashi_lord: RASHI_LORD[r],
    nakshatra: NAKSHATRA[nak], nakshatra_index: nak, pada,
    varna: VARNA_NAMES[VARNA_OF_RASHI[r]],
    vashya: VASHYA_NAMES[vashyaGroup(lon)],
    yoni: YONI_NAMES[YONI_OF_NAKSHATRA[nak]],
    gana: GANA_NAMES[GANA_OF_NAKSHATRA[nak]],
    nadi: NADI_NAMES[NADI_OF_NAKSHATRA[nak]],
    rajju: RAJJU_NAMES[RAJJU_OF_NAKSHATRA[nak]],
  }
}

function verdict(total) {
  if (total >= 32) return 'excellent'
  if (total >= 25) return 'very_good'
  if (total >= 18) return 'average'
  return 'not_recommended'
}

export function ashtakoota(groomMoonLon, brideMoonLon) {
  const g = describeMoon(groomMoonLon), b = describeMoon(brideMoonLon)
  const gn = g.nakshatra_index, bn = b.nakshatra_index
  const gr = g.rashi_index, br = b.rashi_index
  const kootas = []
  const add = (key, score, max, detail) => kootas.push({ key, score, max, detail })

  add('varna', VARNA_OF_RASHI[gr] >= VARNA_OF_RASHI[br] ? 1 : 0, 1, `Groom ${g.varna}, bride ${b.varna}`)

  add('vashya', VASHYA_TABLE[vashyaGroup(brideMoonLon)][vashyaGroup(groomMoonLon)], 2, `Groom ${g.vashya}, bride ${b.vashya}`)

  const tBg = taraFrom(bn, gn) // groom's star counted from bride's
  const tGb = taraFrom(gn, bn)
  const tara = (BAD_TARAS.includes(tBg) ? 0 : 1.5) + (BAD_TARAS.includes(tGb) ? 0 : 1.5)
  add('tara', tara, 3, `${TARA_NAMES[tBg]} from bride, ${TARA_NAMES[tGb]} from groom`)

  add('yoni', YONI_TABLE[YONI_OF_NAKSHATRA[gn]][YONI_OF_NAKSHATRA[bn]], 4, `Groom ${g.yoni}, bride ${b.yoni}`)

  add('graha_maitri', maitri(g.rashi_lord, b.rashi_lord), 5,
    `Rashi lords ${title(g.rashi_lord)} and ${title(b.rashi_lord)}`)

  add('gana', GANA_TABLE[GANA_OF_NAKSHATRA[bn]][GANA_OF_NAKSHATRA[gn]], 6, `Groom ${g.gana}, bride ${b.gana}`)

  const posGFromB = mod(gr - br, 12) + 1
  const posBFromG = mod(br - gr, 12) + 1
  const bhakootBad = BAD_BHAKOOT.includes(`${posGFromB},${posBFromG}`)
  add('bhakoot', bhakootBad ? 0 : 7, 7, `Rashis are ${posGFromB}/${posBFromG} from each other`)

  const nadiSame = NADI_OF_NAKSHATRA[gn] === NADI_OF_NAKSHATRA[bn]
  add('nadi', nadiSame ? 0 : 8, 8, `Groom ${g.nadi}, bride ${b.nadi}`)

  const doshas = []
  if (nadiSame) {
    let cancel = null
    if (gr === br && gn !== bn) cancel = 'Same rashi but different nakshatras'
    else if (gn === bn && gr !== br) cancel = 'Same nakshatra but different rashis'
    else if (gn === bn && g.pada !== b.pada && SHARED_STAR_PERMITTED.includes(gn)) cancel = 'Same nakshatra but different padas'
    doshas.push({ key: 'nadi', cancelled_reason: cancel })
  }
  const sameStar = gn === bn
  if (sameStar) {
    const permitted = SHARED_STAR_PERMITTED.includes(gn) && g.pada !== b.pada
    doshas.push({
      key: 'ekanakshatra',
      cancelled_reason: permitted ? 'Shared nakshatra is a permitted one and the padas differ' : null,
      same_rashi: gr === br,
      same_pada: g.pada === b.pada,
    })
  }
  if (bhakootBad) {
    const lg = g.rashi_lord, lb = b.rashi_lord
    let cancel = null
    if (lg === lb) cancel = 'Both rashis share the same lord'
    else if (relation(lg, lb) === 'friend' && relation(lb, lg) === 'friend') cancel = 'Rashi lords are mutual friends'
    doshas.push({ key: 'bhakoot', cancelled_reason: cancel })
  }
  if (kootas[5].score === 0) doshas.push({ key: 'gana', cancelled_reason: null })

  // South Indian checks. A shared star is judged by the Ekanakshatra rule above, so Rajju applies only
  // when the stars differ.
  const count = mod(gn - bn, 27) + 1
  const south = {
    rajju: { bride: b.rajju, groom: g.rajju, ok: gn === bn || RAJJU_OF_NAKSHATRA[gn] !== RAJJU_OF_NAKSHATRA[bn] },
    vedha: { ok: !vedha(gn, bn) },
    mahendra: { count, ok: MAHENDRA_COUNTS.includes(count) },
    stree_deergha: { count, level: count > 13 ? 'good' : count > 9 ? 'moderate' : 'not_met' },
  }
  if (!south.rajju.ok) doshas.push({ key: 'rajju', cancelled_reason: null, part: g.rajju })
  if (!south.vedha.ok) doshas.push({ key: 'vedha', cancelled_reason: null })

  const total = kootas.reduce((sum, k) => sum + k.score, 0)
  // serious doshas outweigh any guna score; Nadi/Bhakoot left uncancelled call for care
  const active = key => doshas.some(d => d.key === key && !d.cancelled_reason)
  const reasons = [
    ...['rajju', 'vedha', 'ekanakshatra'].filter(active).map(key => ({ key, severity: 'serious' })),
    ...(total < 18 ? [{ key: 'low_score', severity: 'serious' }] : []),
    ...['nadi', 'bhakoot'].filter(active).map(key => ({ key, severity: 'caution' })),
  ]
  return { groom: g, bride: b, kootas, total, max: 36, doshas, south, ...decide(total, reasons) }
}

const RANK = ['not_recommended', 'average', 'very_good', 'excellent']

/** The verdict from the score, lowered by the reasons: any serious one → not recommended, a caution → at most average. */
export function decide(total, reasons) {
  let v = verdict(total)
  if (reasons.some(r => r.severity === 'serious')) v = 'not_recommended'
  else if (reasons.some(r => r.severity === 'caution') && RANK.indexOf(v) > RANK.indexOf('average')) v = 'average'
  return { verdict: v, verdict_reasons: reasons }
}
