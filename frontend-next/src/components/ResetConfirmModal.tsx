'use client'

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useGamification } from '@/context/GamificationContext'
import { performFullReset } from '@/utils/reset'
import { AlertTriangle, RotateCcw, X, ShieldCheck, Flame, BookOpen, Award } from 'lucide-react'

interface ResetConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (message: string) => void
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage()
  const { resetGamification } = useGamification()
  const [isResetting, setIsResetting] = useState(false)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isResetting) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isResetting, onClose])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsResetting(true)
    try {
      // 1. Reset frontend GamificationContext state (XP = 0, Level = 1, Streak = 0)
      resetGamification()

      // 2. Perform backend DB wipe & localStorage cleanup
      const result = await performFullReset()

      // 3. Callback for page refresh / toast
      if (onSuccess) {
        onSuccess(result.message || t('settings.practice_reset_done'))
      }

      onClose()
    } catch (err) {
      console.error('Failed to reset progress:', err)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 p-6 sm:p-8 shadow-2xl shadow-rose-950/20 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Japanese Watermark in background */}
        <div className="absolute -top-6 -right-6 text-9xl font-serif font-black text-rose-500/10 dark:text-rose-400/5 select-none pointer-events-none">
          初
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isResetting}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Danger Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 flex items-center justify-center mb-5 shadow-sm">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>

        {/* Title */}
        <h3
          id="reset-modal-title"
          className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight"
        >
          {t('settings.practice_reset_modal_title')}
        </h3>

        {/* Clear Mandatory Warning */}
        <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm font-semibold text-rose-800 dark:text-rose-200 leading-relaxed">
          {t('settings.practice_reset_modal_desc')}
        </div>

        {/* What Will Happen Checklist */}
        <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Gamifikasi & XP:</strong> XP disetel ke 0, Level 1 (Pemula), dan daily streak 0 hari.
            </span>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <Award className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>Riwayat Ujian & Akurasi:</strong> Seluruh catatan tabel <code>exam_results</code> dan riwayat presisi tracing dikosongkan.
            </span>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <BookOpen className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <span>
              <strong>Status Penguasaan:</strong> Kembali ke 0 / 46 Huruf Hafal (46 Huruf Belajar).
            </span>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Data Master 46 Hiragana:</strong> Simbol, urutan goresan KanjiVG, dan audio pelafalan TIDAK terhapus.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isResetting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-70"
          >
            {isResetting ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>{t('settings.practice_reset_in_progress')}</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>{t('settings.practice_reset_confirm_btn')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
