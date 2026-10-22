// Names and plain-language meanings used to tell the chart as a story.
// Index order matches the backend (Mesha = 0, Ashwini = 0).

export const RASHIS = [
  { en: 'Mesha',     kn: 'ಮೇಷ',     west: 'Aries',       trait: { en: 'courageous, quick to act and independent', kn: 'ಧೈರ್ಯಶಾಲಿ, ಚುರುಕು ಮತ್ತು ಸ್ವತಂತ್ರ ಸ್ವಭಾವ' } },
  { en: 'Vrishabha', kn: 'ವೃಷಭ',    west: 'Taurus',      trait: { en: 'steady, loyal and fond of comfort and beauty', kn: 'ಸ್ಥಿರ, ನಿಷ್ಠಾವಂತ ಮತ್ತು ಸೌಂದರ್ಯ ಪ್ರಿಯ' } },
  { en: 'Mithuna',   kn: 'ಮಿಥುನ',   west: 'Gemini',      trait: { en: 'curious, talkative and quick-witted', kn: 'ಕುತೂಹಲಿ, ಮಾತುಗಾರ ಮತ್ತು ಚತುರ ಬುದ್ಧಿ' } },
  { en: 'Karka',     kn: 'ಕರ್ಕ',     west: 'Cancer',      trait: { en: 'caring, emotional and devoted to family', kn: 'ಮಮತೆಯುಳ್ಳ, ಭಾವುಕ ಮತ್ತು ಕುಟುಂಬ ಪ್ರೇಮಿ' } },
  { en: 'Simha',     kn: 'ಸಿಂಹ',     west: 'Leo',         trait: { en: 'generous, dignified and a natural leader', kn: 'ಉದಾರ, ಆತ್ಮಗೌರವವುಳ್ಳ ಸಹಜ ನಾಯಕ' } },
  { en: 'Kanya',     kn: 'ಕನ್ಯಾ',    west: 'Virgo',       trait: { en: 'practical, careful and helpful', kn: 'ವ್ಯಾವಹಾರಿಕ, ಜಾಗರೂಕ ಮತ್ತು ಸಹಾಯಕ' } },
  { en: 'Tula',      kn: 'ತುಲಾ',     west: 'Libra',       trait: { en: 'balanced, fair-minded and harmony-seeking', kn: 'ಸಮತೋಲನ, ನ್ಯಾಯಪರ ಮತ್ತು ಸಾಮರಸ್ಯ ಪ್ರಿಯ' } },
  { en: 'Vrischika', kn: 'ವೃಶ್ಚಿಕ',  west: 'Scorpio',     trait: { en: 'intense, determined and private', kn: 'ತೀವ್ರ ಭಾವನೆ, ದೃಢ ನಿಶ್ಚಯ ಮತ್ತು ಗುಟ್ಟು ಕಾಪಾಡುವ ಸ್ವಭಾವ' } },
  { en: 'Dhanu',     kn: 'ಧನು',      west: 'Sagittarius', trait: { en: 'optimistic, principled and a lover of learning', kn: 'ಆಶಾವಾದಿ, ತತ್ವನಿಷ್ಠ ಮತ್ತು ಜ್ಞಾನ ಪ್ರಿಯ' } },
  { en: 'Makara',    kn: 'ಮಕರ',     west: 'Capricorn',   trait: { en: 'disciplined, patient and hard-working', kn: 'ಶಿಸ್ತು, ತಾಳ್ಮೆ ಮತ್ತು ಕಠಿಣ ಪರಿಶ್ರಮಿ' } },
  { en: 'Kumbha',    kn: 'ಕುಂಭ',     west: 'Aquarius',    trait: { en: 'an independent thinker who cares about society', kn: 'ಸ್ವತಂತ್ರ ಚಿಂತಕ, ಸಮಾಜಮುಖಿ' } },
  { en: 'Meena',     kn: 'ಮೀನ',     west: 'Pisces',      trait: { en: 'compassionate, imaginative and spiritual', kn: 'ಕರುಣಾಮಯಿ, ಕಲ್ಪನಾಶೀಲ ಮತ್ತು ಆಧ್ಯಾತ್ಮಿಕ' } },
]

