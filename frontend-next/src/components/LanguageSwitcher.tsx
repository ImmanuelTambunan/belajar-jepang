'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useLanguage, Language } from '@/context/LanguageContext'
import { Check, Globe } from 'lucide-react'

interface LanguageSwitcherProps {
  className?: string
  compact?: boolean
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  compact = false,
}) => {
  const { language, setLanguage, isMounted } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  if (!isMounted) {
    return (
      <div className="h-10 w-16 rounded-full border border-slate-300 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/50 animate-pulse" />
    )
  }

  const currentFlag = language === 'id' ? '🇮🇩' : '🇬🇧'
  const currentLabel = language === 'id' ? 'ID' : 'EN'

  const options: { code: Language; flag: string; label: string; sublabel: string }[] = [
    {
      code: 'id',
      flag: '🇮🇩',
      label: 'Bahasa Indonesia',
      sublabel: 'Ramah & Santai',
    },
    {
      code: 'en',
      flag: '🇬🇧',
      label: 'English',
      sublabel: 'Friendly & Clear',
    },
  ]

  const handleSelect = (code: Language) => {
    setLanguage(code)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center gap-1.5 h-10 px-3 rounded-full border border-slate-300 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all duration-300 cursor-pointer backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-xs"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Pilih Bahasa / Select Language"
        title={
          language === 'id'
            ? 'Bahasa Indonesia aktif (Klik untuk beralih ke English)'
            : 'English active (Click to switch to Bahasa Indonesia)'
        }
      >
        <span className="text-sm leading-none drop-shadow-xs">{currentFlag}</span>
        <span className="font-extrabold tracking-tight">{currentLabel}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <Globe className="w-3 h-3 text-sky-500" />
            <span>Pilih Bahasa / Language</span>
          </div>

          {options.map((opt) => {
            const isSelected = language === opt.code
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => handleSelect(opt.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50/90 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{opt.flag}</span>
                  <div>
                    <p className="text-xs leading-snug">{opt.label}</p>
                    {!compact && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                        {opt.sublabel}
                      </p>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 stroke-[2.5]" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
