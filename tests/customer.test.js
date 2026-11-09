import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { computePanchang } from '../src/engine/panchang'
import { chartFor } from '../src/engine'
import { topicFocus } from '../src/engine/analysis'
import { languageIssues } from '../src/lib/factcheck'

// Fixes found by walking through the app as a customer (Nov 2026)

const BENGALURU = [12.9716, 77.5946, 'Asia/Kolkata']
const festivalsOn = date => computePanchang(date, ...BENGALURU).festivals

describe('Panchang shows the festivals families in Karnataka keep', () => {
  // dates as published in Karnataka calendars
  const KNOWN = {
    '2025-01-14': 'makara_sankranti', '2025-02-26': 'maha_shivaratri', '2025-03-30': 'ugadi', '2025-04-06': 'rama_navami',
    '2025-08-26': 'gowri_habba', '2025-08-27': 'ganesha_chaturthi', '2025-09-22': 'navaratri', '2025-10-01': 'mahanavami',
    '2025-10-02': 'vijayadashami', '2025-10-20': 'deepavali', '2025-10-22': 'bali_padyami',
    '2026-02-15': 'maha_shivaratri', '2026-03-19': 'ugadi', '2026-09-13': 'gowri_habba', '2026-09-14': 'ganesha_chaturthi',
    '2026-10-20': 'vijayadashami', '2026-11-08': 'deepavali', '2026-11-10': 'bali_padyami',
  }
  for (const [date, fest] of Object.entries(KNOWN)) {
    it(`${fest} on ${date}`, () => expect(festivalsOn(date)).toContain(fest))
  }

  it('each festival once a year, and about 24 Ekadashis', () => {
    const count = {}
    for (let d = DateTime.fromISO('2025-01-01'); d.year === 2025; d = d.plus({ days: 1 })) {
      for (const f of festivalsOn(d.toISODate())) count[f] = (count[f] || 0) + 1
    }
    const { ekadashi, ...rest } = count
    expect(Object.values(rest).every(n => n === 1)).toBe(true)
    expect(Object.keys(rest)).toHaveLength(18)
    expect(ekadashi).toBeGreaterThanOrEqual(23)
    expect(ekadashi).toBeLessThanOrEqual(26)
  }, 120000)
})

describe('AI fact sheets give dates a customer can trust', () => {
  const ravi = { name: 'Ravi Kumar', gender: 'male', date: '1990-07-12', time: '08:30', lat: 14.2811, lon: 74.4447, tz: 'Asia/Kolkata', time_known: true }
  const chart = chartFor(ravi)
  const sheet = topic => topicFocus(ravi, chart, '2026-11-09', topic)
  const doubles = lines => {
    const rest = lines.slice(lines.findIndex(l => l.startsWith('Double transit')) + 1)
    const end = rest.findIndex(l => !l.startsWith('  '))
    return end < 0 ? rest : rest.slice(0, end)
  }

  it('no double-transit "window" of a few days (was: 23 Feb 2028 – 28 Feb 2028)', () => {
    const marriage = doubles(sheet('marriage'))
    expect(marriage.join('\n')).not.toMatch(/Feb 2028 – 28 Feb/)
    // windows under two months are written with days ("3 Jun 2027 – 26 Jun 2027"); none may be under a month
    for (const l of marriage) {
      const m = l.match(/^\s+(\d{1,2} \w{3} \d{4}) – (\d{1,2} \w{3} \d{4})/)
      if (m) expect(DateTime.fromFormat(m[2], 'd LLL yyyy').diff(DateTime.fromFormat(m[1], 'd LLL yyyy'), 'days').days).toBeGreaterThanOrEqual(30)
    }
  })

  it('every double-transit window names its dasha, so it is never paired with the wrong one', () => {
    const career = doubles(sheet('career'))
    expect(career.length).toBeGreaterThan(0)
    expect(career.every(l => /\(dasha: \w+–\w+/.test(l))).toBe(true)
    expect(career[0]).toMatch(/Jun 2027 – Oct 2027 \(dasha: Saturn–Moon, then Saturn–Mars from Aug 2027\)/)
  })

  it('a stay is not cut off at the end of the three years (was: "Saturn in your 10th: 5 Oct 2029 – 9 Nov 2029")', () => {
    expect(sheet('career').join('\n')).not.toMatch(/9 Nov 2029/)
  })
})

describe('Kannada answers stay in Kannada', () => {
  it('English terms copied from the fact sheet are caught', () => {
    const issues = languageIssues('ಗುರು ಮತ್ತು ಶನಿಯ (Double Transit) ಸಮಯದಲ್ಲಿ ಮದುವೆ.', ['Ravi Kumar', 'Honnavar'])
    expect(issues).toHaveLength(1)
    expect(issues[0].claim).toBe('Double Transit')
    expect(issues[0].truth).toContain('ಗುರು–ಶನಿ ದ್ವಿಗೋಚಾರ')
  })

  it('names of people and places, and "AI", are fine', () => {
    expect(languageIssues('Ravi Kumar ಅವರೇ, Honnavar ನಲ್ಲಿ ಜನಿಸಿದ ನಿಮಗೆ AI ಉತ್ತರ.', ['Ravi Kumar', 'Honnavar'])).toEqual([])
  })
})
