// What a person has told the app about their life — married or not, and what they do for work — kept
// per chart on this device. The AI astrologer is given it with every question, so it can speak to the
// person's actual situation ("as a married person…", "in your business…") instead of hedging.
// It comes from two places: one-tap answers under the kundli in the chat, and what the person types
// ("I'm still single", "ನನ್ನ ಹೆಂಡತಿ…").
import { useEffect, useState } from 'react'

export const MARITAL = ['single', 'married', 'engaged', 'divorced', 'widowed']
export const WORK = ['job', 'business', 'student', 'homemaker', 'retired', 'seeking']

const CHANGED = 'km-life-changed'
const keyOf = p => `km_life_${p.date}_${p.timeUnknown ? 'x' : p.time}_${(+p.lat).toFixed(4)}_${(+p.lon).toFixed(4)}`

export function readLife(profile) {
  try {
    const life = JSON.parse(localStorage.getItem(keyOf(profile)) || '{}')
    return {
      ...(MARITAL.includes(life.marital) && { marital: life.marital }),
      ...(WORK.includes(life.work) && { work: life.work }),
    }
  } catch {
    return {}
  }
}

/** Merge what was learned (e.g. { marital: 'single' }) into what is kept; null removes a field. */
export function saveLife(profile, patch) {
  const next = { ...readLife(profile), ...patch }
  for (const k of Object.keys(next)) if (next[k] == null) delete next[k]
  try { localStorage.setItem(keyOf(profile), JSON.stringify(next)) } catch { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent(CHANGED))
  return next
}

/** The kept facts, re-read whenever they change. */
export function useLife(profile) {
  const [life, setLife] = useState(() => readLife(profile))
  const key = keyOf(profile)
  useEffect(() => {
    const update = () => setLife(readLife(profile))
    update()
    window.addEventListener(CHANGED, update)
    return () => window.removeEventListener(CHANGED, update)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return life
}

// Statements about the person's own life, in English and Kannada. Questions ("will I get married?")
// say nothing about the present, so only first-person statements count. Checked in order: the first
// match of each field wins (e.g. "looking for a job" before "job").
const MARITAL_SAYS = [
  ['single', /\bi(?:'?m| am) (?:still |not yet |currently )?(?:single|unmarried|not married)\b|\bnot (?:yet )?married\b|\bnever (?:been )?married\b|ಮದುವೆ\s*(?:ಇನ್ನೂ\s*)?(?:ಆಗಿಲ್ಲ|ಆಗಲಿಲ್ಲ)|ಅವಿವಾಹಿತ/i],
  ['divorced', /\bi(?:'?m| am| got) (?:divorced|separated)\b|\bmy divorce\b|ವಿಚ್ಛೇದನ(?:\s*ಆಗಿದೆ|ವಾಗಿದೆ|\s*ಪಡೆದ)/i],
  ['widowed', /\bi(?:'?m| am) (?:a )?(?:widow|widower|widowed)\b|\bmy (?:late )?(?:husband|wife) (?:passed|died)\b|ವಿಧವೆ|ವಿಧುರ/i],
  ['engaged', /\bi(?:'?m| am| got) engaged\b|\bmy (?:fianc[eé]e?)\b|ನಿಶ್ಚಿತಾರ್ಥ\s*ಆಗಿದೆ/i],
  ['married', /\bi(?:'?m| am) married\b|\bi got married\b|\bwe (?:got )?married\b|\bmy (?:wife|husband|spouse|in-laws|mother-in-law|father-in-law)\b|ಮದುವೆ\s*ಆಗಿದೆ|ಮದುವೆಯಾಗಿದೆ|ನನ್ನ\s*(?:ಹೆಂಡತಿ|ಗಂಡ|ಪತ್ನಿ|ಪತಿ|ಅತ್ತೆ|ಮಾವ)|(?<!ಅ)ವಿವಾಹಿತ(?:ನು|ಳು|ರು)?(?:\s|$|\.)/i],
]
const WORK_SAYS = [
  ['seeking', /\b(?:unemployed|jobless|lost my job|(?:looking|searching) for (?:a |any )?(?:job|work)|i (?:don'?t|do not) have (?:a )?job|no job)\b|ಕೆಲಸ\s*ಹುಡುಕು|ಕೆಲಸ\s*ಇಲ್ಲ|ನಿರುದ್ಯೋಗ/i],
  ['retired', /\bi(?:'?m| am) retired\b|\bafter (?:my )?retirement\b|ನಿವೃತ್ತ(?:ನಾಗಿ|ಳಾಗಿ|ರಾಗಿ)?/i],
  ['student', /\bi(?:'?m| am) (?:a |an )?(?:student|studying)\b|\bi(?:'?m| am) (?:in|doing) (?:my )?(?:college|degree|engineering|mbbs|masters|phd|puc|12th|10th)\b|ವಿದ್ಯಾರ್ಥಿ|ಓದುತ್ತಿದ್ದೇನೆ/i],
  ['homemaker', /\bi(?:'?m| am) (?:a )?(?:homemaker|housewife|home maker|stay[- ]at[- ]home)\b|ಗೃಹಿಣಿ/i],
  ['business', /\bmy (?:own )?(?:business|shop|company|firm|startup)\b|\bi (?:run|have|own|started) (?:a |my |our )?(?:small |family |own )?(?:business|shop|company|startup)\b|\bself[- ]employed\b|ವ್ಯಾಪಾರ\s*ಮಾಡುತ್ತ|ಸ್ವಂತ\s*(?:ಉದ್ಯಮ|ವ್ಯಾಪಾರ|ಅಂಗಡಿ)/i],
  ['job', /\b(?:i|and) work (?:as|at|in|for)\b|\bi(?:'?m| am) (?:working|employed)\b|\bmy (?:job|office|boss|manager|company|employer)\b|\bi(?:'?m| am) (?:a |an )?(?:software |)(?:engineer|teacher|doctor|nurse|developer|accountant|clerk|lecturer|professor|banker|lawyer|police)\b|ಕೆಲಸ\s*ಮಾಡುತ್ತಿದ್ದೇನೆ|ನೌಕರಿ\s*ಮಾಡುತ್ತ|ನನ್ನ\s*(?:ಕಚೇರಿ|ಆಫೀಸ್|ಕಂಪನಿ)/i],
]

/** What a message says about the person's own life: { marital?, work? } (empty when it says nothing). */
export function lifeFromText(text = '') {
  const found = {}
  const marital = MARITAL_SAYS.find(([, re]) => re.test(text))
  if (marital) found.marital = marital[0]
  const work = WORK_SAYS.find(([, re]) => re.test(text))
  if (work) found.work = work[0]
  return found
}

const SAYS = {
  marital: { single: 'not married', married: 'married', engaged: 'engaged to be married', divorced: 'divorced', widowed: 'widowed' },
  work: { job: 'works in a job', business: 'runs a business / self-employed', student: 'a student', homemaker: 'a homemaker', retired: 'retired', seeking: 'looking for work' },
}

/** One line for the AI, or '' when nothing is known. */
export function lifeLine(life) {
  const parts = [life.marital && SAYS.marital[life.marital], life.work && SAYS.work[life.work]].filter(Boolean)
  return parts.length ? `Life situation (told by the person — build on it, never contradict it): ${parts.join('; ')}.` : ''
}
