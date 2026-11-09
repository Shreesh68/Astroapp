import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { chartFor } from '../src/engine'
import { topicFocus } from '../src/engine/analysis'
import { AnswerWithDetails, splitAnswer } from '../src/components/ChatText'

// The answer first, the reasons behind links; and the app (not the model) ranks the windows
const EN = `Ravi, your strongest time for marriage is Aug 2028 – Aug 2029 (strong), in your Saturn–Rahu period.

**Why — in your chart**
* Saturn, your 7th lord, runs the mahadasha.

### When
* Aug 2028 – Aug 2029 (strong)

Suggestion:
Visit a Shiva temple on Mondays.`

describe('an answer is shown as the answer, with its sections as links', () => {
  it('splits at the headings however the model marks them up', () => {
    const { head, sections } = splitAnswer(EN)
    expect(head).toMatch(/^Ravi, your strongest time/)
    expect(sections.map(s => s.title)).toEqual(['Why — in your chart', 'When', 'Suggestion'])
    expect(sections[2].body).toBe('Visit a Shiva temple on Mondays.')
  })

  it('Kannada headings too', () => {
    const { sections } = splitAnswer('ಉತ್ತರ.\n\nಏಕೆ — ನಿಮ್ಮ ಜಾತಕದಲ್ಲಿ\n* ಕಾರಣ\n\nಯಾವಾಗ\n* ೨೦೨೮\n\nಸಲಹೆ\nದಾನ')
    expect(sections.map(s => s.title)).toEqual(['ಏಕೆ — ನಿಮ್ಮ ಜಾತಕದಲ್ಲಿ', 'ಯಾವಾಗ', 'ಸಲಹೆ'])
  })

  it('shows the opening and closed links; while writing, only the opening', () => {
    const done = renderToStaticMarkup(<AnswerWithDetails text={EN} />)
    expect(done).toContain('strongest time for marriage')
    expect(done).toContain('aria-expanded="false"')
    expect(done).not.toContain('Shiva temple') // behind its link until tapped
    const writing = renderToStaticMarkup(<AnswerWithDetails text={EN} writing detailsLabel="Writing the reasons…" />)
    expect(writing).toContain('Writing the reasons…')
    expect(writing).not.toContain('aria-expanded')
  })

  it('an answer without headings (a refusal, a short reply) is shown whole', () => {
    expect(renderToStaticMarkup(<AnswerWithDetails text="I don't predict death." />)).toContain("predict death")
  })
})

describe('the app ranks the best windows itself', () => {
  const ravi = { name: 'Ravi', gender: 'male', date: '1990-07-12', time: '08:30', lat: 14.2811, lon: 74.4447, tz: 'Asia/Kolkata', time_known: true }
  const chart = chartFor(ravi)
  const best = topic => {
    const lines = topicFocus(ravi, chart, '2026-11-09', topic)
    return lines.slice(lines.findIndex(l => l.startsWith('BEST WINDOWS')))
  }

  it('career: the Saturn–Mars period with Jupiter and Saturn on the 10th comes first, marked strong', () => {
    const [heading, first] = best('career')
    expect(heading).toMatch(/lead your answer with #1/)
    expect(first).toMatch(/^ {2}1\. Jul 2027 – Nov 2027 \(strong\): Saturn–Mars period .*double transit/)
  })

  it('a brief overlap is not called a double transit (Feb–Jun 2027 for marriage)', () => {
    const second = best('marriage').find(l => l.includes('Feb 2027'))
    expect(second).toMatch(/Saturn on it from Jun 2027/)
    expect(second).not.toMatch(/double transit/)
  })

  it('when nothing stands out it says so, rather than stretching a weak period', () => {
    expect(best('money')[0]).toMatch(/none stand out/)
  })
})
