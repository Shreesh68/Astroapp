// The astrology engine, running on the device — no server needed.
import { ashtakoota, decide } from './ashtakoota'
import { computeChart, kujaCompatibility } from './chart'

export { ChartInputError, computeChart } from './chart'
export { computePanchang } from './panchang'

/** Ashtakoota and Kuja dosha compatibility of two birth charts. */
export function computeMatch(groomChart, brideChart) {
  const match = ashtakoota(groomChart.planets.moon.lon, brideChart.planets.moon.lon)
  match.manglik = kujaCompatibility(
    { kuja: groomChart.manglik, samya: groomChart.dosha_samya },
    { kuja: brideChart.manglik, samya: brideChart.dosha_samya },
  )
  // Kuja dosha in only one chart, not balanced by the other, calls for care too
  if (!match.manglik.ok) Object.assign(match, decide(match.total, [...match.verdict_reasons, { key: 'kuja', severity: 'caution' }]))
  return match
}

export function chartFor({ date, time, lat, lon, tz, time_known = true }) {
  return computeChart(date, time, lat, lon, tz, time_known)
}