export const NAKSHATRAS = [
  { en: 'Ashwini',           kn: 'ಅಶ್ವಿನಿ',        symbol: 'Horse’s head',         deity: 'Ashwini Kumaras', trait: { en: 'swift, healing and pioneering', kn: 'ಚುರುಕು, ಆರೋಗ್ಯದಾಯಕ, ಮುಂದಾಳು' } },
  { en: 'Bharani',           kn: 'ಭರಣಿ',          symbol: 'Yoni',                 deity: 'Yama',            trait: { en: 'strong-willed, responsible and intense', kn: 'ದೃಢ ಮನಸ್ಸು, ಜವಾಬ್ದಾರಿ, ತೀವ್ರತೆ' } },
  { en: 'Krittika',          kn: 'ಕೃತ್ತಿಕಾ',       symbol: 'Flame',                deity: 'Agni',            trait: { en: 'sharp, purifying and direct', kn: 'ತೀಕ್ಷ್ಣ, ಶುದ್ಧ, ನೇರ ನುಡಿ' } },
  { en: 'Rohini',            kn: 'ರೋಹಿಣಿ',        symbol: 'Chariot',              deity: 'Brahma',          trait: { en: 'charming, creative and nurturing', kn: 'ಆಕರ್ಷಕ, ಸೃಜನಶೀಲ, ಪೋಷಕ' } },
  { en: 'Mrigashirsha',      kn: 'ಮೃಗಶಿರ',        symbol: 'Deer’s head',          deity: 'Soma',            trait: { en: 'gentle, curious and always searching', kn: 'ಸೌಮ್ಯ, ಕುತೂಹಲಿ, ಹುಡುಕಾಟದ ಮನಸ್ಸು' } },
  { en: 'Ardra',             kn: 'ಆರ್ದ್ರಾ',        symbol: 'Teardrop',             deity: 'Rudra',           trait: { en: 'stormy, transformative and intelligent', kn: 'ಪರಿವರ್ತನಶೀಲ, ಬುದ್ಧಿವಂತ' } },
  { en: 'Punarvasu',         kn: 'ಪುನರ್ವಸು',       symbol: 'Quiver of arrows',     deity: 'Aditi',           trait: { en: 'renewing, kind and optimistic', kn: 'ದಯಾಳು, ಆಶಾವಾದಿ, ಮರುಚೈತನ್ಯ' } },
  { en: 'Pushya',            kn: 'ಪುಷ್ಯ',          symbol: 'Cow’s udder',          deity: 'Brihaspati',      trait: { en: 'nurturing, dutiful and auspicious', kn: 'ಪೋಷಕ, ಕರ್ತವ್ಯನಿಷ್ಠ, ಶುಭ' } },
  { en: 'Ashlesha',          kn: 'ಆಶ್ಲೇಷ',         symbol: 'Coiled serpent',       deity: 'Nagas',           trait: { en: 'perceptive, mystical and persuasive', kn: 'ಸೂಕ್ಷ್ಮ ಗ್ರಹಿಕೆ, ನಿಗೂಢ, ಮನವೊಲಿಸುವ' } },
  { en: 'Magha',             kn: 'ಮಘ',            symbol: 'Throne',               deity: 'Pitris',          trait: { en: 'dignified, traditional and honouring ancestors', kn: 'ಗೌರವಾನ್ವಿತ, ಸಂಪ್ರದಾಯಪ್ರಿಯ' } },
  { en: 'Purva Phalguni',    kn: 'ಪೂರ್ವ ಫಲ್ಗುಣಿ',   symbol: 'Front legs of a bed',  deity: 'Bhaga',           trait: { en: 'warm, artistic and pleasure-loving', kn: 'ಆತ್ಮೀಯ, ಕಲಾಪ್ರಿಯ, ಸುಖಪ್ರಿಯ' } },
  { en: 'Uttara Phalguni',   kn: 'ಉತ್ತರ ಫಲ್ಗುಣಿ',   symbol: 'Back legs of a bed',   deity: 'Aryaman',         trait: { en: 'reliable, generous and friendly', kn: 'ನಂಬಿಕಸ್ಥ, ಉದಾರ, ಸ್ನೇಹಪರ' } },
  { en: 'Hasta',             kn: 'ಹಸ್ತ',           symbol: 'Hand',                 deity: 'Savitar',         trait: { en: 'skilful, resourceful and witty', kn: 'ಕೌಶಲ್ಯಪೂರ್ಣ, ಚತುರ, ಹಾಸ್ಯಪ್ರಿಯ' } },
  { en: 'Chitra',            kn: 'ಚಿತ್ತಾ',          symbol: 'Bright jewel',         deity: 'Vishwakarma',     trait: { en: 'creative, stylish and a builder', kn: 'ಸೃಜನಶೀಲ, ಅಲಂಕಾರಪ್ರಿಯ, ನಿರ್ಮಾತೃ' } },
  { en: 'Swati',             kn: 'ಸ್ವಾತಿ',          symbol: 'Shoot swaying in wind', deity: 'Vayu',           trait: { en: 'independent, flexible and diplomatic', kn: 'ಸ್ವತಂತ್ರ, ಹೊಂದಿಕೊಳ್ಳುವ, ಜಾಣ್ಮೆಯ ಮಾತು' } },
  { en: 'Vishakha',          kn: 'ವಿಶಾಖ',          symbol: 'Triumphal arch',       deity: 'Indra–Agni',      trait: { en: 'goal-driven, ambitious and determined', kn: 'ಗುರಿಯತ್ತ ಸಾಗುವ, ಮಹತ್ವಾಕಾಂಕ್ಷಿ' } },
  { en: 'Anuradha',          kn: 'ಅನುರಾಧ',         symbol: 'Lotus',                deity: 'Mitra',           trait: { en: 'devoted, friendly and cooperative', kn: 'ಭಕ್ತಿಯುಳ್ಳ, ಸ್ನೇಹಪರ, ಸಹಕಾರಿ' } },
  { en: 'Jyeshtha',          kn: 'ಜ್ಯೇಷ್ಠ',         symbol: 'Earring',              deity: 'Indra',           trait: { en: 'protective, responsible and resourceful', kn: 'ರಕ್ಷಕ, ಜವಾಬ್ದಾರಿಯುತ, ಸಾಮರ್ಥ್ಯವುಳ್ಳ' } },
  { en: 'Moola',             kn: 'ಮೂಲ',           symbol: 'Tied roots',           deity: 'Nirriti',         trait: { en: 'philosophical, seeking the root of things', kn: 'ತಾತ್ವಿಕ, ಮೂಲ ಹುಡುಕುವ ಮನಸ್ಸು' } },
  { en: 'Purva Ashadha',     kn: 'ಪೂರ್ವಾಷಾಢ',       symbol: 'Fan',                  deity: 'Apas',            trait: { en: 'invincible, persuasive and proud', kn: 'ಅಜೇಯ, ಮನವೊಲಿಸುವ, ಆತ್ಮಾಭಿಮಾನಿ' } },
  { en: 'Uttara Ashadha',    kn: 'ಉತ್ತರಾಷಾಢ',       symbol: 'Elephant’s tusk',      deity: 'Vishvadevas',     trait: { en: 'righteous, enduring and victorious', kn: 'ಧರ್ಮನಿಷ್ಠ, ಸಹನಶೀಲ, ವಿಜಯಿ' } },
  { en: 'Shravana',          kn: 'ಶ್ರವಣ',          symbol: 'Ear',                  deity: 'Vishnu',          trait: { en: 'a good listener, learner and wise', kn: 'ಉತ್ತಮ ಕೇಳುಗ, ಜ್ಞಾನಿ' } },
  { en: 'Dhanishta',         kn: 'ಧನಿಷ್ಠ',         symbol: 'Drum',                 deity: 'Ashta Vasus',     trait: { en: 'musical, prosperous and generous', kn: 'ಸಂಗೀತಪ್ರಿಯ, ಸಮೃದ್ಧ, ಉದಾರ' } },
  { en: 'Shatabhisha',       kn: 'ಶತಭಿಷ',          symbol: 'Empty circle',         deity: 'Varuna',          trait: { en: 'a healer, private and scientific', kn: 'ಚಿಕಿತ್ಸಕ ಗುಣ, ಏಕಾಂತಪ್ರಿಯ, ವೈಜ್ಞಾನಿಕ' } },
  { en: 'Purva Bhadrapada',  kn: 'ಪೂರ್ವಾಭಾದ್ರ',      symbol: 'Front of a cot',       deity: 'Aja Ekapada',     trait: { en: 'passionate, idealistic and intense', kn: 'ಉತ್ಸಾಹಿ, ಆದರ್ಶವಾದಿ' } },
  { en: 'Uttara Bhadrapada', kn: 'ಉತ್ತರಾಭಾದ್ರ',      symbol: 'Back of a cot',        deity: 'Ahir Budhnya',    trait: { en: 'calm, wise and self-controlled', kn: 'ಶಾಂತ, ಜ್ಞಾನಿ, ಸಂಯಮಿ' } },
  { en: 'Revati',            kn: 'ರೇವತಿ',          symbol: 'Fish',                 deity: 'Pushan',          trait: { en: 'gentle, nurturing and a guide to others', kn: 'ಸೌಮ್ಯ, ಪೋಷಕ, ಮಾರ್ಗದರ್ಶಕ' } },
]

