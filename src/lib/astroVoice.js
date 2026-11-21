// What each astrologer says in the chat's own lines — the questions while taking birth details, the
// greeting once the chart is ready, and the words before the kundli when someone asks to see it — so the
// whole conversation sounds like the person chosen, not like a form. Three voices by years of practice
// (the same tiers as the AI's instructions in astrologers.js), in English and Kannada.

const LINES = {
  // a few years in: casual, friendly, quick
  young: {
    en: {
      hello: 'Hi! I’m {name} 😊 Happy to look at your chart. Just a few quick details and we’re set.',
      ask_who: 'Whose chart are we looking at — yours, or someone you’ve saved?',
      ask_name: 'First things first — what’s the name? Yours or someone else’s, either is fine.',
      ask_gender: 'Got it. Is {name} male or female?',
      ask_date: 'And {name}’s date of birth?',
      ask_time: 'What time was {name} born? Roughly is okay — the time on the birth certificate is best.',
      ask_place: 'Last one — where was {name} born? Start typing the town and pick it from the list.',
      confirm_intro: 'Quick check, here’s what I’ve got:',
      confirm_q: 'All good? I’ll pull up the chart.',
      greet: 'Okay, I’ve got {name}’s chart in front of me. What’s on your mind — job, studies, a move abroad? Ask away.',
      chart_intro: 'Sure — here’s {name}’s chart:',
    },
    kn: {
      hello: 'ಹಾಯ್! ನಾನು {name} 😊 ನಿಮ್ಮ ಜಾತಕ ನೋಡಲು ಖುಷಿ. ಕೆಲವು ವಿವರ ಹೇಳಿ, ಸಾಕು.',
      ask_who: 'ಯಾರ ಜಾತಕ ನೋಡೋಣ — ನಿಮ್ಮದೇ, ಅಥವಾ ಉಳಿಸಿದವರಲ್ಲಿ ಯಾರದ್ದಾದರೂ?',
      ask_name: 'ಮೊದಲು ಹೆಸರು ಹೇಳಿ — ನಿಮ್ಮದಾದರೂ ಸರಿ, ಬೇರೆಯವರದಾದರೂ ಸರಿ.',
      ask_gender: 'ಸರಿ. {name} ಗಂಡೋ ಹೆಣ್ಣೋ?',
      ask_date: '{name} ಅವರ ಜನ್ಮ ದಿನಾಂಕ?',
      ask_time: '{name} ಹುಟ್ಟಿದ ಸಮಯ ಎಷ್ಟು? ಅಂದಾಜು ಆದರೂ ಸರಿ — ಜನನ ಪ್ರಮಾಣಪತ್ರದ ಸಮಯ ಇನ್ನೂ ಒಳ್ಳೆಯದು.',
      ask_place: 'ಕೊನೆಯದು — {name} ಎಲ್ಲಿ ಹುಟ್ಟಿದರು? ಊರಿನ ಹೆಸರು ಟೈಪ್ ಮಾಡಿ, ಪಟ್ಟಿಯಿಂದ ಆರಿಸಿ.',
      confirm_intro: 'ಒಮ್ಮೆ ನೋಡಿ, ನನ್ನ ಬಳಿ ಇರುವುದು:',
      confirm_q: 'ಸರಿ ಇದೆಯಾ? ಜಾತಕ ತೆಗೆಯುತ್ತೇನೆ.',
      greet: 'ಸರಿ, {name} ಅವರ ಜಾತಕ ನನ್ನ ಮುಂದಿದೆ. ಏನು ಕೇಳಬೇಕು — ಉದ್ಯೋಗ, ಓದು, ವಿದೇಶ? ಕೇಳಿ.',
      chart_intro: 'ಖಂಡಿತ — ಇದು {name} ಅವರ ಜಾತಕ:',
    },
  },
  // many years of consultations: warm and polite
  seasoned: {
    en: {
      hello: 'Namaste 🙏 I’m {name}. Let’s go through your chart together — I’ll just need a few birth details first.',
      ask_who: 'Whose horoscope shall we look at today?',
      ask_name: 'May I have the name, please? It can be yours or a family member’s.',
      ask_gender: 'Thank you. Is {name} male or female?',
      ask_date: 'What is {name}’s date of birth?',
      ask_time: 'And the time of birth? The time on the birth certificate is best, but an approximate time also helps.',
      ask_place: 'Where was {name} born? Type the town or village and choose it from the list.',
      confirm_intro: 'Let me read it back to you:',
      confirm_q: 'Is this correct? Then I’ll prepare the chart.',
      greet: 'I have {name}’s chart ready. Tell me, what would you like to know?',
      chart_intro: 'Here is {name}’s kundli:',
    },
    kn: {
      hello: 'ನಮಸ್ಕಾರ 🙏 ನಾನು {name}. ನಿಮ್ಮ ಜಾತಕವನ್ನು ಒಟ್ಟಿಗೆ ನೋಡೋಣ — ಮೊದಲು ಕೆಲವು ಜನನ ವಿವರಗಳು ಬೇಕು.',
      ask_who: 'ಇಂದು ಯಾರ ಜಾತಕ ನೋಡೋಣ?',
      ask_name: 'ದಯವಿಟ್ಟು ಹೆಸರು ಹೇಳಿ — ನಿಮ್ಮದು ಅಥವಾ ಮನೆಯವರದು.',
      ask_gender: 'ಧನ್ಯವಾದ. {name} ಗಂಡೋ ಹೆಣ್ಣೋ?',
      ask_date: '{name} ಅವರ ಜನ್ಮ ದಿನಾಂಕ ಯಾವುದು?',
      ask_time: 'ಹುಟ್ಟಿದ ಸಮಯ? ಜನನ ಪ್ರಮಾಣಪತ್ರದ ಸಮಯ ಉತ್ತಮ; ಅಂದಾಜು ಸಮಯವೂ ಸಹಾಯವಾಗುತ್ತದೆ.',
      ask_place: '{name} ಹುಟ್ಟಿದ ಊರು ಯಾವುದು? ಊರಿನ ಹೆಸರು ಟೈಪ್ ಮಾಡಿ ಪಟ್ಟಿಯಿಂದ ಆರಿಸಿ.',
      confirm_intro: 'ಒಮ್ಮೆ ಓದಿ ಹೇಳುತ್ತೇನೆ:',
      confirm_q: 'ಇದು ಸರಿಯೇ? ಹಾಗಾದರೆ ಜಾತಕ ಸಿದ್ಧಪಡಿಸುತ್ತೇನೆ.',
      greet: '{name} ಅವರ ಜಾತಕ ಸಿದ್ಧವಾಗಿದೆ. ಹೇಳಿ, ಏನು ತಿಳಿಯಬೇಕು?',
      chart_intro: 'ಇದು {name} ಅವರ ಜಾತಕ ಕುಂಡಲಿ:',
    },
  },
  // decades of practice: unhurried, traditional, like the family astrologer
  elder: {
    en: {
      hello: 'Namaskara 🙏 I am {name}. Come, let us look at the horoscope together, calmly. First I will need the birth details.',
      ask_who: 'Tell me, whose jataka shall we see today?',
      ask_name: 'What is the name of the person? Yours, or someone in the family — both are fine.',
      ask_gender: 'Good. And is {name} male or female?',
      ask_date: 'On which date was {name} born?',
      ask_time: 'And at what time? If you have the time from the birth certificate, that is best; otherwise tell me what the elders remember.',
      ask_place: 'In which town or village was {name} born? Type the name and choose it from the list.',
      confirm_intro: 'Let me repeat what you have told me:',
      confirm_q: 'Is everything correct? Then I shall cast the chart.',
      greet: 'I have cast {name}’s chart and studied it. Now tell me what is on your mind — work, marriage, health, or the period you are passing through.',
      chart_intro: 'Here is {name}’s jataka, cast for the moment of birth:',
    },
    kn: {
      hello: 'ನಮಸ್ಕಾರ 🙏 ನಾನು {name}. ಬನ್ನಿ, ನಿಧಾನವಾಗಿ ಜಾತಕ ನೋಡೋಣ. ಮೊದಲು ಜನನ ವಿವರಗಳು ಬೇಕು.',
      ask_who: 'ಹೇಳಿ, ಇಂದು ಯಾರ ಜಾತಕ ನೋಡೋಣ?',
      ask_name: 'ಜಾತಕದವರ ಹೆಸರೇನು? ನಿಮ್ಮದಾಗಲಿ, ಮನೆಯವರದಾಗಲಿ — ಎರಡೂ ಸರಿ.',
      ask_gender: 'ಒಳ್ಳೆಯದು. {name} ಗಂಡೋ, ಹೆಣ್ಣೋ?',
      ask_date: '{name} ಯಾವ ದಿನಾಂಕದಂದು ಜನಿಸಿದರು?',
      ask_time: 'ಯಾವ ಸಮಯಕ್ಕೆ? ಜನನ ಪ್ರಮಾಣಪತ್ರದ ಸಮಯವಿದ್ದರೆ ಉತ್ತಮ; ಇಲ್ಲದಿದ್ದರೆ ಹಿರಿಯರು ನೆನಪಿಸಿಕೊಳ್ಳುವ ಸಮಯ ಹೇಳಿ.',
      ask_place: '{name} ಯಾವ ಊರಿನಲ್ಲಿ ಜನಿಸಿದರು? ಹೆಸರು ಟೈಪ್ ಮಾಡಿ ಪಟ್ಟಿಯಿಂದ ಆರಿಸಿ.',
      confirm_intro: 'ನೀವು ಹೇಳಿದ್ದನ್ನು ಒಮ್ಮೆ ಹೇಳುತ್ತೇನೆ:',
      confirm_q: 'ಎಲ್ಲವೂ ಸರಿಯೇ? ಹಾಗಾದರೆ ಜಾತಕ ಹಾಕುತ್ತೇನೆ.',
      greet: '{name} ಅವರ ಜಾತಕ ಹಾಕಿ ನೋಡಿದ್ದೇನೆ. ಈಗ ಹೇಳಿ, ಮನಸ್ಸಿನಲ್ಲಿ ಏನಿದೆ — ಉದ್ಯೋಗ, ಮದುವೆ, ಆರೋಗ್ಯ, ಅಥವಾ ಈಗ ನಡೆಯುತ್ತಿರುವ ಕಾಲ?',
      chart_intro: 'ಇದು ಜನನ ಕ್ಷಣಕ್ಕೆ ಹಾಕಿದ {name} ಅವರ ಜಾತಕ:',
    },
  },
}

