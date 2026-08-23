import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDateInput } from '../utils/zodiac'
import { getTimezone } from '../utils/geocode'
import { approxDoshas } from '../utils/matchmaking'
import PlaceSearch from '../components/PlaceSearch'
import LoadingOverlay from '../components/LoadingOverlay'



export default function BirthChart(){
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [tob, setTob] = useState('')
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [loading, setLoading] = useState(false)

  function submit(e){
    e.preventDefault()
    if(!name || !dob || !tob) return alert('Please fill all fields, including time of birth')
    if(!selectedLoc) return alert('Please search and select a place from the suggestions')
    ;(async()=>{
      setLoading(true)
      try{
        const { lat, lon, display_name } = selectedLoc
        const tz = getTimezone(lat, lon)

        const date = formatDateInput(dob, tob, tz)
        if(!date) return alert('Invalid date/time')

        // Call backend ephemeris API
        const payload = { date: dob, time: tob, lat, lon, tz }
        const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
        const res = await fetch(`${API_BASE}/api/chart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const json = await res.json()
        if(json.error) throw new Error(json.error || 'API error')

        // attach doshas — manglik uses real planet positions from backend
        const doshas = approxDoshas({name, dobISO: `${dob}T${tob}`, place: display_name, lat, lon, tz}, json)
        navigate('/birth-chart/result', {
          state: { name, dob, tob, place: display_name, ephem: json, doshas, location: { lat, lon, tz, display_name } }
        })
      }catch(err){
        console.error(err)
        alert('Failed to compute chart: '+err.message)
      }finally{
        setLoading(false)
      }
    })()
  }

  return (
    <>
      <LoadingOverlay visible={loading} />
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Birth Chart</h2>
        <form onSubmit={submit} className="space-y-4 bg-white p-4 rounded shadow">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 block w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Date of Birth</label>
            <input type="date" value={dob} onChange={e=>setDob(e.target.value)} className="mt-1 block w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Time of Birth (local)</label>
            <input type="time" value={tob} onChange={e=>setTob(e.target.value)} className="mt-1 block w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Place of Birth</label>
            <PlaceSearch
              onLocationSelect={setSelectedLoc}
              placeholder="Type any city, town or village…"
            />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              className="px-6 py-2 bg-amber-500 text-white rounded font-semibold shadow hover:bg-amber-600 transition"
              disabled={loading}
            >
              {loading ? 'Computing…' : 'Compute Chart →'}
            </button>

          </div>
        </form>
      </div>
    </>
  )
}