export const PLANETS = {
  sun:     { en: 'Sun',     kn: 'ರವಿ',    short: { en: 'Su', kn: 'ರ' },   means: { en: 'soul, father and authority', kn: 'ಆತ್ಮ, ತಂದೆ, ಅಧಿಕಾರ' } },
  moon:    { en: 'Moon',    kn: 'ಚಂದ್ರ',  short: { en: 'Mo', kn: 'ಚಂ' },  means: { en: 'mind, mother and emotions', kn: 'ಮನಸ್ಸು, ತಾಯಿ, ಭಾವನೆ' } },
  mars:    { en: 'Mars',    kn: 'ಕುಜ',    short: { en: 'Ma', kn: 'ಕು' },  means: { en: 'energy, courage, siblings and land', kn: 'ಶಕ್ತಿ, ಧೈರ್ಯ, ಸಹೋದರರು, ಭೂಮಿ' } },
  mercury: { en: 'Mercury', kn: 'ಬುಧ',    short: { en: 'Me', kn: 'ಬು' },  means: { en: 'intellect, speech and business', kn: 'ಬುದ್ಧಿ, ಮಾತು, ವ್ಯಾಪಾರ' } },
  jupiter: { en: 'Jupiter', kn: 'ಗುರು',   short: { en: 'Ju', kn: 'ಗು' },  means: { en: 'wisdom, children and good fortune', kn: 'ಜ್ಞಾನ, ಮಕ್ಕಳು, ಭಾಗ್ಯ' } },
  venus:   { en: 'Venus',   kn: 'ಶುಕ್ರ',  short: { en: 'Ve', kn: 'ಶು' },  means: { en: 'love, marriage, comforts and the arts', kn: 'ಪ್ರೀತಿ, ವಿವಾಹ, ಸುಖ, ಕಲೆ' } },
  saturn:  { en: 'Saturn',  kn: 'ಶನಿ',    short: { en: 'Sa', kn: 'ಶ' },   means: { en: 'discipline, hard work and longevity', kn: 'ಶಿಸ್ತು, ಪರಿಶ್ರಮ, ಆಯುಷ್ಯ' } },
  rahu:    { en: 'Rahu',    kn: 'ರಾಹು',   short: { en: 'Ra', kn: 'ರಾ' },  means: { en: 'ambition, the unconventional and foreign lands', kn: 'ಮಹತ್ವಾಕಾಂಕ್ಷೆ, ಅಸಾಮಾನ್ಯತೆ, ವಿದೇಶ' } },
  ketu:    { en: 'Ketu',    kn: 'ಕೇತು',   short: { en: 'Ke', kn: 'ಕೇ' },  means: { en: 'detachment, spirituality and past karma', kn: 'ವೈರಾಗ್ಯ, ಆಧ್ಯಾತ್ಮ, ಪೂರ್ವ ಕರ್ಮ' } },
}
export const PLANET_ORDER = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']

