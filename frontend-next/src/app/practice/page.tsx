'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { CharacterData } from '@/types/character'
import { UserProgress, ProgressSummary, PracticeSessionStats } from '@/types/progress'
import { Header } from '@/components/Header'
import { PracticeStatsBar } from '@/components/PracticeStatsBar'
import { PracticeCard } from '@/components/PracticeCard'
import { PracticeSummaryModal } from '@/components/PracticeSummaryModal'
import rawHiraganaData from '@/data/hiragana_46.json'

interface RawHiraganaItem {
  symbol: string
  script_type: string
  row_group: string
  stroke_count: number
  reading: string
  strokes: string[]
}

// Complete 46 Hiragana fallback list
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

const LOCAL_STORAGE_KEY = 'nihongo_sora_character_progress'

export default function PracticePage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Master progress map { character_id: UserProgress }
  const [progressMap, setProgressMap] = useState<Record<number, UserProgress>>({})
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Practice session queue
  const [queue, setQueue] = useState<CharacterData[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [selectedRowGroup, setSelectedRowGroup] = useState<string>('all')

  // Session Statistics
  const [sessionStats, setSessionStats] = useState<PracticeSessionStats>({
    totalReviewed: 0,
    newlyMemorized: 0,
    repeatedCount: 0,
  })

  // Load progress from localStorage on mount (for offline support)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        setProgressMap(JSON.parse(stored))
      }
    } catch {
      // ignore JSON errors
    }
  }, [])

  // Save progress map to localStorage whenever it changes
  const saveLocalProgress = useCallback((newMap: Record<number, UserProgress>) => {
    setProgressMap(newMap)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newMap))
      } catch {
        // ignore storage errors
      }
    }
  }, [])

  // Fetch progress summary & practice queue from Golang Fiber API
  const fetchSessionData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch practice queue
      const rowParam = selectedRowGroup !== 'all' ? `?row=${selectedRowGroup}&limit=46` : '?limit=46'
      const queueRes = await fetch(`${apiBaseUrl}/progress/practice-queue${rowParam}`)

      if (queueRes.ok) {
        const queueJson = await queueRes.json()
        if (queueJson.data && queueJson.data.length > 0) {
          const normalized: CharacterData[] = queueJson.data.map((c: CharacterData) => ({
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
          setQueue(normalized)
          setCurrentIndex(0)
          setIsLiveApi(true)

          if (queueJson.progress) {
            saveLocalProgress(queueJson.progress)
          }
          return
        }
      }
      throw new Error('Fallback to local practice queue')
    } catch {
      setIsLiveApi(false)
      // Fallback: build queue from local data & filter by selectedRowGroup
      let candidates = FALLBACK_ALL
      if (selectedRowGroup !== 'all') {
        if (selectedRowGroup === 'wa_n') {
          candidates = candidates.filter((c) => c.row_group === 'wa' || c.row_group === 'n')
        } else {
          candidates = candidates.filter((c) => c.row_group === selectedRowGroup)
        }
      }
      setQueue(candidates)
      setCurrentIndex(0)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, selectedRowGroup, saveLocalProgress])

  useEffect(() => {
    fetchSessionData()
  }, [fetchSessionData])

  // Overall summary calculated from progressMap
  const summary: ProgressSummary = useMemo(() => {
    const total = 46
    let memorized = 0
    let activeLearning = 0

    Object.values(progressMap).forEach((p) => {
      if (p.status === 'memorized') {
        memorized++
      } else if (p.status === 'learning') {
        activeLearning++
      }
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

  // Current Character in session
  const currentCharacter = queue[currentIndex] || null
  const isSessionFinished = queue.length > 0 && currentIndex >= queue.length

  // Action: "Sudah Hapal"
  const handleMarkMemorized = async (char: CharacterData) => {
    setIsSubmitting(true)
    const charId = char.id

    // Update local state immediately
    const existing = progressMap[charId] || {
      character_id: charId,
      status: 'learning',
      review_count: 0,
    }

    const updated: UserProgress = {
      ...existing,
      character_id: charId,
      status: 'memorized',
      review_count: existing.review_count + 1,
      last_practiced_at: new Date().toISOString(),
    }

    const nextMap = { ...progressMap, [charId]: updated }
    saveLocalProgress(nextMap)

    setSessionStats((prev) => ({
      ...prev,
      totalReviewed: prev.totalReviewed + 1,
      newlyMemorized: prev.newlyMemorized + (existing.status !== 'memorized' ? 1 : 0),
    }))

    // Try posting to backend API if live
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
        // silent fail to preserve smooth client interaction
      }
    }

    setIsSubmitting(false)
    setCurrentIndex((prev) => prev + 1)
  }

  // Action: "Ulangi Nanti / Belum Hapal"
  const handleRepeatLater = async (char: CharacterData) => {
    setIsSubmitting(true)
    const charId = char.id

    // Update review count in progress
    const existing = progressMap[charId] || {
      character_id: charId,
      status: 'learning',
      review_count: 0,
    }

    const updated: UserProgress = {
      ...existing,
      character_id: charId,
      status: 'learning',
      review_count: existing.review_count + 1,
      last_practiced_at: new Date().toISOString(),
    }

    const nextMap = { ...progressMap, [charId]: updated }
    saveLocalProgress(nextMap)

    setSessionStats((prev) => ({
      ...prev,
      totalReviewed: prev.totalReviewed + 1,
      repeatedCount: prev.repeatedCount + 1,
    }))

    // Push character to the end of the queue to be repeated again later in this session!
    setQueue((prev) => [...prev, char])

    // Update backend API if live
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
    setCurrentIndex((prev) => prev + 1)
  }

  // Action: "Lewati"
  const handleSkip = () => {
    setCurrentIndex((prev) => prev + 1)
  }

  // Action: Restart Session
  const handleRestartSession = (mode: 'all' | 'unmemorized') => {
    setSessionStats({
      totalReviewed: 0,
      newlyMemorized: 0,
      repeatedCount: 0,
    })

    let nextQueue = FALLBACK_ALL
    if (selectedRowGroup !== 'all') {
      if (selectedRowGroup === 'wa_n') {
        nextQueue = nextQueue.filter((c) => c.row_group === 'wa' || c.row_group === 'n')
      } else {
        nextQueue = nextQueue.filter((c) => c.row_group === selectedRowGroup)
      }
    }

    if (mode === 'unmemorized') {
      nextQueue = nextQueue.filter((c) => progressMap[c.id]?.status !== 'memorized')
      if (nextQueue.length === 0) {
        nextQueue = FALLBACK_ALL // fallback to all if all are memorized
      }
    }

    setQueue(nextQueue)
    setCurrentIndex(0)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      {/* HEADER WITH NAVIGATION */}
      <Header />

      <div className="mt-8">
        {/* STATS BAR */}
        <PracticeStatsBar
          currentIndex={currentIndex}
          totalInQueue={queue.length}
          summary={summary}
          isLiveApi={isLiveApi}
          selectedRowGroup={selectedRowGroup}
          onRowGroupChange={(row) => setSelectedRowGroup(row)}
        />

        {/* LOADING STATE */}
        {loading && (
          <div className="py-20 text-center">
            <span className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin inline-block mb-3"></span>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Menyiapkan antrean latihan hafalan Hiragana...
            </p>
          </div>
        )}

        {/* ACTIVE PRACTICE CARD */}
        {!loading && currentCharacter && !isSessionFinished && (
          <PracticeCard
            character={currentCharacter}
            currentProgress={progressMap[currentCharacter.id]}
            onMarkMemorized={handleMarkMemorized}
            onRepeatLater={handleRepeatLater}
            onSkip={handleSkip}
            isSubmitting={isSubmitting}
          />
        )}

        {/* SESSION COMPLETED MODAL */}
        {!loading && (isSessionFinished || queue.length === 0) && (
          <PracticeSummaryModal
            stats={sessionStats}
            summary={summary}
            onRestartSession={handleRestartSession}
          />
        )}
      </div>

      {/* FOOTER */}
      <footer className="text-center py-10 mt-12 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <p>
          Nihongo Sora v2.0 • Modul Latihan Hafalan Interaktif (Spaced Repetition & Muscle Memory Tracing)
        </p>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Backend Golang Fiber + GORM • Frontend Next.js 16 (App Router + Tailwind CSS)
        </p>
      </footer>
    </main>
  )
}
