import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SouthIndianChart from '../components/SouthIndianChart'

// ── Translations ────────────────────────────────────────────
const T = {
  en: {
    title:        'Birth Chart',
    back:         '← Back',
    name:         'Name',
    dob:          'Date of Birth',
    tob:          'Time of Birth',
    place:        'Place',
    lat:          'Lat',
    lon:          'Lon',
    tz:           'Time Zone',
    chartTitle:   'South Indian Birth Chart',
    planets:      'Planet Positions',
    planet:       'Planet',
    rashi:        'Rāśi',
    degree:       'Degree',
    nakshatra:    'Nakshatra',
    pada:         'Pada',
    lagna:        'Lagna (Ascendant)',
    moonRashi:    'Moon Rāśi (Janma)',
    moonNak:      'Moon Nakshatra',
    doshas:       'Dosha Summary',
    manglik:      'Manglik',
    marsHouse:    'Mars in house',
    nadi:         'Nadi conflict',
    yes:          'Yes',
    no:           'No',
    approx:       'approx',
    note:         'Calculated using Swiss Ephemeris · Lahiri Ayanamsa',
    langBtn:      'ಕನ್ನಡ',
  },
  kn: {
    title:        'ಜನ್ಮ ಕುಂಡಲಿ',
    back:         '← ಹಿಂದೆ',
    name:         'ಹೆಸರು',
    dob:          'ಜನ್ಮ ದಿನಾಂಕ',
    tob:          'ಜನ್ಮ ಸಮಯ',
    place:        'ಸ್ಥಳ',
    lat:          'ಅಕ್ಷಾಂಶ',
    lon:          'ರೇಖಾಂಶ',
    tz:           'ಸಮಯ ವಲಯ',
    chartTitle:   'ದಕ್ಷಿಣ ಭಾರತ ಜನ್ಮ ಕುಂಡಲಿ',
    planets:      'ಗ್ರಹ ಸ್ಥಾನಗಳು',
    planet:       'ಗ್ರಹ',
    rashi:        'ರಾಶಿ',
    degree:       'ಅಂಶ',
    nakshatra:    'ನಕ್ಷತ್ರ',
    pada:         'ಪಾದ',
    lagna:        'ಲಗ್ನ',
    moonRashi:    'ಚಂದ್ರ ರಾಶಿ (ಜನ್ಮ)',
    moonNak:      'ಜನ್ಮ ನಕ್ಷತ್ರ',
    doshas:       'ದೋಷ ವಿವರ',
    manglik:      'ಮಾಂಗಲಿಕ',
    marsHouse:    'ಮಂಗಳ ಭಾವ',
    nadi:         'ನಾಡಿ ದೋಷ',
    yes:          'ಹೌದು',
    no:           'ಇಲ್ಲ',
    approx:       'ಅಂದಾಜು',
    note:         'ಸ್ವಿಸ್ ಎಫೆಮೆರಿಸ್ · ಲಹಿರಿ ಅಯನಾಂಶ ಬಳಸಿ ಲೆಕ್ಕ ಹಾಕಲಾಗಿದೆ',
    langBtn:      'English',
  },
}

const PLANET_NAMES_EN = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
  mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', rahu: 'Rahu', ketu: 'Ketu',
}
const PLANET_NAMES_KN = {
  sun: 'ರವಿ (ಸೂರ್ಯ)', moon: 'ಚಂದ್ರ', mercury: 'ಬುಧ', venus: 'ಶುಕ್ರ',
  mars: 'ಮಂಗಳ (ಕುಜ)', jupiter: 'ಗುರು (ಬೃಹಸ್ಪತಿ)', saturn: 'ಶನಿ',
  rahu: 'ರಾಹು', ketu: 'ಕೇತು',
}
const RASHI_KN = {
  Mesha: 'ಮೇಷ', Vrishabha: 'ವೃಷಭ', Mithuna: 'ಮಿಥುನ', Karka: 'ಕರ್ಕ',
  Simha: 'ಸಿಂಹ', Kanya: 'ಕನ್ಯಾ', Tula: 'ತುಲಾ', Vrischika: 'ವೃಶ್ಚಿಕ',
  Dhanu: 'ಧನು', Makara: 'ಮಕರ', Kumbha: 'ಕುಂಭ', Meena: 'ಮೀನ',
}

const RASHI_LIST = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena']

function rashiLabel(sign, lang) {
  return lang === 'kn' ? (RASHI_KN[sign] || sign) : sign
}

