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
