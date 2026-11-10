import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { translate } from '../lib/i18n'

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: k => k })

// the person's own choice, once made; on first launch, Kannada when the phone itself is set to Kannada
function initialLang() {
  try {
    const chosen = localStorage.getItem('karnataka_lang')
    if (chosen) return chosen === 'kn' ? 'kn' : 'en'
  } catch { /* storage unavailable */ }
  const phone = typeof navigator !== 'undefined' ? [navigator.language, ...(navigator.languages || [])] : []
  return phone.some(l => /^kn\b/i.test(l || '')) ? 'kn' : 'en'
}

export function LanguageProvider({ children }){
  const [lang, setLang] = useState(initialLang)

  useEffect(()=>{
    try { localStorage.setItem('karnataka_lang', lang) } catch { /* ignore */ }
    // mark on <html> for styling and screen readers
    document.documentElement.setAttribute('data-lang', lang)
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(){
  return useContext(LanguageContext)
}
