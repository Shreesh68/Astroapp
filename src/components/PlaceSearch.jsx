import { useState, useRef, useEffect } from 'react'

/**
 * PlaceSearch — interactive place autocomplete using Nominatim (OpenStreetMap).
 * No API key required.
 *
 * Props:
 *   onLocationSelect(loc | null) — called with { lat, lon, display_name, tz? } on selection
 *   placeholder — input placeholder text
 */
export default function PlaceSearch({ onLocationSelect, placeholder = 'Type city or village name…' }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [fetching, setFetching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInput(e) {
    const q = e.target.value
    setQuery(q)
    setSelected(null)
    onLocationSelect(null)
    setSuggestions([])

    clearTimeout(debounceRef.current)
    if (q.trim().length < 3) return
    debounceRef.current = setTimeout(() => fetchSuggestions(q.trim()), 420)
  }

  async function fetchSuggestions(q) {
    setFetching(true)
    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(q)}` +
        `&format=json&limit=6&addressdetails=1&countrycodes=in`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'KarnatakaMatch/1.0 (contact@example.com)' },
      })
      const data = await res.json()
      setSuggestions(Array.isArray(data) ? data : [])
      setOpen(true)
    } catch (err) {
      console.error('PlaceSearch error', err)
    }
    setFetching(false)
  }

  function selectItem(item) {
    const lat = parseFloat(item.lat)
    const lon = parseFloat(item.lon)
    const display_name = item.display_name
    const shortName = item.name || display_name.split(',')[0]

    setQuery(shortName)
    const loc = { lat, lon, display_name }
    setSelected(loc)
    setSuggestions([])
    setOpen(false)
    onLocationSelect(loc)
  }

  function clear() {
    setQuery('')
    setSelected(null)
    setSuggestions([])
    onLocationSelect(null)
  }

  const mapBbox = selected
    ? `${selected.lon - 0.08},${selected.lat - 0.08},${selected.lon + 0.08},${selected.lat + 0.08}`
    : null

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input row */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="mt-1 block w-full border p-2 rounded pr-16"
          autoComplete="off"
          required
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {fetching && (
            <span className="text-xs text-slate-400 animate-pulse">searching…</span>
          )}
          {selected && (
            <button
              type="button"
              onClick={clear}
              className="text-slate-400 hover:text-red-500 text-lg leading-none"
              title="Clear"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded shadow-lg max-h-52 overflow-auto mt-1">
          {suggestions.map((item, i) => {
            const parts = item.display_name.split(', ')
            const main = parts[0]
            const sub = parts.slice(1, 4).join(', ')
            return (
              <li
                key={i}
                className="px-3 py-2 cursor-pointer hover:bg-amber-50 border-b border-slate-100 last:border-0"
                onMouseDown={() => selectItem(item)}
              >
                <span className="text-sm font-medium text-slate-800">{main}</span>
                {sub && <span className="text-xs text-slate-500 ml-1">{sub}</span>}
              </li>
            )
          })}
        </ul>
      )}

      {/* Selected location card with map */}
      {selected && (
        <div className="mt-2 rounded border border-slate-200 overflow-hidden bg-slate-50">
          <div className="px-3 py-2 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-700 leading-snug">{selected.display_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Lat: <strong>{selected.lat.toFixed(5)}</strong> &nbsp; Lon: <strong>{selected.lon.toFixed(5)}</strong>
              </p>
            </div>
            <span className="text-green-600 text-base mt-0.5 shrink-0">✓</span>
          </div>
          {/* OpenStreetMap embed — no API key needed */}
          <iframe
            title="location-map"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBbox}&layer=mapnik&marker=${selected.lat},${selected.lon}`}
            className="w-full"
            style={{ height: '160px', border: 0 }}
          />
          <p className="text-center text-xs text-slate-400 py-1">
            <a
              href={`https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lon}#map=13/${selected.lat}/${selected.lon}`}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-slate-600"
            >
              Open in OpenStreetMap
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