export const HOUSES = [
  { en: 'Self, body and personality',            kn: 'ತನು ಭಾವ — ವ್ಯಕ್ತಿತ್ವ, ದೇಹ' },
  { en: 'Wealth, family and speech',             kn: 'ಧನ ಭಾವ — ಸಂಪತ್ತು, ಕುಟುಂಬ, ಮಾತು' },
  { en: 'Courage, siblings and effort',          kn: 'ಸಹಜ ಭಾವ — ಧೈರ್ಯ, ಸಹೋದರರು, ಪ್ರಯತ್ನ' },
  { en: 'Home, mother and inner happiness',      kn: 'ಸುಖ ಭಾವ — ಮನೆ, ತಾಯಿ, ನೆಮ್ಮದಿ' },
  { en: 'Children, intellect and past merit',    kn: 'ಪುತ್ರ ಭಾವ — ಮಕ್ಕಳು, ಬುದ್ಧಿ, ಪೂರ್ವಪುಣ್ಯ' },
  { en: 'Health, competition and service',       kn: 'ಶತ್ರು ಭಾವ — ಆರೋಗ್ಯ, ಸ್ಪರ್ಧೆ, ಸೇವೆ' },
  { en: 'Marriage and partnership',              kn: 'ಕಳತ್ರ ಭಾವ — ವಿವಾಹ, ಪಾಲುದಾರಿಕೆ' },
  { en: 'Longevity, change and the hidden',      kn: 'ಆಯುಷ್ಯ ಭಾವ — ದೀರ್ಘಾಯುಷ್ಯ, ಬದಲಾವಣೆ, ರಹಸ್ಯ' },
  { en: 'Fortune, father and dharma',            kn: 'ಭಾಗ್ಯ ಭಾವ — ಅದೃಷ್ಟ, ತಂದೆ, ಧರ್ಮ' },
  { en: 'Career, status and action',             kn: 'ಕರ್ಮ ಭಾವ — ವೃತ್ತಿ, ಕೀರ್ತಿ' },
  { en: 'Gains, friends and wishes',             kn: 'ಲಾಭ ಭಾವ — ಆದಾಯ, ಸ್ನೇಹಿತರು, ಆಸೆಗಳು' },
  { en: 'Expenses, foreign lands and liberation', kn: 'ವ್ಯಯ ಭಾವ — ಖರ್ಚು, ವಿದೇಶ, ಮೋಕ್ಷ' },
]

