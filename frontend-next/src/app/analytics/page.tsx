'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  AnalyticsOverview,
  RowAccuracyMetric,
  ExamHistoryAnalyticsItem,
} from '@/types/analytics'
import { UserProgress } from '@/types/progress'
import { ExamResultSummary } from '@/types/exam'
import rawHiraganaData from '@/data/hiragana_46.json'

interface RawHiraganaItem {
  symbol: string
  script_type: string
  row_group: string
  stroke_count: number
  reading: string
  strokes: string[]
}

const LOCAL_STORAGE_PROGRESS_KEY = 'nihongo_sora_character_progress'
const LOCAL_STORAGE_EXAM_KEY = 'nihongo_sora_exam_history'

// Row definition list for standard Gojuon
const ROW_DEFINITIONS = [
  { row_group: 'vowel', label: 'Baris A (Vokal)', sample_kana: 'あ, い, う, え, お' },
  { row_group: 'ka', label: 'Baris Ka', sample_kana: 'か, き, く, け, こ' },
  { row_group: 'sa', label: 'Baris Sa', sample_kana: 'さ, し, す, せ, そ' },
  { row_group: 'ta', label: 'Baris Ta', sample_kana: 'た, ち, つ, て, と' },
  { row_group: 'na', label: 'Baris Na', sample_kana: 'な, に, ぬ, ね, の' },
  { row_group: 'ha', label: 'Baris Ha', sample_kana: 'は, ひ, ふ, へ, ほ' },
  { row_group: 'ma', label: 'Baris Ma', sample_kana: 'ま, み, む, め, も' },
  { row_group: 'ya', label: 'Baris Ya', sample_kana: 'や, ゆ, よ' },
  { row_group: 'ra', label: 'Baris Ra', sample_kana: 'ら, り, る, れ, ろ' },
  { row_group: 'wa', label: 'Baris Wa / N', sample_kana: 'わ, を, ん' },
]

