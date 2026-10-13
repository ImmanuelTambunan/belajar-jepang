'use client'

import React, { useEffect } from 'react'
import { useGamification } from '@/context/GamificationContext'
import { Award, ChevronRight, Sparkles, X } from 'lucide-react'

export const LevelUpModal: React.FC = () => {
  const { levelUpModal, dismissLevelUpModal } = useGamification()

  // Close on Escape key
  useEffect(() => {
    if (!levelUpModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissLevelUpModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [levelUpModal, dismissLevelUpModal])

  if (!levelUpModal) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 p-6 sm:p-8 shadow-2xl shadow-amber-500/10 text-center animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Japanese Watermark in background */}
        <div className="absolute -top-6 -right-6 text-9xl font-serif font-black text-amber-500/10 dark:text-amber-400/5 select-none pointer-events-none">
          昇
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={dismissLevelUpModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Tutup jendela Level Up"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Badge */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/30 mb-5 relative group">
          <Award className="w-10 h-10 animate-bounce" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400"></span>
          </span>
        </div>

        {/* Heading */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-black tracking-widest uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>LEVEL UP! KENAIKAN LEVEL</span>
        </div>

        <h2
          id="levelup-title"
          className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1"
        >
          Level {levelUpModal.newLevel} Diraih!
        </h2>

        {/* Japanese Title Badge */}
        <div className="mt-3 py-2 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 inline-flex flex-col items-center">
          <span className="text-xl font-bold font-serif text-amber-700 dark:text-amber-300">
            {levelUpModal.japaneseTitle}
          </span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
            {levelUpModal.title}
          </span>
        </div>

        <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Selamat! Dedikasi latihan kaligrafi Hiragana Anda membuahkan hasil.
          Terus jaga konsistensi belajar Anda setiap hari!
        </p>

        {/* Level Progression Indicator */}
        <div className="mt-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-around text-xs font-bold text-slate-600 dark:text-slate-300">
          <span>Lv. {levelUpModal.oldLevel}</span>
          <ChevronRight className="w-4 h-4 text-amber-500" />
          <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">
            Lv. {levelUpModal.newLevel}
          </span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={dismissLevelUpModal}
          className="mt-6 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-lg shadow-amber-500/25 transition active:scale-98 cursor-pointer"
        >
          Lanjutkan Belajar (Sugoi! ✨)
        </button>
      </div>
    </div>
  )
}
