import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'
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
