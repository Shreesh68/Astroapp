import { describe, expect, it } from 'vitest'
import { ChartInputError, chartFor, computePanchang } from '../src/engine'
import { kujaDosha } from '../src/engine/chart'
import { RASHI } from '../src/engine/constants'
import { runTool, signChanges } from '../src/engine/tools'

const KUMTA = { lat: 14.4271622, lon: 74.4117058, tz: 'Asia/Kolkata' }
const pooja = chartFor({ ...KUMTA, date: '2001-08-20', time: '11:55' })
const shreesh = chartFor({ ...KUMTA, date: '2000-08-19', time: '01:10' })
const S = Object.fromEntries(RASHI.map((r, i) => [r, i]))

describe('birth chart (checked against Swiss Ephemeris)', () => {
  it('places the Lagna, Moon and nakshatra', () => {
    expect(shreesh.ascendant.sign).toBe('Vrishabha')
    expect(shreesh.planets.moon.sign).toBe('Meena')
    expect(shreesh.moon_nakshatra.name).toBe('Uttara Bhadrapada')
    expect(pooja.ascendant.sign).toBe('Tula')
    expect(pooja.planets.mars.sign).toBe('Vrischika')
  })

  it('keeps Rahu and Ketu opposite and always retrograde', () => {
    const d = (shreesh.planets.ketu.lon - shreesh.planets.rahu.lon + 360) % 360
    expect(d).toBeCloseTo(180, 6)
    expect(shreesh.planets.rahu.retrograde && shreesh.planets.ketu.retrograde).toBe(true)
  })

  it('rejects bad input', () => {
    expect(() => chartFor({ ...KUMTA, tz: 'Nowhere/Land', date: '2000-01-01', time: '10:00' })).toThrow(ChartInputError)
    expect(() => chartFor({ ...KUMTA, date: '2000-13-45', time: '10:00' })).toThrow(ChartInputError)
    expect(() => chartFor({ ...KUMTA, lat: 120, date: '2000-01-01', time: '10:00' })).toThrow(ChartInputError)
  })
})

describe('Vimshottari dasha', () => {
  it('covers 120 years with no gaps', () => {
    const p = pooja.dasha.periods
    for (let i = 1; i < p.length; i++) expect(p[i].start).toBe(p[i - 1].end)
    const years = (Date.parse(p.at(-1).end) - Date.parse(p[0].start)) / (365.25 * 864e5)
    expect(years).toBeGreaterThan(119.9)
  })

  it('antardashas tile each mahadasha', () => {
    for (const m of pooja.dasha.periods) {
      expect(m.antardashas[0].start).toBe(m.start)
      expect(m.antardashas.at(-1).end).toBe(m.end)
      for (let i = 1; i < m.antardashas.length; i++) expect(m.antardashas[i].start).toBe(m.antardashas[i - 1].end)
    }
  })
})

describe('Kuja dosha', () => {
  it("Pooja: Mars in Vrischika in the 2nd from a Tula Lagna is a (mild) dosha — own sign exempts only the 4th/7th", () => {
    expect(pooja.manglik.present).toBe(true)
    expect(pooja.manglik.strength).toBe('mild')
    const lagna = pooja.manglik.references.find(r => r.from === 'lagna')
    expect(lagna).toMatchObject({ house: 2, active: true })
  })

  it('a chart whose dosha houses are all exempt reads as cancelled, not present', () => {
    expect(shreesh.manglik.present).toBe(false)
    expect(shreesh.manglik.strength).toBe('cancelled')
  })

  it('house-table exemption: Mars in the 4th in Mesha', () => {
    // Lagna Makara → Mesha is the 4th
    const signs = { mars: S.Mesha, moon: S.Tula, venus: S.Tula, sun: S.Dhanu, mercury: S.Dhanu, jupiter: S.Vrishabha, saturn: S.Kanya, rahu: S.Mithuna, ketu: S.Dhanu }
    const k = kujaDosha(signs, S.Makara)
    expect(k.references.find(r => r.from === 'lagna')).toMatchObject({ house: 4, active: false })
  })

  it('unknown birth time skips the Lagna', () => {
    const k = chartFor({ ...KUMTA, date: '2001-08-20', time: '12:00', time_known: false }).manglik
    expect(k.references.find(r => r.from === 'lagna').skipped).toBeTruthy()
  })
})

describe('sign changes (transits)', () => {
  const birth = { ...KUMTA, time_known: true }
  it('Saturn enters Meena on 29 March 2025 and Mesha on 3 June 2027', () => {
    const r = signChanges(birth, pooja, { planet: 'saturn', start_date: '2025-01-01', end_date: '2028-01-01' })
    expect(r.sign_on_start_date).toBe('Kumbha')
    expect(r.changes[0]).toMatchObject({ date: '2025-03-29', from: 'Kumbha', to: 'Meena' })
    expect(r.changes[1]).toMatchObject({ date: '2027-06-03', to: 'Mesha' })
  })

  it('tool errors are returned to the model, not thrown', () => {
    expect(runTool('get_panchang', '{"date":"tomorrow"}', birth, pooja)).toMatch(/YYYY-MM-DD/)
    expect(runTool('find_sign_changes', { planet: 'pluto', start_date: '2025-01-01', end_date: '2026-01-01' }, birth, pooja)).toMatch(/unknown planet/)
    expect(runTool('get_panchang', '{not json', birth, pooja)).toMatch(/not valid JSON/)
    expect(runTool('no_such_tool', '{}', birth, pooja)).toMatch(/unknown tool/)
  })
})

describe('Panchang', () => {
  const p = computePanchang('2026-10-22', 14.2251, 76.398, 'Asia/Kolkata')

  it('matches the known day', () => {
    expect(p.samvatsara.name).toBe('Parabhava')
    expect(p.maasa.name).toBe('Ashwayuja')
    expect(p.vara.name).toBe('Thursday')
  })

  it('has consistent times', () => {
    expect(p.sunrise < p.sunset).toBe(true)
    for (const seg of [p.rahu_kala, p.yamaganda, p.gulika]) {
      expect(seg.start < seg.end).toBe(true)
      expect(seg.start >= p.sunrise && seg.end <= p.sunset).toBe(true)
    }
  })

  it('rejects a bad date', () => {
    expect(() => computePanchang('22-10-2026', 14.2, 76.4, 'Asia/Kolkata')).toThrow(ChartInputError)
  })
})
