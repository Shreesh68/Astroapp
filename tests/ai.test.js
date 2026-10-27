import { describe, expect, it } from 'vitest'
import { chartFor } from '../src/engine'
import { analyseChart, topicFocus, topicOf } from '../src/engine/analysis'
import { fixedReply } from '../worker/src/index.js'

const ravi = { name: 'Ravi', gender: 'male', date: '1995-03-05', time: '19:45', lat: 14.2810827, lon: 74.4446716, tz: 'Asia/Kolkata', time_known: true }
const pooja = { name: 'Pooja', gender: 'female', date: '2001-08-20', time: '11:55', lat: 14.4271622, lon: 74.4117058, tz: 'Asia/Kolkata', time_known: true }
const TODAY = '2026-10-24'

describe('topic of a question (English and Kannada)', () => {
  it.each([
    ['When will I get married?', 'marriage'],
    ['ನನ್ನ ಮದುವೆ ಯಾವಾಗ?', 'marriage'],
    ['How will my career be?', 'career'],
    ['ನನ್ನ ಉದ್ಯೋಗ ಹೇಗಿರುತ್ತದೆ?', 'career'],
    ['Will I go abroad for studies?', 'education'],
    ['Will I settle in Canada?', 'foreign_travel'],
    ['Any money gains this year?', 'money'],
    ['ಮನೆ ಕಟ್ಟುವ ಯೋಗ ಇದೆಯೇ?', 'home_property'],
    ['Hi, how are you?', null],
  ])('%s → %s', (q, topic) => expect(topicOf(q)).toBe(topic))
})

describe('chart analysis given to the model', () => {
  const text = analyseChart(pooja, chartFor(pooja), TODAY).join('\n')

  it('finds the yogas actually present', () => {
    expect(text).toMatch(/Yogakaraka — Saturn rules both kendra and trikona houses \(4 & 5\)/)
    expect(text).toMatch(/Budhaditya yoga/)
    expect(text).toMatch(/Raja yoga — Mercury \(lord of 9&12\) and Moon \(lord of 10\) join in house 11/)
  })

  it('names the career house and its lord', () => {
    expect(text).toMatch(/career: house 10 Karka; lord Moon in house 11/)
  })
})

describe('focus sheet for one question', () => {
  const lines = topicFocus(ravi, chartFor(ravi), TODAY, 'marriage').join('\n')

  it('names the 7th house and its lord', () => {
    expect(lines).toMatch(/Main house: 7, Meena\. Its lord Jupiter sits in house 3/)
  })

  it('lists Saturn in the 7th and the double-transit window Jan–Jun 2027', () => {
    expect(lines).toMatch(/Saturn in your 7th house \(Meena\): Oct 2026 – Jun 2027/)
    expect(lines).toMatch(/Double transit[\s\S]*Jan 2027 – Jun 2027/)
  })

  it('uses proper ordinals', () => {
    expect(lines).not.toMatch(/\b1th\b|\b2th\b|\b3th\b/)
  })
})

describe('server guard: death and self-harm never reach the model', () => {
  // the app sends the chart data and the question together; only the question may trigger the guard
  const ask = q => fixedReply([{ role: 'user', content: `Birth chart:\nSaturn in house 8 (longevity)\n\nQuestion: ${q}` }])

  it.each([
    'When will I die?', 'How long will my father live?', 'What is my lifespan?', 'When will my grandmother pass away?',
    'ನನ್ನ ಆಯುಷ್ಯ ಎಷ್ಟು?', 'ನನ್ನ ಸಾವು ಯಾವಾಗ?', 'nanna maranam yavaga',
  ])('refuses: %s', q => expect(ask(q)).toBe('death'))

  it.each(['I want to die', 'I am thinking of suicide', 'ನನಗೆ ಬದುಕು ಬೇಡ ಅನಿಸುತ್ತಿದೆ'])('helpline: %s', q => expect(ask(q)).toBe('self_harm'))

  it.each([
    'Any diet tips for my health?', 'My friend Ayush asked about his career', 'How is my health this year?', 'When will I get married?',
  ])('answers normally: %s', q => expect(ask(q)).toBeNull())

  it('checks only the newest question, not earlier turns', () => {
    expect(fixedReply([
      { role: 'user', content: 'Question: when will I die' }, { role: 'assistant', content: 'I don’t predict that…' },
      { role: 'user', content: 'ok, then tell me about my career' },
    ])).toBeNull()
  })
})

