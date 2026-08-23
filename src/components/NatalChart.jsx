import React from 'react'

function shortName(planet){
  return planet.slice(0,3).toUpperCase()
}

export default function NatalChart({ ephem, width = 420 }){
  if(!ephem || !ephem.planets) return null

  const planets = ephem.planets
  const asc = ephem.ascendant && ephem.ascendant.lon ? ephem.ascendant.lon : 0
  const size = width
  const cx = size/2
  const cy = size/2
  const r = size*0.38

  const signs = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena']

  function lonToXY(lon, radius){
    // Convert ecliptic lon (degrees) to SVG coords.
    // Use 0° at right (east) and increase counter-clockwise.
    const theta = (lon) * Math.PI / 180.0
    const x = cx + radius * Math.cos(theta)
    const y = cy - radius * Math.sin(theta)
    return [x,y]
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <defs>
        <style>{`.chart-label{font:12px Poppins, sans-serif; fill:#0f172a}`}</style>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#e2e8f0" />
      {/* draw sign divisions */}
      {signs.map((s,i)=>{
        const angle = (i*30) * Math.PI / 180.0
        const x1 = cx + r * Math.cos(angle)
        const y1 = cy - r * Math.sin(angle)
        const x2 = cx + (r*0.9) * Math.cos(angle)
        const y2 = cy - (r*0.9) * Math.sin(angle)
        const tx = cx + (r*1.05) * Math.cos(angle + 15 * Math.PI/180)
        const ty = cy - (r*1.05) * Math.sin(angle + 15 * Math.PI/180)
        return (
          <g key={s}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e6e6e6" />
            <text x={tx} y={ty} textAnchor="middle" className="chart-label">{s}</text>
          </g>
        )
      })}

      {/* plot planets */}
      {Object.keys(planets).map((p,i)=>{
        const node = planets[p]
        const lon = node && node.lon ? node.lon : null
        if(lon==null) return null
        const [x,y] = lonToXY(lon, r*0.7)
        return (
          <g key={p}>
            <circle cx={x} cy={y} r={12} fill="#f8fafc" stroke="#94a3b8" />
            <text x={x} y={y+4} textAnchor="middle" className="chart-label">{shortName(p)}</text>
          </g>
        )
      })}

      {/* center label */}
      <text x={cx} y={cy} textAnchor="middle" className="chart-label" style={{fontWeight:700}}>Natal</text>
    </svg>
  )
}
