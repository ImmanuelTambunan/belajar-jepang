'use client'

import React from 'react'
import { useLanguage } from '@/context/LanguageContext'

interface LanguageSwitcherProps {
  className?: string
  compact?: boolean
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
}) => {
  const { language, setLanguage, isMounted } = useLanguage()

  if (!isMounted) {
    return (
      <div className="h-10 w-20 rounded-full border border-slate-300 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/50 animate-pulse" />
    )
  }

  return (
    <div
      className={`inline-flex items-center p-1 h-10 rounded-full border border-slate-300 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs ${className}`}
      role="group"
      aria-label="Pilihan Bahasa / Language Selection"
    >
      <button
        type="button"
        onClick={() => setLanguage('id')}
        className={`px-2.5 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
          language === 'id'
            ? 'bg-sky-600 text-white shadow-xs'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
        title="Bahasa Indonesia"
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
          language === 'en'
            ? 'bg-sky-600 text-white shadow-xs'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
        title="English"
      >
        EN
      </button>
    </div>
  )
}
