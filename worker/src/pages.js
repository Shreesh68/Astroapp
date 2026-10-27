// Public pages the Play Store listing links to: the privacy policy and how to delete an account.
// Served by the chat server at /privacy and /delete-account so they need no separate website.
const CONTACT = 'shreesh.hegde00@gmail.com'
const UPDATED = '27 October 2026'

const page = (title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · AIAstrology</title>
<style>
  :root { color-scheme: light dark; --bg: #FFF8EC; --fg: #2B2118; --muted: #6B5B4B; --accent: #9E1B32; }
  @media (prefers-color-scheme: dark) { :root { --bg: #1C1612; --fg: #F3E9DA; --muted: #B9A893; --accent: #F08A9B; } }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.6 system-ui, -apple-system, "Noto Sans Kannada", sans-serif; }
  main { max-width: 720px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 1.7rem; margin: 0 0 4px; } h2 { font-size: 1.15rem; margin: 28px 0 6px; }
  p, li { color: var(--fg); } .muted { color: var(--muted); font-size: .9rem; }
  a { color: var(--accent); } ul, ol { padding-left: 1.3rem; }
</style></head>
<body><main>${body}</main></body></html>`

export const PRIVACY = page('Privacy policy', `
<h1>AIAstrology — Privacy policy</h1>
<p class="muted">Last updated ${UPDATED}. App: AIAstrology (com.karnatakamatch.app), Android.</p>

<p>AIAstrology makes Vedic birth charts, kundli matching and a daily Panchang, and has an AI astrologer you can chat with.
This page explains what information the app uses, where it goes, and how you can delete it.</p>

<h2>What the app uses</h2>
<ul>
  <li><b>Birth details you enter</b> — name, gender, date and time of birth, and birth place (with its map coordinates).
  Charts, matching and the Panchang are calculated <b>on your phone</b>; these calculations send nothing anywhere.</li>
  <li><b>Questions you ask the AI astrologer</b>, and the answers.</li>
  <li><b>Your Google account's name, email and user ID</b> — only if you choose to log in. Login is optional.</li>
</ul>
<p>The app does not use your location, contacts, photos, microphone or advertising ID, shows no ads, and does not sell or share
your information for advertising.</p>

<h2>Where information goes</h2>
<ul>
  <li><b>Saved people and AI chats</b> are stored on your phone. Uninstalling the app or clearing its data removes them.</li>
  <li><b>If you log in with Google</b>, the people you save (birth details as above) are also stored in your account in
  Google Firebase (Cloud Firestore, India region) so they are back when you log in on another phone. Only you can read them.
  Login itself is handled by Firebase Authentication.</li>
  <li><b>AI astrologer</b>: when you ask a question, the question, the earlier messages of that chat, and a summary of the
  chart (name, gender, birth date, time and place, planet positions and dasha periods) are sent over an encrypted connection
  to our server on Cloudflare, which passes them to an AI model running on Cloudflare Workers AI and returns the answer.
  The server does not store your questions or answers. Cloudflare briefly processes request data (including your IP
  address) to run and protect the service, under its own privacy policy.</li>
  <li><b>Place search</b>: the place name you type is sent to Photon (komoot) and OpenStreetMap Nominatim to find matching
  places.</li>
</ul>

<h2>Keeping and deleting your information</h2>
<ul>
  <li>Remove any saved person with × in the app; it is removed from your account too.</li>
  <li><b>Delete your account</b> in the app: <i>My account → Delete my account</i>. This erases every kundli in the account
  and the login straight away, and the AI chats on that phone. Or see <a href="/delete-account">how to delete an account</a>
  without the app.</li>
  <li>Information in Firebase stays until you delete it or your account. Firebase backups are removed within about 30 days.</li>
</ul>

<h2>Children</h2>
<p>The app is meant for adults and is not directed at children under 13.</p>

<h2>Security</h2>
<p>All information sent by the app travels encrypted (HTTPS). Information in your account can be read only after logging in
with that Google account.</p>

<h2>AI answers</h2>
<p>AI astrologer answers are generated automatically, are for guidance and interest only, and are not medical, legal or
financial advice. Use <b>⚑ Report</b> under any answer to tell us about a harmful or wrong answer.</p>

<h2>Changes and contact</h2>
<p>We will update this page if anything here changes. Questions or requests: <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
`)

export const DELETE_ACCOUNT = page('Delete your account', `
<h1>AIAstrology — Delete your account</h1>
<p class="muted">App: AIAstrology (com.karnatakamatch.app), by Shreesh Hegde.</p>

<h2>In the app (immediate)</h2>
<ol>
  <li>Open AIAstrology and tap your account at the top of the home screen (<i>My account</i>).</li>
  <li>Tap <b>Delete my account</b> at the bottom, then <b>Yes, delete everything</b>.</li>
  <li>If asked, pick your Google account once more to confirm it is you.</li>
</ol>

<h2>Without the app</h2>
<p>Email <a href="mailto:${CONTACT}?subject=Delete%20my%20AIAstrology%20account">${CONTACT}</a> from the Gmail address
you log in with, with the subject "Delete my AIAstrology account". We delete the account within 7 days and reply when it is done.</p>

<h2>What is deleted</h2>
<ul>
  <li>Your login (Google name, email and user ID) in Firebase Authentication.</li>
  <li>Every kundli saved in your account (names, gender, birth dates, times and places).</li>
  <li>AI chats are kept only on your phone; deleting in the app also erases them there. Our AI server keeps no copies.</li>
</ul>
<p>Nothing is kept after deletion, apart from Firebase's own backups, which expire within about 30 days.</p>
`)
