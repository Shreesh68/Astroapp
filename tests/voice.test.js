import { beforeEach, describe, expect, it } from 'vitest'
import { astrologerById } from '../src/lib/astrologers'
import { isChartRequest, say, voiceOf } from '../src/lib/astroVoice'
import { chatKey, loadChat, showChart } from '../src/lib/chats'

// The chat speaks in the chosen astrologer's voice; the kundli appears only when asked for

describe('each astrologer asks in their own voice', () => {
  const kavya = astrologerById('kavya'), raghavendra = astrologerById('raghavendra')
  it('three voices by years of practice', () => {
    expect([6, 12, 18, 25, 32, 40].map(voiceOf)).toEqual(['young', 'seasoned', 'seasoned', 'elder', 'elder', 'elder'])
  })
  it('the same question, worded by each', () => {
    expect(say(kavya, 'en', 'ask_name')).toMatch(/what’s the name/)
    expect(say(raghavendra, 'en', 'ask_name')).toMatch(/What is the name of the person/)
    expect(say(raghavendra, 'en', 'ask_date', { name: 'Ravi' })).toBe('On which date was Ravi born?')
    expect(say(raghavendra, 'kn', 'ask_date', { name: 'ರವಿ' })).toBe('ರವಿ ಯಾವ ದಿನಾಂಕದಂದು ಜನಿಸಿದರು?')
  })
  it('the greeting gives the astrologer\'s own name, in the right language', () => {
    expect(say(raghavendra, 'en', 'hello')).toMatch(/^Namaskara 🙏 I am Acharya Raghavendra Rao\./)
    expect(say(raghavendra, 'kn', 'hello')).toMatch(/ನಾನು ಆಚಾರ್ಯ ರಾಘವೇಂದ್ರ ರಾವ್/)
  })
  it('no line sounds like a form ("Type their name", "Whose chart shall I draw")', () => {
    for (const a of ['kavya', 'suma', 'raghavendra']) for (const lang of ['en', 'kn']) {
      expect(say(astrologerById(a), lang, 'ask_name')).not.toMatch(/Type their name|Whose chart shall I draw/)
    }
  })
})

describe('the kundli only when asked for', () => {
  it('recognises a request to see it, in English and Kannada', () => {
    for (const q of ['Show me the kundli', 'show my chart', 'Can you send me my horoscope?', 'my chart', 'ಜಾತಕ ತೋರಿಸಿ', 'ನನ್ನ ಕುಂಡಲಿ ನೋಡಬೇಕು']) expect(isChartRequest(q)).toBe(true)
  })
  it('a question about the chart goes to the astrologer instead', () => {
    for (const q of ['What does my chart say about career?', 'Can you see in my chart when I will marry?', 'ನನ್ನ ಜಾತಕದಲ್ಲಿ ಮದುವೆ ಯಾವಾಗ ಎಂದು ನೋಡಬೇಕು', 'How is my health?']) expect(isChartRequest(q)).toBe(false)
  })

  const ravi = { name: 'Ravi', date: '1990-07-12', time: '08:30', lat: 14.2811, lon: 74.4447, tz: 'Asia/Kolkata' }
  beforeEach(() => localStorage.clear())
  it('the request and the kundli card are kept in the chat, answered without the AI', () => {
    showChart(ravi, 'Show me the kundli', 'raghavendra')
    const chat = loadChat(chatKey(ravi, 'raghavendra'))
    expect(chat.map(m => [m.role, m.kind || null])).toEqual([['user', null], ['assistant', 'chart']])
  })
})
