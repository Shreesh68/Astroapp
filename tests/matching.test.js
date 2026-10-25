import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { ashtakoota, decide } from '../src/engine/ashtakoota'
import { agesOf, chartFor, computeMatch } from '../src/engine'
import { NAKSHATRA } from '../src/engine/constants'

// a Moon longitude in the middle of a nakshatra pada
const star = (name, pada = 2) => NAKSHATRA.indexOf(name) * 360 / 27 + (pada - 0.5) * 360 / 108
// ashtakoota(groom, bride)
const match = (groom, bride) => ashtakoota(star(groom), star(bride))
const score = (m, key) => m.kootas.find(k => k.key === key).score
const reasons = m => m.verdict_reasons.map(r => r.key)

describe('point tables read bride × groom (OnlineJyotish)', () => {
  // Ashwini = Deva, Bharani = Manushya, Krittika = Rakshasa
  it.each([
    ['Ashwini', 'Bharani', 5], // groom Deva, bride Manushya
    ['Bharani', 'Ashwini', 6], // groom Manushya, bride Deva
    ['Ashwini', 'Krittika', 1], // groom Deva, bride Rakshasa
    ['Krittika', 'Ashwini', 0], // groom Rakshasa, bride Deva
    ['Krittika', 'Bharani', 0], // groom Rakshasa, bride Manushya
  ])('Gana: groom %s, bride %s → %d', (g, b, want) => expect(score(match(g, b), 'gana')).toBe(want))

  // Ardra is in Mithuna (Nara), Anuradha in Vrischika (Keeta), Ashwini in Mesha (Chatushpada), Magha in Simha (Vanachara)
  it.each([
    ['Ardra', 'Anuradha', 0], // bride Keeta, groom Nara
    ['Anuradha', 'Ardra', 1], // bride Nara, groom Keeta
    ['Ashwini', 'Magha', 0], // bride Vanachara, groom Chatushpada
    ['Ashwini', 'Bharani', 2], // both Chatushpada
  ])('Vashya: groom %s, bride %s → %d', (g, b, want) => expect(score(match(g, b), 'vashya')).toBe(want))

  it('Tara gives 1.5 for each good direction', () => {
    // Ashwini → Rohini is the 4th (Kshema, good); Rohini → Ashwini is the 25th → 7th tara (Vadha, bad)
    expect(score(match('Rohini', 'Ashwini'), 'tara')).toBe(1.5)
  })
})

describe('South Indian checks', () => {
  it('Rajju: both stars in the same body part is a serious dosha', () => {
    const m = match('Magha', 'Ashwini') // both Pada
    expect(m.south.rajju).toMatchObject({ ok: false, groom: 'Pada', bride: 'Pada' })
    expect(m.verdict).toBe('not_recommended')
    expect(m.verdict_reasons).toContainEqual({ key: 'rajju', severity: 'serious' })
  })

  it('Rajju: different parts agree', () => {
    expect(match('Rohini', 'Ashwini').south.rajju.ok).toBe(true) // Kantha vs Pada
  })

  it.each([
    ['Ashwini', 'Jyeshtha'], ['Bharani', 'Anuradha'], ['Hasta', 'Shatabhisha'],
    ['Mrigashirsha', 'Chitra'], ['Mrigashirsha', 'Dhanishta'], ['Chitra', 'Dhanishta'],
  ])('Vedha: %s and %s obstruct each other (both ways)', (a, b) => {
    expect(match(a, b).south.vedha.ok).toBe(false)
    expect(match(b, a).south.vedha.ok).toBe(false)
  })

  it('no Vedha for an ordinary pair', () => {
    expect(match('Rohini', 'Ashwini').south.vedha.ok).toBe(true)
  })

  it('Mahendra counts from the bride\'s star (her star = 1)', () => {
    const m = match('Rohini', 'Ashwini') // Ashwini(1) → Rohini is the 4th
    expect(m.south.mahendra).toEqual({ count: 4, ok: true })
    expect(match('Krittika', 'Ashwini').south.mahendra.ok).toBe(false) // 3rd
  })

  it.each([
    ['Swati', 15, 'good'], ['Hasta', 13, 'moderate'], ['Magha', 10, 'moderate'], ['Rohini', 4, 'not_met'],
  ])('Stree Deergha: groom %s from a bride in Ashwini (count %d) is %s', (g, count, level) => {
    expect(match(g, 'Ashwini').south.stree_deergha).toEqual({ count, level })
  })
})

