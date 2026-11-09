import { beforeEach, describe, expect, it } from 'vitest'
import { chartFor } from '../src/engine'
import { analyseChart, topicFocus } from '../src/engine/analysis'
import { chartSummary } from '../src/lib/astrologer'
import { buildFacts, checkAnswer } from '../src/lib/factcheck'
import { lifeFromText, lifeLine, readLife, saveLife } from '../src/lib/life'

// More personal answers: the person's life situation, learned from taps and from what they type
describe('what a person says about their own life', () => {
  const cases = [
    ['I am still single', { marital: 'single' }],
    ["I'm not married yet, will it happen soon?", { marital: 'single' }],
    ['My wife and I are planning a house', { marital: 'married' }],
    ['I got married in 2019', { marital: 'married' }],
    ['ನನಗೆ ಇನ್ನೂ ಮದುವೆ ಆಗಿಲ್ಲ', { marital: 'single' }],
    ['ನನ್ನ ಹೆಂಡತಿಯ ಆರೋಗ್ಯ ಹೇಗಿದೆ?', { marital: 'married' }],
    ['I am looking for a job since March', { work: 'seeking' }],
    ['I run a small business in Mysuru', { work: 'business' }],
    ['I work as a software engineer', { work: 'job' }],
    ["I'm a student doing engineering", { work: 'student' }],
    ['ನಾನು ವಿದ್ಯಾರ್ಥಿ', { work: 'student' }],
    ['ಕೆಲಸ ಹುಡುಕುತ್ತಿದ್ದೇನೆ', { work: 'seeking' }],
    ['I am married and work as a teacher', { marital: 'married', work: 'job' }],
  ]
  for (const [text, want] of cases) it(text, () => expect(lifeFromText(text)).toEqual(want))

  it('questions about the future say nothing about the present', () => {
    for (const q of ['When will I get married?', 'Will I get a job?', 'ನನಗೆ ಮದುವೆ ಯಾವಾಗ ಆಗುತ್ತದೆ?', 'Is business good for me?', 'Should I study abroad?']) {
      expect(lifeFromText(q)).toEqual({})
    }
  })
})

describe('the life situation is kept and given to the AI', () => {
  const ravi = { name: 'Ravi Kumar', gender: 'male', date: '1990-07-12', time: '08:30', lat: 14.2811, lon: 74.4447, tz: 'Asia/Kolkata', place: 'Honnavar' }
  beforeEach(() => localStorage.clear())

  it('kept per chart; a tap can clear it again', () => {
    expect(readLife(ravi)).toEqual({})
    saveLife(ravi, { marital: 'single' })
    saveLife(ravi, { work: 'job' })
    expect(readLife(ravi)).toEqual({ marital: 'single', work: 'job' })
    saveLife(ravi, { work: null })
    expect(readLife(ravi)).toEqual({ marital: 'single' })
    expect(readLife({ ...ravi, date: '1991-01-01' })).toEqual({})
  })

  it('one plain line for the AI', () => {
    expect(lifeLine({})).toBe('')
    expect(lifeLine({ marital: 'married', work: 'business' })).toMatch(/Life situation .*: married; runs a business/)
  })

  it('the marriage sheet states a known status instead of "not known"', () => {
    const birth = { ...ravi, time_known: true }
    const chart = chartFor(birth)
    expect(topicFocus(birth, chart, '2026-11-09', 'marriage').join('\n')).toContain('Marital status: not known to the app')
    expect(topicFocus({ ...birth, marital: 'single' }, chart, '2026-11-09', 'marriage').join('\n')).toContain('Marital status: single (told by the person)')
    // past windows ("you may already be married around…") only while the status is unknown
    expect(topicFocus(birth, chart, '2026-11-09', 'marriage').join('\n')).toContain('Past periods that activated marriage')
    expect(topicFocus({ ...birth, marital: 'single' }, chart, '2026-11-09', 'marriage').join('\n')).not.toContain('Past periods')
  })

  it('the summary says when the running sub-period began, so the answer can tie into it', () => {
    const birth = { ...ravi, time_known: true }
    expect(chartSummary(birth, chartFor(birth), '2026-11-09')).toMatch(/Saturn mahadasha, Moon antardasha since 2026-01-\d\d until 2027-08-\d\d/)
  })
})

describe('the answer check covers dignity and yogas', () => {
  // Ravi: Karka Lagna; Mars in Mesha (own sign, 10th) → Ruchaka; Venus in Vrishabha (own sign); Saturn in Dhanu
  const ravi = { name: 'Ravi', gender: 'male', date: '1990-07-12', time: '08:30', lat: 14.2811, lon: 74.4447, tz: 'Asia/Kolkata', time_known: true, place: 'Honnavar' }
  const chart = chartFor(ravi)
  const facts = buildFacts(ravi, chart, [chartSummary(ravi, chart, '2026-11-09'), analyseChart(ravi, chart, '2026-11-09').join('\n')])
  const kinds = text => checkAnswer(text, facts).map(i => i.kind)

  it('true dignity claims pass', () => {
    expect(kinds('Your Venus is strong in its own sign in the 11th house. Mars, in its own sign Mesha, gives drive.')).toEqual([])
    expect(kinds('ಶುಕ್ರನು ಸ್ವಕ್ಷೇತ್ರದಲ್ಲಿ ಬಲವಾಗಿದ್ದಾನೆ.')).toEqual([])
  })

  it('false dignity claims are caught', () => {
    expect(kinds('Saturn is exalted in your chart, giving discipline.')).toEqual(['dignity'])
    expect(kinds('Your debilitated Mars holds you back.')).toEqual(['dignity'])
    expect(kinds('ಶನಿ ಉಚ್ಚನಾಗಿದ್ದಾನೆ.')).toEqual(['dignity'])
  })

  it('a transit in another sign is not a birth-chart claim', () => {
    expect(kinds('Saturn transits Tula, its exaltation sign, in 2041.'.replace('2041', 'June 2027'))).not.toContain('dignity')
  })

  it('yogas: only those the analysis found; denials are fine', () => {
    expect(kinds('Your Mars in the 10th forms Ruchaka Yoga.')).toEqual([])
    expect(kinds('This gives you a powerful Gajakesari yoga.').includes('yoga')).toBe(!/gajakesari/i.test(facts.yogas))
    expect(kinds('There is no Hamsa yoga in your chart.')).toEqual([])
    expect(kinds('You have Hamsa yoga, a sign of wisdom.')).toEqual(['yoga'])
    expect(kinds('ನಿಮ್ಮ ಜಾತಕದಲ್ಲಿ ಹಂಸ ಯೋಗ ಇದೆ.')).toEqual(['yoga'])
  })
})
