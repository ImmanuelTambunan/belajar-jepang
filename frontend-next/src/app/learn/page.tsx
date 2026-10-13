'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  Search,
  X,
  PenTool,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
  Filter,
  Flame,
} from 'lucide-react'
import { CharacterData } from '@/types/character'
import { UserProgress } from '@/types/progress'
import { ExamResultSummary } from '@/types/exam'
import { AudioSpeakerButton } from '@/components/AudioSpeakerButton'
import { useCharacterAudio } from '@/hooks/useCharacterAudio'
import {
  evaluateCharacterReviewStatus,
  getCharactersNeedingReview,
  getLatestExamFromStorage,
} from '@/utils/srs'
import rawHiraganaData from '@/data/hiragana_46.json'

interface RawHiraganaItem {
  symbol: string
  script_type: string
  row_group: string
  stroke_count: number
  reading: string
  strokes: string[]
}

const FALLBACK_HIRAGANA: CharacterData[] = (rawHiraganaData as RawHiraganaItem[]).map(
  (item, idx) => ({
    id: idx + 1,
    character: item.symbol,
    symbol: item.symbol,
    type: item.script_type,
    script_type: item.script_type,
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
  })
)

interface RowTab {
  id: string
  label: string
  sublabel: string
  rowGroups: string[]
}

const ROW_TABS: RowTab[] = [
  {
    id: 'all',
    label: 'Semua',
    sublabel: '46 Huruf',
    rowGroups: ['vowel', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'n'],
  },
  { id: 'vowel', label: 'A', sublabel: 'A, I, U, E, O', rowGroups: ['vowel'] },
  { id: 'ka', label: 'Ka', sublabel: 'Ka, Ki, Ku, Ke, Ko', rowGroups: ['ka'] },
  { id: 'sa', label: 'Sa', sublabel: 'Sa, Shi, Su, Se, So', rowGroups: ['sa'] },
  { id: 'ta', label: 'Ta', sublabel: 'Ta, Chi, Tsu, Te, To', rowGroups: ['ta'] },
  { id: 'na', label: 'Na', sublabel: 'Na, Ni, Nu, Ne, No', rowGroups: ['na'] },
  { id: 'ha', label: 'Ha', sublabel: 'Ha, Hi, Fu, He, Ho', rowGroups: ['ha'] },
  { id: 'ma', label: 'Ma', sublabel: 'Ma, Mi, Mu, Me, Mo', rowGroups: ['ma'] },
  { id: 'ya', label: 'Ya', sublabel: 'Ya, Yu, Yo', rowGroups: ['ya'] },
  { id: 'ra', label: 'Ra', sublabel: 'Ra, Ri, Ru, Re, Ro', rowGroups: ['ra'] },
  { id: 'wa_n', label: 'Wa/N', sublabel: 'Wa, Wo, N', rowGroups: ['wa', 'n'] },
]

const STROKE_COLORS = ['#0284c7', '#ec4899', '#10b981', '#f97316', '#8b5cf6', '#06b6d4']
const LOCAL_STORAGE_KEY = 'nihongo_sora_character_progress'

