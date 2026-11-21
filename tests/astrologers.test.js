import { describe, expect, it } from 'vitest'
import { ASTROLOGERS, DEFAULT_ASTROLOGER, astrologerById, personaPrompt } from '../src/lib/astrologers'
import { chatKey } from '../src/lib/chats'

// Choosing an astrologer: personas from 6 to 40 years of practice; the voice changes, the facts don't

describe('the astrologers', () => {
  it('range from a few years of practice to forty, each with a name in both languages and a specialty', () => {
    const years = ASTROLOGERS.map(a => a.years)
    expect(Math.min(...years)).toBeLessThanOrEqual(8)
    expect(Math.max(...years)).toBeGreaterThanOrEqual(35)
    for (const a of ASTROLOGERS) {
      expect(a.name.en && a.name.kn && a.focus.en && a.focus.kn && a.about.en && a.about.kn).toBeTruthy()
      expect(/[ಀ-೿]/.test(a.name.kn)).toBe(true)
    }
    expect(new Set(ASTROLOGERS.map(a => a.id)).size).toBe(ASTROLOGERS.length)
  })

  it('an unknown or missing id falls back to the default astrologer (a phone cannot invent one)', () => {
    expect(astrologerById('nobody').id).toBe(DEFAULT_ASTROLOGER)
    expect(astrologerById(undefined).id).toBe(DEFAULT_ASTROLOGER)
  })

  it('the voice follows the years: plain and modern for the junior, classical and calm for the senior', () => {
    const junior = personaPrompt(astrologerById('kavya'))
    const senior = personaPrompt(astrologerById('mahadev'))
    expect(junior).toMatch(/6 years of practice/)
    expect(junior).toMatch(/Explain every Sanskrit term/)
    expect(senior).toMatch(/40 years of practice/)
    expect(senior).toMatch(/Brihat Parashara Hora Shastra/)
  })

  it('every persona stays honest and keeps the app\'s facts', () => {
    for (const a of ASTROLOGERS) {
      const p = personaPrompt(a)
      expect(p).toMatch(/never claim to be human/)
      expect(p).toMatch(/Every fact, house, period and date still comes from the app/)
    }
  })
})

describe('one conversation per chart and astrologer', () => {
  const ravi = { date: '1990-07-12', time: '08:30', lat: 14.2811, lon: 74.4447 }
  it('chats from before astrologers could be chosen stay with the default astrologer', () => {
    expect(chatKey(ravi)).toBe('km_chat_1990-07-12_08:30_14.2811_74.4447')
    expect(chatKey(ravi, DEFAULT_ASTROLOGER)).toBe(chatKey(ravi))
  })
  it('each other astrologer has a conversation of its own', () => {
    expect(chatKey(ravi, 'venkatesh')).toBe('km_chat_1990-07-12_08:30_14.2811_74.4447_venkatesh')
    expect(chatKey(ravi, 'venkatesh')).not.toBe(chatKey(ravi, 'kavya'))
  })
})
