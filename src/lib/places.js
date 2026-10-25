// Place search over OpenStreetMap data, shared by the place picker and the AI astrologer.
// Photon matches partial words as you type; Nominatim is the fallback (e.g. names in Kannada script).
import { getTimezone } from './geocode'

// India, so that results stay inside the country even for names shared with neighbours
const INDIA_BBOX = '68,6,98,37'
// towns and cities first, so "chitrad" offers Chitradurga before a village called Chitrada
const PLACE_RANK = { city: 0, town: 0, state: 1, district: 1, county: 1, suburb: 2, village: 3 }

export async function searchPhoton(q, signal) {
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

export async function searchNominatim(q, signal) {
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

/** The best match for a place name in India: { name, lat, lon, tz, display_name } or null. */
export async function findPlace(query, signal) {
  let places = await searchPhoton(query, signal).catch(() => [])
  if (!places.length) places = await searchNominatim(query, signal).catch(() => [])
  const p = places[0]
  return p ? { name: p.name, lat: p.lat, lon: p.lon, tz: getTimezone(p.lat, p.lon), display_name: p.display_name } : null
}
