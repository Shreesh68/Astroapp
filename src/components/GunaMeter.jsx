import { useEffect, useState } from 'react'

const TONE = { good: '#2F7D4F', warn: '#C78A12', bad: '#9E1B32' }

/** Semicircular gauge that counts up to `score` out of `max`. Bands mark 18 and 25 gunas. */
export default function GunaMeter({ score, max = 36, tone = 'good', label }) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setShown(score); return }
    let raf
    const t0 = performance.now()
    const dur = 1200
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur)
      const eased = 1 - Math.pow(1 - k, 3)
      setShown(score * eased)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score])

  const r = 80
  const cx = 100
  const cy = 100
  const arc = Math.PI * r
  const frac = shown / max
  const angle = Math.PI * (1 - frac)
  const knob = [cx + r * Math.cos(angle), cy - r * Math.sin(angle)]
  const tick = g => {
    const a = Math.PI * (1 - g / max)
    return { x1: cx + (r - 14) * Math.cos(a), y1: cy - (r - 14) * Math.sin(a), x2: cx + (r + 14) * Math.cos(a), y2: cy - (r + 14) * Math.sin(a) }
  }
  const display = Number.isInteger(score) ? Math.round(shown) : (Math.round(shown * 2) / 2).toFixed(1)

  return (
    <div className="relative mx-auto w-full max-w-[280px]" role="img" aria-label={`${score} / ${max}`}>
      <svg viewBox="0 0 200 116" className="w-full overflow-visible">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#F5E3C3" strokeWidth="16" strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={TONE[tone]} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={arc} strokeDashoffset={arc * (1 - frac)} />
        {[18, 25].map(g => <line key={g} {...tick(g)} stroke="#fff" strokeWidth="2" />)}
        <circle cx={knob[0]} cy={knob[1]} r="9" fill="#fff" stroke={TONE[tone]} strokeWidth="4" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <span className="font-display text-5xl font-bold tabular-nums" style={{ color: TONE[tone] }}>{display}</span>
        <span className="text-ink-500 text-lg"> / {max}</span>
        {label && <p className="text-xs text-ink-500 mt-0.5">{label}</p>}
      </div>
    </div>
  )
}
