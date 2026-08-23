import React from 'react'

const SIGN_CELLS = [
  { rashi: 'Meena',     row: 1, col: 1 },
  { rashi: 'Mesha',     row: 1, col: 2 },
  { rashi: 'Vrishabha', row: 1, col: 3 },
  { rashi: 'Mithuna',   row: 1, col: 4 },
  { rashi: 'Karka',     row: 2, col: 4 },
  { rashi: 'Simha',     row: 3, col: 4 },
  { rashi: 'Kanya',     row: 4, col: 4 },
  { rashi: 'Tula',      row: 4, col: 3 },
  { rashi: 'Vrischika', row: 4, col: 2 },
  { rashi: 'Dhanu',     row: 4, col: 1 },
  { rashi: 'Makara',    row: 3, col: 1 },
  { rashi: 'Kumbha',    row: 2, col: 1 },
]

const RASHI_KN = {
  Mesha: 'ಮೇಷ', Vrishabha: 'ವೃಷಭ', Mithuna: 'ಮಿಥುನ', Karka: 'ಕರ್ಕ',
  Simha: 'ಸಿಂಹ', Kanya: 'ಕನ್ಯಾ', Tula: 'ತುಲಾ', Vrischika: 'ವೃಶ್ಚಿಕ',
  Dhanu: 'ಧನು', Makara: 'ಮಕರ', Kumbha: 'ಕುಂಭ', Meena: 'ಮೀನ',
}

const PLANET_SHORT_EN = {
  sun: 'Su', moon: 'Mo', mercury: 'Me', venus: 'Ve',
  mars: 'Ma', jupiter: 'Ju', saturn: 'Sa', rahu: 'Ra', ketu: 'Ke',
}
const PLANET_SHORT_KN = {
  sun: 'ರವಿ', moon: 'ಚಂ', mercury: 'ಬು', venus: 'ಶು',
  mars: 'ಮಂ', jupiter: 'ಗು', saturn: 'ಶನಿ', rahu: 'ರಾ', ketu: 'ಕೇ',
}

const RASHI_LIST = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena']

export default function SouthIndianChart({ ephem, lang = 'en', size = 'md' }) {
  if (!ephem || !ephem.planets) return null

  const ascSign = ephem.ascendant?.sign
  const planetShort = lang === 'kn' ? PLANET_SHORT_KN : PLANET_SHORT_EN

  const signPlanets = {}
  const planetsWithKetu = { ...ephem.planets }

  const rahuLon = ephem.planets?.rahu?.lon
  if (rahuLon != null) {
    const ketuLon = (rahuLon + 180) % 360
    planetsWithKetu.ketu = { lon: ketuLon, sign: RASHI_LIST[Math.floor(ketuLon / 30) % 12], degree: ketuLon % 30 }
  }

  for (const [planet, data] of Object.entries(planetsWithKetu)) {
    const sign = data?.sign
    if (!sign) continue
    if (!signPlanets[sign]) signPlanets[sign] = []
    signPlanets[sign].push({ abbr: planetShort[planet] || planet.slice(0, 2), key: planet })
  }

  const isLarge = size === 'lg'
  const signFontSize   = isLarge ? '12px' : '9px'
  const planetFontSize = isLarge ? '14px' : '11px'

  const rashiLabel = (r) => lang === 'kn' ? (RASHI_KN[r] || r) : r
  const lagnaLabel = lang === 'kn' ? 'ಲಗ್ನ' : 'Lagna'

  return (
    <div style={{ width: '100%', maxWidth: isLarge ? '480px' : '360px', margin: '0 auto', userSelect: 'none' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          border: '2px solid #92400e',
          borderRadius: '6px',
          aspectRatio: '1',
          background: '#fffbeb',
          overflow: 'hidden',
        }}
      >
        {SIGN_CELLS.map(({ rashi, row, col }) => {
          const isLagna = rashi === ascSign
          const planets = signPlanets[rashi] || []
          return (
            <div
              key={rashi}
              style={{
                gridColumn: col, gridRow: row,
                border: '1px solid #d97706',
                padding: isLarge ? '6px' : '3px',
                background: isLagna ? '#fef3c7' : '#fff',
                display: 'flex', flexDirection: 'column',
                minHeight: 0, overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: signFontSize, color: '#92400e', lineHeight: 1.2, fontWeight: 500 }}>
                  {rashiLabel(rashi)}
                </span>
                {isLagna && (
                  <span style={{ fontSize: signFontSize, fontWeight: 800, color: '#b45309', lineHeight: 1.2 }}>
                    {lagnaLabel}
                  </span>
                )}
              </div>
              <div style={{ marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                {planets.map(({ abbr, key }) => (
                  <span key={key} style={{
                    fontSize: planetFontSize, fontWeight: 700, lineHeight: 1.3,
                    color: key === 'rahu' || key === 'ketu' ? '#7c3aed' : '#1d4ed8',
                  }}>{abbr}</span>
                ))}
              </div>
            </div>
          )
        })}

        {/* Centre 2×2 */}
        <div style={{
          gridColumn: '2 / 4', gridRow: '2 / 4',
          border: '1px solid #d97706',
          background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '3px', padding: '4px',
        }}>
          <span style={{ fontSize: '22px', color: '#92400e', lineHeight: 1 }}>ॐ</span>
          <span style={{ fontSize: isLarge ? '13px' : '11px', fontWeight: 700, color: '#92400e', textAlign: 'center' }}>
            {rashiLabel(ascSign)}
          </span>
          <span style={{ fontSize: signFontSize, color: '#b45309', fontWeight: 600 }}>{lagnaLabel}</span>
          {ephem.moon_nakshatra?.name && (
            <span style={{ fontSize: signFontSize, color: '#64748b', textAlign: 'center', marginTop: '2px' }}>
              {ephem.moon_nakshatra.name}{ephem.moon_nakshatra.pada ? ` P${ephem.moon_nakshatra.pada}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
