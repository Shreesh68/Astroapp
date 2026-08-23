import { useState, lazy, Suspense } from 'react'
import { getSunSignFromDate, formatDateInput } from '../utils/zodiac'
import { matchProfiles } from '../utils/matchmaking'
import { getTimezone } from '../utils/geocode'
import PlaceSearch from '../components/PlaceSearch'

const SouthIndianChart = lazy(() => import('../components/SouthIndianChart'))

export default function Matchmaking(){
  const [groom, setGroom] = useState({name:'', dob:'', tob:''})
  const [bride, setBride] = useState({name:'', dob:'', tob:''})
  const [groomLoc, setGroomLoc] = useState(null)
  const [brideLoc, setBrideLoc] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  function submit(e){
    e.preventDefault()
    if(!groom.name||!groom.dob||!groom.tob||!bride.name||!bride.dob||!bride.tob) return alert('Please fill all fields including time of birth')
    if(!groomLoc) return alert('Please search and select a place for Groom')
    if(!brideLoc) return alert('Please search and select a place for Bride')
    ;(async()=>{
      setLoading(true)
      try{
        const loc1 = groomLoc
        const loc2 = brideLoc
        const tz1 = getTimezone(loc1.lat, loc1.lon)
        const tz2 = getTimezone(loc2.lat, loc2.lon)

        const date1 = formatDateInput(groom.dob, groom.tob, tz1)
        const date2 = formatDateInput(bride.dob, bride.tob, tz2)
        if(!date1 || !date2) return alert('Invalid date/time')

        // Call backend for both charts
        const p1 = await fetch('http://127.0.0.1:8000/api/chart', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ date: groom.dob, time: groom.tob, lat: loc1?.lat||0, lon: loc1?.lon||0, tz: tz1 }) })
        const p2 = await fetch('http://127.0.0.1:8000/api/chart', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ date: bride.dob, time: bride.tob, lat: loc2?.lat||0, lon: loc2?.lon||0, tz: tz2 }) })
        const j1 = await p1.json()
        const j2 = await p2.json()
        if(j1.error) throw new Error(j1.error)
        if(j2.error) throw new Error(j2.error)

        // Use Moon sign (Janma Rashi) for Vedic matching; fall back to Sun sign from date only if backend is unavailable
        const sign1 = j1.planets?.moon?.sign || j1.planets?.sun?.sign || getSunSignFromDate(date1)
        const sign2 = j2.planets?.moon?.sign || j2.planets?.sun?.sign || getSunSignFromDate(date2)

        const res = matchProfiles(
          {...groom, lat: loc1?.lat, lon: loc1?.lon, tz: tz1},
          {...bride, lat: loc2?.lat, lon: loc2?.lon, tz: tz2},
          sign1, sign2,
          j1, j2
        )

        setResult({...res, sign1, sign2, chart1: j1, chart2: j2, location1: {lat: loc1?.lat, lon: loc1?.lon, tz: tz1, display_name: loc1?.display_name}, location2: {lat: loc2?.lat, lon: loc2?.lon, tz: tz2, display_name: loc2?.display_name}})
      }catch(err){
        console.error(err)
        alert('Failed to compute charts: '+err.message)
      }finally{
        setLoading(false)
      }
    })()
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-2xl font-semibold mb-4">Matchmaking (Bride & Groom)</h2>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Groom</h3>
          <input placeholder="Name" className="w-full border p-2 rounded mb-2" value={groom.name} onChange={e=>setGroom({...groom,name:e.target.value})} required />
          <input type="date" className="w-full border p-2 rounded mb-2" value={groom.dob} onChange={e=>setGroom({...groom,dob:e.target.value})} required />
          <input type="time" className="w-full border p-2 rounded mb-2" value={groom.tob} onChange={e=>setGroom({...groom,tob:e.target.value})} required />
          <PlaceSearch onLocationSelect={setGroomLoc} placeholder="Type city or village…" />
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Bride</h3>
          <input placeholder="Name" className="w-full border p-2 rounded mb-2" value={bride.name} onChange={e=>setBride({...bride,name:e.target.value})} required />
          <input type="date" className="w-full border p-2 rounded mb-2" value={bride.dob} onChange={e=>setBride({...bride,dob:e.target.value})} required />
          <input type="time" className="w-full border p-2 rounded mb-2" value={bride.tob} onChange={e=>setBride({...bride,tob:e.target.value})} required />
          <PlaceSearch onLocationSelect={setBrideLoc} placeholder="Type city or village…" />
        </div>

        <div className="md:col-span-2">
          <button className="px-4 py-2 bg-rose-500 text-white rounded">Check Match</button>
        </div>
      </form>

      {loading && <div className="mt-4">Computing match…</div>}
      {result && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h3 className="text-xl">Match Result</h3>
          <p><strong>Groom Moon Rāśi:</strong> {result.sign1} — <strong>Bride Moon Rāśi:</strong> {result.sign2}</p>
          <p className="mt-2"><strong>Score:</strong> {result.score}%</p>
          <div className="mt-3 grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Groom chart</p>
              {result.chart1 ? (
                <>
                  <div className="text-sm mb-2">
                    <p>Moon: {result.chart1.planets?.moon?.sign} ({result.chart1.planets?.moon?.degree?.toFixed?.(2)})</p>
                    <p>Asc: {result.chart1.ascendant?.sign} ({result.chart1.ascendant?.degree?.toFixed?.(2)})</p>
                    <p>Nakshatra: {result.chart1.moon_nakshatra?.name} — Pada {result.chart1.moon_nakshatra?.pada}</p>
                  </div>
                  <Suspense fallback={<div>Rendering…</div>}>
                    <SouthIndianChart ephem={result.chart1} />
                  </Suspense>
                </>
              ) : null}
            </div>
            <div>
              <p className="font-semibold">Bride chart</p>
              {result.chart2 ? (
                <>
                  <div className="text-sm mb-2">
                    <p>Moon: {result.chart2.planets?.moon?.sign} ({result.chart2.planets?.moon?.degree?.toFixed?.(2)})</p>
                    <p>Asc: {result.chart2.ascendant?.sign} ({result.chart2.ascendant?.degree?.toFixed?.(2)})</p>
                    <p>Nakshatra: {result.chart2.moon_nakshatra?.name} — Pada {result.chart2.moon_nakshatra?.pada}</p>
                  </div>
                  <Suspense fallback={<div>Rendering…</div>}>
                    <SouthIndianChart ephem={result.chart2} />
                  </Suspense>
                </>
              ) : null}
            </div>
          </div>
          {result.reasons.length>0 && (
            <div className="mt-3">
              <p className="font-semibold">Reasons / notes</p>
              <ul className="list-disc ml-6">
                {result.reasons.map((r,i)=>(<li key={i}>{r}</li>))}
              </ul>
            </div>
          )}

          <div className="mt-3">
            <p className="font-semibold">Dosha checks</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <p className="font-medium">Groom</p>
                <ul className="list-disc ml-6">
                  <li>
                    Manglik: <strong>{result.chart1?.manglik === true ? 'Yes' : result.chart1?.manglik === false ? 'No' : result.doshas.groom.manglik ? 'Yes' : 'No'}</strong>
                    {result.chart1?.manglik_mars_house != null && <span className="text-xs text-slate-500 ml-1">(Mars H{result.chart1.manglik_mars_house})</span>}
                  </li>
                  <li>Nadi conflict: {result.doshas.groom.nadiConflict ? 'Yes' : 'No'}</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Bride</p>
                <ul className="list-disc ml-6">
                  <li>
                    Manglik: <strong>{result.chart2?.manglik === true ? 'Yes' : result.chart2?.manglik === false ? 'No' : result.doshas.bride.manglik ? 'Yes' : 'No'}</strong>
                    {result.chart2?.manglik_mars_house != null && <span className="text-xs text-slate-500 ml-1">(Mars H{result.chart2.manglik_mars_house})</span>}
                  </li>
                  <li>Nadi conflict: {result.doshas.bride.nadiConflict ? 'Yes' : 'No'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
