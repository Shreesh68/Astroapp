// Time zone lookup from coordinates (offline, via tz-lookup).
import tzlookup from 'tz-lookup'

export function getTimezone(lat, lon){
  try{
    return tzlookup(lat, lon)
  }catch(err){
    console.error('tz lookup error', err)
    return null
  }
}
