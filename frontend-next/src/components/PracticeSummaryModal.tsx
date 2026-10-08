'use client'

import React from 'react'
import Link from 'next/link'
import { ProgressSummary, PracticeSessionStats } from '@/types/progress'

interface PracticeSummaryModalProps {
  stats: PracticeSessionStats
  summary: ProgressSummary
  onRestartSession: (mode: 'all' | 'unmemorized') => void
}

export const PracticeSummaryModal: React.FC<PracticeSummaryModalProps> = ({
  stats,
  summary,
  onRestartSession,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xl transition-colors">
      <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/30">
        🎉
      </div>

      <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2">
        Sesi Latihan Selesai!
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
        Hebat! Kamu telah menuntaskan antrean karakter dalam sesi latihan hafalan ini. Memori visual dan ototmu semakin terasah.
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Hafal Baru di Sesi Ini
          </span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            +{stats.newlyMemorized}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Pengulangan Review
          </span>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.repeatedCount}x
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Hapal Gojūon
          </span>
          <p className="text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">
            {summary.memorized_count}/{summary.total_characters}
          </p>
        </div>
      </div>

      {/* Progress Bar of Mastered Characters */}
      <div className="mb-8 text-left bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between text-xs font-bold mb-2">
          <span className="text-slate-700 dark:text-slate-300">Penguasaan Hiragana Total</span>
          <span className="text-sky-600 dark:text-sky-400 font-mono">{summary.percentage}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${summary.percentage}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => onRestartSession('unmemorized')}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-lg shadow-sky-600/25 transition cursor-pointer"
        >
          🚀 Latih Sisa Huruf Belum Hapal
        </button>

        <button
          onClick={() => onRestartSession('all')}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
        >
          🔄 Ulangi Semua (46 Huruf)
        </button>

        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition text-center"
        >
          🔤 Kembali ke Koleksi
        </Link>
      </div>
    </div>
  )
}
