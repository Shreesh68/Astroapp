import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { fmtLongDate, shiftDate, todayIn } from '../lib/dates'
import { getTimezone } from '../lib/geocode'
import PanchangCard, { loadPanchangPlace, placeName, savePanchangPlace, usePanchang, useToday } from '../components/PanchangCard'
import PlaceSearch from '../components/PlaceSearch'
import { ErrorState } from '../components/LoadingOverlay'

export default function Panchang() {
  const { t, lang } = useLanguage()
  const [place, setPlace] = useState(loadPanchangPlace)
  const [date, setDate] = useState(() => todayIn(place.tz))
  const [editing, setEditing] = useState(false)
  const { data, error, loading, reload } = usePanchang(date, place)
  // "today" moves on at midnight and when the app comes back after a night in the background; a page
  // showing today follows it, a day the person stepped to stays put
  const today = useToday(place.tz)
  const shownToday = useRef(today)
  useEffect(() => {
    if (date === shownToday.current) setDate(today)
    shownToday.current = today
  }, [today]) // eslint-disable-line react-hooks/exhaustive-deps

  function onPlace(loc) {
    if (!loc) return
    const next = { name: loc.name, lat: loc.lat, lon: loc.lon, tz: getTimezone(loc.lat, loc.lon) || 'Asia/Kolkata' }
    setPlace(next)
    savePanchangPlace(next)
    setEditing(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('panchang_title')}</h1>
          <p className="text-ink-500">
            📍 {placeName(place, lang)}{' '}
            <button onClick={() => setEditing(e => !e)} className="text-sm font-semibold text-turmeric-700 hover:underline">{t('panchang_change_place')}</button>
          </p>
        </div>
      </div>

      {editing && <div className="card card-pad animate-rise"><PlaceSearch autoFocus onLocationSelect={onPlace} /></div>}

      <div className="card card-pad">
        <div className="flex items-center justify-between gap-2 mb-5">
          <button onClick={() => setDate(d => shiftDate(d, -1))} className="btn-ghost px-3" aria-label={t('p_prev')}>←</button>
          <div className="text-center">
            <p className="font-semibold">{fmtLongDate(date, lang)}</p>
            {date !== today
              ? <button onClick={() => setDate(today)} className="text-xs font-semibold text-turmeric-700 hover:underline">↺ {t('p_back_today')}</button>
              : <span className="text-xs text-ink-500">{t('p_today')}</span>}
          </div>
          <button onClick={() => setDate(d => shiftDate(d, 1))} className="btn-ghost px-3" aria-label={t('p_next')}>→</button>
        </div>
        {loading && <div className="h-64 rounded-xl bg-cream animate-pulse" />}
        {error && <ErrorState message={error.message} onRetry={reload} />}
        {data && !loading && <div key={date} className="animate-rise"><PanchangCard data={data} /></div>}
      </div>
    </div>
  )
}
