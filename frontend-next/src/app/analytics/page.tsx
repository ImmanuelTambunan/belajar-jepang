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
import rawHiraganaData from '@/data/hiragana_107.json'
import rawKatakanaData from '@/data/katakana_107.json'
import { ResetConfirmModal } from '@/components/ResetConfirmModal'
import { useScript } from '@/context/ScriptContext'
import { useLanguage } from '@/context/LanguageContext'
import { KanaSwitcher } from '@/components/KanaSwitcher'
import {
  BarChart3,
  CheckCircle2,
  Trophy,
  Flame,
  Award,
  RefreshCw,
  Trash2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

interface RawKanaItem {
  symbol: string
  script_type: string
  category?: string
  row_group: string
  stroke_count: number
  reading: string
  strokes: string[]
}

const LOCAL_STORAGE_PROGRESS_KEY = 'nihongo_sora_character_progress'
const LOCAL_STORAGE_EXAM_KEY = 'nihongo_sora_exam_history'

type AnalyticsScriptMode = 'hiragana' | 'katakana' | 'overall'

interface RowDefinition {
  row_group: string
  label: string
  sample_kana: string
}

function getRowDefinitions(mode: AnalyticsScriptMode): RowDefinition[] {
  if (mode === 'katakana') {
    return [
      { row_group: 'vowel', label: 'Baris A (Vokal)', sample_kana: 'ア, イ, ウ, エ, オ' },
      { row_group: 'ka', label: 'Baris Ka', sample_kana: 'カ, キ, ク, ケ, コ' },
      { row_group: 'sa', label: 'Baris Sa', sample_kana: 'サ, シ, ス, セ, ソ' },
      { row_group: 'ta', label: 'Baris Ta', sample_kana: 'タ, チ, ツ, テ, ト' },
      { row_group: 'na', label: 'Baris Na', sample_kana: 'ナ, ニ, ヌ, ネ, ノ' },
      { row_group: 'ha', label: 'Baris Ha', sample_kana: 'ハ, ヒ, フ, ヘ, ホ' },
      { row_group: 'ma', label: 'Baris Ma', sample_kana: 'マ, ミ, ム, メ, モ' },
      { row_group: 'ya', label: 'Baris Ya', sample_kana: 'ヤ, ユ, ヨ' },
      { row_group: 'ra', label: 'Baris Ra', sample_kana: 'ラ, リ, ル, レ, ロ' },
      { row_group: 'wa', label: 'Baris Wa / N', sample_kana: 'ワ, ヲ, ン' },
      { row_group: 'ga', label: 'Baris Ga (Dakuon)', sample_kana: 'ガ, ギ, グ, ゲ, ゴ' },
      { row_group: 'za', label: 'Baris Za (Dakuon)', sample_kana: 'ザ, ジ, ズ, ゼ, ゾ' },
      { row_group: 'da', label: 'Baris Da (Dakuon)', sample_kana: 'ダ, ヂ, ヅ, デ, ド' },
      { row_group: 'ba', label: 'Baris Ba (Dakuon)', sample_kana: 'バ, ビ, ブ, ベ, ボ' },
      { row_group: 'pa', label: 'Baris Pa (Handakuon)', sample_kana: 'パ, ピ, プ, ペ, ポ' },
      { row_group: 'yoon', label: 'Yōon (Gabungan)', sample_kana: 'キャ, シュ, チョ, ...' },
    ]
  } else if (mode === 'overall') {
    return [
      { row_group: 'vowel', label: 'Baris A (Vokal)', sample_kana: 'あ/ア, い/イ, う/ウ, ...' },
      { row_group: 'ka', label: 'Baris Ka', sample_kana: 'か/カ, き/キ, く/ク, ...' },
      { row_group: 'sa', label: 'Baris Sa', sample_kana: 'さ/サ, し/シ, す/ス, ...' },
      { row_group: 'ta', label: 'Baris Ta', sample_kana: 'た/タ, ち/チ, つ/ツ, ...' },
      { row_group: 'na', label: 'Baris Na', sample_kana: 'な/ナ, に/ニ, ぬ/ヌ, ...' },
      { row_group: 'ha', label: 'Baris Ha', sample_kana: 'は/ハ, ひ/ヒ, ふ/フ, ...' },
      { row_group: 'ma', label: 'Baris Ma', sample_kana: 'ま/マ, み/ミ, む/ム, ...' },
      { row_group: 'ya', label: 'Baris Ya', sample_kana: 'や/ヤ, ゆ/ユ, よ/ヨ' },
      { row_group: 'ra', label: 'Baris Ra', sample_kana: 'ら/ラ, り/リ, る/ル, ...' },
      { row_group: 'wa', label: 'Baris Wa / N', sample_kana: 'わ/ワ, を/ヲ, ん/ン' },
      { row_group: 'ga', label: 'Baris Ga (Dakuon)', sample_kana: 'が/ガ, ぎ/ギ, ぐ/グ, ...' },
      { row_group: 'za', label: 'Baris Za (Dakuon)', sample_kana: 'ざ/ザ, ジ/ジ, ず/ズ, ...' },
      { row_group: 'da', label: 'Baris Da (Dakuon)', sample_kana: 'だ/ダ, ぢ/ヂ, づ/ヅ, ...' },
      { row_group: 'ba', label: 'Baris Ba (Dakuon)', sample_kana: 'ば/バ, び/ビ, ぶ/ブ, ...' },
      { row_group: 'pa', label: 'Baris Pa (Handakuon)', sample_kana: 'ぱ/パ, ぴ/ピ, ぷ/プ, ...' },
      { row_group: 'yoon', label: 'Yōon (Gabungan)', sample_kana: 'きゃ/キャ, しゃ/シャ, ...' },
    ]
  }
  return [
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
    { row_group: 'ga', label: 'Baris Ga (Dakuon)', sample_kana: 'が, ぎ, ぐ, げ, ご' },
    { row_group: 'za', label: 'Baris Za (Dakuon)', sample_kana: 'ざ, じ, ず, ぜ, ぞ' },
    { row_group: 'da', label: 'Baris Da (Dakuon)', sample_kana: 'だ, ぢ, づ, で, ど' },
    { row_group: 'ba', label: 'Baris Ba (Dakuon)', sample_kana: 'ば, び, ぶ, べ, ぼ' },
    { row_group: 'pa', label: 'Baris Pa (Handakuon)', sample_kana: 'ぱ, ぴ, ぷ, ぺ, ぽ' },
    { row_group: 'yoon', label: 'Yōon (Gabungan)', sample_kana: 'きゃ, しゃ, ちょ, ...' },
  ]
}

export default function AnalyticsDashboardPage() {
  const { script: globalScript } = useScript()
  const { t, language } = useLanguage()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Script Mode state for analytics: 'hiragana' | 'katakana' | 'overall'
  const [scriptMode, setScriptMode] = useState<AnalyticsScriptMode>(
    globalScript === 'katakana' ? 'katakana' : 'hiragana'
  )

  // Dashboard Data State
  const [overview, setOverview] = useState<AnalyticsOverview>({
    total_characters: 107,
    memorized_count: 0,
    learning_count: 107,
    active_learning_count: 0,
    completion_rate: 0,
    overall_accuracy_avg: 0,
    total_practice_count: 0,
    total_exams_taken: 0,
    exam_average_score: 0,
  })

  // Quick stats counts for the top badges
  const [hMemorizedCount, setHMemorizedCount] = useState<number>(0)
  const [kMemorizedCount, setKMemorizedCount] = useState<number>(0)

  const [rowMetrics, setRowMetrics] = useState<RowAccuracyMetric[]>([])
  const [examHistory, setExamHistory] = useState<ExamHistoryAnalyticsItem[]>([])
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'all' | 'accuracy' | 'exams'>('all')
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Format Helper: Seconds to mm:ss
  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0 dtk'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs} dtk`
  }

  // Format Helper: ISO date to friendly format
  const formatDateTime = (isoString: string): string => {
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
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
        label: language === 'en' ? 'Unpracticed' : 'Belum Dilatih',
        classes:
          'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        barColor: 'bg-slate-300 dark:bg-slate-700',
      }
    }
    if (acc >= 85) {
      return {
        label: language === 'en' ? 'Mastered' : 'Sangat Mahir',
        classes:
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      }
    }
    if (acc >= 70) {
      return {
        label: language === 'en' ? 'Good' : 'Bagus',
        classes:
          'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
        barColor: 'bg-gradient-to-r from-sky-500 to-indigo-400',
      }
    }
    return {
      label: language === 'en' ? 'Needs Practice' : 'Perlu Latihan',
      classes:
        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      barColor: 'bg-gradient-to-r from-amber-500 to-rose-400',
    }
  }

  // Local Offline Analytics Calculator (Fallback when Golang API is unreachable or standalone)
  const computeOfflineAnalytics = useCallback(() => {
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

    // Always compute badge counters (107 Hiragana vs 107 Katakana)
    const hRaw = rawHiraganaData as RawKanaItem[]
    const kRaw = rawKatakanaData as RawKanaItem[]
    let hCount = 0
    let kCount = 0

    hRaw.forEach((_, idx) => {
      const charId = idx + 1
      if (progressMap[charId]?.status === 'memorized') hCount++
    })
    kRaw.forEach((_, idx) => {
      const charId = 107 + idx + 1
      if (progressMap[charId]?.status === 'memorized') kCount++
    })
    setHMemorizedCount(hCount)
    setKMemorizedCount(kCount)

    // Build candidate list based on active scriptMode
    let activeKanaItems: Array<{ item: RawKanaItem; id: number }> = []

    if (scriptMode === 'hiragana') {
      activeKanaItems = hRaw.map((item, idx) => ({ item, id: idx + 1 }))
    } else if (scriptMode === 'katakana') {
      activeKanaItems = kRaw.map((item, idx) => ({ item, id: 107 + idx + 1 }))
    } else {
      // Overall: both Hiragana and Katakana (214 characters)
      activeKanaItems = [
        ...hRaw.map((item, idx) => ({ item, id: idx + 1 })),
        ...kRaw.map((item, idx) => ({ item, id: 107 + idx + 1 })),
      ]
    }

    // 1. Overview computation
    const totalChars = activeKanaItems.length
    let memorized = 0
    let activeLearning = 0
    let totalReviewCount = 0
    const accuracyScores: number[] = []

    activeKanaItems.forEach(({ id }) => {
      const p = progressMap[id]
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

    // Filter exams by script mode
    const filteredExams = storedExams.filter((e) => {
      if (scriptMode === 'overall') return true
      return !e.scriptMode || e.scriptMode === scriptMode || e.scriptMode === 'mixed'
    })

    let totalExamScoreSum = 0
    filteredExams.forEach((e) => {
      totalExamScoreSum += e.score || 0
    })
    const examAvgScore =
      filteredExams.length > 0
        ? Math.round((totalExamScoreSum / filteredExams.length) * 10) / 10
        : 0

    const computedOverview: AnalyticsOverview = {
      total_characters: totalChars,
      memorized_count: memorized,
      learning_count: Math.max(0, totalChars - memorized),
      active_learning_count: activeLearning,
      completion_rate: totalChars > 0 ? Math.round((memorized / totalChars) * 1000) / 10 : 0,
      overall_accuracy_avg: overallAvgAcc,
      total_practice_count: totalReviewCount,
      total_exams_taken: filteredExams.length,
      exam_average_score: examAvgScore,
    }

    // 2. Row accuracy computation
    const rowDefs = getRowDefinitions(scriptMode)
    const computedRows: RowAccuracyMetric[] = rowDefs.map((rowDef) => {
      const matching = activeKanaItems.filter(({ item }) => {
        const rg = item.row_group?.toLowerCase().trim()
        if (rowDef.row_group === 'wa') {
          return rg === 'wa' || rg === 'n' || rg === 'wa_n'
        }
        if (rowDef.row_group === 'yoon') {
          return item.category === 'yoon'
        }
        return rg === rowDef.row_group
      })

      const totalInRow = matching.length > 0 ? matching.length : 5
      let memInRow = 0
      let revInRow = 0
      const rowAccuracies: number[] = []

      matching.forEach(({ id }) => {
        const p = progressMap[id]
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
    const formattedExams: ExamHistoryAnalyticsItem[] = filteredExams.map((e, idx) => ({
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
  }, [scriptMode])

  // Load Data with dual-mode support (Live Backend -> Local Offline Fallback)
  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    const backendScriptQuery = scriptMode === 'overall' ? 'all' : scriptMode
    try {
      const [resOverview, resRowAcc, resExamHistory] = await Promise.all([
        fetch(`${apiBaseUrl}/analytics/overview?script=${backendScriptQuery}`),
        fetch(`${apiBaseUrl}/analytics/accuracy-by-row?script=${backendScriptQuery}`),
        fetch(`${apiBaseUrl}/analytics/exam-history?script=${backendScriptQuery}`),
      ])

      if (resOverview.ok && resRowAcc.ok && resExamHistory.ok) {
        const jsonOverview = await resOverview.json()
        const jsonRowAcc = await resRowAcc.json()
        const jsonExamHistory = await resExamHistory.json()

        if (jsonOverview.data) setOverview(jsonOverview.data)
        if (jsonRowAcc.data) setRowMetrics(jsonRowAcc.data)
        if (jsonExamHistory.data) setExamHistory(jsonExamHistory.data)
        setIsLiveBackend(true)

        // Read badge counts from storage
        if (typeof window !== 'undefined') {
          try {
            const progStr = localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY)
            if (progStr) {
              const pm = JSON.parse(progStr)
              let hCount = 0
              let kCount = 0
              for (let i = 1; i <= 107; i++) {
                if (pm[i]?.status === 'memorized') hCount++
              }
              for (let i = 108; i <= 214; i++) {
                if (pm[i]?.status === 'memorized') kCount++
              }
              setHMemorizedCount(hCount)
              setKMemorizedCount(kCount)
            }
          } catch {
            // ignore
          }
        }
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
  }, [apiBaseUrl, computeOfflineAnalytics, scriptMode])

  useEffect(() => {
    loadDashboardData()

    const handleUpdate = () => {
      loadDashboardData()
    }

    window.addEventListener('nihongo_sora_progress_updated', handleUpdate)
    window.addEventListener('nihongo_sora_gamification_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener('nihongo_sora_progress_updated', handleUpdate)
      window.removeEventListener('nihongo_sora_gamification_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [loadDashboardData])

  // Clear Exam History Handler (Local storage)
  const handleClearExamHistory = () => {
    if (
      confirm(
        language === 'en'
          ? 'Are you sure you want to clear your local exam session history?'
          : 'Apakah Anda yakin ingin mereset seluruh riwayat sesi ujian lokal?'
      )
    ) {
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
              Analytics Dashboard
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              学習ダッシュボード
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'en'
              ? 'Learning Statistics & History Dashboard'
              : 'Dasbor Statistik & Riwayat Belajar'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            {language === 'en'
              ? `Track mastery progress across 107 Hiragana and 107 Katakana, brush stroke accuracy by row, and exam performance trends.`
              : `Pantau kemajuan penguasaan 107 Hiragana dan 107 Katakana (Gojūon, Dakuon, Handakuon, & Yōon), akurasi goresan kuas per baris, serta grafik perkembangan nilai ujian Anda.`}
          </p>
        </div>

        {/* Status Pill & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <KanaSwitcher size="sm" />

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
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{language === 'en' ? 'Refresh' : 'Segarkan'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Reset seluruh progres belajar & database"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Reset Progress' : 'Reset Progres'}</span>
          </button>
        </div>
      </div>

      {/* SCRIPT FILTER SEGMENTED CONTROL: HIRAGANA | KATAKANA | OVERALL */}
      <div className="mb-8 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-wrap sm:flex-nowrap gap-1.5 shadow-xs">
        {/* Tab 1: Hiragana */}
        <button
          type="button"
          onClick={() => setScriptMode('hiragana')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            scriptMode === 'hiragana'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-md border border-slate-200/80 dark:border-slate-700 ring-2 ring-sky-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <span className="text-base font-serif font-black text-sky-500">あ</span>
          <span>Hiragana</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold">
            {hMemorizedCount}/107
          </span>
        </button>

        {/* Tab 2: Katakana */}
        <button
          type="button"
          onClick={() => setScriptMode('katakana')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            scriptMode === 'katakana'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200/80 dark:border-slate-700 ring-2 ring-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <span className="text-base font-serif font-black text-indigo-500">ア</span>
          <span>Katakana</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold">
            {kMemorizedCount}/107
          </span>
        </button>

        {/* Tab 3: Ringkasan Gabungan (Overall) */}
        <button
          type="button"
          onClick={() => setScriptMode('overall')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            scriptMode === 'overall'
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-md border border-slate-200/80 dark:border-slate-700 ring-2 ring-purple-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <span className="text-base font-serif font-black text-purple-500">空</span>
          <span>{language === 'en' ? 'Combined (Overall)' : 'Ringkasan Gabungan'}</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold">
            {hMemorizedCount + kMemorizedCount}/214
          </span>
        </button>
      </div>

      {/* SUCCESS TOAST ALERT */}
      {successToast && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TABS NAVIGATION (VIEWS: ALL | ACCURACY | EXAMS) */}
      <div className="flex items-center gap-2 mb-8 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{language === 'en' ? 'All Metrics' : 'Semua Ringkasan'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('accuracy')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'accuracy'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>
            {language === 'en' ? 'Brush Accuracy by Row' : 'Akurasi Goresan Baris'} (
            {scriptMode === 'katakana'
              ? 'Katakana'
              : scriptMode === 'overall'
              ? 'Gabungan'
              : 'Hiragana'}
            )
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'exams'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{language === 'en' ? 'Exam History & Trend' : 'Riwayat & Tren Ujian'}</span>
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
                  {scriptMode === 'katakana' ? 'ア' : scriptMode === 'overall' ? '空' : 'あ'}
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
                  {overview.memorized_count} {t('common.mastered')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {overview.learning_count} {t('common.learning')}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {scriptMode === 'katakana'
                    ? 'Koleksi Katakana'
                    : scriptMode === 'overall'
                    ? 'Total Kurikulum Aksara'
                    : 'Koleksi Hiragana'}
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {overview.total_characters} Karakter
                </span>
              </div>
            </div>

            {/* CARD 2: Tingkat Penyelesaian (Completion Rate) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tingkat Kelulusan
                </span>
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                  <Trophy className="w-4 h-4" />
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
                  {overview.memorized_count}/{overview.total_characters}
                </span>
              </div>
            </div>

            {/* CARD 3: Rata-rata Akurasi Tracing Kuas */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-purple-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Rata-rata Akurasi Tracing
                </span>
                <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-bold">
                  🎯
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                  {overview.overall_accuracy_avg > 0 ? `${overview.overall_accuracy_avg}%` : '0%'}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  {overview.overall_accuracy_avg >= 85
                    ? 'Grade A'
                    : overview.overall_accuracy_avg >= 70
                    ? 'Grade B'
                    : overview.overall_accuracy_avg > 0
                    ? 'Grade C'
                    : 'Belum Uji'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium mt-3">
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {overview.total_practice_count}x Penggoresan
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Metrik Studio</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Jarak Hausdorff KanjiVG
                </span>
              </div>
            </div>

            {/* CARD 4: Rata-rata Skor Ujian */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Rata-rata Skor Ujian
                </span>
                <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                  {overview.exam_average_score > 0 ? `${overview.exam_average_score}` : '-'}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {overview.total_exams_taken} Sesi Selesai
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium mt-3">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Tersimpan di Sistem
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Modul Ujian</span>
                <Link
                  href="/exam"
                  className="font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>Mulai Ujian</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: BRUSH ACCURACY BY ROW METRIC */}
      {(activeTab === 'all' || activeTab === 'accuracy') && (
        <section className="mb-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🎨</span>
                  <span>
                    Akurasi Goresan Kuas per Baris (
                    {scriptMode === 'katakana'
                      ? 'Katakana'
                      : scriptMode === 'overall'
                      ? 'Gabungan Hiragana & Katakana'
                      : 'Hiragana'}
                    )
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Evaluasi presisi goresan berdasarkan kelompok baris (Gojūon, Dakuon, Handakuon, & Yōon).
                </p>
              </div>

              <Link
                href={`/practice?script=${scriptMode === 'katakana' ? 'katakana' : 'hiragana'}`}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>🧠</span>
                <span>Latihan Studio Tracing</span>
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
                        href={`/practice?script=${
                          scriptMode === 'katakana' ? 'katakana' : 'hiragana'
                        }`}
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
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <span>Grafik Tren Nilai & Riwayat Sesi Ujian</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Rekapitulasi nilai dan waktu pengerjaan ujian kuis Hiragana & Katakana dari waktu ke waktu.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/exam"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>Ambil Ujian Baru</span>
                </Link>

                {examHistory.length > 0 && !isLiveBackend && (
                  <button
                    type="button"
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
                  <Award className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Belum Ada Riwayat Sesi Ujian
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
                  Anda belum menyelesaikan sesi ujian. Uji kemampuan hafalan dan presisi goresan huruf Anda sekarang untuk melihat analitik nilai!
                </p>
                <Link
                  href="/exam"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 transition-all"
                >
                  <span>Mulai Ujian Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div>
                {/* INTERACTIVE SCORE TREND SVG CHART */}
                <div className="mb-8 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tren Nilai {chronologicalExams.length} Sesi Terakhir
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Skor 0 - 100
                    </span>
                  </div>

                  <div className="w-full overflow-x-auto">
                    <svg viewBox="0 0 500 120" className="w-full h-32 overflow-visible">
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                      <line x1="0" y1="60" x2="500" y2="60" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />

                      {/* SVG Polyline trend */}
                      {chronologicalExams.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={chronologicalExams
                            .map((item, idx) => {
                              const x = 30 + (idx * (440 / Math.max(chronologicalExams.length - 1, 1)))
                              const y = 100 - (item.score * 0.8)
                              return `${x},${y}`
                            })
                            .join(' ')}
                        />
                      )}

                      {/* Interactive Data Points */}
                      {chronologicalExams.map((item, idx) => {
                        const x = 30 + (idx * (440 / Math.max(chronologicalExams.length - 1, 1)))
                        const y = 100 - (item.score * 0.8)
                        const isSelected = selectedPointIndex === idx

                        return (
                          <g key={item.id || idx}>
                            <circle
                              cx={x}
                              cy={y}
                              r={isSelected ? '6' : '4'}
                              className="fill-purple-600 stroke-white dark:stroke-slate-900 cursor-pointer transition-all"
                              strokeWidth="2"
                              onClick={() => setSelectedPointIndex(idx)}
                            />
                            <text
                              x={x}
                              y={y - 8}
                              textAnchor="middle"
                              className={`text-[9px] ${
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
          href="/learn"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400/50 shadow-xs transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
            あ
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              Koleksi Huruf
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
              Studio Tracing
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

      {/* FULL RESET MODAL */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessToast(msg)
          loadDashboardData()
          setTimeout(() => setSuccessToast(null), 4000)
        }}
      />
    </main>
  )
}
