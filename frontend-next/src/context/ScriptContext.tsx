'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ScriptType } from '@/types/character'

interface ScriptContextType {
  script: ScriptType
  setScript: (script: ScriptType) => void
  toggleScript: () => void
}

const ScriptContext = createContext<ScriptContextType | undefined>(undefined)

const STORAGE_KEY = 'nihongo_sora_active_script'

export const ScriptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [script, setScriptState] = useState<ScriptType>('hiragana')

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'katakana' || saved === 'hiragana' || saved === 'kanji') {
        setScriptState(saved)
      }
    } catch {
      // ignore
    }
  }, [])

  const setScript = useCallback((newScript: ScriptType) => {
    setScriptState(newScript)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newScript)
        window.dispatchEvent(
          new CustomEvent('nihongo_sora_script_changed', { detail: { script: newScript } })
        )
      } catch {
        // ignore
      }
    }
  }, [])

  const toggleScript = useCallback(() => {
    setScript(script === 'hiragana' ? 'katakana' : script === 'katakana' ? 'kanji' : 'hiragana')
  }, [script, setScript])

  return (
    <ScriptContext.Provider value={{ script, setScript, toggleScript }}>
      {children}
    </ScriptContext.Provider>
  )
}

export function useScript(): ScriptContextType {
  const context = useContext(ScriptContext)
  if (!context) {
    throw new Error('useScript must be used within a ScriptProvider')
  }
  return context
}
