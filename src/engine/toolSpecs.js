// What the AI astrologer is told about the calculations it can ask for (OpenAI-style tool format).
// Kept apart from tools.js so the chat server can send these without bundling the engine.
const date = { type: 'string', description: 'YYYY-MM-DD' }
const fn = (name, description, properties) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required: Object.keys(properties) } },
})

export const TOOL_SPECS = [
  fn('get_planet_positions',
    'Sidereal positions of all nine grahas at noon on a date (transits / gochara), with the house each one occupies counted from the natal Lagna and from the natal Moon. Use for questions about a specific day, month or year, including today.',
    { date }),
  fn('find_sign_changes',
    'Dates on which a planet moves from one rashi into another between two dates, including back-and-forth moves during retrograde. Use for Sade Sati, Ashtama Shani, Jupiter or Rahu/Ketu transits and similar "when" questions. Up to 60 years per call (60 days for the Moon).',
    {
      planet: { type: 'string', enum: ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] },
      start_date: date,
      end_date: date,
    }),
  fn('get_dasha_periods', "The person's Vimshottari mahadashas and antardashas (bhuktis) that overlap a date range.",
    { start_date: date, end_date: date }),
  fn('get_panchang',
    'The Panchang for a date at the birth place: samvatsara, maasa, tithi, vara, nakshatra, yoga, karana, sunrise and sunset, Rahu kala, Yamaganda and Gulika.',
    { date }),
]