export const KOOTAS = {
  varna:        { en: 'Varna',        kn: 'ವರ್ಣ',       about: { en: 'Spiritual compatibility and temperament at work', kn: 'ಆಧ್ಯಾತ್ಮಿಕ ಹೊಂದಾಣಿಕೆ' } },
  vashya:       { en: 'Vashya',       kn: 'ವಶ್ಯ',       about: { en: 'Mutual attraction and influence', kn: 'ಪರಸ್ಪರ ಆಕರ್ಷಣೆ ಮತ್ತು ಪ್ರಭಾವ' } },
  tara:         { en: 'Tara',         kn: 'ತಾರಾ',       about: { en: 'Harmony of birth stars — well-being and luck', kn: 'ಜನ್ಮ ನಕ್ಷತ್ರಗಳ ಹೊಂದಾಣಿಕೆ — ಶುಭ, ಆರೋಗ್ಯ' } },
  yoni:         { en: 'Yoni',         kn: 'ಯೋನಿ',       about: { en: 'Physical and instinctive compatibility', kn: 'ದೈಹಿಕ ಮತ್ತು ಸಹಜ ಹೊಂದಾಣಿಕೆ' } },
  graha_maitri: { en: 'Graha Maitri', kn: 'ಗ್ರಹ ಮೈತ್ರಿ',  about: { en: 'Mental wavelength — friendship of Moon-sign lords', kn: 'ಮಾನಸಿಕ ಸ್ನೇಹ — ರಾಶ್ಯಾಧಿಪತಿಗಳ ಮೈತ್ರಿ' } },
  gana:         { en: 'Gana',         kn: 'ಗಣ',         about: { en: 'Temperament: Deva, Manushya or Rakshasa', kn: 'ಸ್ವಭಾವ: ದೇವ, ಮನುಷ್ಯ ಅಥವಾ ರಾಕ್ಷಸ' } },
  bhakoot:      { en: 'Bhakoot',      kn: 'ಭಕೂಟ',       about: { en: 'Family welfare, finances and affection', kn: 'ಕುಟುಂಬ ಕ್ಷೇಮ, ಆರ್ಥಿಕ ಸ್ಥಿತಿ, ಪ್ರೀತಿ' } },
  nadi:         { en: 'Nadi',         kn: 'ನಾಡಿ',       about: { en: 'Health and progeny — carries the most weight', kn: 'ಆರೋಗ್ಯ ಮತ್ತು ಸಂತಾನ — ಅತಿ ಮುಖ್ಯ ಕೂಟ' } },
}

