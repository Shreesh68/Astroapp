import { ChartInputError, chartFor, computeMatch, computePanchang } from '../engine'

export class ApiError extends Error {}

/** Birth details (see profiles.js) → chart input */
export function toPayload(p) {
  return { date: p.date, time: p.timeUnknown ? '12:00' : p.time, lat: p.lat, lon: p.lon, tz: p.tz, time_known: !p.timeUnknown }
}

// Charts, matching and Panchang are calculated on the device (src/engine) — no server, works offline.
// They stay async so pages can keep treating them like any other load.
function local(compute) {
  return new Promise((resolve, reject) => {
    // yield first so a loading state can paint before the calculation runs
    setTimeout(() => {
      try {
        resolve(compute())
      } catch (err) {
        reject(err instanceof ChartInputError ? new ApiError(err.message) : err)
      }
    }, 0)
  })
}

export const getChart = (profile) => local(() => chartFor(toPayload(profile)))

export const getMatch = (groom, bride) => local(() => {
  const groomChart = chartFor(toPayload(groom))
  const brideChart = chartFor(toPayload(bride))
  return { groom_chart: groomChart, bride_chart: brideChart, match: computeMatch(groomChart, brideChart) }
})

export const getPanchang = ({ date, lat, lon, tz }) => local(() => computePanchang(date, +lat, +lon, tz))
