'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Lang = 'en' | 'ar'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  isRTL: boolean
  t: (en: string, ar: string) => string
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  isRTL: false,
  t: (en) => en,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = (localStorage.getItem('clinic-lang') ?? 'en') as Lang
    setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('clinic-lang', l)
  }

  const isRTL = lang === 'ar'

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', lang)
  }, [lang, isRTL])

  function t(en: string, ar: string) {
    return lang === 'ar' ? ar : en
  }

  return (
    <LangContext.Provider value={{ lang, setLang, isRTL, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