export const VERDICTS = {
  excellent:       { en: 'Excellent match',                kn: 'ಅತ್ಯುತ್ತಮ ಹೊಂದಾಣಿಕೆ',           tone: 'good' },
  very_good:       { en: 'Very good match',                kn: 'ಬಹಳ ಒಳ್ಳೆಯ ಹೊಂದಾಣಿಕೆ',          tone: 'good' },
  average:         { en: 'Acceptable match',               kn: 'ಸಾಧಾರಣ ಹೊಂದಾಣಿಕೆ',             tone: 'warn' },
  not_recommended: { en: 'Not traditionally recommended',  kn: 'ಸಾಂಪ್ರದಾಯಿಕವಾಗಿ ಶಿಫಾರಸು ಇಲ್ಲ',   tone: 'bad' },
}

export const TITHIS_KN = ['ಪಾಡ್ಯ', 'ಬಿದಿಗೆ', 'ತದಿಗೆ', 'ಚೌತಿ', 'ಪಂಚಮಿ', 'ಷಷ್ಠಿ', 'ಸಪ್ತಮಿ', 'ಅಷ್ಟಮಿ', 'ನವಮಿ', 'ದಶಮಿ',
  'ಏಕಾದಶಿ', 'ದ್ವಾದಶಿ', 'ತ್ರಯೋದಶಿ', 'ಚತುರ್ದಶಿ']
export const VARAS_KN = ['ಭಾನುವಾರ', 'ಸೋಮವಾರ', 'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ', 'ಶುಕ್ರವಾರ', 'ಶನಿವಾರ']

// Panchang year/month names in Kannada (backend index order)
export const MAASAS_KN = ['ಚೈತ್ರ', 'ವೈಶಾಖ', 'ಜ್ಯೇಷ್ಠ', 'ಆಷಾಢ', 'ಶ್ರಾವಣ', 'ಭಾದ್ರಪದ', 'ಆಶ್ವಯುಜ', 'ಕಾರ್ತಿಕ', 'ಮಾರ್ಗಶಿರ',
  'ಪುಷ್ಯ', 'ಮಾಘ', 'ಫಾಲ್ಗುಣ']
export const RUTUS_KN = ['ವಸಂತ', 'ಗ್ರೀಷ್ಮ', 'ವರ್ಷ', 'ಶರದ್', 'ಹೇಮಂತ', 'ಶಿಶಿರ']
export const YOGAS_KN = ['ವಿಷ್ಕಂಭ', 'ಪ್ರೀತಿ', 'ಆಯುಷ್ಮಾನ್', 'ಸೌಭಾಗ್ಯ', 'ಶೋಭನ', 'ಅತಿಗಂಡ', 'ಸುಕರ್ಮ', 'ಧೃತಿ', 'ಶೂಲ',
  'ಗಂಡ', 'ವೃದ್ಧಿ', 'ಧ್ರುವ', 'ವ್ಯಾಘಾತ', 'ಹರ್ಷಣ', 'ವಜ್ರ', 'ಸಿದ್ಧಿ', 'ವ್ಯತೀಪಾತ', 'ವರೀಯಾನ್', 'ಪರಿಘ', 'ಶಿವ', 'ಸಿದ್ಧ',
  'ಸಾಧ್ಯ', 'ಶುಭ', 'ಶುಕ್ಲ', 'ಬ್ರಹ್ಮ', 'ಐಂದ್ರ', 'ವೈಧೃತಿ']
export const KARANAS_KN = { Bava: 'ಬವ', Balava: 'ಬಾಲವ', Kaulava: 'ಕೌಲವ', Taitila: 'ತೈತಿಲ', Garaja: 'ಗರಜ', Vanija: 'ವಣಿಜ',
  Vishti: 'ವಿಷ್ಟಿ', Shakuni: 'ಶಕುನಿ', Chatushpada: 'ಚತುಷ್ಪಾದ', Naga: 'ನಾಗ', Kimstughna: 'ಕಿಂಸ್ತುಘ್ನ' }
