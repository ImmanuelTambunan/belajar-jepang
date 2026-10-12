'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { CharacterData } from '@/types/character'
import { ExamConfig, ExamQuestion, ExamResultSummary } from '@/types/exam'
import { Header } from '@/components/Header'
import { ExamConfigCard } from '@/components/ExamConfigCard'
import { ExamQuestionCard } from '@/components/ExamQuestionCard'
import { ExamResultSummaryView } from '@/components/ExamResultSummaryView'
import { generateExamQuestions, calculateExamGrade } from '@/utils/examGenerator'
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
}))

const LOCAL_STORAGE_EXAM_HISTORY = 'nihongo_sora_exam_history'

export default function ExamPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Master character pool
  const [allCharacters, setAllCharacters] = useState<CharacterData[]>(FALLBACK_ALL)
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false)

  // Exam flow states: 'config' | 'in_progress' | 'summary'
  const [examState, setExamState] = useState<'config' | 'in_progress' | 'summary'>('config')
  const [currentConfig, setCurrentConfig] = useState<ExamConfig | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [startTime, setStartTime] = useState<number>(0)
  const [examSummary, setExamSummary] = useState<ExamResultSummary | null>(null)

  // Fetch character dataset from Go API if available
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/characters`)
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
            return
          }
        }
      } catch {
        // use fallback data
        setIsLiveApi(false)
      }
    }

    fetchCharacters()
  }, [apiBaseUrl])

  // Start exam session
  const handleStartExam = useCallback(
    (config: ExamConfig) => {
      const generated = generateExamQuestions(allCharacters, config)
      if (generated.length === 0) return

      setCurrentConfig(config)
      setQuestions(generated)
      setCurrentIndex(0)
      setStartTime(Date.now())
      setExamSummary(null)
      setExamState('in_progress')
    },
    [allCharacters]
  )

  // Record answer for current question
  const handleAnswerQuestion = useCallback(
    (
      questionId: number,
      isCorrect: boolean,
      userAnswerId?: number,
      score?: number
    ) => {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                isCorrect,
                userAnswerId,
                userTracingScore: score,
                answeredAt: new Date().toISOString(),
              }
            : q
        )
      )
    },
    []
  )

  // Advance to next question or complete exam
  const handleNextQuestion = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      return
    }

    // Exam Finished! Calculate results
    const total = questions.length
    const correct = questions.filter((q) => q.isCorrect === true).length
    const wrong = total - correct
    const finalScore = total > 0 ? Math.round((correct / total) * 100) : 0
    const duration = Math.max(1, Math.round((Date.now() - startTime) / 1000))

    const wrongChars = questions
      .filter((q) => q.isCorrect !== true)
      .map((q) => q.targetCharacter)

    const gradeInfo = calculateExamGrade(finalScore)

    const summary: ExamResultSummary = {
      totalQuestions: total,
      correctAnswers: correct,
      wrongAnswers: wrong,
      score: finalScore,
      durationSeconds: duration,
      grade: gradeInfo.grade,
      gradeLabel: gradeInfo.gradeLabel,
      gradeJapanese: gradeInfo.gradeJapanese,
      wrongCharacters: wrongChars,
      questions,
      createdAt: new Date().toISOString(),
    }

    setExamSummary(summary)
    setExamState('summary')

    // 1. Save to LocalStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_EXAM_HISTORY)
        const historyList = stored ? JSON.parse(stored) : []
        historyList.unshift(summary)
        localStorage.setItem(
          LOCAL_STORAGE_EXAM_HISTORY,
          JSON.stringify(historyList.slice(0, 30))
        )
      } catch {
        // ignore storage errors
      }
    }

    // 2. Sync with Golang Fiber Backend (POST /api/exam/submit)
    try {
      const wrongIds = wrongChars.map((c) => c.id)
      await fetch(`${apiBaseUrl}/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_questions: total,
          correct_answers: correct,
          score: finalScore,
          duration_seconds: duration,
          wrong_character_ids: wrongIds,
        }),
      })
    } catch {
      // silent fail in offline mode
    }
  }, [currentIndex, questions, startTime, apiBaseUrl])

  // Retake exam with the same configuration
  const handleRetakeExam = useCallback(() => {
    if (!currentConfig) return
    handleStartExam(currentConfig)
  }, [currentConfig, handleStartExam])

  // Return to configuration screen
  const handleNewConfig = useCallback(() => {
    setExamState('config')
  }, [])

  // Interactive progress percentage
  const progressPercent = useMemo(() => {
    if (questions.length === 0) return 0
    return Math.round(((currentIndex + 1) / questions.length) * 100)
  }, [currentIndex, questions.length])

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      {/* HEADER WITH NAVIGATION */}
      <Header />

      <div className="mt-8">
        {/* EXAM STATE 1: CONFIGURATION */}
        {examState === 'config' && (
          <ExamConfigCard
            onStartExam={handleStartExam}
            totalAvailableCharacters={allCharacters.length}
          />
        )}

        {/* EXAM STATE 2: IN PROGRESS */}
        {examState === 'in_progress' && questions.length > 0 && (
          <div>
            {/* Top Interactive Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                <span>
                  Kemajuan Ujian: <strong className="text-slate-900 dark:text-white">{currentIndex + 1}</strong> dari{' '}
                  {questions.length} Soal
                </span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-rose-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Active Question Card */}
            <ExamQuestionCard
              question={questions[currentIndex]}
              questionIndex={currentIndex}
              totalQuestions={questions.length}
              timerSeconds={currentConfig?.timerSecondsPerQuestion || 0}
              onAnswerQuestion={handleAnswerQuestion}
              onNextQuestion={handleNextQuestion}
              isLastQuestion={currentIndex === questions.length - 1}
            />
          </div>
        )}

        {/* EXAM STATE 3: RESULT SUMMARY */}
        {examState === 'summary' && examSummary && (
          <ExamResultSummaryView
            summary={examSummary}
            onRetakeExam={handleRetakeExam}
            onNewConfig={handleNewConfig}
          />
        )}
      </div>

      {/* FOOTER */}
      <footer className="text-center py-10 mt-12 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <p>
          Nihongo Sora v2.0 • Modul Ujian Hafalan & Blind Tracing Challenge
        </p>
        <p className="mt-1">
          Backend Golang Fiber + GORM (MySQL) • Frontend Next.js 16 (App Router)
        </p>
      </footer>
    </main>
  )
}
