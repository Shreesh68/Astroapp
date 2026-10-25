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