export const AYANAS_KN = { uttarayana: 'ಉತ್ತರಾಯಣ', dakshinayana: 'ದಕ್ಷಿಣಾಯನ' }
export const SAMVATSARAS_KN = [
  'ಪ್ರಭವ', 'ವಿಭವ', 'ಶುಕ್ಲ', 'ಪ್ರಮೋದೂತ', 'ಪ್ರಜೋತ್ಪತ್ತಿ', 'ಆಂಗೀರಸ', 'ಶ್ರೀಮುಖ', 'ಭಾವ', 'ಯುವ', 'ಧಾತು',
  'ಈಶ್ವರ', 'ಬಹುಧಾನ್ಯ', 'ಪ್ರಮಾಥಿ', 'ವಿಕ್ರಮ', 'ವೃಷ', 'ಚಿತ್ರಭಾನು', 'ಸ್ವಭಾನು', 'ತಾರಣ', 'ಪಾರ್ಥಿವ', 'ವ್ಯಯ',
  'ಸರ್ವಜಿತ್', 'ಸರ್ವಧಾರಿ', 'ವಿರೋಧಿ', 'ವಿಕೃತಿ', 'ಖರ', 'ನಂದನ', 'ವಿಜಯ', 'ಜಯ', 'ಮನ್ಮಥ', 'ದುರ್ಮುಖಿ',
  'ಹೇವಿಳಂಬಿ', 'ವಿಳಂಬಿ', 'ವಿಕಾರಿ', 'ಶಾರ್ವರಿ', 'ಪ್ಲವ', 'ಶುಭಕೃತ್', 'ಶೋಭಕೃತ್', 'ಕ್ರೋಧಿ', 'ವಿಶ್ವಾವಸು', 'ಪರಾಭವ',
  'ಪ್ಲವಂಗ', 'ಕೀಲಕ', 'ಸೌಮ್ಯ', 'ಸಾಧಾರಣ', 'ವಿರೋಧಿಕೃತ್', 'ಪರಿಧಾವಿ', 'ಪ್ರಮಾದೀಚ', 'ಆನಂದ', 'ರಾಕ್ಷಸ', 'ನಳ',
  'ಪಿಂಗಳ', 'ಕಾಳಯುಕ್ತಿ', 'ಸಿದ್ಧಾರ್ಥಿ', 'ರೌದ್ರಿ', 'ದುರ್ಮತಿ', 'ದುಂದುಭಿ', 'ರುಧಿರೋದ್ಗಾರಿ', 'ರಕ್ತಾಕ್ಷಿ', 'ಕ್ರೋಧನ', 'ಅಕ್ಷಯ',
]

// ── helpers ────────────────────────────────────────────────
export const rashiName = (i, lang) => RASHIS[i]?.[lang === 'kn' ? 'kn' : 'en'] ?? ''
export const rashiIndex = name => RASHIS.findIndex(r => r.en === name)
export const nakName = (i, lang) => NAKSHATRAS[i]?.[lang === 'kn' ? 'kn' : 'en'] ?? ''
export const planetName = (p, lang) => PLANETS[p]?.[lang === 'kn' ? 'kn' : 'en'] ?? p
export const pick = (obj, lang) => obj?.[lang === 'kn' ? 'kn' : 'en'] ?? ''

/** 12.3456 → 12°20′ */
export function dms(deg) {
  if (deg == null) return ''
  let d = Math.floor(deg)
  let m = Math.round((deg - d) * 60)
  if (m === 60) { d += 1; m = 0 }
  return `${d}°${String(m).padStart(2, '0')}′`
}

export function tithiLabel(tithi, lang) {
  if (lang !== 'kn') return `${tithi.paksha} ${tithi.name}`
  const n = tithi.index % 15
  const paksha = tithi.index < 15 ? 'ಶುಕ್ಲ' : 'ಕೃಷ್ಣ'
  if (n === 14) return tithi.index < 15 ? 'ಹುಣ್ಣಿಮೆ' : 'ಅಮಾವಾಸ್ಯೆ'
  return `${paksha} ${TITHIS_KN[n]}`
}

