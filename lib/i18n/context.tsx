'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type Lang, t } from './portal'

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  tr: typeof t['en']
  isRtl: boolean
}

const Ctx = createContext<LangCtx>({
  lang: 'ar',
  setLang: () => {},
  tr: t.ar,
  isRtl: true,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar')

  useEffect(() => {
    const saved = localStorage.getItem('portal-lang') as Lang | null
    if (saved === 'en' || saved === 'ar') setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('portal-lang', l)
  }

  const isRtl = lang === 'ar'

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', lang)
  }, [lang, isRtl])

  return (
    <Ctx.Provider value={{ lang, setLang, tr: t[lang], isRtl }}>
      {children}
    </Ctx.Provider>
  )
}

export const useLang = () => useContext(Ctx)
