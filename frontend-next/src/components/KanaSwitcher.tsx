'use client'

import React from 'react'
import { useScript } from '@/context/ScriptContext'
import { useLanguage } from '@/context/LanguageContext'
import { ScriptType } from '@/types/character'
import { Sparkles } from 'lucide-react'

interface KanaSwitcherProps {
  size?: 'sm' | 'md' | 'lg'
  showBadge?: boolean
  className?: string
}

export const KanaSwitcher: React.FC<KanaSwitcherProps> = ({
  size = 'md',
  showBadge = true,
  className = '',
}) => {
  const { script, setScript } = useScript()
  const { t } = useLanguage()

  const isSmall = size === 'sm'
  const isLarge = size === 'lg'

  return (
    <div
      role="group"
      aria-label="Kana Script Switcher"
      className={`inline-flex items-center p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-all ${className}`}
    >
      {/* Hiragana option */}
      <button
        type="button"
        onClick={() => setScript('hiragana')}
        className={`flex items-center gap-1.5 sm:gap-2 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
          isSmall
            ? 'px-2.5 py-1 text-xs'
            : isLarge
            ? 'px-4 py-2 text-sm sm:text-base'
            : 'px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm'
        } ${
          script === 'hiragana'
            ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-slate-700 ring-2 ring-sky-500/20'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
        }`}
        title={t('script.hiragana_desc') || 'Koleksi 107 Aksara Hiragana'}
        aria-pressed={script === 'hiragana'}
      >
        <span className="font-serif text-sm sm:text-base leading-none text-sky-500 dark:text-sky-400">
          あ
        </span>
        <span>Hiragana</span>
        {showBadge && script === 'hiragana' && (
          <span className="hidden xs:inline-block w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
        )}
      </button>

      {/* Katakana option */}
      <button
        type="button"
        onClick={() => setScript('katakana')}
        className={`flex items-center gap-1.5 sm:gap-2 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
          isSmall
            ? 'px-2.5 py-1 text-xs'
            : isLarge
            ? 'px-4 py-2 text-sm sm:text-base'
            : 'px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm'
        } ${
          script === 'katakana'
            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700 ring-2 ring-indigo-500/20'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
        }`}
        title={t('script.katakana_desc') || 'Koleksi 107 Aksara Katakana'}
        aria-pressed={script === 'katakana'}
      >
        <span className="font-serif text-sm sm:text-base leading-none text-indigo-500 dark:text-indigo-400">
          ア
        </span>
        <span>Katakana</span>
        {showBadge && script === 'katakana' && (
          <span className="hidden xs:inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        )}
      </button>

      {/* Kanji (N5) option */}
      <button
        type="button"
        onClick={() => setScript('kanji')}
        className={`flex items-center gap-1.5 sm:gap-2 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
          isSmall
            ? 'px-2.5 py-1 text-xs'
            : isLarge
            ? 'px-4 py-2 text-sm sm:text-base'
            : 'px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm'
        } ${
          script === 'kanji'
            ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-slate-700 ring-2 ring-emerald-500/20'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
        }`}
        title={t('script.kanji_desc') || 'Koleksi 48 Kanji JLPT N5'}
        aria-pressed={script === 'kanji'}
      >
        <span className="font-serif text-sm sm:text-base leading-none text-emerald-500 dark:text-emerald-400">
          漢
        </span>
        <span>Kanji (N5)</span>
        {showBadge && script === 'kanji' && (
          <span className="hidden xs:inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </button>
    </div>
  )
}