// Backend dosha-cancellation reasons → display text
const REASONS = {
  'Mars in the 2nd house in Mithuna or Kanya':   'ಕುಜ 2ನೇ ಭಾವದಲ್ಲಿ ಮಿಥುನ ಅಥವಾ ಕನ್ಯಾ ರಾಶಿಯಲ್ಲಿದ್ದಾನೆ',
  'Mars in the 4th house in Mesha or Vrischika': 'ಕುಜ 4ನೇ ಭಾವದಲ್ಲಿ ಮೇಷ ಅಥವಾ ವೃಶ್ಚಿಕ ರಾಶಿಯಲ್ಲಿದ್ದಾನೆ',
  'Mars in the 7th house in Karka or Makara':    'ಕುಜ 7ನೇ ಭಾವದಲ್ಲಿ ಕರ್ಕ ಅಥವಾ ಮಕರ ರಾಶಿಯಲ್ಲಿದ್ದಾನೆ',
  'Mars in the 8th house in Dhanu or Meena':     'ಕುಜ 8ನೇ ಭಾವದಲ್ಲಿ ಧನು ಅಥವಾ ಮೀನ ರಾಶಿಯಲ್ಲಿದ್ದಾನೆ',
  'Mars in the 12th house in Vrishabha or Tula': 'ಕುಜ 12ನೇ ಭಾವದಲ್ಲಿ ವೃಷಭ ಅಥವಾ ತುಲಾ ರಾಶಿಯಲ್ಲಿದ್ದಾನೆ',
  'Lagna is Karka or Simha, for which Mars is a yogakaraka': 'ಕರ್ಕ ಅಥವಾ ಸಿಂಹ ಲಗ್ನ — ಕುಜ ಯೋಗಕಾರಕ',
  'Mars is in its own sign':              'ಕುಜ ಸ್ವಕ್ಷೇತ್ರದಲ್ಲಿದ್ದಾನೆ',
  'Mars is exalted in Makara':            'ಕುಜ ಮಕರದಲ್ಲಿ ಉಚ್ಚನಾಗಿದ್ದಾನೆ',
  'Mars is in Karka, Simha or Kumbha':    'ಕುಜ ಕರ್ಕ, ಸಿಂಹ ಅಥವಾ ಕುಂಭ ರಾಶಿಯಲ್ಲಿದ್ದಾನೆ',
  'Mars is conjunct Jupiter':             'ಕುಜನೊಂದಿಗೆ ಗುರು ಇದ್ದಾನೆ',
  'Mars is conjunct the Moon':            'ಕುಜನೊಂದಿಗೆ ಚಂದ್ರ ಇದ್ದಾನೆ',
  'Mars is conjunct the Sun':             'ಕುಜನೊಂದಿಗೆ ರವಿ ಇದ್ದಾನೆ',
  'Mars is conjunct Mercury':             'ಕುಜನೊಂದಿಗೆ ಬುಧ ಇದ್ದಾನೆ',
  'Mars is aspected by Jupiter':          'ಕುಜನಿಗೆ ಗುರು ದೃಷ್ಟಿ ಇದೆ',
  'Mars is aspected by the Sun':          'ಕುಜನಿಗೆ ರವಿ ದೃಷ್ಟಿ ಇದೆ',
  'Mars is aspected by Mercury':          'ಕುಜನಿಗೆ ಬುಧ ದೃಷ್ಟಿ ಇದೆ',
  'Same rashi but different nakshatras':  'ಒಂದೇ ರಾಶಿ, ಬೇರೆ ನಕ್ಷತ್ರಗಳು',
  'Same nakshatra but different rashis':  'ಒಂದೇ ನಕ್ಷತ್ರ, ಬೇರೆ ರಾಶಿಗಳು',
  'Same nakshatra but different padas':   'ಒಂದೇ ನಕ್ಷತ್ರ, ಬೇರೆ ಪಾದಗಳು',
  'Both rashis share the same lord':      'ಎರಡೂ ರಾಶಿಗಳ ಅಧಿಪತಿ ಒಬ್ಬನೇ',
  'Rashi lords are mutual friends':       'ರಾಶ್ಯಾಧಿಪತಿಗಳು ಪರಸ್ಪರ ಮಿತ್ರರು',
  'Shared nakshatra is a permitted one and the padas differ': 'ಒಂದೇ ನಕ್ಷತ್ರ ಅನುಮತಿಸಿದ ನಕ್ಷತ್ರಗಳಲ್ಲಿ ಒಂದು, ಪಾದಗಳು ಬೇರೆ',
}
export const reasonText = (reason, lang) => (lang === 'kn' && REASONS[reason]) || reason