describe('shared birth star (Ekanakshatra)', () => {
  it('same star and pada is not recommended whatever the score', () => {
    const m = match('Rohini', 'Rohini')
    expect(m.total).toBeGreaterThanOrEqual(25)
    expect(m.verdict).toBe('not_recommended')
    expect(reasons(m)).toContain('ekanakshatra')
  })

  it('a permitted star with different padas is allowed, and Rajju is not double-counted', () => {
    const m = ashtakoota(star('Rohini', 1), star('Rohini', 3))
    expect(m.south.rajju.ok).toBe(true)
    expect(m.verdict_reasons.filter(r => r.severity === 'serious')).toEqual([])
  })

  it('a star outside the permitted list is not recommended even with different padas', () => {
    expect(ashtakoota(star('Krittika', 1), star('Krittika', 3)).verdict).toBe('not_recommended')
  })
})

describe('verdict', () => {
  it('a serious reason makes any score not recommended', () => {
    expect(decide(34, [{ key: 'vedha', severity: 'serious' }]).verdict).toBe('not_recommended')
  })

  it('a caution caps a high score at average', () => {
    expect(decide(34, [{ key: 'nadi', severity: 'caution' }]).verdict).toBe('average')
    expect(decide(20, [{ key: 'nadi', severity: 'caution' }]).verdict).toBe('average')
  })

  it('below 18 gunas is never recommended', () => {
    expect(decide(17.5, []).verdict).toBe('not_recommended')
  })

  it('every one of the 27 × 27 star pairs gives a consistent result', () => {
    for (let g = 0; g < 27; g++) {
      for (let b = 0; b < 27; b++) {
        const m = ashtakoota(g * 360 / 27 + 5, b * 360 / 27 + 5)
        const sum = m.kootas.reduce((s, k) => s + k.score, 0)
        expect(m.total).toBe(sum)
        expect(m.total).toBeGreaterThanOrEqual(0)
        expect(m.total).toBeLessThanOrEqual(36)
        for (const k of m.kootas) expect(k.score).toBeLessThanOrEqual(k.max)
        if (m.verdict_reasons.some(r => r.severity === 'serious')) expect(m.verdict).toBe('not_recommended')
        if (!m.south.rajju.ok) expect(reasons(m)).toContain('rajju')
        if (m.total < 18) expect(m.verdict).toBe('not_recommended')
      }
    }
  })
})

describe('ages and the older bride', () => {
  const at = (date, time = '12:00') => chartFor({ date, time, lat: 14.43, lon: 74.41, tz: 'Asia/Kolkata' })
  const ravi = at('1995-03-05', '19:45')

  it('computes both ages and the gap', () => {
    const a = agesOf(ravi, at('1998-06-12', '08:30'), DateTime.fromISO('2026-10-25'))
    expect(a).toMatchObject({ groom: 31, bride: 28, bride_older: false })
    expect(Math.floor(a.groom_older_months / 12)).toBe(3)
  })

  it('an older bride is a caution that caps the verdict', () => {
    const m = computeMatch(ravi, at('1993-02-02', '18:15'))
    expect(m.ages.bride_older).toBe(true)
    expect(m.verdict_reasons).toContainEqual({ key: 'bride_older', severity: 'caution' })
    expect(['average', 'not_recommended']).toContain(m.verdict)
  })

  it('a younger bride adds no age caution', () => {
    expect(reasons(computeMatch(ravi, at('1998-06-12', '08:30')))).not.toContain('bride_older')
  })
})
