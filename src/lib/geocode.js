// geocode.js — lightweight geocoding + timezone lookup
// Uses Nominatim for free geocoding (openstreetmap) and tz-lookup for IANA time zone mapping.

import tzlookup from 'tz-lookup'

export async function geocodePlace(place){
  if(!place) return null
  const q = encodeURIComponent(place + ' Karnataka India')
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&addressdetails=1&countrycodes=in`
  try{
    const res = await fetch(url, { headers: { 'User-Agent': 'KarnatakaMatch/1.0 (mailto:example@example.com)' } })
    const data = await res.json()
    if(!data || data.length===0) return null
    const item = data[0]
    return {
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      display_name: item.display_name
    }
  }catch(err){
    console.error('Geocode error', err)
    return null
  }
}

export function getTimezone(lat, lon){
  try{
    return tzlookup(lat, lon)
  }catch(err){
    console.error('tz lookup error', err)
    return null
  }
}
