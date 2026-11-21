import { describe, expect, it } from 'vitest'
import { messageParts } from '../src/components/ChatText'

// An answer is sent as a few short messages, one per paragraph, like a person texting

const ANSWER = `Ravi, the best time for a new job is July to November 2027 — a strong period.

That's when your Saturn–Mars period runs, and Mars rules your 10th house of career from its own sign.

Other good windows:
- Mar 2028 – Sep 2028 (strong)
- Jan 2029 – Mar 2029 (moderate)

Until then, build skills and keep your options open. Are you hoping to stay in the same field?`

describe('an answer as separate messages', () => {
  it('one message per paragraph; a lead-in stays with its list', () => {
    const parts = messageParts(ANSWER)
    expect(parts).toHaveLength(4)
    expect(parts[0]).toMatch(/^Ravi, the best time/)
    expect(parts[2]).toMatch(/^Other good windows:\n- Mar 2028/)
    expect(parts[3]).toMatch(/same field\?$/)
  })

  it('a very short paragraph goes with the next one ("Ravi," is not a message on its own)', () => {
    expect(messageParts('Ravi,\n\nyour chart shows a strong career period from July 2027 onwards.')).toEqual(['Ravi,\n\nyour chart shows a strong career period from July 2027 onwards.'])
  })

  it('at most six messages', () => {
    const long = Array.from({ length: 10 }, (_, i) => `Paragraph ${i + 1} has enough words in it to be a message of its own.`).join('\n\n')
    expect(messageParts(long)).toHaveLength(6)
  })

  it('while the answer is still coming, only finished paragraphs are sent', () => {
    expect(messageParts('Ravi, the best time for a new job is July 2027 — a strong period.\n\nThat is when your Satu', { complete: false }))
      .toEqual(['Ravi, the best time for a new job is July 2027 — a strong period.'])
    expect(messageParts('Ravi, the best time for a new job is July 2027 — a strong period.', { complete: false })).toEqual([])
  })

  it('a short last paragraph joins the message before it, rather than being a message on its own', () => {
    expect(messageParts('Answer here, long enough to be one message on its own.\n\nWhy — in your chart\n* Mars in the 10th'))
      .toEqual(['Answer here, long enough to be one message on its own.\n\nWhy — in your chart\n* Mars in the 10th'])
  })
})
