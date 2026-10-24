'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  BookOpen,
  PenTool,
  Award,
  BarChart3,
  Settings,
  ArrowRight,
  CheckCircle2,
  Target,
  Flame,
  RefreshCw,
  Cpu,
} from 'lucide-react'
import { CharacterData } from '@/types/character'
import { UserProgress } from '@/types/progress'
import { ExamResultSummary } from '@/types/exam'
import { useCharacterAudio } from '@/hooks/useCharacterAudio'
import { AudioSpeakerButton } from '@/components/AudioSpeakerButton'
import { useGamification } from '@/context/GamificationContext'
import { useLanguage } from '@/context/LanguageContext'
import { useScript } from '@/context/ScriptContext'
import { KanaSwitcher } from '@/components/KanaSwitcher'
import {
  getCharactersNeedingReview,
  getLatestExamFromStorage,
} from '@/utils/srs'
import rawHiraganaData from '@/data/hiragana_107.json'
import rawKatakanaData from '@/data/katakana_107.json'

interface RawKanaItem {
  symbol: string
  script_type: string
  category?: string
  row_group: string
  stroke_count: number
  reading: string
  strokes: string[]
}

const FALLBACK_ALL: CharacterData[] = [
  ...(rawHiraganaData as RawKanaItem[]).map((item, idx) => ({
    id: idx + 1,
    character: item.symbol,
    symbol: item.symbol,
    type: 'hiragana',
    script_type: 'hiragana',
    category: item.category || 'gojuon',
    row_group: item.row_group,
    strokes_count: item.stroke_count,
    stroke_count: item.stroke_count,
    jlpt_level: 'N5',
    readings: [
      {
        id: idx + 1,
        character_id: idx + 1,
        romaji: item.reading,
        meaning: `Karakter Hiragana ${item.symbol} (${item.reading})`,
      },
    ],
    strokes: item.strokes.map((st, sIdx) => ({
      id: idx * 100 + sIdx + 1,
      character_id: idx + 1,
      stroke_order: sIdx + 1,
      stroke_number: sIdx + 1,
      svg_path: st,
      path_data: st,
    })),
  })),
  ...(rawKatakanaData as RawKanaItem[]).map((item, idx) => ({
    id: 107 + idx + 1,
    character: item.symbol,
    symbol: item.symbol,
    type: 'katakana',
    script_type: 'katakana',
    category: item.category || 'gojuon',
    row_group: item.row_group,
    strokes_count: item.stroke_count,
    stroke_count: item.stroke_count,
    jlpt_level: 'N5',
    readings: [
      {
        id: 107 + idx + 1,
        character_id: 107 + idx + 1,
        romaji: item.reading,
        meaning: `Karakter Katakana ${item.symbol} (${item.reading})`,
      },
    ],
    strokes: item.strokes.map((st, sIdx) => ({
      id: (107 + idx) * 100 + sIdx + 1,
      character_id: 107 + idx + 1,
      stroke_order: sIdx + 1,
      stroke_number: sIdx + 1,
      svg_path: st,
      path_data: st,
    })),
  })),
]

const LOCAL_STORAGE_KEY = 'nihongo_sora_character_progress'
const LOCAL_STORAGE_EXAM_KEY = 'nihongo_sora_exam_history'