/** The voice for an astrologer's years: young (up to 8), seasoned (up to 20), elder (more). */
export const voiceOf = years => (years <= 8 ? 'young' : years <= 20 ? 'seasoned' : 'elder')

/**
 * One of the astrologer's lines, filled in: say(astro, 'kn', 'ask_date', { name: 'Ravi' }).
 * {name} in 'hello' is the astrologer's own name; elsewhere it is the person whose chart it is.
 */
export function say(astro, lang, key, vars = {}) {
  const line = LINES[voiceOf(astro.years)][lang === 'kn' ? 'kn' : 'en'][key]
  if (!line) return ''
  const all = key === 'hello' ? { name: astro.name[lang === 'kn' ? 'kn' : 'en'] } : vars
  return line.replace(/\{(\w+)\}/g, (_, k) => all[k] ?? '')
}

// "show me the chart" / "ಜಾತಕ ತೋರಿಸಿ": the kundli is shown at once, on the phone, without asking the AI
const SHOW_WORDS = /\b(show|see|view|display|draw|open|send|give|share)\b[^.?!]{0,25}\b(chart|kundli|kundali|horoscope|jataka|jathaka)\b/i
const ONLY_CHART = /^\s*(my |the |his |her )?(birth )?(chart|kundli|kundali|horoscope|jataka|jathaka)\s*[?.!]*\s*$/i
const KN_SHOW = /(ಜಾತಕ|ಕುಂಡಲಿ)[^.?!]{0,20}(ತೋರಿಸಿ|ತೋರಿಸು|ತೋರಿಸುವಿರಾ|ನೋಡಬೇಕು|ನೋಡಲು|ಕಳುಹಿಸಿ|ಬೇಕು)/

// "can you see in my chart when I'll marry?" is a question for the astrologer, not a request to see it
const ASKING = /\b(when|what|how|why|which|will|would|should|about|does|say|tell|explain|marri\w*|career|job|health)\b|ಯಾವಾಗ|ಏನು|ಹೇಗೆ|ಏಕೆ|ಯಾಕೆ|ಬಗ್ಗೆ|ಮದುವೆ|ಉದ್ಯೋಗ|ಆರೋಗ್ಯ/i

/** Whether a message only asks to see the chart. */
export const isChartRequest = text => !ASKING.test(text) && (SHOW_WORDS.test(text) || ONLY_CHART.test(text) || KN_SHOW.test(text))
