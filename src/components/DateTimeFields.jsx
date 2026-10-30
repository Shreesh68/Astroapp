import { useRef, useState } from 'react'
import { DateTime } from 'luxon'
import { useLanguage } from '../contexts/LanguageContext'

/*
 * Typed date and time entry. Native <input type="date|time"> opens a calendar/clock picker on
 * Android instead of the keyboard, which is slow for birth dates decades back. These boxes
 * bring up the numeric keyboard and move to the next box automatically.
 */

function Segment({ inputRef, label, value, onChange, maxLength, placeholder, onBackEmpty, onBlur, disabled, autoFocus }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-xs font-medium text-ink-500">{label}</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        enterKeyHint="next"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, maxLength))}
        onKeyDown={e => { if (e.key === 'Backspace' && !value) onBackEmpty?.() }}
        onFocus={e => e.target.select()}
        onBlur={onBlur}
        className="input text-center text-xl tabular-nums px-2 disabled:bg-cream disabled:text-ink-300"
      />
    </label>
  )
}

const pad = v => (v.length === 1 ? `0${v}` : v)
const focus = ref => ref.current?.focus()

/** value / onChange use 'YYYY-MM-DD'; onChange('') while the date is incomplete or impossible. */
export function DateFields({ value, onChange, autoFocus }) {
  const { t } = useLanguage()
  const [y0, m0, d0] = (value || '').split('-')
  const [parts, setParts] = useState({ d: d0 || '', m: m0 || '', y: y0 || '' })
  // latest parts: blur handlers fire mid-keystroke (auto-advance) before React re-renders
  const latest = useRef(parts)
  const dRef = useRef(null)
  const mRef = useRef(null)
  const yRef = useRef(null)

  function update(patch) {
    const next = { ...latest.current, ...patch }
    latest.current = next
    setParts(next)
    const dt = next.y.length === 4 && next.m && next.d
      ? DateTime.fromObject({ year: +next.y, month: +next.m, day: +next.d })
      : null
    onChange(dt?.isValid ? dt.toISODate() : '')
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)] gap-3 max-w-sm">
      <Segment inputRef={dRef} label={t('f_day')} placeholder="DD" maxLength={2} value={parts.d} autoFocus={autoFocus}
        onBlur={() => latest.current.d.length === 1 && update({ d: pad(latest.current.d) })}
        onChange={v => {
          // a first digit above 3 can only be a single-digit day
          if (v.length === 1 && +v > 3) v = pad(v)
          update({ d: v })
          if (v.length === 2) focus(mRef)
        }} />
      <Segment inputRef={mRef} label={t('f_month')} placeholder="MM" maxLength={2} value={parts.m}
        onBackEmpty={() => focus(dRef)}
        onBlur={() => latest.current.m.length === 1 && update({ m: pad(latest.current.m) })}
        onChange={v => {
          if (v.length === 1 && +v > 1) v = pad(v)
          update({ m: v })
          if (v.length === 2) focus(yRef)
        }} />
      <Segment inputRef={yRef} label={t('f_year')} placeholder="YYYY" maxLength={4} value={parts.y}
        onBackEmpty={() => focus(mRef)}
        onChange={v => update({ y: v })} />
    </div>
  )
}

function parseTime(value) {
  const [h, m] = (value || '').split(':')
  if (h == null || m == null) return { h: '', m: '', p: null }
  const hh = +h
  return { h: String(hh % 12 || 12), m, p: hh < 12 ? 'AM' : 'PM' }
}

/** value / onChange use 24-hour 'HH:MM'; onChange('') until hour, minute and AM/PM are all given. */
export function TimeFields({ value, onChange, disabled, autoFocus }) {
  const { t } = useLanguage()
  const [parts, setParts] = useState(() => parseTime(value))
  const latest = useRef(parts)
  const hRef = useRef(null)
  const mRef = useRef(null)

  function update(patch) {
    const next = { ...latest.current, ...patch }
    latest.current = next
    setParts(next)
    const h = +next.h
    const m = +next.m
    const ok = next.h && next.m && next.p && h >= 1 && h <= 12 && m >= 0 && m <= 59
    const h24 = (h % 12) + (next.p === 'PM' ? 12 : 0)
    onChange(ok ? `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}` : '')
  }

  return (
    // one row on every phone: the hour and minute boxes give up width first, AM/PM never wraps or stacks
    <div className="flex items-end gap-1 sm:gap-3">
      <div className="min-w-[3.25rem] max-w-[5rem] flex-1 basis-0">
        <Segment inputRef={hRef} label={t('f_hour')} placeholder="HH" maxLength={2} value={parts.h}
          disabled={disabled} autoFocus={autoFocus}
          onChange={v => {
            const n = +v
            // accept 24-hour typing: 13–23 → PM, 00 → 12 AM
            if (v.length === 2 && n >= 13 && n <= 23) { update({ h: String(n - 12), p: 'PM' }); focus(mRef); return }
            if (v.length === 2 && n === 0) { update({ h: '12', p: 'AM' }); focus(mRef); return }
            update({ h: v })
            if (v.length === 2 || (v.length === 1 && n > 1)) focus(mRef)
          }} />
      </div>
      <span className="shrink-0 pb-3 text-2xl font-semibold text-ink-300" aria-hidden>:</span>
      <div className="min-w-[3.25rem] max-w-[5rem] flex-1 basis-0">
        <Segment inputRef={mRef} label={t('f_minute')} placeholder="MM" maxLength={2} value={parts.m}
          disabled={disabled}
          onBackEmpty={() => focus(hRef)}
          onBlur={() => latest.current.m.length === 1 && update({ m: pad(latest.current.m) })}
          onChange={v => update({ m: v })} />
      </div>
      <div role="group" aria-label={`${t('f_am')} / ${t('f_pm')}`} className="flex shrink-0 flex-nowrap rounded-xl border border-cream-200 bg-white p-1 gap-1 h-[52px]">
        {['AM', 'PM'].map(p => (
          <button key={p} type="button" disabled={disabled} aria-pressed={parts.p === p}
            onClick={() => update({ p })}
            className={`whitespace-nowrap rounded-lg px-2 sm:px-3 text-sm font-semibold transition disabled:opacity-40
              ${parts.p === p ? 'bg-ink text-cream' : 'text-ink-500 hover:bg-cream'}`}>
            {/* "AM"/"PM", as Android's own Kannada clock writes them; screen readers get the full words */}
            <span aria-hidden>{p}</span><span className="sr-only">{t(p === 'AM' ? 'f_am' : 'f_pm')}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
