import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'
// Fonts ship inside the app: no wait for Google Fonts on a slow network, and the same look offline.
// Poppins for Latin, Noto Sans Kannada for Kannada, Noto Serif (+ Kannada) for headings.
import '@fontsource/poppins/latin-400.css'
import '@fontsource/poppins/latin-500.css'
import '@fontsource/poppins/latin-600.css'
import '@fontsource/poppins/latin-700.css'
import '@fontsource/noto-sans-kannada/kannada-400.css'
import '@fontsource/noto-sans-kannada/kannada-600.css'
import '@fontsource/noto-sans-kannada/kannada-700.css'
import '@fontsource/noto-serif/latin-600.css'
import '@fontsource/noto-serif/latin-700.css'
import '@fontsource/noto-serif-kannada/kannada-600.css'
import '@fontsource/noto-serif-kannada/kannada-700.css'
import { isNativeApp } from './lib/platform'

// In the app, lock the page to the phone's width: a stray double-tap (e.g. flipping the language
// quickly) must not zoom the screen, since the WebView has no pinch-zoom to undo it.
if (isNativeApp) {
  document.querySelector('meta[name="viewport"]')?.setAttribute('content',
    'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
)
