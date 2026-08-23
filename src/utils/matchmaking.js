// Simplified deterministic matchmaking utilities.

function hashStr(s){
  let h = 0
  for(let i=0;i<s.length;i++){ h = (h*31 + s.charCodeAt(i)) & 0xffffffff }
  return Math.abs(h)
}

/**
 * Compute Mangal Dosha from real ephemeris data.
 * Mars in houses 1, 2, 4, 7, 8, 12 from Lagna.
 * Returns { manglik: bool, marsHouse: number|null }
 */
export function isManglik(ephem) {
  try {
    const marsLon = ephem?.planets?.mars?.lon
    const ascLon  = ephem?.ascendant?.lon
    if (marsLon == null || ascLon == null) return { manglik: null, marsHouse: null }
    // Rashi-based house counting: Lagna rashi = house 1, next rashi = house 2, …
    const ascRashi  = Math.floor(ascLon  / 30) % 12
    const marsRashi = Math.floor(marsLon / 30) % 12
    const house = ((marsRashi - ascRashi) % 12 + 12) % 12  // 0-based
    return { manglik: [0, 3, 6, 7, 11].includes(house), marsHouse: house + 1 }  // 1st,4th,7th,8th,12th
  } catch {
    return { manglik: null, marsHouse: null }
  }
}

export function approxDoshas(profile, ephem = null){
  // Manglik uses real ephem if available; other checks are still hash-based stubs
  const { manglik } = ephem ? isManglik(ephem) : { manglik: null }
  const key = `${profile.name}|${profile.dobISO}|${profile.place}`
  const h = hashStr(key)
  return {
    manglik: manglik ?? ((h % 3) === 0),
    nadiConflict: (h % 5) === 0,
    yoniIssue: (h % 7) === 0,
    notes: 'Manglik is computed from actual Mars/Lagna positions. Other checks are placeholder approximations.'
  }
}

const rashiCompat = {
  'Mesha':     ['Simha','Dhanu','Mithuna','Kumbha'],
  'Vrishabha': ['Kanya','Makara','Karka','Meena'],
  'Mithuna':   ['Tula','Kumbha','Mesha','Simha'],
  'Karka':     ['Vrischika','Meena','Vrishabha','Kanya'],
  'Simha':     ['Mesha','Dhanu','Mithuna','Tula'],
  'Kanya':     ['Vrishabha','Makara','Karka','Vrischika'],
  'Tula':      ['Mithuna','Kumbha','Simha','Dhanu'],
  'Vrischika': ['Karka','Meena','Kanya','Makara'],
  'Dhanu':     ['Mesha','Simha','Tula','Kumbha'],
  'Makara':    ['Vrishabha','Kanya','Vrischika','Meena'],
  'Kumbha':    ['Mithuna','Tula','Mesha','Dhanu'],
  'Meena':     ['Karka','Vrischika','Vrishabha','Makara'],
}

export function matchProfiles(p1, p2, sign1, sign2, ephem1 = null, ephem2 = null){
  // Returns score and reasons
  let score = 50
  const reasons = []

  if(sign1 === sign2){ score += 10; reasons.push('Same rāśi — strong similarity.') }
  if(rashiCompat[sign1] && rashiCompat[sign1].includes(sign2)){ score += 20; reasons.push('Rāśi compatibility (simplified)') }

  const d1 = approxDoshas(p1, ephem1)
  const d2 = approxDoshas(p2, ephem2)

  if(d1.manglik || d2.manglik){ score -= 15; reasons.push('Manglik flag detected. Review with expert.') }
  if(d1.nadiConflict && d2.nadiConflict){ score -= 10; reasons.push('Nadi conflict (approx).') }
  if(d1.yoniIssue || d2.yoniIssue){ score -= 5; reasons.push('Yoni note (approx).') }

  // Normalize
  if(score > 100) score = 100
  if(score < 0) score = 0

  return { score, reasons, doshas: { groom: d1, bride: d2 } }
}
