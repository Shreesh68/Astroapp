import { Fragment } from 'react'

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/

/** Just enough Markdown for the astrologer's answers: paragraphs, lists, headings and **bold**. */
export function Answer({ text }) {
  if (!text) return null
  return (
    <div className="space-y-2 leading-relaxed">
      {text.split(/\n{2,}/).map((block, i) => {
        const lines = block.split('\n').filter(l => l.trim())
        if (lines.length && lines.every(l => BULLET.test(l))) {
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
