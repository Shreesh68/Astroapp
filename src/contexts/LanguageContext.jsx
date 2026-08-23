import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export function LanguageProvider({ children }){
  const [lang, setLang] = useState('en')

  useEffect(()=>{
    const saved = localStorage.getItem('karnataka_lang')
    if(saved) setLang(saved)
  }, [])

  useEffect(()=>{
    localStorage.setItem('karnataka_lang', lang)
    // mark on <html> for styling if needed
    document.documentElement.setAttribute('data-lang', lang)
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(){
  return useContext(LanguageContext)
}
