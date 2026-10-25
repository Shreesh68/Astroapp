// The astrology engine, running on the device — no server needed.
import { DateTime } from 'luxon'
import { ashtakoota, decide } from './ashtakoota'
import { computeChart, kujaCompatibility } from './chart'

export { ChartInputError, computeChart } from './chart'
export { computePanchang } from './panchang'

/**
 * Ages of the two, and by how much the groom is older (negative when the bride is older).
 * Tradition prefers an older groom, so an older bride is noted as a caution.
 */
export function agesOf(groomChart, brideChart, now = DateTime.now()) {
  const g = DateTime.fromISO(groomChart.utc), b = DateTime.fromISO(brideChart.utc)
  const years = (from, to) => Math.floor(to.diff(from, 'years').years)
  const gap = b.diff(g, 'months').months // positive: groom born first
  return {
    groom: years(g, now), bride: years(b, now),
    groom_older_months: Math.round(gap),
    bride_older: gap < 0,
  }
}

/** Ashtakoota and Kuja dosha compatibility of two birth charts. */
export function computeMatch(groomChart, brideChart) {
  const match = ashtakoota(groomChart.planets.moon.lon, brideChart.planets.moon.lon)
  match.ages = agesOf(groomChart, brideChart)
  match.manglik = kujaCompatibility(
    { kuja: groomChart.manglik, samya: groomChart.dosha_samya },
    { kuja: brideChart.manglik, samya: brideChart.dosha_samya },
  )
  // Kuja dosha in only one chart (not balanced by the other) and an older bride call for care too
  const cautions = [
    ...(!match.manglik.ok ? [{ key: 'kuja', severity: 'caution' }] : []),
    ...(match.ages.bride_older ? [{ key: 'bride_older', severity: 'caution' }] : []),
  ]
  if (cautions.length) Object.assign(match, decide(match.total, [...match.verdict_reasons, ...cautions]))
  return match
}

export function chartFor({ date, time, lat, lon, tz, time_known = true }) {
  return computeChart(date, time, lat, lon, tz, time_known)
}
