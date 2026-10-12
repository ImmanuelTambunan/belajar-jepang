'use client'

import React from 'react'
import { OverallAccuracyResult } from '@/types/accuracy'
import { ACCURACY_TIERS } from '@/utils/strokeScorer'

interface AccuracyScoreCardProps {
  evaluation: OverallAccuracyResult
  onRetry: () => void
  onNext?: () => void
  isSubmitting?: boolean
  showOverlay: boolean
  onToggleOverlay: () => void
}

export const AccuracyScoreCard: React.FC<AccuracyScoreCardProps> = ({
  evaluation,
  onRetry,
  onNext,
  isSubmitting = false,
  showOverlay,
  onToggleOverlay,
}) => {
  const { score, grade, stars, japaneseLabel, indonesianLabel, summaryMessage, strokeEvaluations } =
    evaluation
  const tier = ACCURACY_TIERS[grade]

  // Circular progress ring calculation
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/90 dark:to-slate-850 border border-slate-200 dark:border-slate-700/80 p-5 shadow-lg dark:shadow-2xl transition-all animate-fade-in">
      {/* Header with circular progress ring & grade badge */}
      <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-slate-200 dark:border-slate-800">
        {/* Animated Circular Ring */}
        <div className="relative flex items-center justify-center w-28 h-28 shrink-0">
          <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-slate-200 dark:text-slate-800"
            />
            {/* Colored progress ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={tier.ringColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Centered percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {score}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Akurasi
            </span>
          </div>
        </div>

        {/* Tier, Star & Japanese Feedback */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${tier.badgeBg} ${tier.badgeBorder} ${tier.badgeText}`}
            >
              <span className="text-sm font-black">Skor {grade}</span>
              <span>•</span>
              <span>{indonesianLabel}</span>
            </span>

            {/* Stars rating */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold">
              {stars > 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      i < stars ? 'text-amber-400 drop-shadow-sm' : 'text-slate-300 dark:text-slate-700'
                    }`}
                  >
                    ★
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">Belum Berbintang</span>
              )}
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            {japaneseLabel}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            {summaryMessage}
          </p>
        </div>
      </div>

      {/* Stroke-by-stroke analysis details */}
      {strokeEvaluations.length > 0 && (
        <div className="mt-4 pt-2">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
            Analisis Tiap Goresan ({strokeEvaluations.length} Garis Terdaftar):
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {strokeEvaluations.map((st) => {
              const isAccurate = st.score >= 80
              const isWarning = st.score >= 50 && st.score < 80
              return (
                <div
                  key={st.strokeIndex}
                  className={`p-3 rounded-xl border text-xs flex flex-col gap-1 transition-colors ${
                    isAccurate
                      ? 'bg-emerald-500/5 border-emerald-500/20 dark:border-emerald-500/30'
                      : isWarning
                      ? 'bg-amber-500/5 border-amber-500/20 dark:border-amber-500/30'
                      : 'bg-rose-500/5 border-rose-500/20 dark:border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {st.strokeOrder}
                      </span>
                      <span>Goresan #{st.strokeOrder}</span>
                    </span>
                    <span
                      className={`font-black px-2 py-0.5 rounded-md ${
                        isAccurate
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : isWarning
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {st.score}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    <span>Deviasi: ~{st.averageDistance}px</span>
                    {st.isDirectionInverted ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        ⚠️ Arah Terbalik
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">✓ Arah Benar</span>
                    )}
                  </div>

                  {st.feedbackNotes.length > 0 && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic mt-0.5">
                      {st.feedbackNotes[0]}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action Buttons: Overlay toggle, Coba Lagi, Lanjut Karakter */}
      <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onToggleOverlay}
          type="button"
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
            showOverlay
              ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-400 dark:border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-400/20'
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>🎯</span>
          <span>{showOverlay ? 'Overlay Akurasi: Aktif' : 'Tampilkan Overlay Akurasi'}</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRetry}
            type="button"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer shadow-sm"
          >
            🔄 Coba Lagi
          </button>

          {onNext && (
            <button
              onClick={onNext}
              disabled={isSubmitting}
              type="button"
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-600/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>Lanjut Karakter Berikutnya</span>
              <span>➔</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
