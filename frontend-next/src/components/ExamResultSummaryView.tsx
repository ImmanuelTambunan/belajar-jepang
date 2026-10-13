import React from 'react'
import Link from 'next/link'
import { ExamResultSummary } from '@/types/exam'
import { calculateExamGrade } from '@/utils/examGenerator'
import { useLanguage } from '@/context/LanguageContext'

interface ExamResultSummaryViewProps {
  summary: ExamResultSummary
  onRetakeExam: () => void
  onNewConfig: () => void
}

export const ExamResultSummaryView: React.FC<ExamResultSummaryViewProps> = ({
  summary,
  onRetakeExam,
  onNewConfig,
}) => {
  const { t, language } = useLanguage()
  const { score, totalQuestions, correctAnswers, wrongAnswers, durationSeconds, wrongCharacters } =
    summary

  const gradeInfo = calculateExamGrade(score)

  // Format duration into m:ss
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60
  const durationText = `${minutes > 0 ? `${minutes}m ` : ''}${seconds}d`

  // Circular progress ring calculation
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl dark:shadow-2xl text-slate-800 dark:text-slate-100 transition-colors animate-fade-in">
      {/* HEADER RESULT */}
      <div className="flex flex-col items-center text-center pb-8 border-b border-slate-200 dark:border-slate-800">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700 mb-4">
          <span>🏁</span>
          <span>{t('exam.summary_title')}</span>
        </span>

        {/* Circular Progress Ring */}
        <div className="relative flex items-center justify-center w-36 h-36 my-2">
          <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke={
                score >= 75
                  ? '#10b981'
                  : score >= 60
                  ? '#0ea5e9'
                  : score >= 45
                  ? '#f59e0b'
                  : '#f43f5e'
              }
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {score}%
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('exam.summary_score')}
            </span>
          </div>
        </div>

        {/* Grade Badge & Japanese Praise */}
        <div className="mt-2">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black border ${gradeInfo.badgeColor}`}
          >
            <span>{language === 'en' ? `Grade ${gradeInfo.grade}` : `Predikat ${gradeInfo.grade}`}</span>
            <span>•</span>
            <span>{gradeInfo.gradeLabel}</span>
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-3">
            {gradeInfo.gradeJapanese}
          </h3>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl mt-6">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Total Questions' : 'Total Soal'}
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalQuestions}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-700 dark:text-emerald-300">
            <div className="text-xs">{t('exam.summary_correct')}</div>
            <div className="text-xl font-black mt-0.5">{correctAnswers}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center text-rose-700 dark:text-rose-300">
            <div className="text-xs">{t('exam.summary_wrong')}</div>
            <div className="text-xl font-black mt-0.5">{wrongAnswers}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Duration' : 'Durasi'}
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {durationText}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: WRONG CHARACTERS REVIEW & PRACTICE RECOMMENDATION */}
      {wrongCharacters.length > 0 ? (
        <div className="py-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  {language === 'en'
                    ? `Characters to Practice (${wrongCharacters.length})`
                    : `Karakter Perlu Dilatih Ulang (${wrongCharacters.length})`}
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'en'
                  ? 'These kana are automatically queued into your Spaced Repetition smart review list.'
                  : 'Karakter ini otomatis diprioritaskan di antrean modul latihan hafalan Spaced Repetition.'}
              </p>
            </div>

            <Link
              href="/practice?filter=needs_review"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 transition flex items-center gap-1.5 self-start sm:self-center"
            >
              <span>🧠</span>
              <span>
                {language === 'en'
                  ? 'Open Smart Review in Studio'
                  : 'Buka Latihan Hafalan Karakter Ini'}
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {wrongCharacters.map((char) => (
              <div
                key={char.id}
                className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex flex-col items-center text-center transition"
              >
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {char.character || char.symbol}
                </span>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 mt-1">
                  /{char.readings?.[0]?.romaji || '-'}/
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Baris {char.row_group || 'vowel'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-6 border-b border-slate-200 dark:border-slate-800 text-center">
          <span className="text-4xl">🎉</span>
          <h4 className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {t('exam.summary_perfect_msg')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'en'
              ? 'You answered every single quiz question with absolute precision.'
              : 'Anda berhasil menjawab seluruh soal ujian dengan sempurna tanpa kesalahan.'}
          </p>
        </div>
      )}

      {/* ACTION NAVIGATION BUTTONS */}
      <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link
          href="/"
          className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center cursor-pointer"
        >
          🏠 {t('exam.home_btn')}
        </Link>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onNewConfig}
            type="button"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            ⚙️ {language === 'en' ? 'Change Exam Settings' : 'Ganti Pengaturan Ujian'}
          </button>

          <button
            onClick={onRetakeExam}
            type="button"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-lg shadow-sky-600/25 transition cursor-pointer active:scale-98 flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>{t('exam.retry_btn')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
