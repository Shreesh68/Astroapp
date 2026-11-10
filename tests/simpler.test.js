import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { chartFor } from '../src/engine'
import { isMuhurtaQuestion, muhurtaFocus } from '../src/engine/analysis'
import { computePanchang } from '../src/engine/panchang'
import { jdFromMillis, siderealLongitude } from '../src/engine/ephemeris'
import { sameBirth } from '../src/lib/profiles'
import { translate } from '../src/lib/i18n'

// Simplifications from the customer walkthroughs (persona, frontend and behaviour reviews)

describe('a good day to begin something: the app chooses the days', () => {
  const mahesh = { name: 'Mahesh', gender: 'male', date: '1986-04-03', time: '07:15', lat: 15.3647, lon: 75.124, tz: 'Asia/Kolkata', time_known: true }
  const chart = chartFor(mahesh)
  const panchang = d => computePanchang(d, 15.3647, 75.124, 'Asia/Kolkata')
  const moonSign = iso => Math.floor(siderealLongitude(jdFromMillis(Date.parse(iso)), 'moon') / 30)
  const lines = muhurtaFocus(mahesh, chart, '2026-11-10', panchang, moonSign, 'Hubballi')
  const days = lines.filter(l => /^\s+\d{1,2} \w{3} \d{4}/.test(l)).map(l => DateTime.fromFormat(l.trim().split(' (')[0], 'd LLL yyyy').toISODate())

  it('recognises the question, in English and Kannada', () => {
    expect(isMuhurtaQuestion('When is a good day to start something new (a shop, a business)?')).toBe(true)
    expect(isMuhurtaQuestion('ಹೊಸ ಅಂಗಡಿ / ವ್ಯವಹಾರ ಆರಂಭಿಸಲು ಒಳ್ಳೆಯ ದಿನ ಯಾವುದು?')).toBe(true)
    expect(isMuhurtaQuestion('when should I open my second shop')).toBe(true)
    expect(isMuhurtaQuestion('Will I get married?')).toBe(false)
    expect(isMuhurtaQuestion('How is my career?')).toBe(false)
  })

  it('lists up to five days in date order, each with the Rahu kala to avoid', () => {
    expect(days.length).toBeGreaterThan(0)
    expect(days.length).toBeLessThanOrEqual(5)
    expect([...days].sort()).toEqual(days)
    expect(lines.filter(l => l.includes('avoid Rahu kala')).length).toBe(days.length)
  })

  it('never a Tuesday, Saturday, Rikta tithi, Amavasya, bad tara or Chandrashtama day', () => {
    const birthNak = chart.planets.moon.nakshatra_index
    for (const d of days) {
      const p = panchang(d)
      expect([2, 6]).not.toContain(p.vara.index)
      expect([3, 8, 13, 18, 23, 28, 29]).not.toContain(p.tithi.index)
      expect([3, 5, 7]).not.toContain((((p.nakshatra.index - birthNak) % 27 + 27) % 27) % 9 + 1)
      expect((moonSign(p.sunrise) - chart.planets.moon.sign_index + 12) % 12 + 1).not.toBe(8)
    }
  })
})

describe('small things customers noticed', () => {
  it('a saved person is recognised on their chart page (links round the place to 4 decimals)', () => {
    const saved = { name: 'Ravi', date: '1990-07-12', time: '08:30', lat: 12.3051828, lon: 76.6551, tz: 'Asia/Kolkata' }
    expect(sameBirth(saved, { ...saved, lat: 12.3052, lon: 76.6551 })).toBe(true)
    expect(sameBirth(saved, { ...saved, lat: '12.3052', lon: '76.6551' })).toBe(true)
    expect(sameBirth(saved, { ...saved, lat: 12.31 })).toBe(false)
  })

  it('a shared match says the verdict, not only the score', () => {
    expect(translate('en', 'share_text_match', { groom: 'Santosh', bride: 'Priya', score: 28, verdict: 'Not traditionally recommended' }))
      .toBe('Kundli match: Santosh & Priya — 28/36 · Not traditionally recommended')
  })
})
