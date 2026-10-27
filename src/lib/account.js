// Accounts: "Continue with Google" (Firebase Authentication), and the person's kundlis kept in their account
// (Cloud Firestore, users/{uid}/people/{id}). Login is optional: without it everything works as before, on
// this phone only. Login with a mobile number + SMS code is built but off (VITE_PHONE_LOGIN=on to enable):
// Firebase sends SMS only on the paid Blaze plan.
//
// The native Firebase SDKs do the work inside the Android app (SMS auto-read, offline cache); in a
// browser the same plugins fall back to the Firebase JS SDK.
import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { initializeApp } from 'firebase/app'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { FirebaseFirestore } from '@capacitor-firebase/firestore'
import { readProfiles, replaceProfiles, setCloudSink } from './profiles'

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
}

/** False in builds without Firebase settings (the website): the app then has no login at all. */
export const accountsAvailable = !!config.apiKey
/** Mobile number + SMS code login, offered as a second option when switched on. */
export const phoneLoginAvailable = accountsAvailable && env.VITE_PHONE_LOGIN === 'on'

// the plugins' browser implementations use the default JS app; the Android app uses google-services.json
if (accountsAvailable && !Capacitor.isNativePlatform()) initializeApp(config)

// ── Signed-in state ───────────────────────────────────────

let state = { ready: !accountsAvailable, user: null }
const listeners = new Set()
const setState = next => { state = { ...state, ...next }; listeners.forEach(l => l(state)) }

/** { ready, user: { uid, name, email, phoneNumber, photoUrl } | null } — re-renders on log in / out. */
export function useAccount() {
  const [s, set] = useState(state)
  useEffect(() => { listeners.add(set); set(state); return () => listeners.delete(set) }, [])
  return s
}

if (accountsAvailable) {
  FirebaseAuthentication.addListener('authStateChange', ({ user }) => onUser(user))
  FirebaseAuthentication.getCurrentUser().then(({ user }) => onUser(user), () => setState({ ready: true }))
}

let syncing = null // uid whose kundlis are currently mirrored

function onUser(user) {
  const u = user ? { uid: user.uid, name: user.displayName, email: user.email, phoneNumber: user.phoneNumber, photoUrl: user.photoUrl } : null
  setState({ ready: true, user: u })
  if (u && syncing !== u.uid) startSync(u.uid)
  if (!u && syncing) stopSync()
}

// ── Google ────────────────────────────────────────────────

/** Show Google's account picker and log in; rejects with 'cancelled' or a short reason. */
export async function signInWithGoogle() {
  try {
    await FirebaseAuthentication.signInWithGoogle()
  } catch (err) {
    const message = String(err?.message || err)
    console.warn('google login:', message)
    if (/cancel|closed|dismiss|16:|no credentials/i.test(message)) throw new Error('cancelled')
    throw new Error(/network|offline|7:/i.test(message) ? 'network' : 'failed')
  }
}

// ── Phone number + code (off unless phoneLoginAvailable) ──

/** A 10-digit Indian mobile number (6–9 first), with or without +91 / 0 in front → '+91XXXXXXXXXX' or null. */
export function indianMobile(input) {
  const digits = String(input).replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null
}

let recaptcha = null

/**
 * Send the login code by SMS. Handlers: onCodeSent(verificationId), onVerified() when Android reads the
 * SMS (or verifies the number) by itself, onFailed(message). Returns a function that stops listening.
 */
export async function sendCode(phoneNumber, { onCodeSent, onVerified, onFailed }, { resend = false } = {}) {
  const handles = await Promise.all([
    FirebaseAuthentication.addListener('phoneCodeSent', e => onCodeSent(e.verificationId)),
    FirebaseAuthentication.addListener('phoneVerificationCompleted', () => onVerified()),
    FirebaseAuthentication.addListener('phoneVerificationFailed', e => onFailed(e.message)),
  ])
  const stop = () => handles.forEach(h => h.remove())
  try {
    const options = { phoneNumber, resendCode: resend && Capacitor.isNativePlatform() }
    if (!Capacitor.isNativePlatform()) {
      // the web SDK needs a (normally invisible) reCAPTCHA check before it will send an SMS
      const { getAuth, RecaptchaVerifier } = await import('firebase/auth')
      recaptcha ??= new RecaptchaVerifier(getAuth(), 'recaptcha-box', { size: 'invisible' })
      options.recaptchaVerifier = recaptcha
    }
    await FirebaseAuthentication.signInWithPhoneNumber(options)
  } catch (err) {
    onFailed(err?.message || String(err))
  }
  return stop
}

