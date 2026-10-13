'use client'

import React from 'react'
import { useGamification } from '@/context/GamificationContext'
import { useLanguage } from '@/context/LanguageContext'
import { Sparkles, X, Zap } from 'lucide-react'

export const XPToastContainer: React.FC = () => {
  const { activeToasts, dismissToast } = useGamification()
  const { language } = useLanguage()

  if (activeToasts.length === 0) return null

  return (
    <aside
      aria-live="polite"
      aria-label={language === 'id' ? 'Notifikasi Perolehan XP' : 'XP Earned Notifications'}
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {activeToasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-300 dark:border-amber-600/60 shadow-lg shadow-amber-500/10 dark:shadow-amber-500/5 animate-in slide-in-from-bottom-3 duration-200 transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center gap-3">
            {/* Glowing Icon Badge */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
              <Zap className="w-5 h-5 fill-white" />
            </div>

            {/* Text details */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-amber-600 dark:text-amber-400 tracking-tight">
                  +{toast.amount} XP
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                {toast.reason}
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </aside>
  )
}
