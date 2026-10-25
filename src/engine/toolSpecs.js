// What the AI astrologer is told about the calculations it can ask for (OpenAI-style tool format).
// Kept apart from tools.js so the chat server can send these without bundling the engine.
const date = { type: 'string', description: 'YYYY-MM-DD' }
const fn = (name, description, properties, required = Object.keys(properties)) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required } },
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
  fn('check_match',
    'Kundli matching between the person asking and a prospective partner: Ashtakoota (36 gunas), the South Indian checks (Rajju, Vedha, Mahendra, Stree Deergha), Kuja dosha and both ages. The groom and bride are decided by gender (the partner is the opposite gender of the person asking). Give partner_name alone for someone already saved in the app; otherwise also give their birth date, birth time and birth place, asking the person for any that are missing. If the bride is older the tool asks for confirmation first: tell the person tradition prefers an older groom and ask whether to continue; only if they say yes, call again with allow_elder_bride true.',
    {
      partner_name: { type: 'string', description: 'name of the prospective bride or groom' },
      birth_date: { type: 'string', description: 'YYYY-MM-DD' },
      birth_time: { type: 'string', description: 'HH:MM in 24-hour time, or "unknown"' },
      birth_place: { type: 'string', description: 'town or village of birth, e.g. "Sirsi, Karnataka"' },
      allow_elder_bride: { type: 'boolean', description: 'true only after the person has agreed to match with an older bride' },
      asker_gender: { type: 'string', enum: ['male', 'female'], description: 'only when the chart summary gives no gender for the person asking' },
    }, ['partner_name']),
  fn('get_panchang',
    'The Panchang for a date at the birth place: samvatsara, maasa, tithi, vara, nakshatra, yoga, karana, sunrise and sunset, Rahu kala, Yamaganda and Gulika.',
    { date }),
]
