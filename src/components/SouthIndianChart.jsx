import { PLANETS, PLANET_ORDER, rashiName, nakName } from '../lib/astro'

// Fixed rashi positions in the South Indian square (Meena top-left, running clockwise)
const SIGN_CELLS = [
  { sign: 11, row: 1, col: 1 }, { sign: 0, row: 1, col: 2 }, { sign: 1, row: 1, col: 3 }, { sign: 2, row: 1, col: 4 },
  { sign: 3, row: 2, col: 4 }, { sign: 4, row: 3, col: 4 }, { sign: 5, row: 4, col: 4 }, { sign: 6, row: 4, col: 3 },
  { sign: 7, row: 4, col: 2 }, { sign: 8, row: 4, col: 1 }, { sign: 9, row: 3, col: 1 }, { sign: 10, row: 2, col: 1 },
]

/** Planets grouped by rashi index, in traditional order */
export function planetsBySign(planets) {
  const out = {}
  for (const key of PLANET_ORDER) {
    const p = planets?.[key]
    if (!p) continue
    ;(out[p.sign_index] ||= []).push({ key, ...p })
  }
  return out
}

/**
 * Props:
 *   ephem      chart from the backend
 *   lang       'en' | 'kn'
 *   size       'md' | 'lg'
 *   selected   rashi index currently highlighted (optional)
 *   onSelect   (rashiIndex) => void — makes houses clickable
 *   title      centre caption (defaults to "Rashi")
 */
export default function SouthIndianChart({ ephem, lang = 'en', size = 'md', selected = null, onSelect, title }) {
  if (!ephem?.planets) return null
  const ascSign = ephem.ascendant?.sign_index
  const bySign = planetsBySign(ephem.planets)
  const lg = size === 'lg'
  const lagnaLabel = lang === 'kn' ? 'ಲಗ್ನ' : 'Lagna'
  const interactive = typeof onSelect === 'function'
  let order = 0

  return (
    <div className={`w-full mx-auto select-none ${lg ? 'max-w-[480px]' : 'max-w-[340px]'}`}>
      <div className="grid grid-cols-4 grid-rows-4 aspect-square rounded-xl overflow-hidden border-2 border-turmeric-700 bg-cream-100 gap-px">
        {SIGN_CELLS.map(({ sign, row, col }) => {
          const isLagna = sign === ascSign
          const isSel = sign === selected
          const planets = bySign[sign] || []
          const house = ascSign != null ? ((sign - ascSign + 12) % 12) + 1 : null
          const Tag = interactive ? 'button' : 'div'
          const label = `${rashiName(sign, lang)}${house ? `, house ${house}` : ''}: ${planets.map(p => PLANETS[p.key][lang === 'kn' ? 'kn' : 'en']).join(', ') || '—'}`
          return (
            <Tag
              key={sign}
              type={interactive ? 'button' : undefined}
              onClick={interactive ? () => onSelect(sign) : undefined}
              aria-label={interactive ? label : undefined}
              aria-pressed={interactive ? isSel : undefined}
              style={{ gridRow: row, gridColumn: col }}
              className={`relative flex flex-col text-left min-h-0 overflow-hidden transition
                ${lg ? 'p-1.5 sm:p-2' : 'p-1'}
                ${isSel ? 'bg-turmeric/25 ring-2 ring-inset ring-turmeric-600 z-10' : isLagna ? 'bg-cream-100' : 'bg-white'}
                ${interactive ? 'cursor-pointer hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kumkum' : ''}`}
            >
              <span className="flex items-start justify-between gap-1">
                <span className={`leading-tight font-medium text-turmeric-700 ${lg ? 'text-[10px] sm:text-xs' : 'text-[9px]'}`}>{rashiName(sign, lang)}</span>
                {isLagna && <span className={`leading-tight font-bold text-kumkum ${lg ? 'text-[10px] sm:text-xs' : 'text-[9px]'}`}>{lagnaLabel}</span>}
              </span>
              <span className="mt-auto flex flex-wrap gap-x-1.5 gap-y-0.5">
                {planets.map(p => (
                  <span key={p.key}
                    className={`font-bold leading-tight animate-pop ${lg ? 'text-xs sm:text-sm' : 'text-[11px]'} ${p.key === 'rahu' || p.key === 'ketu' ? 'text-ink-500' : 'text-ink'}`}
                    style={{ animationDelay: `${120 + order++ * 70}ms` }}
                    title={`${PLANETS[p.key].en} ${p.degree.toFixed(1)}°${p.retrograde && p.key !== 'rahu' && p.key !== 'ketu' ? ' (R)' : ''}`}>
                    {PLANETS[p.key].short[lang === 'kn' ? 'kn' : 'en']}
                    {p.retrograde && p.key !== 'rahu' && p.key !== 'ketu' && <sup className="text-kumkum font-semibold">ᴿ</sup>}
                  </span>
                ))}
              </span>
            </Tag>
          )
        })}

        <div style={{ gridRow: '2 / 4', gridColumn: '2 / 4' }}
          className="flex flex-col items-center justify-center gap-0.5 text-center bg-gradient-to-br from-cream to-cream-200 p-2">
          <span className={`text-turmeric-700 leading-none ${lg ? 'text-3xl' : 'text-xl'}`} aria-hidden>ॐ</span>
          <span className={`font-display font-semibold text-ink ${lg ? 'text-base' : 'text-xs'}`}>{title ?? (lang === 'kn' ? 'ರಾಶಿ ಕುಂಡಲಿ' : 'Rashi chart')}</span>
          {ephem.moon_nakshatra && (
            <span className={`text-ink-500 ${lg ? 'text-xs' : 'text-[10px]'}`}>
              {nakName(ephem.moon_nakshatra.index, lang)} · {lang === 'kn' ? 'ಪಾದ' : 'Pada'} {ephem.moon_nakshatra.pada}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
