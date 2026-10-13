'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { id } from '@/locales/id'
import { en } from '@/locales/en'

export type Language = 'id' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isMounted: boolean
}

const STORAGE_KEY = 'nihongo_sora_language'

const dictionaries = {
  id,
  en,
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

/**
 * Resolves dot-notated key in nested object and replaces {placeholders} with params
 */
function resolveTranslation(
  dict: Record<string, unknown>,
  key: string,
  params?: Record<string, string | number>
): string | null {
  const parts = key.split('.')
  let current: unknown = dict

  for (const part of parts) {
    if (
      current !== null &&
      typeof current === 'object' &&
      part in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return null
    }
  }

  if (typeof current !== 'string') return null

  if (params) {
    return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
      return str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal))
    }, current)
  }

  return current
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('id')
  const [isMounted, setIsMounted] = useState<boolean>(false)

  // Initialize from localStorage after mounting to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'id' || stored === 'en') {
        setLanguageState(stored)
      }
    } catch {
      // ignore localStorage errors
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'id' || e.newValue === 'en')) {
        setLanguageState(e.newValue as Language)
      }
    }

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<Language>
      if (customEvent.detail === 'id' || customEvent.detail === 'en') {
        setLanguageState(customEvent.detail)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('nihongo_sora_language_changed', handleCustomChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('nihongo_sora_language_changed', handleCustomChange)
    }
  }, [])

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang)
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
      window.dispatchEvent(
        new CustomEvent<Language>('nihongo_sora_language_changed', { detail: newLang })
      )
    } catch {
      // ignore
    }
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const activeDict = dictionaries[language] as unknown as Record<string, unknown>
      const result = resolveTranslation(activeDict, key, params)
      if (result !== null) return result

      // Fallback to Indonesian if key is missing in English
      if (language !== 'id') {
        const fallbackResult = resolveTranslation(
          dictionaries.id as unknown as Record<string, unknown>,
          key,
          params
        )
        if (fallbackResult !== null) return fallbackResult
      }

      return key
    },
    [language]
  )

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isMounted }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Convenient alias
export const useTranslation = useLanguage
