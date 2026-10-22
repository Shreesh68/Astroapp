import { Capacitor } from '@capacitor/core'

/** True inside the Android app (Capacitor), false in a browser. */
export const isNativeApp = Capacitor.isNativePlatform()

const PUBLIC_SITE = (import.meta.env.VITE_PUBLIC_URL || '').replace(/\/+$/, '')

/**
 * Shareable URL for the current page. Inside the app the page lives at https://localhost/…,
 * which means nothing to the recipient, so links are rebuilt on the public website.
 */
export function publicUrl() {
  const { origin, pathname, search } = window.location
  return `${isNativeApp && PUBLIC_SITE ? PUBLIC_SITE : origin}${pathname}${search}`
}

/**
 * Call `fn` whenever the user comes back to the app/tab (Android resume, tab focus).
 * Returns an unsubscribe function.
 */
export function onResume(fn) {
  const onVisible = () => { if (document.visibilityState === 'visible') fn() }
  document.addEventListener('visibilitychange', onVisible)
  let handle = null
  let cancelled = false
  if (isNativeApp) {
    import('@capacitor/app').then(({ App }) => App.addListener('resume', fn)).then(h => {
      if (cancelled) h.remove()
      else handle = h
    }).catch(() => {})
  }
  return () => {
    cancelled = true
    document.removeEventListener('visibilitychange', onVisible)
    handle?.remove()
  }
}

/**
 * Android back button / back gesture: step back through the app's own screens and only leave
 * the app from the home screen. Without a listener Android closes the app on the first back.
 * `goBack` is called when there is in-app history; returns an unsubscribe function.
 */
export function onBackButton(goBack, goHome) {
  if (!isNativeApp) return () => {}
  let handle = null
  let cancelled = false
  import('@capacitor/app').then(({ App }) => App.addListener('backButton', () => {
    if ((window.history.state?.idx ?? 0) > 0) goBack()
    else if (window.location.pathname !== '/') goHome()
    else App.exitApp()
  })).then(h => {
    if (cancelled) h.remove()
    else handle = h
  }).catch(() => {})
  return () => {
    cancelled = true
    handle?.remove()
  }
}