describe('reply language (the bug where English chats answered in Kannada)', async () => {
  const { withReplyLanguage } = await import('../worker/src/index.js')
  const convo = [
    { role: 'user', content: 'ನನ್ನ ದಶೆ ಏನು?' }, { role: 'assistant', content: 'ಚಂದ್ರ ಮಹಾದಶೆ…' }, { role: 'user', content: 'ನನ್ನ ಆರೋಗ್ಯ?' },
  ]

  it('attaches the instruction to the newest question only', () => {
    const out = withReplyLanguage(convo, 'en')
    expect(out.at(-1).content).toMatch(/Reply language: English/)
    expect(out[0].content).toBe(convo[0].content)
    expect(out[1].content).toBe(convo[1].content)
  })

  it('works the other way round too', () => {
    expect(withReplyLanguage([{ role: 'user', content: 'What about my health?' }], 'kn')[0].content).toMatch(/Reply language: Kannada/)
  })

  it('does not change the original conversation', () => {
    withReplyLanguage(convo, 'en')
    expect(convo.at(-1).content).toBe('ನನ್ನ ಆರೋಗ್ಯ?')
  })
})

describe('marriage questions from people who may already be married', () => {
  const at = date => ({ ...ravi, name: 'X', date })
  const focus = (p, today) => topicFocus(p, chartFor(p), today, 'marriage').join('\n')

  it('gives the age and the windows that have already passed', () => {
    const lines = focus(at('1985-08-19'), '2026-10-27')
    expect(lines).toMatch(/Age today: 41\. Marital status: not known to the app\./)
    expect(lines).toMatch(/Past periods that activated marriage/)
    expect(lines).toMatch(/Past double-transit windows/)
  })

  it('says it is too early for someone under 18', () => {
    const lines = focus(at('2011-05-10'), '2026-10-27')
    expect(lines).toMatch(/Age today: 15/)
    expect(lines).toMatch(/Under 18: too early/)
    expect(lines).not.toMatch(/Past periods/)
  })

  it('other topics carry no age or past windows', () => {
    expect(topicFocus(ravi, chartFor(ravi), TODAY, 'career').join('\n')).not.toMatch(/Age today|Past periods/)
  })
})

describe('fact sheets never fail, for any chart (the suggested-question bug)', async () => {
  const { dashaFocus } = await import('../src/engine/analysis')
  it('dasha sheet in a Ketu mahadasha (Rahu and Ketu have no natural friendships)', () => {
    const shreesh = { name: 'Shreesh', gender: 'male', date: '2000-08-19', time: '01:10', lat: 14.4271622, lon: 74.4117058, tz: 'Asia/Kolkata', time_known: true }
    const lines = dashaFocus(shreesh, chartFor(shreesh), '2026-10-27').join('\n')
    expect(lines).toMatch(/Ketu mahadasha/)
    expect(lines).toMatch(/Ketu acts through its sign lord/)
  })

  it('every sheet works for 300 birth dates across 1930–2025 (all dasha lords, both birth-time cases)', () => {
    const topics = ['career', 'marriage', 'money', 'health', 'education', 'children', 'home_property', 'foreign_travel', 'spirituality']
    for (let i = 0; i < 300; i++) {
      const d = new Date(Date.UTC(1930, 0, 1) + i * 116 * 864e5).toISOString().slice(0, 10)
      const b = { name: 'T', gender: i % 2 ? 'male' : 'female', date: d, time: `${String(i % 24).padStart(2, '0')}:15`, lat: 12 + (i % 7), lon: 75 + (i % 5), tz: 'Asia/Kolkata', time_known: i % 5 !== 0 }
      const c = chartFor(b)
      expect(() => dashaFocus(b, c, TODAY)).not.toThrow()
      for (const t of topics) expect(() => topicFocus(b, c, TODAY, t)).not.toThrow()
      expect(() => analyseChart(b, c, TODAY)).not.toThrow()
    }
  }, 120000)
})