export default function LearnPage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [characters, setCharacters] = useState<CharacterData[]>(FALLBACK_HIRAGANA)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'memorized' | 'learning' | 'needs_review'>('all')
  const [loading, setLoading] = useState<boolean>(false)
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false)

  // User progress map & latest exam history
  const [progressMap, setProgressMap] = useState<Record<number, UserProgress>>({})
  const [latestExam, setLatestExam] = useState<ExamResultSummary | null>(null)

  // Modal Detail State
  const [modalChar, setModalChar] = useState<CharacterData | null>(null)
  const [isAnimatingStroke, setIsAnimatingStroke] = useState<boolean>(false)
  const [activeAnimStrokeIdx, setActiveAnimStrokeIdx] = useState<number | null>(null)

  // Audio Hook
  const { play: playAudio, isItemPlaying, activeSource } = useCharacterAudio()

  // Safe audio playback handler wrapped in try-catch
  const handlePlayAudio = useCallback(
    async (char: CharacterData) => {
      try {
        await playAudio(char)
      } catch (err) {
        console.warn('LearnPage audio playback error:', err)
      }
    },
    [playAudio]
  )

  // Load progress and latest exam
  const loadProgress = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        setProgressMap(JSON.parse(stored))
      }
      setLatestExam(getLatestExamFromStorage())
    } catch {
      // ignore
    }
  }, [])

  // Fetch from Golang Fiber API
  const fetchCharacters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBaseUrl}/characters/hiragana`)
      if (res.ok) {
        const json = await res.json()
        if (json.data && json.data.length > 0) {
          const normalized: CharacterData[] = json.data.map((c: CharacterData) => ({
            ...c,
            character: c.character || c.symbol || '',
            symbol: c.symbol || c.character || '',
            strokes_count: c.strokes_count || c.stroke_count || c.strokes?.length || 0,
            strokes: (c.strokes || []).map((s, sIdx) => ({
              ...s,
              stroke_order: s.stroke_order ?? s.stroke_number ?? sIdx + 1,
              stroke_number: s.stroke_number ?? s.stroke_order ?? sIdx + 1,
              svg_path: s.svg_path || s.path_data || '',
              path_data: s.path_data || s.svg_path || '',
            })),
          }))
          setCharacters(normalized)
          setIsLiveApi(true)
          return
        }
      }
      throw new Error('API offline')
    } catch {
      setIsLiveApi(false)
      setCharacters(FALLBACK_HIRAGANA)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    fetchCharacters()
    loadProgress()

    const handleProgress = () => loadProgress()
    window.addEventListener('nihongo_sora_progress_updated', handleProgress)
    window.addEventListener('storage', handleProgress)

    return () => {
      window.removeEventListener('nihongo_sora_progress_updated', handleProgress)
      window.removeEventListener('storage', handleProgress)
    }
  }, [fetchCharacters, loadProgress])

  // Filtered characters
  const filteredList = useMemo(() => {
    let result = characters

    // Filter by row group tab
    const currentTab = ROW_TABS.find((t) => t.id === activeTab)
    if (currentTab && currentTab.id !== 'all') {
      result = result.filter((c) => {
        const row = (c.row_group || '').toLowerCase()
        return currentTab.rowGroups.includes(row)
      })
    }

    // Filter by search query (romaji or symbol)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((c) => {
        const symbol = (c.character || c.symbol || '').toLowerCase()
        const romaji = (c.readings?.[0]?.romaji || '').toLowerCase()
        return symbol.includes(q) || romaji.includes(q)
      })
    }

    // Filter by mastery status
    if (masteryFilter === 'memorized') {
      result = result.filter((c) => progressMap[c.id]?.status === 'memorized')
    } else if (masteryFilter === 'learning') {
      result = result.filter((c) => progressMap[c.id]?.status !== 'memorized')
    } else if (masteryFilter === 'needs_review') {
      result = result.filter((c) => {
        const { needsReview } = evaluateCharacterReviewStatus(c, progressMap, latestExam)
        return needsReview
      })
    }

    return result
  }, [characters, activeTab, searchQuery, masteryFilter, progressMap, latestExam])

  // Count of characters needing review
  const needsReviewCount = useMemo(() => {
    return getCharactersNeedingReview(characters, progressMap, latestExam).length
  }, [characters, progressMap, latestExam])

  // Hitsujun Animation controller in modal
  const animTimerRef = useRef<number | null>(null)
  const playStrokeAnimation = useCallback(() => {
    if (!modalChar || !modalChar.strokes || modalChar.strokes.length === 0) return
    setIsAnimatingStroke(true)
    setActiveAnimStrokeIdx(0)

    let current = 0
    const total = modalChar.strokes.length

    if (animTimerRef.current) clearInterval(animTimerRef.current)

    animTimerRef.current = window.setInterval(() => {
      current++
      if (current < total) {
        setActiveAnimStrokeIdx(current)
      } else {
        if (animTimerRef.current) clearInterval(animTimerRef.current)
        setIsAnimatingStroke(false)
        setActiveAnimStrokeIdx(null)
      }
    }, 750)
  }, [modalChar])

  const stopStrokeAnimation = () => {
    if (animTimerRef.current) clearInterval(animTimerRef.current)
    setIsAnimatingStroke(false)
    setActiveAnimStrokeIdx(null)
  }

  // Navigate next/previous in modal
  const navigateModalChar = (direction: 'prev' | 'next') => {
    if (!modalChar) return
    stopStrokeAnimation()
    const currentIndex = characters.findIndex((c) => c.id === modalChar.id)
    if (currentIndex === -1) return

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (nextIndex < 0) nextIndex = characters.length - 1
    if (nextIndex >= characters.length) nextIndex = 0

    setModalChar(characters[nextIndex])
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-bold mb-2">
            <span>🎌</span>
            <span>Tabel Gojūon (五十音) Lengkap</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Koleksi Karakter Hiragana
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Jelajahi 46 karakter dasar Hiragana. Klik karakter untuk melihat detail urutan goresan resmi KanjiVG (Hitsujun), dengarkan audio pelafalan, atau langsung mulai latihan tracing.
          </p>
        </div>

        {/* Live sync & status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveApi ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isLiveApi ? 'Golang API Live' : 'Data Lokal (46)'}</span>
          </div>

          <button
            type="button"
            onClick={fetchCharacters}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer text-xs"
            title="Muat Ulang Data dari API"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CONTROLS: SEARCH & STATUS FILTER */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari huruf atau romaji (cth: a, ka, shi, ん)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shrink-0">
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'needs_review', label: `Perlu Diulang (${needsReviewCount})` },
                { id: 'memorized', label: 'Sudah Hafal' },
                { id: 'learning', label: 'Belum Hafal' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMasteryFilter(opt.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  masteryFilter === opt.id
                    ? opt.id === 'needs_review'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-sky-600 text-sky-700 dark:text-white shadow-2xs'
                    : opt.id === 'needs_review'
                    ? 'text-amber-700 dark:text-amber-400 hover:text-amber-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.id === 'needs_review' && (
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                )}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ROW GROUP FILTER TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {ROW_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex flex-col items-center border ${
                isActive
                  ? 'bg-sky-600 dark:bg-sky-500 text-white border-sky-600 dark:border-sky-500 shadow-sm shadow-sky-500/20'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="leading-tight">{tab.label}</span>
              <span
                className={`text-[10px] font-normal leading-tight ${
                  isActive ? 'text-sky-100' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {tab.sublabel}
              </span>
            </button>
          )
        })}
      </div>

      {/* CHARACTER COUNTER */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
        <span>Menampilkan {filteredList.length} dari {characters.length} Karakter</span>
        <span>Klik kartu untuk detail urutan goresan & latihan</span>
      </div>

      {/* CHARACTER GRID */}
      {filteredList.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
          <p className="text-4xl mb-3">🔍</p>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Tidak ada karakter yang cocok
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Coba ubah kata kunci pencarian atau ganti filter baris huruf.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setActiveTab('all')
              setMasteryFilter('all')
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 transition"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2.5 sm:gap-3">
          {filteredList.map((item) => {
            const isMemorized = progressMap[item.id]?.status === 'memorized'
            const accuracyScore = progressMap[item.id]?.accuracy_score
            const isPlaying = isItemPlaying(item)
            const reviewStatus = evaluateCharacterReviewStatus(
              item,
              progressMap,
              latestExam
            )

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  stopStrokeAnimation()
                  setModalChar(item)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    stopStrokeAnimation()
                    setModalChar(item)
                  }
                }}
                className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center select-none ${
                  reviewStatus.needsReview
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 hover:border-amber-400 hover:shadow-md'
                    : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-md'
                }`}
              >
                {/* Needs Review Pulsing Indicator */}
                {reviewStatus.needsReview && (
                  <span
                    className="absolute top-1.5 left-1.5 z-10 flex h-2.5 w-2.5"
                    title={reviewStatus.label}
                  >
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}

                {/* Status Badges (Hafal) */}
                {isMemorized && !reviewStatus.needsReview && (
                  <span
                    className="absolute top-1.5 left-1.5 text-emerald-500 text-[10px]"
                    title="Sudah Hafal"
                  >
                    ✓
                  </span>
                )}

                {/* Speaker Button */}
                <div className="absolute top-1.5 right-1.5 z-10">
                  <AudioSpeakerButton
                    character={item}
                    isPlaying={isPlaying}
                    onPlay={() => handlePlayAudio(item)}
                    size="xs"
                    stopPropagation={true}
                    title={`Putar audio pelafalan ${item.character}`}
                  />
                </div>

                {/* Big Kana Symbol */}
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1 group-hover:scale-110 transition-transform">
                  {item.character || item.symbol}
                </span>

                {/* Romaji */}
                <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 mt-1 uppercase">
                  /{item.readings?.[0]?.romaji || '-'}/
                </span>

                {/* Needs Review Pill */}
                {reviewStatus.needsReview && (
                  <span
                    className="mt-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-[8px] font-extrabold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 leading-none"
                    title={reviewStatus.label}
                  >
                    Review
                  </span>
                )}

                {/* Stroke count & accuracy */}
                <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                  <span>{item.strokes_count} Goresan</span>
                  {accuracyScore !== undefined && accuracyScore !== null && (
                    <>
                      <span>•</span>
                      <span
                        className={`font-bold ${
                          accuracyScore >= 70
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {accuracyScore}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE DETAIL MODAL (HITSUJUN & AUDIO) */}
      {/* ========================================================================= */}
      {modalChar && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header & Close Button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  {modalChar.script_type || 'Hiragana'}
                </span>
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                  Baris {modalChar.row_group}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  JLPT N5
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigateModalChar('prev')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                  title="Karakter Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateModalChar('next')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                  title="Karakter Selanjutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopStrokeAnimation()
                    setModalChar(null)
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer ml-1"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Needs Review Alert Banner in Modal */}
            {(() => {
              const modalReviewStatus = modalChar
                ? evaluateCharacterReviewStatus(modalChar, progressMap, latestExam)
                : null
              if (!modalReviewStatus?.needsReview) return null
              return (
                <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-amber-500 text-white shrink-0">
                      <Flame className="w-4 h-4 fill-white" />
                    </span>
                    <div>
                      <strong className="font-extrabold">Karakter Perlu Diulang (SRS):</strong>{' '}
                      {modalReviewStatus.label}
                    </div>
                  </div>
                  <Link
                    href={`/practice?char=${modalChar.symbol || modalChar.character}`}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs whitespace-nowrap self-start sm:self-auto shadow-xs"
                  >
                    Latih di Studio Tracing →
                  </Link>
                </div>
              )
            })()}

            {/* Modal Body */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* SVG Character Display & Hitsujun Visual */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-center shadow-inner">
                  {/* KanjiVG SVG Rendering with Stroke Colors */}
                  <svg viewBox="0 0 109 109" className="w-full h-full drop-shadow-md">
                    {modalChar.strokes.map((stroke, index) => {
                      const color = STROKE_COLORS[index % STROKE_COLORS.length]
                      const isHighlighted =
                        activeAnimStrokeIdx !== null
                          ? activeAnimStrokeIdx === index
                          : true

                      return (
                        <path
                          key={stroke.id || index}
                          d={stroke.svg_path || stroke.path_data}
                          stroke={color}
                          strokeWidth={isHighlighted ? '5' : '2'}
                          opacity={isHighlighted ? 1 : 0.25}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                          className="transition-all duration-300"
                        />
                      )
                    })}
                  </svg>

                  {/* Play animation floating badge */}
                  {isAnimatingStroke && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-bold animate-pulse">
                      Goresan #{activeAnimStrokeIdx !== null ? activeAnimStrokeIdx + 1 : 1}
                    </div>
                  )}
                </div>

                {/* Animation Controls */}
                <div className="flex items-center gap-2 mt-3 w-full">
                  <button
                    type="button"
                    onClick={playStrokeAnimation}
                    disabled={isAnimatingStroke}
                    className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isAnimatingStroke ? 'Memutar...' : 'Animasi Hitsujun'}</span>
                  </button>
                  {isAnimatingStroke && (
                    <button
                      type="button"
                      onClick={stopStrokeAnimation}
                      className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition cursor-pointer"
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>

              {/* Character Details & Actions */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline gap-3 mb-2">
                    <h2 className="text-5xl font-black text-slate-900 dark:text-white">
                      {modalChar.character || modalChar.symbol}
                    </h2>
                    <span className="text-2xl font-mono font-bold text-sky-600 dark:text-sky-400">
                      /{modalChar.readings?.[0]?.romaji}/
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    {modalChar.readings?.[0]?.meaning ||
                      `Karakter Hiragana ${modalChar.character} (${modalChar.readings?.[0]?.romaji})`}
                  </p>

                  {/* Audio Speaker */}
                  <div className="mt-4 flex items-center gap-3">
                    <AudioSpeakerButton
                      character={modalChar}
                      isPlaying={isItemPlaying(modalChar)}
                      activeSource={activeSource}
                      onPlay={() => handlePlayAudio(modalChar)}
                      size="md"
                      variant="badge"
                      label="Putar Audio Pelafalan"
                    />
                  </div>

                  {/* Stroke Breakdown Tags */}
                  <div className="mt-5">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Urutan Goresan Resmi ({modalChar.strokes.length}):
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {modalChar.strokes.map((stroke, index) => {
                        const color = STROKE_COLORS[index % STROKE_COLORS.length]
                        return (
                          <span
                            key={stroke.id || index}
                            className="text-[11px] font-mono px-2 py-0.5 rounded-md border font-bold"
                            style={{
                              borderColor: `${color}60`,
                              color: color,
                              backgroundColor: `${color}15`,
                            }}
                          >
                            #{stroke.stroke_order ?? index + 1}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Direct CTA: Jump to Tracing Studio */}
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <Link
                    href={`/practice?char=${modalChar.character || modalChar.symbol}`}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-98"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Latihan Tracing Huruf Ini di Studio →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
