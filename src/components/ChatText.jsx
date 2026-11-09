import { Fragment, useState } from 'react'

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/

/** Just enough Markdown for the astrologer's answers: paragraphs, lists, headings and **bold**. */
export function Answer({ text }) {
  if (!text) return null
  // a block can mix plain lines and list items ("Why — in your chart" straight above its bullets),
  // so each block is cut into runs of one kind
  const runs = []
  for (const block of text.split(/\n{2,}/)) {
    let run = null
    for (const line of block.split('\n').filter(l => l.trim())) {
      const list = BULLET.test(line)
      if (!run || run.list !== list) runs.push(run = { list, lines: [] })
      run.lines.push(line)
    }
  }
  return (
    <div className="space-y-2 leading-relaxed">
      {runs.map(({ list, lines }, i) => {
        if (list) {
          const ordered = /^\s*\d/.test(lines[0])
          const List = ordered ? 'ol' : 'ul'
          return (
            <List key={i} className={`${ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-1`}>
              {lines.map((l, j) => <li key={j}><Inline text={l.replace(BULLET, '')} /></li>)}
            </List>
          )
        }
        return (
          <p key={i}>
            {lines.map((l, j) => {
              const heading = /^#{1,6}\s+/.test(l)
              const content = <Inline text={l.replace(/^#{1,6}\s+/, '')} />
              return <Fragment key={j}>{j > 0 && <br />}{heading ? <strong>{content}</strong> : content}</Fragment>
            })}
          </p>
        )
      })}
    </div>
  )
}

function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

// The section headings the astrologer is told to use (worker/src/index.js, LANG_NOTE)
const HEADINGS = ['why — in your chart', 'when', 'suggestion', 'ಏಕೆ — ನಿಮ್ಮ ಜಾತಕದಲ್ಲಿ', 'ಯಾವಾಗ', 'ಸಲಹೆ']
// what each section's link says to the person
const LINK_LABEL = {
  'why — in your chart': 'Why? The reasons in your chart', when: 'All the dates', suggestion: 'What you can do',
  'ಏಕೆ — ನಿಮ್ಮ ಜಾತಕದಲ್ಲಿ': 'ಏಕೆ? ನಿಮ್ಮ ಜಾತಕದ ಕಾರಣಗಳು', 'ಯಾವಾಗ': 'ಎಲ್ಲಾ ದಿನಾಂಕಗಳು', 'ಸಲಹೆ': 'ಏನು ಮಾಡಬಹುದು',
}
const asHeading = line => {
  const bare = line.trim().replace(/^#{1,6}\s*/, '').replace(/^\*\*(.*)\*\*$/, '$1').replace(/:$/, '').replace(/\s+[-–]\s+/, ' — ').trim()
  return HEADINGS.includes(bare.toLowerCase()) ? bare : null
}

/** An answer cut at its section headings: the opening, then [{ title, body }]. */
export function splitAnswer(text = '') {
  const lines = text.split('\n')
  const sections = []
  const head = []
  for (const line of lines) {
    const title = asHeading(line)
    if (title) sections.push({ title, body: [] })
    else (sections.at(-1)?.body ?? head).push(line)
  }
  return { head: head.join('\n').trim(), sections: sections.map(x => ({ title: x.title, body: x.body.join('\n').trim() })).filter(x => x.body) }
}

/**
 * An astrologer's answer as a customer reads it: the specific answer first, and the reasons, all the
 * dates and the suggestion as links that open in place. While it is still being written, only the
 * opening shows, with a note that the details are coming.
 */
export function AnswerWithDetails({ text, writing = false, detailsLabel }) {
  const { head, sections } = splitAnswer(text)
  const [open, setOpen] = useState(() => new Set())
  if (!sections.length) return <Answer text={text} />
  const toggle = i => setOpen(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next })
  return (
    <div className="space-y-2">
      <Answer text={head} />
      {writing
        ? <p className="text-sm text-ink-500 animate-pulse">{detailsLabel}</p>
        : (
          <div className="divide-y divide-cream-100 rounded-lg bg-cream/60">
            {sections.map((x, i) => (
              <div key={i}>
                <button type="button" onClick={() => toggle(i)} aria-expanded={open.has(i)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-turmeric-700">
                  <span>{LINK_LABEL[x.title.toLowerCase()] || x.title}</span><span aria-hidden className={`transition ${open.has(i) ? 'rotate-90' : ''}`}>›</span>
                </button>
                {open.has(i) && <div className="px-3 pb-3 text-[15px]"><Answer text={x.body} /></div>}
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