export default function HomePage() {
  const { currentXP, dailyStreak, levelInfo } = useGamification()
  const { t } = useLanguage()
  const { script } = useScript()
  const [homeScriptFilter, setHomeScriptFilter] = useState<'all' | 'hiragana' | 'katakana'>('all')
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [progressMap, setProgressMap] = useState<Record<number, UserProgress>>({})
  const [latestExam, setLatestExam] = useState<ExamResultSummary | null>(null)
  const [examCount, setExamCount] = useState<number>(0)
  const [lastExamScore, setLastExamScore] = useState<number | null>(null)
  const [isBackendLive, setIsBackendLive] = useState<boolean | null>(null)
  const [isPinging, setIsPinging] = useState<boolean>(false)
  const [latency, setLatency] = useState<number | null>(null)

  // Spotlight character
  const [spotlightChar, setSpotlightChar] = useState<CharacterData>(FALLBACK_ALL[0])
  const { play: playAudio, isItemPlaying } = useCharacterAudio()

  // Safe audio playback handler wrapped in try-catch
  const handlePlayAudio = useCallback(
    async (char: CharacterData) => {
      try {
        await playAudio(char)
      } catch (err) {
        console.warn('HomePage audio playback error:', err)
      }
    },
    [playAudio]
  )

  // Load user progress and exam history
  const loadLocalData = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const storedProgress = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (storedProgress) {
        setProgressMap(JSON.parse(storedProgress))
      }

      setLatestExam(getLatestExamFromStorage())

      const storedExam = localStorage.getItem(LOCAL_STORAGE_EXAM_KEY)
      if (storedExam) {
        const exams = JSON.parse(storedExam)
        if (Array.isArray(exams) && exams.length > 0) {
          setExamCount(exams.length)
          const last = exams[0] || exams[exams.length - 1]
          const sc = last.score ?? last.score_percentage ?? 0
          setLastExamScore(Math.round(sc))
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Ping backend status
  const pingBackend = useCallback(async () => {
    setIsPinging(true)
    const t0 = performance.now()
    try {
      const res = await fetch(`${apiBaseUrl}/health`)
      const t1 = performance.now()
      setLatency(Math.round(t1 - t0))
      setIsBackendLive(res.ok)
    } catch {
      setIsBackendLive(false)
      setLatency(null)
    } finally {
      setIsPinging(false)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    loadLocalData()
    pingBackend()

    // Randomize spotlight character
    const randIndex = Math.floor(Math.random() * FALLBACK_ALL.length)
    setSpotlightChar(FALLBACK_ALL[randIndex])

    const handleProgressChange = () => loadLocalData()
    window.addEventListener('nihongo_sora_progress_updated', handleProgressChange)
    window.addEventListener('storage', handleProgressChange)

    return () => {
      window.removeEventListener('nihongo_sora_progress_updated', handleProgressChange)
      window.removeEventListener('storage', handleProgressChange)
    }
  }, [loadLocalData, pingBackend])

  // Progress summary calculation per script and combined
  const { allStats, hStats, kStats, activeStats } = useMemo(() => {
    const calcForPool = (chars: CharacterData[]) => {
      const total = chars.length
      let memorized = 0
      let learning = 0
      let totalScore = 0
      let scoredCount = 0

      chars.forEach((c) => {
        const p = progressMap[c.id]
        if (p) {
          if (p.status === 'memorized') memorized++
          else if (p.status === 'learning') learning++
          if (p.accuracy_score !== undefined && p.accuracy_score !== null) {
            totalScore += p.accuracy_score
            scoredCount++
          }
        }
      })

      const percent = total > 0 ? Math.round((memorized / total) * 100) : 0
      const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0

      return {
        total,
        memorized,
        learning: learning > 0 ? learning : total - memorized,
        percent,
        avgScore,
        unmemorized: total - memorized,
      }
    }

    const hiraganaChars = FALLBACK_ALL.filter((c) => c.script_type === 'hiragana')
    const katakanaChars = FALLBACK_ALL.filter((c) => c.script_type === 'katakana')

    const computedH = calcForPool(hiraganaChars)
    const computedK = calcForPool(katakanaChars)
    const computedAll = calcForPool(FALLBACK_ALL)

    const active =
      homeScriptFilter === 'hiragana'
        ? computedH
        : homeScriptFilter === 'katakana'
        ? computedK
        : computedAll

    return {
      allStats: computedAll,
      hStats: computedH,
      kStats: computedK,
      activeStats: active,
    }
  }, [progressMap, homeScriptFilter])

  // Characters requiring review based on SRS criteria
  const { needsReviewList, hReviewList, kReviewList, activeReviewList } = useMemo(() => {
    const allReviews = getCharactersNeedingReview(FALLBACK_ALL, progressMap, latestExam)
    const hReviews = allReviews.filter((c) => c.script_type === 'hiragana')
    const kReviews = allReviews.filter((c) => c.script_type === 'katakana')
    const activeReviews =
      homeScriptFilter === 'hiragana'
        ? hReviews
        : homeScriptFilter === 'katakana'
        ? kReviews
        : allReviews

    return {
      needsReviewList: allReviews,
      hReviewList: hReviews,
      kReviewList: kReviews,
      activeReviewList: activeReviews,
    }
  }, [progressMap, latestExam, homeScriptFilter])

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-sky-200/80 dark:border-sky-800/60 p-8 sm:p-12 mb-10 shadow-xl shadow-sky-500/5 transition-all">
        {/* Japanese Calligraphy Watermark in Background */}
        <div className="absolute right-4 -bottom-10 pointer-events-none select-none text-[150px] sm:text-[240px] font-serif font-black text-sky-900/[0.05] dark:text-sky-200/[0.05] leading-none z-0 transition-opacity">
          空
        </div>

        <div className="relative z-10 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-100/90 to-rose-100/90 dark:from-sky-950/80 dark:to-rose-950/80 border border-sky-200 dark:border-rose-900/60 text-sky-900 dark:text-sky-200 text-xs font-bold mb-4 shadow-xs backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{t('home.badge')}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">🌸 Sora &amp; Sakura</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {t('home.hero_title_prefix')}{' '}
            <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-rose-500 dark:from-sky-400 dark:via-indigo-300 dark:to-rose-400 bg-clip-text text-transparent">
              {t('home.hero_title_highlight')}
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {t('home.hero_desc')}
          </p>

          {/* QUICK CTAs */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-8">
            <Link
              href={`/practice?script=${script}`}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-rose-500 hover:from-sky-500 hover:via-indigo-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-sky-600/25 flex items-center gap-2 transition active:scale-98"
            >
              <PenTool className="w-4 h-4" />
              <span>{t('home.cta_practice')} ({script === 'katakana' ? 'Katakana' : 'Hiragana'})</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>

            {/* Tombol Latihan Kilat Huruf Lemah */}
            <Link
              href={
                activeReviewList.length > 0
                  ? `/practice?filter=needs_review&char=${encodeURIComponent(activeReviewList[0].symbol || activeReviewList[0].character)}`
                  : '/practice?filter=needs_review'
              }
              className={`px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md flex items-center gap-2 transition active:scale-98 ${
                activeReviewList.length > 0
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25 ring-2 ring-amber-400/40'
                  : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
              }`}
              title={t('home.srs_alert_desc', { count: activeReviewList.length })}
            >
              <Flame className={`w-4 h-4 ${activeReviewList.length > 0 ? 'fill-white text-white animate-pulse' : 'text-amber-500'}`} />
              <span>{t('home.srs_alert_btn')} ({activeReviewList.length})</span>
            </Link>

            <Link
              href="/exam"
              className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-sm border border-slate-300 dark:border-slate-700 shadow-sm flex items-center gap-2 transition active:scale-98"
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>{t('home.cta_exam')}</span>
            </Link>

            <Link
              href="/learn"
              className="px-5 py-3.5 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 text-sm font-semibold flex items-center gap-2 transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('home.cta_learn')}</span>
            </Link>

            <div className="sm:ml-auto">
              <KanaSwitcher size="sm" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STATUS GAMIFIKASI & DAILY STREAK BANNER */}
      {/* ========================================================================= */}
      <section className="mb-10 p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-md shadow-indigo-500/5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-md shadow-indigo-500/20 shrink-0">
            <span>{levelInfo.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Level {levelInfo.level}: {levelInfo.title}
              </span>
              <span className="text-xs font-serif text-slate-400 dark:text-slate-500">
                ({levelInfo.japaneseTitle})
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold">
                Akumulasi: <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{currentXP} XP</strong>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
                <span>Streak {dailyStreak} {t('nav.streak')}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="md:w-72 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-600 dark:text-slate-400">Progres Level {levelInfo.level + 1}</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">{levelInfo.currentLevelXP} / {levelInfo.nextLevelXP} XP</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.percentage}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            +{100 - levelInfo.currentLevelXP} XP lagi untuk kenaikan level
          </span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. RINGKASAN PROGRES BELAJAR HARI INI */}
      {/* ========================================================================= */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-sky-500" />
              <span>Ringkasan Progres Belajar Hari Ini</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Pantau akumulasi hafalan, akurasi tracing kaligrafi, dan hasil ujian Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Script Filter Segmented Control */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-850 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setHomeScriptFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  homeScriptFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Semua (214)
              </button>
              <button
                type="button"
                onClick={() => setHomeScriptFilter('hiragana')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  homeScriptFilter === 'hiragana'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                あ Hiragana ({hStats.memorized}/107)
              </button>
              <button
                type="button"
                onClick={() => setHomeScriptFilter('katakana')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  homeScriptFilter === 'katakana'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                ア Katakana ({kStats.memorized}/107)
              </button>
            </div>

            <Link
              href="/analytics"
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 ml-2"
            >
              <span>Statistik Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Hafalan */}
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-sky-300 dark:hover:border-sky-800 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Penguasaan Huruf
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {activeStats.memorized}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  / {activeStats.total} {homeScriptFilter === 'hiragana' ? 'Hiragana' : homeScriptFilter === 'katakana' ? 'Katakana' : 'Aksara'}
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${activeStats.percent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                {activeStats.percent}% kurikulum {homeScriptFilter === 'all' ? 'Hiragana & Katakana' : homeScriptFilter === 'katakana' ? 'Katakana' : 'Hiragana'} terkuasai
              </p>
              {homeScriptFilter === 'all' && (
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                  <span>Hiragana: <strong className="text-slate-700 dark:text-slate-300">{hStats.memorized}/107</strong></span>
                  <span>•</span>
                  <span>Katakana: <strong className="text-slate-700 dark:text-slate-300">{kStats.memorized}/107</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Karakter Perlu Diulang (SRS) */}
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-sky-300 dark:hover:border-sky-800 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Perlu Diulang (SRS)
              </span>
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Flame className="w-4 h-4 fill-amber-500" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {activeReviewList.length}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  Huruf Lemah
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                {activeReviewList.length > 0
                  ? 'Akurasi < 70% atau salah di sesi ujian'
                  : 'Semua huruf aman terkontrol lancar'}
              </p>
              {homeScriptFilter === 'all' && activeReviewList.length > 0 && (
                <div className="flex items-center gap-2 mt-1 text-[10px] text-amber-700 dark:text-amber-400">
                  <span>Hiragana: {hReviewList.length}</span>
                  <span>•</span>
                  <span>Katakana: {kReviewList.length}</span>
                </div>
              )}
              <Link
                href={
                  activeReviewList.length > 0
                    ? `/practice?filter=needs_review${homeScriptFilter !== 'all' ? `&script=${homeScriptFilter}` : ''}&char=${encodeURIComponent(activeReviewList[0].symbol || activeReviewList[0].character)}`
                    : `/practice?filter=needs_review${homeScriptFilter !== 'all' ? `&script=${homeScriptFilter}` : ''}`
                }
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                <span>Latihan Kilat</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: Rata-rata Skor Tracing */}
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-sky-300 dark:hover:border-sky-800 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Akurasi Tracing
              </span>
              <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <PenTool className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {activeStats.avgScore > 0 ? `${activeStats.avgScore}%` : '-'}
                </span>
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                  {activeStats.avgScore >= 80 ? 'Grade A' : activeStats.avgScore >= 60 ? 'Grade B' : 'Latihan'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 font-medium">
                Skor algoritma presisi jarak Hausdorff & urutan goresan
              </p>
            </div>
          </div>

          {/* Card 4: Sesi Ujian Terakhir */}
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-sky-300 dark:hover:border-sky-800 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Riwayat Ujian
              </span>
              <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {lastExamScore !== null ? `${lastExamScore}%` : '-'}
                </span>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {examCount} Kali Ujian
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 font-medium">
                {examCount > 0 ? 'Tersimpan otomatis ke database' : 'Belum ada ujian diselesaikan'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SPOTLIGHT KARAKTER HARI INI & QUICK PRACTICE */}
      {/* ========================================================================= */}
      <section className="mb-12 p-6 sm:p-8 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-indigo-200/80 dark:border-indigo-800/60 shadow-lg shadow-indigo-500/5 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Big symbol preview */}
          <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <span className="text-5xl font-black text-slate-900 dark:text-white">
              {spotlightChar.symbol}
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold mb-1">
              <span>🌟</span>
              <span>{t('home.spotlight_badge')}</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {spotlightChar.script_type === 'katakana' ? 'Katakana' : 'Hiragana'} {spotlightChar.symbol} (/{spotlightChar.readings?.[0]?.romaji}/)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {t('home.spotlight_row', { row: spotlightChar.row_group?.toUpperCase() || '' })} • {t('home.spotlight_strokes', { count: spotlightChar.strokes_count })} • JLPT N5
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <AudioSpeakerButton
            character={spotlightChar}
            isPlaying={isItemPlaying(spotlightChar)}
            onPlay={() => handlePlayAudio(spotlightChar)}
            size="md"
            variant="badge"
            label={t('home.spotlight_listen')}
          />

          <Link
            href={`/practice?script=${spotlightChar.script_type || 'hiragana'}&char=${encodeURIComponent(spotlightChar.symbol || spotlightChar.character || '')}`}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
          >
            <PenTool className="w-4 h-4" />
            <span>{t('home.spotlight_practice_btn')} →</span>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MODUL & FITUR UTAMA (ARSIKTETUR MPA) */}
      {/* ========================================================================= */}
      <section className="mb-12">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-bold mb-2">
            <span>✨</span>
            <span>{t('home.features_badge')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {t('home.features_title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('home.features_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Koleksi Huruf */}
          <Link
            href="/learn"
            className="group p-6 rounded-3xl bg-white/80 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-sky-400 dark:hover:border-sky-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                {t('home.card_learn_title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {t('home.card_learn_desc')}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400">
              <span>{t('home.cta_learn')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 2. Studio Tracing */}
          <Link
            href="/practice"
            className="group p-6 rounded-3xl bg-white/80 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {t('home.card_practice_title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {t('home.card_practice_desc')}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <span>{t('home.cta_practice')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 3. Arena Ujian */}
          <Link
            href="/exam"
            className="group p-6 rounded-3xl bg-white/80 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-400 dark:hover:border-purple-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {t('home.card_exam_title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {t('home.card_exam_desc')}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
              <span>{t('home.cta_exam')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 4. Dasbor Analitik */}
          <Link
            href="/analytics"
            className="group p-6 rounded-3xl bg-white/80 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {t('nav.analytics')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {t('nav.analytics_sub')}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>{t('nav.analytics')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 5. Pengaturan & Audio Manager */}
          <Link
            href="/settings"
            className="group p-6 rounded-3xl bg-white/80 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-400 dark:hover:border-amber-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {t('home.card_settings_title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {t('home.card_settings_desc')}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
              <span>{t('nav.settings')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 6. Arsitektur Decoupled Card */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Cpu className="w-5 h-5" />
                </span>
                <button
                  type="button"
                  onClick={pingBackend}
                  disabled={isPinging}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>Ping API</span>
                </button>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Status Decoupled Backend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Golang Fiber + GORM di port 8000
              </p>

              <div className="mt-3 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-500">API Health:</span>
                  <span className={`font-bold flex items-center gap-1.5 ${isBackendLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {isBackendLive ? '200 OK' : 'Offline / Standalone'}
                  </span>
                </div>
                {latency !== null && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-slate-500">Latensi REST:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {latency} ms
                    </span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4">
              Aplikasi tetap berjalan mulus dengan data cadangan lokal jika backend offline.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
