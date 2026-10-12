'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle2,
  RotateCcw,
  Sidebar,
  ChevronRight,
  ChevronLeft,
  Layers,
} from 'lucide-react'
import { CharacterData } from '@/types/character'
import { UserProgress, ProgressSummary, PracticeSessionStats } from '@/types/progress'
import { OverallAccuracyResult } from '@/types/accuracy'
import { StrokeCanvas } from '@/components/StrokeCanvas'
import { PracticeSummaryModal } from '@/components/PracticeSummaryModal'
import { AudioSpeakerButton } from '@/components/AudioSpeakerButton'
import { useCharacterAudio } from '@/hooks/useCharacterAudio'
import rawHiraganaData from '@/data/hiragana_46.json'

interface RawHiraganaItem {
  symbol: string
  script_type: string
  row_group: string
  stroke_count: number
  reading: string
  strokes: string[]
}

const FALLBACK_ALL: CharacterData[] = (rawHiraganaData as RawHiraganaItem[]).map((item, idx) => ({
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
      meaning: `Huruf Hiragana ${item.symbol} (${item.reading})`,
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
}))

const ROW_FILTERS = [
  { id: 'all', label: 'Semua (46)' },
  { id: 'vowel', label: 'A (Vokal)' },
  { id: 'ka', label: 'Ka' },
  { id: 'sa', label: 'Sa' },
  { id: 'ta', label: 'Ta' },
  { id: 'na', label: 'Na' },
  { id: 'ha', label: 'Ha' },
  { id: 'ma', label: 'Ma' },
  { id: 'ya', label: 'Ya' },
  { id: 'ra', label: 'Ra' },
  { id: 'wa_n', label: 'Wa / N' },
]

const LOCAL_STORAGE_KEY = 'nihongo_sora_character_progress'

