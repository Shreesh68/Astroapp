// Where people reach the app's developer: AI answer reports, account deletion requests, privacy questions.
// The same address is in the Play Store listing and on the privacy page (worker/src/pages.js).
export const CONTACT_EMAIL = 'shreesh.hegde00@gmail.com'

// public pages served by the chat server (worker/src/pages.js), also linked from the Play Store listing
const PAGES = 'https://karnatakamatch-chat.astrology-app.workers.dev'
export const PRIVACY_URL = `${PAGES}/privacy`
export const DELETE_ACCOUNT_URL = `${PAGES}/delete-account`

/** A mailto: link that reports one AI answer, with the question and (shortened) answer filled in. */
export function reportLink(question = '', answer = '') {
  const cut = (s, n) => (s.length > n ? `${s.slice(0, n)}…` : s)
  const body = `What is wrong with this answer?\n\n\n---\nQuestion: ${cut(question, 300)}\n\nAnswer: ${cut(answer, 1200)}`
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('AIAstrology: report an AI answer')}&body=${encodeURIComponent(body)}`
}