export default function AnalyticsDashboardPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Dashboard Data State
  const [overview, setOverview] = useState<AnalyticsOverview>({
    total_characters: 46,
    memorized_count: 0,
    learning_count: 46,
    active_learning_count: 0,
    completion_rate: 0,
    overall_accuracy_avg: 0,
    total_practice_count: 0,
    total_exams_taken: 0,
    exam_average_score: 0,
  })

  const [rowMetrics, setRowMetrics] = useState<RowAccuracyMetric[]>([])
  const [examHistory, setExamHistory] = useState<ExamHistoryAnalyticsItem[]>([])
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'all' | 'accuracy' | 'exams'>('all')
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)

  // Format Helper: Seconds to mm:ss
  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0 dtk'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs} dtk`
  }

  // Format Helper: ISO date to friendly Indonesian format
  const formatDateTime = (isoString: string): string => {
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  // Helper: Grade badge styling
  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'S':
        return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
      case 'A':
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      case 'B':
        return 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30'
      case 'C':
        return 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
      default:
        return 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
    }
  }

  // Helper: Tracing Accuracy Status styling & label
  const getAccuracyStatusBadge = (status: string, acc: number) => {
    if (acc === 0 || status === 'unpracticed') {
      return {
        label: 'Belum Dilatih',
        classes: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        barColor: 'bg-slate-300 dark:bg-slate-700',
      }
    }
    if (acc >= 85) {
      return {
        label: 'Sangat Mahir',
        classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      }
    }
    if (acc >= 70) {
      return {
        label: 'Bagus',
        classes: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
        barColor: 'bg-gradient-to-r from-sky-500 to-indigo-400',
      }
    }
    return {
      label: 'Perlu Latihan',
      classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      barColor: 'bg-gradient-to-r from-amber-500 to-rose-400',
    }
  }

  // Local Offline Analytics Calculator (Fallback when Golang API is unreachable)
  const computeOfflineAnalytics = useCallback(() => {
    const rawList = rawHiraganaData as RawHiraganaItem[]
    let progressMap: Record<number, UserProgress> = {}
    let storedExams: ExamResultSummary[] = []

    if (typeof window !== 'undefined') {
      try {
        const progStr = localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY)
        if (progStr) progressMap = JSON.parse(progStr)
      } catch {
        // ignore
      }

      try {
        const examStr = localStorage.getItem(LOCAL_STORAGE_EXAM_KEY)
        if (examStr) storedExams = JSON.parse(examStr)
      } catch {
        // ignore
      }
    }

    // 1. Overview computation
    const totalChars = 46
    let memorized = 0
    let activeLearning = 0
    let totalReviewCount = 0
    const accuracyScores: number[] = []

    rawList.forEach((_, idx) => {
      const charId = idx + 1
      const p = progressMap[charId]
      if (p) {
        if (p.status === 'memorized') memorized++
        if (p.status === 'learning') activeLearning++
        totalReviewCount += p.review_count || 0
        if (p.accuracy_score && p.accuracy_score > 0) {
          accuracyScores.push(p.accuracy_score)
        }
      }
    })

    const overallAvgAcc =
      accuracyScores.length > 0
        ? Math.round((accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length) * 10) / 10
        : 0

    let totalExamScoreSum = 0
    storedExams.forEach((e) => {
      totalExamScoreSum += e.score || 0
    })
    const examAvgScore =
      storedExams.length > 0
        ? Math.round((totalExamScoreSum / storedExams.length) * 10) / 10
        : 0

    const computedOverview: AnalyticsOverview = {
      total_characters: totalChars,
      memorized_count: memorized,
      learning_count: totalChars - memorized,
      active_learning_count: activeLearning,
      completion_rate: Math.round((memorized / totalChars) * 1000) / 10,
      overall_accuracy_avg: overallAvgAcc,
      total_practice_count: totalReviewCount,
      total_exams_taken: storedExams.length,
      exam_average_score: examAvgScore,
    }

    // 2. Row accuracy computation
    const computedRows: RowAccuracyMetric[] = ROW_DEFINITIONS.map((rowDef) => {
      // Find characters matching row_group
      const matching = rawList
        .map((item, idx) => ({ ...item, id: idx + 1 }))
        .filter((item) => {
          const rg = item.row_group?.toLowerCase().trim()
          if (rowDef.row_group === 'wa') {
            return rg === 'wa' || rg === 'n' || rg === 'wa_n'
          }
          return rg === rowDef.row_group
        })

      const totalInRow = matching.length > 0 ? matching.length : 5
      let memInRow = 0
      let revInRow = 0
      const rowAccuracies: number[] = []

      matching.forEach((char) => {
        const p = progressMap[char.id]
        if (p) {
          if (p.status === 'memorized') memInRow++
          revInRow += p.review_count || 0
          if (p.accuracy_score && p.accuracy_score > 0) {
            rowAccuracies.push(p.accuracy_score)
          }
        }
      })

      const avgRowAcc =
        rowAccuracies.length > 0
          ? Math.round((rowAccuracies.reduce((a, b) => a + b, 0) / rowAccuracies.length) * 10) / 10
          : 0

      let status: RowAccuracyMetric['status'] = 'unpracticed'
      if (avgRowAcc >= 85) status = 'proficient'
      else if (avgRowAcc >= 70) status = 'good'
      else if (avgRowAcc > 0) status = 'needs_practice'

      return {
        row_group: rowDef.row_group,
        label: rowDef.label,
        sample_kana: rowDef.sample_kana,
        total_characters: totalInRow,
        memorized_count: memInRow,
        average_accuracy: avgRowAcc,
        total_reviews: revInRow,
        status,
      }
    })

    // 3. Exam history formatting
    const formattedExams: ExamHistoryAnalyticsItem[] = storedExams.map((e, idx) => ({
      id: e.id || idx + 1,
      exam_id: e.id || idx + 1,
      total_questions: e.totalQuestions || 0,
      correct_answers: e.correctAnswers || 0,
      wrong_answers: e.wrongAnswers || 0,
      score: e.score || 0,
      duration_seconds: e.durationSeconds || 0,
      grade: e.grade || 'D',
      grade_label: e.gradeLabel || 'Perlu Diulang',
      completed_at: e.createdAt || new Date().toISOString(),
    }))

    setOverview(computedOverview)
    setRowMetrics(computedRows)
    setExamHistory(formattedExams)
  }, [])

  // Load Data with dual-mode support (Live Backend -> Local Offline Fallback)
  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      // Parallel fetch to backend
      const [resOverview, resRowAcc, resExamHistory] = await Promise.all([
        fetch(`${apiBaseUrl}/analytics/overview`),
        fetch(`${apiBaseUrl}/analytics/accuracy-by-row`),
        fetch(`${apiBaseUrl}/analytics/exam-history`),
      ])

      if (resOverview.ok && resRowAcc.ok && resExamHistory.ok) {
        const jsonOverview = await resOverview.json()
        const jsonRowAcc = await resRowAcc.json()
        const jsonExamHistory = await resExamHistory.json()

        if (jsonOverview.data) setOverview(jsonOverview.data)
        if (jsonRowAcc.data) setRowMetrics(jsonRowAcc.data)
        if (jsonExamHistory.data) setExamHistory(jsonExamHistory.data)
        setIsLiveBackend(true)
      } else {
        throw new Error('Backend response not OK')
      }
    } catch {
      // Fallback to client-side localStorage calculation
      setIsLiveBackend(false)
      computeOfflineAnalytics()
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, computeOfflineAnalytics])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Tracing accuracy grade letter helper
  const accuracyGrade = useMemo(() => {
    const acc = overview.overall_accuracy_avg
    if (acc === 0) return '-'
    if (acc >= 90) return 'S'
    if (acc >= 75) return 'A'
    if (acc >= 60) return 'B'
    if (acc >= 45) return 'C'
    return 'D'
  }, [overview.overall_accuracy_avg])

  // Clear Exam History Handler (Local storage)
  const handleClearExamHistory = () => {
    if (confirm('Apakah Anda yakin ingin mereset seluruh riwayat sesi ujian lokal?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_EXAM_KEY)
      }
      loadDashboardData()
    }
  }

  // Sorted exams for chart chronological trend (oldest to newest)
  const chronologicalExams = useMemo(() => {
    return [...examHistory].reverse().slice(-15) // Max 15 points
  }, [examHistory])

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      {/* DASHBOARD HERO HEADER & STATUS */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              Fase 5 • Analytics Dashboard
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              学習ダッシュボード
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dasbor Statistik & Riwayat Belajar
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Pantau kemajuan penguasaan 46 Hiragana, akurasi goresan kuas per baris Gojūon, serta grafik perkembangan nilai ujian Anda.
          </p>
        </div>

        {/* Status Pill & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 shadow-xs ${
              isLiveBackend
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/60'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveBackend ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'
              }`}
            ></span>
            <span>
              {isLiveBackend
                ? 'Terhubung ke Backend Golang'
                : 'Mode Penyimpanan Lokal (Offline)'}
            </span>
          </div>

          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 mb-8 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>📊</span>
          <span>Semua Ringkasan</span>
        </button>
        <button
          onClick={() => setActiveTab('accuracy')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'accuracy'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>🎯</span>
          <span>Akurasi Goresan Baris</span>
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'exams'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>📝</span>
          <span>Riwayat & Tren Ujian</span>
        </button>
      </div>

      {/* SECTION 1: METRIC OVERVIEW CARDS (4 CARDS GRID) */}
      {(activeTab === 'all' || activeTab === 'accuracy') && (
        <section className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: Karakter Hafal vs Belajar */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-sky-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status Penguasaan
                </span>
                <span className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-sm font-bold">
                  🔤
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                  {overview.memorized_count}
                </span>
                <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                  / {overview.total_characters} Karakter
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium mt-3">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {overview.memorized_count} Hafal
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {overview.learning_count} Belajar
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Total Gojūon</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">46 Huruf Dasar</span>
              </div>
            </div>

            {/* CARD 2: Tingkat Penyelesaian (Completion Rate) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tingkat Kelulusan
                </span>
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                  🏆
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                  {overview.completion_rate}%
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {overview.completion_rate >= 100
                    ? 'Lengkap!'
                    : overview.completion_rate >= 50
                    ? 'Kemajuan Pesat'
                    : 'Awal Baik'}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(overview.completion_rate, 100)}%` }}
                ></div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Target Hafalan</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {overview.total_characters - overview.memorized_count} tersisa
                </span>
              </div>
            </div>

            {/* CARD 3: Rata-Rata Presisi Tracing */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Akurasi Tracing
                </span>
                <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">
                  ✍️
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                  {overview.overall_accuracy_avg > 0 ? `${overview.overall_accuracy_avg}%` : '0%'}
                </span>
                {overview.overall_accuracy_avg > 0 && (
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-md border ${getGradeBadge(
                      accuracyGrade
                    )}`}
                  >
                    Grade {accuracyGrade}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Berdasarkan {overview.total_practice_count} kali latihan goresan kuas kanji/kana.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Kualitas Goresan</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {overview.overall_accuracy_avg >= 85
                    ? 'Sangat Presisi'
                    : overview.overall_accuracy_avg >= 70
                    ? 'Bagus & Rapi'
                    : overview.overall_accuracy_avg > 0
                    ? 'Perlu Penyesuaian'
                    : 'Belum Ada Latihan'}
                </span>
              </div>
            </div>

            {/* CARD 4: Performa Ujian (Exam Average) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-purple-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Performa Ujian
                </span>
                <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-bold">
                  📊
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                  {overview.exam_average_score > 0 ? overview.exam_average_score : '0'}
                </span>
                <span className="text-sm font-medium text-slate-400 dark:text-slate-500">/ 100</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium mt-2">
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold">
                  {overview.total_exams_taken} Sesi Selesai
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Rata-Rata Nilai</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {overview.exam_average_score >= 80
                    ? 'Sangat Memuaskan'
                    : overview.exam_average_score >= 60
                    ? 'Kompeten'
                    : overview.exam_average_score > 0
                    ? 'Perlu Evaluasi'
                    : 'Belum Mengambil Ujian'}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: ROW-BY-ROW ACCURACY BREAKDOWN */}
      {(activeTab === 'all' || activeTab === 'accuracy') && (
        <section className="mb-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🎯</span>
                  <span>Akurasi Goresan Tracing Per Baris Karakter (Gojūon Rows)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Evaluasi presisi goresan kuas Anda di setiap deret vokal dan konsonan untuk menemukan baris huruf yang membutuhkan latihan intensif.
                </p>
              </div>

              <Link
                href="/practice"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>🧠</span>
                <span>Latihan Baris Karakter</span>
              </Link>
            </div>

            {/* Row Indicators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rowMetrics.map((row) => {
                const badgeInfo = getAccuracyStatusBadge(row.status, row.average_accuracy)
                const percentHafal = Math.round(
                  (row.memorized_count / Math.max(row.total_characters, 1)) * 100
                )

                return (
                  <div
                    key={row.row_group}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-sky-400/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Label, Kana sample, and Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {row.label}
                          </span>
                          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            ({row.sample_kana})
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeInfo.classes}`}
                        >
                          {badgeInfo.label}
                        </span>
                      </div>

                      {/* Tracing Accuracy Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                          <span className="text-slate-600 dark:text-slate-400">
                            Presisi Goresan Kuas:
                          </span>
                          <span className="text-slate-900 dark:text-white font-bold">
                            {row.average_accuracy > 0 ? `${row.average_accuracy}%` : '0%'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/70 dark:bg-slate-700/60 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${badgeInfo.barColor}`}
                            style={{ width: `${Math.min(row.average_accuracy, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata: Memorized stats & quick practice button */}
                    <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <span>
                          Dihafal:{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {row.memorized_count}/{row.total_characters}
                          </strong>{' '}
                          ({percentHafal}%)
                        </span>
                        <span>•</span>
                        <span>{row.total_reviews}x direview</span>
                      </div>

                      <Link
                        href={`/practice`}
                        className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <span>Latih baris</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: EXAM HISTORY & SCORE TREND CHART */}
      {(activeTab === 'all' || activeTab === 'exams') && (
        <section className="mb-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📈</span>
                  <span>Grafik Tren Nilai & Riwayat Sesi Ujian</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Rekapitulasi nilai dan waktu pengerjaan ujian kuis Hiragana dari waktu ke waktu.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/exam"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>✍️</span>
                  <span>Ambil Ujian Baru</span>
                </Link>

                {examHistory.length > 0 && !isLiveBackend && (
                  <button
                    onClick={handleClearExamHistory}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="Reset riwayat lokal"
                  >
                    Reset Riwayat
                  </button>
                )}
              </div>
            </div>

            {/* If Exam History is Empty */}
            {examHistory.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl font-bold mb-3">
                  📝
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Belum Ada Riwayat Sesi Ujian
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
                  Anda belum menyelesaikan sesi ujian Hiragana. Uji kemampuan hafalan dan presisi goresan huruf Anda sekarang untuk melihat analitik nilai!
                </p>
                <Link
                  href="/exam"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 transition-all"
                >
                  <span>🚀</span>
                  <span>Mulai Ujian Pertama Sekarang</span>
                </Link>
              </div>
            ) : (
              <div>
                {/* INTERACTIVE SCORE TREND SVG CHART */}
                <div className="mb-8 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Grafik Perkembangan Skor Ujian ({chronologicalExams.length} Sesi Terakhir)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Arahkan kursor pada titik grafik untuk melihat rincian sesi.
                      </p>
                    </div>

                    {selectedPointIndex !== null && chronologicalExams[selectedPointIndex] && (
                      <div className="text-right text-xs bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          Skor {chronologicalExams[selectedPointIndex].score}/100
                        </span>{' '}
                        • Grade {chronologicalExams[selectedPointIndex].grade} (
                        {chronologicalExams[selectedPointIndex].correct_answers}/
                        {chronologicalExams[selectedPointIndex].total_questions} Benar)
                      </div>
                    )}
                  </div>

                  {/* SVG Chart */}
                  <div className="relative w-full h-44 sm:h-52">
                    <svg
                      className="w-full h-full overflow-visible"
                      viewBox="0 0 600 160"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines (0, 25, 50, 75, 100) */}
                      {[0, 25, 50, 75, 100].map((level) => {
                        const y = 140 - (level / 100) * 120
                        return (
                          <g key={level}>
                            <line
                              x1="30"
                              y1={y}
                              x2="590"
                              y2={y}
                              stroke="currentColor"
                              className="text-slate-200 dark:text-slate-700/60"
                              strokeDasharray={level === 75 || level === 100 ? '4 4' : '2 2'}
                              strokeWidth="1"
                            />
                            <text
                              x="5"
                              y={y + 3}
                              className="text-[9px] fill-slate-400 dark:fill-slate-500 font-mono"
                            >
                              {level}
                            </text>
                          </g>
                        )
                      })}

                      {/* Connecting Line and Area */}
                      {chronologicalExams.length > 1 && (
                        <>
                          {/* Area Polygon */}
                          <polygon
                            points={`30,140 ${chronologicalExams
                              .map((item, idx) => {
                                const x =
                                  30 +
                                  (idx / (chronologicalExams.length - 1)) * 560
                                const y = 140 - (item.score / 100) * 120
                                return `${x},${y}`
                              })
                              .join(' ')} 590,140`}
                            fill="url(#scoreAreaGradient)"
                          />

                          {/* Line Path */}
                          <polyline
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={chronologicalExams
                              .map((item, idx) => {
                                const x =
                                  30 +
                                  (idx / (chronologicalExams.length - 1)) * 560
                                const y = 140 - (item.score / 100) * 120
                                return `${x},${y}`
                              })
                              .join(' ')}
                          />
                        </>
                      )}

                      {/* Interactive Data Points */}
                      {chronologicalExams.map((item, idx) => {
                        const x =
                          chronologicalExams.length === 1
                            ? 310
                            : 30 +
                              (idx / (chronologicalExams.length - 1)) * 560
                        const y = 140 - (item.score / 100) * 120
                        const isSelected = selectedPointIndex === idx

                        return (
                          <g
                            key={idx}
                            className="cursor-pointer group"
                            onMouseEnter={() => setSelectedPointIndex(idx)}
                            onClick={() => setSelectedPointIndex(idx)}
                          >
                            <circle
                              cx={x}
                              cy={y}
                              r={isSelected ? '7' : '5'}
                              className={`transition-all duration-200 ${
                                isSelected
                                  ? 'fill-purple-600 stroke-white stroke-2 drop-shadow-md'
                                  : 'fill-purple-500 group-hover:fill-purple-600 stroke-white dark:stroke-slate-900 stroke-2'
                              }`}
                            />
                            {/* Score Text Label */}
                            <text
                              x={x}
                              y={y - 10}
                              textAnchor="middle"
                              className={`text-[9px] font-bold ${
                                isSelected
                                  ? 'fill-purple-600 dark:fill-purple-400 font-extrabold'
                                  : 'fill-slate-500 dark:fill-slate-400'
                              }`}
                            >
                              {item.score}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                </div>

                {/* EXAM HISTORY DETAILED TABLE */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Waktu Sesi</th>
                        <th className="px-4 py-3 text-center">Skor Akhir</th>
                        <th className="px-4 py-3 text-center">Grade</th>
                        <th className="px-4 py-3 text-center">Hasil Jawaban</th>
                        <th className="px-4 py-3 text-center">Durasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                      {examHistory.map((session, index) => {
                        return (
                          <tr
                            key={session.id || index}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            {/* Date */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {formatDateTime(session.completed_at)}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                Sesi #{examHistory.length - index}
                              </div>
                            </td>

                            {/* Score */}
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <span className="text-base font-black text-slate-900 dark:text-white">
                                {session.score}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                /100
                              </span>
                            </td>

                            {/* Grade */}
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black border ${getGradeBadge(
                                  session.grade
                                )}`}
                              >
                                {session.grade} • {session.grade_label}
                              </span>
                            </td>

                            {/* Questions correct / wrong */}
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 font-medium text-xs">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  {session.correct_answers} Benar
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">/</span>
                                <span className="text-rose-500 dark:text-rose-400 font-bold">
                                  {session.wrong_answers} Salah
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                Total {session.total_questions} Soal
                              </div>
                            </td>

                            {/* Duration */}
                            <td className="px-4 py-3.5 text-center whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                              ⏱️ {formatDuration(session.duration_seconds)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* QUICK SHORTCUT CARDS FOOTER */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400/50 shadow-xs transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
            🔤
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              Koleksi 46 Huruf
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pelajari urutan goresan stroke order dan audio pelafalan asli.
            </p>
          </div>
        </Link>

        <Link
          href="/practice"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 shadow-xs transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
            🧠
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Latihan Hafalan
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uji memori dengan antrean repetisi berjarak (spaced review).
            </p>
          </div>
        </Link>

        <Link
          href="/exam"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400/50 shadow-xs transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
            📝
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Ujian & Kuis Buta
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Blind tracing dan kuis pilihan ganda romaji-kana dengan timer.
            </p>
          </div>
        </Link>
      </section>
    </main>
  )
}