/** Check the code from the SMS; resolves once logged in, rejects with a short reason. */
export async function confirmCode(verificationId, code) {
  try {
    await FirebaseAuthentication.confirmVerificationCode({ verificationId, verificationCode: code })
  } catch (err) {
    const message = String(err?.message || err)
    throw new Error(/invalid|wrong|mismatch/i.test(message) ? 'wrong_code' : /expired|session/i.test(message) ? 'expired' : 'failed')
  }
}

export async function logOut() {
  await FirebaseAuthentication.signOut()
}

/**
 * Delete the account for good: every kundli stored in it, then the login itself. Firebase asks for a fresh
 * sign-in before deleting a login that was opened long ago; then the person picks their Google account
 * once more and the deletion goes ahead.
 */
export async function deleteAccount() {
  const { user } = await FirebaseAuthentication.getCurrentUser()
  if (!user) return
  const ref = collection(user.uid)
  const { snapshots } = await FirebaseFirestore.getCollection({ reference: ref })
  if (snapshots.length) {
    await FirebaseFirestore.writeBatch({ operations: snapshots.map(s => ({ type: 'delete', reference: `${ref}/${s.id}` })) })
  }
  try {
    await FirebaseAuthentication.deleteUser()
  } catch (err) {
    if (!/recent|credential|requires/i.test(String(err?.message || err))) throw err
    await FirebaseAuthentication.signInWithGoogle()
    await FirebaseAuthentication.deleteUser()
  }
  // nothing of the account stays on this phone either: its kundlis and the AI chats about them
  stopSync()
  try {
    Object.keys(localStorage).filter(k => k.startsWith('km_chat_')).forEach(k => localStorage.removeItem(k))
  } catch { /* storage unavailable */ }
  setState({ user: null })
}

/** Turn a Firebase error message into one of the app's short reasons. */
export function loginError(message = '') {
  console.warn('phone login:', message)
  if (/too.?many|quota|blocked/i.test(message)) return 'too_many'
  if (/network|unavailable|offline/i.test(message)) return 'network'
  if (/invalid.*phone|phone.*invalid|format/i.test(message)) return 'bad_number'
  return 'failed'
}

// ── Kundlis in the account ────────────────────────────────

const collection = uid => `users/${uid}/people`
const FIELDS = ['id', 'name', 'gender', 'date', 'time', 'timeUnknown', 'place', 'lat', 'lon', 'tz', 'display_name', 'savedAt', 'self']
// Firestore rejects undefined values, so send only the known fields that are set
const clean = p => Object.fromEntries(FIELDS.filter(k => p[k] !== undefined && p[k] !== null).map(k => [k, p[k]]))

let listenerId = null

async function startSync(uid) {
  syncing = uid
  const ref = collection(uid)
  setCloudSink({
    put: p => FirebaseFirestore.setDocument({ reference: `${ref}/${p.id}`, data: clean(p) }).catch(console.error),
    remove: id => FirebaseFirestore.deleteDocument({ reference: `${ref}/${id}` }).catch(console.error),
  })
  try {
    // first login on this phone: people saved here before go into the account too
    const { snapshots } = await FirebaseFirestore.getCollection({ reference: ref })
    const inCloud = new Set(snapshots.map(s => s.id))
    const localOnly = readProfiles().filter(p => p.id && !inCloud.has(p.id))
    // the account may already have its own "My kundli"; then a local one stops being "self"
    const cloudHasSelf = snapshots.some(s => s.data?.self)
    if (localOnly.length) {
      await FirebaseFirestore.writeBatch({
        operations: localOnly.map(p => ({ type: 'set', reference: `${ref}/${p.id}`, data: clean(cloudHasSelf ? { ...p, self: false } : p) })),
      })
    }
  } catch (err) {
    console.error('kundli sync failed', err)
  }
  if (syncing !== uid) return
  // from now on the account's copy is the truth; changes from other phones arrive here too
  listenerId = await FirebaseFirestore.addCollectionSnapshotListener({ reference: ref }, (event, error) => {
    if (error) return console.error('kundli listener', error)
    if (event) replaceProfiles(event.snapshots.filter(s => s.data).map(s => ({ ...s.data, id: s.id })))
  })
}

function stopSync() {
  syncing = null
  setCloudSink(null)
  if (listenerId) FirebaseFirestore.removeSnapshotListener({ callbackId: listenerId }).catch(() => {})
  listenerId = null
  // the kundlis are safe in the account; don't leave them on a phone someone else may use next
  replaceProfiles([])
}
