import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { translate } from '../lib/i18n'

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: k => k })

function initialLang() {
  try {
    return localStorage.getItem('karnataka_lang') === 'kn' ? 'kn' : 'en'
  } catch {
    return 'en'
  }
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