function PracticeStudioContent() {
  const searchParams = useSearchParams()
  const initialCharParam = searchParams.get('char')
  const initialIdParam = searchParams.get('id')

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Master character pool & progress
  const [allCharacters, setAllCharacters] = useState<CharacterData[]>(FALLBACK_ALL)
  const [progressMap, setProgressMap] = useState<Record<number, UserProgress>>({})
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Selected character & queue
  const [selectedChar, setSelectedChar] = useState<CharacterData>(FALLBACK_ALL[0])
  const [selectedRowGroup, setSelectedRowGroup] = useState<string>('all')
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

  // Session stats
  const [sessionStats, setSessionStats] = useState<PracticeSessionStats>({
    totalReviewed: 0,
    newlyMemorized: 0,
    repeatedCount: 0,
  })
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false)

  // Audio Hook
  const { play: playAudio, isItemPlaying, activeSource } = useCharacterAudio()

  // Load progress from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        setProgressMap(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  // Save progress map
  const saveLocalProgress = useCallback((newMap: Record<number, UserProgress>) => {
    setProgressMap(newMap)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newMap))
        window.dispatchEvent(new Event('nihongo_sora_progress_updated'))
      } catch {
        // ignore
      }
    }
  }, [])

  // Fetch characters from Golang Fiber
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
          setAllCharacters(normalized)
          setIsLiveApi(true)

          // Pick target character from query param if available
          if (initialCharParam) {
            const found = normalized.find(
              (item) => item.character === initialCharParam || item.symbol === initialCharParam
            )
            if (found) {
              setSelectedChar(found)
              setLoading(false)
              return
            }
          } else if (initialIdParam) {
            const found = normalized.find((item) => String(item.id) === initialIdParam)
            if (found) {
              setSelectedChar(found)
              setLoading(false)
              return
            }
          }

          setSelectedChar(normalized[0])
          setLoading(false)
          return
        }
      }
      throw new Error('API offline')
    } catch {
      setIsLiveApi(false)
      setAllCharacters(FALLBACK_ALL)

      if (initialCharParam) {
        const found = FALLBACK_ALL.find(
          (item) => item.character === initialCharParam || item.symbol === initialCharParam
        )
        if (found) setSelectedChar(found)
      }
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, initialCharParam, initialIdParam])

  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])

  // Filtered sidebar characters
  const sidebarCharacters = useMemo(() => {
    if (selectedRowGroup === 'all') return allCharacters
    if (selectedRowGroup === 'wa_n') {
      return allCharacters.filter((c) => c.row_group === 'wa' || c.row_group === 'n')
    }
    return allCharacters.filter((c) => c.row_group === selectedRowGroup)
  }, [allCharacters, selectedRowGroup])

  // Summary statistics
  const summary: ProgressSummary = useMemo(() => {
    const total = 46
    let memorized = 0
    let activeLearning = 0

    Object.values(progressMap).forEach((p) => {
      if (p.status === 'memorized') memorized++
      else if (p.status === 'learning') activeLearning++
    })

    const percentage = total > 0 ? Math.round((memorized / total) * 1000) / 10 : 0
    return {
      total_characters: total,
      memorized_count: memorized,
      learning_count: total - memorized,
      active_learning_count: activeLearning,
      percentage,
    }
  }, [progressMap])

  // Advance to next character seamlessly
  const handleNextCharacter = useCallback(() => {
    const currentIndex = allCharacters.findIndex((c) => c.id === selectedChar.id)
    if (currentIndex === -1) return

    const nextIndex = (currentIndex + 1) % allCharacters.length
    setSelectedChar(allCharacters[nextIndex])
  }, [allCharacters, selectedChar.id])

  // Advance to previous character
  const handlePrevCharacter = useCallback(() => {
    const currentIndex = allCharacters.findIndex((c) => c.id === selectedChar.id)
    if (currentIndex === -1) return

    const prevIndex = (currentIndex - 1 + allCharacters.length) % allCharacters.length
    setSelectedChar(allCharacters[prevIndex])
  }, [allCharacters, selectedChar.id])

  // Action: Tandai Sudah Hafal
  const handleMarkMemorized = async () => {
    setIsSubmitting(true)
    const charId = selectedChar.id

    const existing = progressMap[charId] || {
      character_id: charId,
      status: 'learning',
      review_count: 0,
    }

    const updated: UserProgress = {
      ...existing,
      character_id: charId,
      status: 'memorized',
      review_count: (existing.review_count || 0) + 1,
      last_practiced_at: new Date().toISOString(),
    }

    const nextMap = { ...progressMap, [charId]: updated }
    saveLocalProgress(nextMap)

    setSessionStats((prev) => ({
      ...prev,
      totalReviewed: prev.totalReviewed + 1,
      newlyMemorized: prev.newlyMemorized + (existing.status !== 'memorized' ? 1 : 0),
    }))

    if (isLiveApi) {
      try {
        await fetch(`${apiBaseUrl}/progress/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character_id: charId,
            status: 'memorized',
            increment_review: true,
          }),
        })
      } catch {
        // silent fail
      }
    }

    setIsSubmitting(false)
    handleNextCharacter()
  }

  // Action: Ulangi Nanti
  const handleRepeatLater = async () => {
    setIsSubmitting(true)
    const charId = selectedChar.id

    const existing = progressMap[charId] || {
      character_id: charId,
      status: 'learning',
      review_count: 0,
    }

    const updated: UserProgress = {
      ...existing,
      character_id: charId,
      status: 'learning',
      review_count: (existing.review_count || 0) + 1,
      last_practiced_at: new Date().toISOString(),
    }

    const nextMap = { ...progressMap, [charId]: updated }
    saveLocalProgress(nextMap)

    setSessionStats((prev) => ({
      ...prev,
      totalReviewed: prev.totalReviewed + 1,
      repeatedCount: prev.repeatedCount + 1,
    }))

    if (isLiveApi) {
      try {
        await fetch(`${apiBaseUrl}/progress/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character_id: charId,
            status: 'learning',
            increment_review: true,
          }),
        })
      } catch {
        // silent fail
      }
    }

    setIsSubmitting(false)
    handleNextCharacter()
  }

  // Action: Save accuracy score
  const handleSaveAccuracyScore = async (evalResult: OverallAccuracyResult) => {
    const charId = selectedChar.id
    const existing = progressMap[charId] || {
      character_id: charId,
      status: 'learning',
      review_count: 0,
    }

    const updated: UserProgress = {
      ...existing,
      character_id: charId,
      accuracy_score: evalResult.score,
      accuracy_grade: evalResult.grade,
      last_practiced_at: new Date().toISOString(),
    }

    const nextMap = { ...progressMap, [charId]: updated }
    saveLocalProgress(nextMap)

    if (isLiveApi) {
      try {
        await fetch(`${apiBaseUrl}/progress/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character_id: charId,
            accuracy_score: evalResult.score,
          }),
        })
      } catch {
        // silent fail
      }
    }
  }

  const isCurrentMemorized = progressMap[selectedChar.id]?.status === 'memorized'
  const currentAccuracy = progressMap[selectedChar.id]?.accuracy_score

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* ========================================================================= */}
      {/* 1. STUDIO HEADER CONTROL BAR */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sticky top-16 z-30 backdrop-blur-md">
        {/* Left: Drawer toggle & Current Character Info */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              sidebarOpen
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title={sidebarOpen ? 'Sembunyikan Pemilih Huruf' : 'Tampilkan Pemilih Huruf'}
          >
            <Sidebar className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {selectedChar.character || selectedChar.symbol}
              </span>
              <span className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400">
                /{selectedChar.readings?.[0]?.romaji}/
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                Baris {selectedChar.row_group}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {selectedChar.strokes_count} Goresan
              </span>
              {isCurrentMemorized && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  ✓ Hafal
                </span>
              )}
              {currentAccuracy !== undefined && currentAccuracy !== null && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-mono">
                  🎯 {currentAccuracy}%
                </span>
              )}
            </div>

            {/* Audio Button */}
            <AudioSpeakerButton
              character={selectedChar}
              isPlaying={isItemPlaying(selectedChar)}
              activeSource={activeSource}
              onPlay={() => playAudio(selectedChar)}
              size="sm"
              title="Dengarkan pelafalan karakter ini"
            />
          </div>
        </div>

        {/* Right: Quick Spaced Repetition Actions */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrevCharacter}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
            title="Karakter Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Repeat Later */}
          <button
            type="button"
            onClick={handleRepeatLater}
            disabled={isSubmitting}
            className="px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Ulangi karakter ini nanti"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Ulangi Nanti</span>
          </button>

          {/* Mark Memorized */}
          <button
            type="button"
            onClick={handleMarkMemorized}
            disabled={isSubmitting}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Tandai karakter sudah dihafal"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sudah Hafal</span>
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNextCharacter}
            className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition cursor-pointer shadow-xs flex items-center gap-1"
            title="Lanjut ke karakter berikutnya"
          >
            <span className="hidden sm:inline font-bold">Lanjut</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN STUDIO WORKSPACE (DRAWER + FULL CANVAS) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SIDEBAR DRAWER (COLLAPSIBLE) */}
        {sidebarOpen && (
          <aside className="w-64 sm:w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex flex-col z-20 overflow-y-auto">
            {/* Drawer Filter Header */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-500" />
                  <span>Daftar 46 Huruf</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {summary.memorized_count}/46 Hafal
                </span>
              </div>

              {/* Row Filter dropdown */}
              <select
                value={selectedRowGroup}
                onChange={(e) => setSelectedRowGroup(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {ROW_FILTERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    Baris: {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Character List Grid in Sidebar */}
            <div className="p-2 grid grid-cols-4 gap-1.5 overflow-y-auto max-h-[calc(100vh-14rem)]">
              {sidebarCharacters.map((char) => {
                const isSelected = char.id === selectedChar.id
                const isMemorized = progressMap[char.id]?.status === 'memorized'
                const score = progressMap[char.id]?.accuracy_score

                return (
                  <button
                    key={char.id}
                    onClick={() => setSelectedChar(char)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer select-none relative ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-400/50 scale-105 z-10'
                        : isMemorized
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-slate-900 dark:text-slate-100'
                        : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {isMemorized && !isSelected && (
                      <span className="absolute top-1 right-1 text-emerald-500 text-[9px] font-bold">
                        ✓
                      </span>
                    )}

                    <span className="text-xl font-bold leading-tight">
                      {char.character || char.symbol}
                    </span>
                    <span
                      className={`text-[10px] font-mono leading-tight ${
                        isSelected ? 'text-sky-100' : 'text-slate-400'
                      }`}
                    >
                      {char.readings?.[0]?.romaji}
                    </span>

                    {score !== undefined && score !== null && (
                      <span
                        className={`text-[8px] font-mono mt-0.5 ${
                          isSelected ? 'text-sky-100' : 'text-emerald-600 dark:text-emerald-400 font-bold'
                        }`}
                      >
                        {score}%
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        {/* CENTRAL STAGE: FOCUSED STROKE CANVAS */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-4xl">
            {/* DISTRACTION-FREE CANVAS */}
            <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
              {loading ? (
                <div className="py-24 text-center">
                  <span className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin inline-block mb-3" />
                  <p className="text-sm font-semibold text-slate-500">Memuat karakter studio...</p>
                </div>
              ) : (
                <StrokeCanvas
                  character={selectedChar}
                  onSaveScore={handleSaveAccuracyScore}
                  onNextCharacter={handleNextCharacter}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>

            {/* Quick Helper Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span>💡</span>
                <span>
                  <strong>Tips Kaligrafi:</strong> Tarik goresan sesuai arah panah KanjiVG. Evaluasi otomatis akan menilai keselarasan garis dengan algoritma Hausdorff.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSummaryModal(true)}
                className="text-sky-600 dark:text-sky-400 hover:underline font-bold text-xs whitespace-nowrap cursor-pointer"
              >
                Lihat Ringkasan Sesi
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* SUMMARY MODAL */}
      {showSummaryModal && (
        <PracticeSummaryModal
          stats={sessionStats}
          summary={summary}
          onRestartSession={() => {
            setShowSummaryModal(false)
            setSessionStats({
              totalReviewed: 0,
              newlyMemorized: 0,
              repeatedCount: 0,
            })
          }}
        />
      )}
    </div>
  )
}

export default function PracticeStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <span className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin inline-block mb-3"></span>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Menyiapkan Studio Tracing...
            </p>
          </div>
        </div>
      }
    >
      <PracticeStudioContent />
    </Suspense>
  )
}
