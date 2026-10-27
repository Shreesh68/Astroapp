import { describe, expect, it } from 'vitest'
import { chartFor } from '../src/engine'
import { topicFocus } from '../src/engine/analysis'
import { chartSummary } from '../src/lib/astrologer'
import { buildFacts, checkAnswer, monthsIn } from '../src/lib/factcheck'

// Pooja: Tula Lagna, 10th lord Moon in the 11th, Mars in the 2nd, Saturn in the 8th (natal)
const pooja = { name: 'Pooja', gender: 'female', date: '2001-08-20', time: '11:55', lat: 14.4271622, lon: 74.4117058, tz: 'Asia/Kolkata', time_known: true, place: 'Kumta' }
const chart = chartFor(pooja)
const TODAY = '2026-10-27'
const context = [chartSummary(pooja, chart, TODAY), topicFocus(pooja, chart, TODAY, 'career').join('\n')]
const facts = buildFacts(pooja, chart, context)
const kinds = text => checkAnswer(text, facts).map(i => i.kind)

describe('a correct answer passes', () => {
  it('English', () => {
    expect(checkAnswer(
      'Pooja, your 10th lord, the Moon, sits in your 11th house in Simha. Mars is in your 2nd house in its own sign. ' +
      'Saturn is transiting your 6th house now. From May 2027 to November 2027, in your Moon–Sun period, career rises.', facts)).toEqual([])
  })

  it('Kannada', () => {
    expect(checkAnswer('ನಿಮ್ಮ 10ನೇ ಮನೆಯ ಅಧಿಪತಿ ಚಂದ್ರನು 11ನೇ ಮನೆಯಲ್ಲಿ ಕುಳಿತಿದ್ದಾನೆ. ಮೇ 2027 ರಿಂದ ನವೆಂಬರ್ 2027 ರವರೆಗೆ ಉತ್ತಮ ಸಮಯ.', facts)).toEqual([])
  })

  it('houses counted from the Moon are not checked against the Lagna', () => {
    expect(checkAnswer('Saturn is in the 8th house from your Moon (Ashtama Shani).', facts)).toEqual([])
    expect(checkAnswer('ಶನಿಯು ಚಂದ್ರನಿಂದ 8ನೇ ಮನೆಯಲ್ಲಿದ್ದಾನೆ.', facts)).toEqual([])
  })
})

describe('wrong claims are caught', () => {
  it('a wrong lordship (English and Kannada)', () => {
    expect(kinds('Your 10th lord, the Sun, is strong.')).toEqual(['lordship'])
    expect(kinds('The lord of your 7th house, Venus, is well placed.')).toEqual(['lordship']) // 7th lord is Mars
    expect(kinds('ನಿಮ್ಮ 8ನೇ ಮನೆಯ ಅಧಿಪತಿ ಚಂದ್ರ.')).toEqual(['lordship']) // 8th lord is Venus
  })

  it('a planet put in a house it is not in, natally or by transit', () => {
    expect(kinds('Mars sits in your 9th house.')).toEqual(['placement'])
    expect(kinds('ಕುಜನು 5ನೇ ಮನೆಯಲ್ಲಿ ಇದ್ದಾನೆ.')).toEqual(['placement'])
  })

  it('a date nowhere near the calculated periods', () => {
    expect(kinds('A big change comes in March 2041.')).toEqual(['date'])
    expect(kinds('ಮಾರ್ಚ್ 2041 ರಲ್ಲಿ ಬದಲಾವಣೆ.')).toEqual(['date'])
  })
})

describe('date parsing', () => {
  it('reads the common forms', () => {
    const idx = (y, m) => y * 12 + m
    expect(monthsIn('2027-06-03')).toContain(idx(2027, 5))
    expect(monthsIn('June 2027')).toContain(idx(2027, 5))
    expect(monthsIn('Jun 3, 2027')).toContain(idx(2027, 5))
    expect(monthsIn('ಜೂನ್ 2027')).toContain(idx(2027, 5))
    expect(monthsIn('2027ರ ಜೂನ್')).toContain(idx(2027, 5))
  })
})

describe('fixes found by the AI evaluation', () => {
  it('a house claim never jumps across another planet (false alarm on a correct answer)', () => {
    // Pooja: Mars is her 2nd & 7th lord; Jupiter sits in her 9th. The "9th house" belongs to Jupiter here, not Mars.
    expect(checkAnswer('Mars is your 7th lord and Jupiter is well-placed in your 9th house.', facts)).toEqual([])
  })

  it('Kannada house numbers written in words or Kannada digits are checked too', () => {
    expect(checkAnswer('ನಿಮ್ಮ ಹತ್ತನೇ ಮನೆಯ ಅಧಿಪತಿ ಚಂದ್ರನು ಹನ್ನೊಂದನೇ ಮನೆಯಲ್ಲಿ ಇದ್ದಾನೆ.', facts)).toEqual([])
    expect(kinds('ನಿಮ್ಮ ಹತ್ತನೇ ಮನೆಯ ಅಧಿಪತಿ ಶುಕ್ರ.')).toEqual(['lordship'])
    expect(kinds('ಕುಜನು ೯ನೇ ಮನೆಯಲ್ಲಿ ಇದ್ದಾನೆ.')).toEqual(['placement'])
  })
})