function formatDOB(iso) {
  if (!iso) return iso
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function ChartResultPage() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const [lang, setLang] = useState('kn')

  if (!state || !state.ephem) {
    return (
      <div className="text-center mt-20">
        <p className="text-slate-500 mb-4">No chart data found.</p>
        <button onClick={() => navigate('/birth-chart')} className="px-4 py-2 bg-amber-500 text-white rounded">
          ← Go back
        </button>
      </div>
    )
  }

  const { name, dob, tob, place, ephem, doshas, location } = state
  const t  = T[lang]

  // Build ketu
  const planets = { ...ephem.planets }
  const rahuLon = planets?.rahu?.lon
  if (rahuLon != null) {
    const ketuLon = (rahuLon + 180) % 360
    planets.ketu = { lon: ketuLon, sign: RASHI_LIST[Math.floor(ketuLon / 30) % 12], degree: ketuLon % 30 }
  }
  const ephem2 = { ...ephem, planets }

  const manglikVal = ephem.manglik === true ? t.yes : ephem.manglik === false ? t.no : (doshas?.manglik ? t.yes : t.no)

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 40px' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 0', marginBottom: '8px',
      }}>
        <button
          onClick={() => navigate('/birth-chart')}
          style={{ background: 'none', border: 'none', color: '#92400e', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
        >
          {t.back}
        </button>
        <button
          onClick={() => setLang(l => l === 'en' ? 'kn' : 'en')}
          style={{
            padding: '5px 14px', borderRadius: 20, border: '1.5px solid #d97706',
            background: '#fffbeb', color: '#92400e', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          {t.langBtn}
        </button>
      </div>

      {/* Header card */}
      <div style={{
        background: 'linear-gradient(135deg,#92400e,#d97706)',
        borderRadius: 12, padding: '20px 24px', color: '#fff', marginBottom: 20,
      }}>
        <p style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>{t.title}</p>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>{name}</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 13 }}>
          <span><b>{t.dob}:</b> {formatDOB(dob)}</span>
          <span><b>{t.tob}:</b> {tob}</span>
          <span style={{ gridColumn: '1 / 3' }}><b>{t.place}:</b> {place}</span>
          <span><b>{t.lat}:</b> {location?.lat?.toFixed(4)}</span>
          <span><b>{t.lon}:</b> {location?.lon?.toFixed(4)}</span>
          <span style={{ gridColumn: '1 / 3' }}><b>{t.tz}:</b> {location?.tz}</span>
        </div>
      </div>

      {/* Key facts */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 10, marginBottom: 20,
      }}>
        {[
          { label: t.lagna,    value: rashiLabel(ephem.ascendant?.sign, lang), sub: `${ephem.ascendant?.degree?.toFixed(1)}°` },
          { label: t.moonRashi, value: rashiLabel(ephem.planets?.moon?.sign, lang), sub: `${ephem.planets?.moon?.degree?.toFixed(1)}°` },
          { label: t.moonNak,  value: ephem.moon_nakshatra?.name, sub: `${t.pada} ${ephem.moon_nakshatra?.pada}` },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{
            background: '#fff', border: '1.5px solid #fde68a',
            borderRadius: 10, padding: '12px 10px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 10, color: '#92400e', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase' }}>{label}</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>{value}</p>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* South Indian Chart */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '16px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#92400e', margin: '0 0 14px', textAlign: 'center' }}>
          {t.chartTitle}
        </h2>
        <SouthIndianChart ephem={ephem2} lang={lang} size="lg" />
      </div>

      {/* Planet table */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#92400e', margin: '0 0 12px' }}>{t.planets}</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fffbeb' }}>
              <th style={thStyle}>{t.planet}</th>
              <th style={thStyle}>{t.rashi}</th>
              <th style={thStyle}>{t.degree}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(planets).map(([p, d], i) => (
              <tr key={p} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={tdStyle}>
                  {lang === 'kn' ? (PLANET_NAMES_KN[p] || p) : (PLANET_NAMES_EN[p] || p)}
                </td>
                <td style={tdStyle}>{rashiLabel(d?.sign, lang)}</td>
                <td style={{ ...tdStyle, color: '#64748b' }}>{d?.degree?.toFixed(2)}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dosha summary */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#92400e', margin: '0 0 12px' }}>{t.doshas}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={doshaRow}>
            <span style={{ fontWeight: 600 }}>{t.manglik}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                padding: '2px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13,
                background: ephem.manglik ? '#fee2e2' : '#dcfce7',
                color: ephem.manglik ? '#b91c1c' : '#15803d',
              }}>
                {manglikVal}
              </span>
              {ephem.manglik_mars_house != null && (
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  ({t.marsHouse} {ephem.manglik_mars_house})
                </span>
              )}
            </span>
          </div>
          <div style={doshaRow}>
            <span style={{ fontWeight: 600 }}>{t.nadi} <span style={{ fontSize: 11, color: '#94a3b8' }}>({t.approx})</span></span>
            <span style={{
              padding: '2px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13,
              background: doshas?.nadiConflict ? '#fee2e2' : '#dcfce7',
              color: doshas?.nadiConflict ? '#b91c1c' : '#15803d',
            }}>
              {doshas?.nadiConflict ? t.yes : t.no}
            </span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>{t.note}</p>
    </div>
  )
}

const thStyle = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#92400e', borderBottom: '2px solid #fde68a' }
const tdStyle = { padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }
const doshaRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }
