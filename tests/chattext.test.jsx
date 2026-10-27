import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Answer } from '../src/components/ChatText'

const html = text => renderToStaticMarkup(<Answer text={text} />)

describe('AI answer formatting', () => {
  it('a heading straight above "*" bullets becomes a heading and a real list (no stray asterisks)', () => {
    const out = html('**Why — in your chart**\n* **Strong:** Jupiter in the 10th.\n* Moon with it.')
    expect(out).toContain('<strong>Why — in your chart</strong>')
    expect(out).toMatch(/<ul[^>]*><li><strong>Strong:<\/strong> Jupiter in the 10th\.<\/li><li>Moon with it\.<\/li><\/ul>/)
    expect(out).not.toContain('* ')
  })

  it('numbered lists and plain paragraphs still work', () => {
    expect(html('1. One\n2. Two')).toMatch(/<ol[^>]*><li>One<\/li><li>Two<\/li><\/ol>/)
    expect(html('Line one\nline two\n\nNext')).toBe('<div class="space-y-2 leading-relaxed"><p>Line one<br/>line two</p><p>Next</p></div>')
  })
})
