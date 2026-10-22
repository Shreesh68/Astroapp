// The astrology engine, running on the device — no server needed.
import { ashtakoota } from './ashtakoota'
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
  return match
}

export function chartFor({ date, time, lat, lon, tz, time_known = true }) {
  return computeChart(date, time, lat, lon, tz, time_known)
}
