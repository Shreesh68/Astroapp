import { useState, useRef, useEffect, useId } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

/**
 * PlaceSearch — place autocomplete over OpenStreetMap data. No API key required.
 * Photon matches partial words as you type ("chitrad" → Chitradurga) and covers towns and
 * villages across India; Nominatim is the fallback for what Photon can't match, such as names
 * typed in Kannada script.
 *
 * Props:
 *   value — currently selected { lat, lon, name, display_name } or null
 *   onLocationSelect(loc | null)
 *   autoFocus
 */
export default function PlaceSearch({ value = null, onLocationSelect, autoFocus = false }) {
  const { t } = useLanguage()
  const [query, setQuery] = useState(value?.name || '')
  const [suggestions, setSuggestions] = useState([])
  const [fetching, setFetching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)
  const wrapperRef = useRef(null)
  const listId = useId()
  const selected = value

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => { document.removeEventListener('mousedown', handleClick); clearTimeout(debounceRef.current) }
  }, [])

  function handleInput(e) {
    const q = e.target.value
    setQuery(q)
    if (selected) onLocationSelect(null)
    setSearched(false)
    setActive(-1)
    clearTimeout(debounceRef.current)
    if (q.trim().length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(() => fetchSuggestions(q.trim()), 300)
  }

  async function fetchSuggestions(q) {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setFetching(true)
    try {
      let places = await searchPhoton(q, ctrl.signal).catch(err => {
        if (err.name === 'AbortError') throw err
        return []
      })
      if (places.length === 0) places = await searchNominatim(q, ctrl.signal)
      setSuggestions(places)
      setSearched(true)
      setOpen(true)
    } catch (err) {
      if (err.name !== 'AbortError') console.error('PlaceSearch error', err)
    } finally {
      if (abortRef.current === ctrl) setFetching(false)
    }
  }

  function selectItem(item) {
    setQuery(item.name)
    setSuggestions([])
    setOpen(false)
    onLocationSelect({ lat: item.lat, lon: item.lon, name: item.name, display_name: item.display_name })
  }

  function clear() {
    setQuery('')
    setSuggestions([])
    setSearched(false)
    onLocationSelect(null)
  }

  function onKeyDown(e) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % suggestions.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => (a <= 0 ? suggestions.length - 1 : a - 1)) }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); e.stopPropagation(); selectItem(suggestions[active]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  const d = 0.08
  const mapBbox = selected ? `${selected.lon - d},${selected.lat - d},${selected.lon + d},${selected.lat + d}` : null

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={t('place_ph')}
          className="input pr-24"
          autoComplete="off"
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {fetching && <span className="text-xs text-ink-300 animate-pulse">{t('place_searching')}</span>}
          {(selected || query) && !fetching && (
            <button type="button" onClick={clear} className="text-ink-300 hover:text-kumkum text-xl leading-none" aria-label={t('place_clear')}>×</button>
          )}
        </div>
      </div>

      {open && searched && (
        <ul id={listId} role="listbox" className="absolute z-50 w-full bg-white border border-cream-200 rounded-xl shadow-lg max-h-64 overflow-auto mt-1 animate-rise">
          {suggestions.length === 0 && <li className="px-4 py-3 text-sm text-ink-500">{t('place_none')}</li>}
          {suggestions.map((item, i) => {
            const parts = item.display_name.split(', ')
            return (
              <li
                key={item.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={`px-4 py-2.5 cursor-pointer border-b border-cream-100 last:border-0 ${i === active ? 'bg-cream-100' : 'hover:bg-cream'}`}
                onMouseDown={() => selectItem(item)}
                onMouseEnter={() => setActive(i)}
              >
                <span className="text-sm font-medium text-ink">{parts[0]}</span>
                <span className="block text-xs text-ink-500 truncate">{parts.slice(1, 4).join(', ')}</span>
              </li>
            )
          })}
        </ul>
      )}

      {selected && (
        <div className="mt-3 rounded-xl border border-cream-200 overflow-hidden bg-cream animate-rise">
          <div className="px-4 py-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-700 leading-snug">{selected.display_name}</p>
              <p className="text-xs text-ink-500 mt-0.5">{selected.lat.toFixed(4)}°, {selected.lon.toFixed(4)}°</p>
            </div>
            <span className="text-leaf text-base shrink-0" aria-hidden>✓</span>
          </div>
          <iframe
            title="location-map"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBbox}&layer=mapnik&marker=${selected.lat},${selected.lon}`}
            className="w-full block"
            style={{ height: 150, border: 0 }}
          />
        </div>
      )}
    </div>
  )
}

// India, so that results stay inside the country even for names shared with neighbours
const INDIA_BBOX = '68,6,98,37'
// towns and cities first, so "chitrad" offers Chitradurga before a village called Chitrada
const PLACE_RANK = { city: 0, town: 0, state: 1, district: 1, county: 1, suburb: 2, village: 3 }

async function searchPhoton(q, signal) {
  const url = `https://photon.komoot.io/api/?${new URLSearchParams({
    q, limit: '15', bbox: INDIA_BBOX, osm_tag: 'place', lang: 'en',
  })}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Photon ${res.status}`)
  const data = await res.json()
  return (data.features || [])
    .filter(f => f.properties?.countrycode === 'IN' && f.properties.name)
    .map(f => {
      const p = f.properties
      const [lon, lat] = f.geometry.coordinates
      const area = [p.city, p.county, p.district, p.state].filter(x => x && x !== p.name)
      return {
        id: `${p.osm_type}${p.osm_id}`,
        name: p.name,
        lat, lon,
        display_name: [p.name, ...new Set(area), 'India'].join(', '),
        rank: PLACE_RANK[p.osm_value] ?? 4,
      }
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 8)
}

async function searchNominatim(q, signal) {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q, format: 'json', limit: '6', countrycodes: 'in',
  })}`
  const res = await fetch(url, { signal })
  if (!res.ok) return []
  const data = await res.json()
  return (Array.isArray(data) ? data : []).map(item => ({
    id: item.place_id,
    name: item.name || item.display_name.split(',')[0],
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    display_name: item.display_name,
  }))
}
