import { describe, expect, it } from 'vitest'
import { computeMatch, chartFor } from '../src/engine'
import { deityName, kootaTerm, NAKSHATRAS, reasonText } from '../src/lib/astro'
import { fmtClock, fmtTime } from '../src/lib/dates'

// Kannada mode must not fall back to English for anything the engine can produce
const latin = s => /[A-Za-z]{3,}/.test(s)
const rand = (i, n) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1 * n
const person = (i, gender) => {
  const y = 1960 + Math.floor(rand(i, 45)), m = 1 + Math.floor(rand(i + 1, 12)), d = 1 + Math.floor(rand(i + 2, 28))
  const h = Math.floor(rand(i + 3, 24)), min = Math.floor(rand(i + 4, 60))
  return { name: `P${i}`, gender, date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, time: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`, lat: 12.97, lon: 77.59, tz: 'Asia/Kolkata', time_known: true }
}

describe('Kannada has a word for everything shown', () => {
  it('match terms and dosha cancellation reasons, for 2000 random pairs', () => {
    const missing = new Set()
    for (let i = 0; i < 2000; i++) {
      const m = computeMatch(chartFor(person(i * 7, 'male')), chartFor(person(i * 7 + 100000, 'female')))
      for (const side of [m.groom, m.bride]) for (const k of ['varna', 'vashya', 'yoni', 'gana', 'nadi']) if (latin(kootaTerm(side[k], 'kn'))) missing.add(side[k])
      for (const k of m.kootas) if (k.key === 'tara') for (const v of Object.values(k.parts)) if (latin(kootaTerm(v, 'kn'))) missing.add(v)
      for (const d of m.doshas) if (d.cancelled_reason && latin(reasonText(d.cancelled_reason, 'kn'))) missing.add(d.cancelled_reason)
    }
    expect([...missing]).toEqual([])
  })

  it('Kuja dosha exemptions in birth charts, for 2000 random births', () => {
    const missing = new Set()
    let seen = 0
    for (let i = 0; i < 2000; i++) {
      const c = chartFor(person(i * 11 + 7, 'male'))
      for (const r of c.manglik.references) if (r.cancelled_reason) { seen++; if (latin(reasonText(r.cancelled_reason, 'kn'))) missing.add(r.cancelled_reason) }
    }
    expect(seen).toBeGreaterThan(100)
    expect([...missing]).toEqual([])
  })

  it('every nakshatra deity', () => {
    expect(NAKSHATRAS.filter(n => latin(deityName(n.deity, 'kn'))).map(n => n.deity)).toEqual([])
  })

  it('times say the part of the day, not AM/PM', () => {
    expect(fmtTime('06:12', 'kn')).toBe('ಬೆಳಿಗ್ಗೆ 6:12')
    expect(fmtTime('13:05', 'kn')).toBe('ಮಧ್ಯಾಹ್ನ 1:05')
    expect(fmtTime('17:53', 'kn')).toBe('ಸಂಜೆ 5:53')
    expect(fmtTime('20:41', 'kn')).toBe('ರಾತ್ರಿ 8:41')
    expect(fmtTime('00:30', 'kn')).toBe('ರಾತ್ರಿ 12:30')
    expect(fmtClock('2026-10-27T18:05:00+05:30', 'kn')).toBe('ಸಂಜೆ 6:05')
    expect(fmtTime('06:12', 'en')).toMatch(/6:12\s?am/i)
  })
})
