'use client'

import React from 'react'
import { ProgressSummary } from '@/types/progress'

interface PracticeStatsBarProps {
  currentIndex: number
  totalInQueue: number
  summary: ProgressSummary
  isLiveApi: boolean
  selectedRowGroup: string
  onRowGroupChange: (row: string) => void
}

const ROW_FILTERS = [
  { id: 'all', label: 'Semua (46)' },
  { id: 'vowel', label: 'Vokal' },
  { id: 'ka', label: 'Ka' },
  { id: 'sa', label: 'Sa' },
  { id: 'ta', label: 'Ta' },
  { id: 'na', label: 'Na' },
  { id: 'ha', label: 'Ha' },
  { id: 'ma', label: 'Ma' },
  { id: 'ya', label: 'Ya' },
  { id: 'ra', label: 'Ra' },
  { id: 'wa_n', label: 'Wa/N' },
]

export const PracticeStatsBar: React.FC<PracticeStatsBarProps> = ({
  currentIndex,
  totalInQueue,
  summary,
  isLiveApi,
  selectedRowGroup,
  onRowGroupChange,
}) => {
  const currentStep = Math.min(currentIndex + 1, totalInQueue)
  const sessionPercent = totalInQueue > 0 ? Math.round((currentStep / totalInQueue) * 100) : 0

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-8 shadow-sm transition-colors">
      {/* Top metrics row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Sesi Latihan Hafalan
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isLiveApi
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              }`}
            >
              {isLiveApi ? '🟢 DB Live Sync' : '🟡 Offline Local'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Antrean:</span>
            <span className="text-sky-600 dark:text-sky-400 font-mono">
              {totalInQueue > 0 ? `${currentStep} / ${totalInQueue}` : 'Selesai'}
            </span>
            <span className="text-xs text-slate-400 font-normal">Karakter</span>
          </h2>
        </div>

        {/* Overall Gojūon Progress Badge */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 px-4 py-2.5 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
            {summary.percentage}%
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Total Dihafal
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {summary.memorized_count} dari {summary.total_characters} Karakter
            </p>
          </div>
        </div>
      </div>

      {/* Session Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4">
        <div
          className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${sessionPercent}%` }}
        />
      </div>

      {/* Row Group Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap mr-1">
          Filter Baris:
        </span>
        {ROW_FILTERS.map((rf) => {
          const isActive = selectedRowGroup === rf.id
          return (
            <button
              key={rf.id}
              onClick={() => onRowGroupChange(rf.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap border ${
                isActive
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {rf.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
