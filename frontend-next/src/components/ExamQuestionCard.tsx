'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ExamQuestion } from '@/types/exam'
import { BlindTracingQuizCanvas } from './BlindTracingQuizCanvas'

interface ExamQuestionCardProps {
  question: ExamQuestion
  questionIndex: number
  totalQuestions: number
  timerSeconds: number
  onAnswerQuestion: (questionId: number, isCorrect: boolean, userAnswerId?: number, score?: number) => void
  onNextQuestion: () => void
  isLastQuestion: boolean
}

export const ExamQuestionCard: React.FC<ExamQuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  timerSeconds,
  onAnswerQuestion,
  onNextQuestion,
  isLastQuestion,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState<boolean>(false)
  const [timeLeft, setTimeLeft] = useState<number>(timerSeconds)

  const targetChar = question.targetCharacter
  const targetRomaji = targetChar.readings?.[0]?.romaji || '-'
  const targetSymbol = targetChar.character || targetChar.symbol || ''

  // Reset state on question change
  useEffect(() => {
    setSelectedOptionId(null)
    setIsAnswered(false)
    setTimeLeft(timerSeconds)
  }, [question.id, timerSeconds])

  // Native Japanese Text-to-Speech
  const playPronunciation = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(targetSymbol)
      utterance.lang = 'ja-JP'
      utterance.rate = 0.85
      window.speechSynthesis.speak(utterance)
    } catch {
      // ignore audio errors
    }
  }, [targetSymbol])

  // Timer countdown hook
  useEffect(() => {
    if (timerSeconds <= 0 || isAnswered) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Timeout counts as incorrect answer
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timerSeconds, isAnswered, question.id])

  const handleTimeout = () => {
    if (isAnswered) return
    setIsAnswered(true)
    onAnswerQuestion(question.id, false, undefined, 0)
  }

  // Handle multiple-choice selection (Tipe A & B)
  const handleSelectOption = (optionId: number) => {
    if (isAnswered) return
    setSelectedOptionId(optionId)
    setIsAnswered(true)

    const isCorrect = optionId === question.correctAnswerId
    onAnswerQuestion(question.id, isCorrect, optionId, isCorrect ? 100 : 0)
  }

  // Handle Blind Tracing submission (Tipe C)
  const handleBlindTracingSubmit = (score: number, isCorrect: boolean) => {
    if (isAnswered) return
    setIsAnswered(true)
    onAnswerQuestion(question.id, isCorrect, undefined, score)
  }

  // Type badge info
  const getTypeBadge = () => {
    switch (question.type) {
      case 'romaji_to_kana':
        return {
          label: 'Tipe A: Romaji ➔ Kana',
          color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
          desc: 'Pilih simbol Kana yang cocok dengan Romaji berikut:',
        }
      case 'kana_to_romaji':
        return {
          label: 'Tipe B: Kana ➔ Romaji',
          color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          desc: 'Pilih cara baca Romaji yang benar untuk simbol Kana berikut:',
        }
      case 'blind_tracing':
        return {
          label: 'Tipe C: Tantangan Blind Tracing',
          color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          desc: 'Tuliskan karakter ini di kanvas tanpa garis panduan (ingatan langsung):',
        }
    }
  }

  const badgeInfo = getTypeBadge()

  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg dark:shadow-2xl text-slate-800 dark:text-slate-100 transition-colors">
      {/* Question Header & Timer Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono">
            Soal #{questionIndex + 1} dari {totalQuestions}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeInfo.color}`}>
            {badgeInfo.label}
          </span>
        </div>

        {/* Timer Display */}
        {timerSeconds > 0 && (
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
                timeLeft <= 5
                  ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-400 animate-pulse ring-1 ring-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              <span>⏱️</span>
              <span>{timeLeft} detik</span>
            </span>
          </div>
        )}
      </div>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-4 text-center">
        {badgeInfo.desc}
      </p>

      {/* QUESTION MAIN STAGE */}
      <div className="py-6 flex flex-col items-center justify-center">
        {/* TIPE A: PROMPT ROMAJI */}
        {question.type === 'romaji_to_kana' && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3">
              <span className="text-5xl sm:text-6xl font-black font-mono text-sky-600 dark:text-sky-400">
                /{targetRomaji}/
              </span>
              <button
                onClick={playPronunciation}
                title="Dengarkan pengucapan audio"
                className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm transition"
              >
                🔊
              </button>
            </div>
          </div>
        )}

        {/* TIPE B: PROMPT KANA */}
        {question.type === 'kana_to_romaji' && (
          <div className="text-center mb-6">
            <span className="text-7xl sm:text-8xl font-black text-slate-900 dark:text-white drop-shadow-sm select-none">
              {targetSymbol}
            </span>
          </div>
        )}

        {/* TIPE C: PROMPT BLIND TRACING */}
        {question.type === 'blind_tracing' && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
                /{targetRomaji}/
              </span>
              <button
                onClick={playPronunciation}
                title="Dengarkan pengucapan audio"
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
              >
                🔊
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Goreskan huruf Hiragana ini di kotak kaligrafi di bawah:
            </p>
          </div>
        )}

        {/* INTERACTION SECTION: OPTIONS OR CANVAS */}
        {question.type === 'romaji_to_kana' && question.options && (
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {question.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id
              const isCorrectOpt = opt.id === question.correctAnswerId

              let btnStyle =
                'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-slate-750'
              if (isAnswered) {
                if (isCorrectOpt) {
                  btnStyle =
                    'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40'
                } else if (isSelected) {
                  btnStyle =
                    'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/40'
                } else {
                  btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800'
                }
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={isAnswered}
                  className={`p-6 rounded-2xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-center ${btnStyle}`}
                >
                  <span className="text-4xl sm:text-5xl font-black">{opt.symbol}</span>
                  {isAnswered && (
                    <span className="text-xs font-mono opacity-80 mt-1">/{opt.romaji}/</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {question.type === 'kana_to_romaji' && question.options && (
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {question.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id
              const isCorrectOpt = opt.id === question.correctAnswerId

              let btnStyle =
                'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-slate-750'
              if (isAnswered) {
                if (isCorrectOpt) {
                  btnStyle =
                    'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40'
                } else if (isSelected) {
                  btnStyle =
                    'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/40'
                } else {
                  btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800'
                }
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={isAnswered}
                  className={`py-5 px-4 rounded-2xl border-2 text-center transition cursor-pointer flex items-center justify-center font-mono font-black text-xl sm:text-2xl ${btnStyle}`}
                >
                  /{opt.romaji}/
                </button>
              )
            })}
          </div>
        )}

        {/* TIPE C: BLIND TRACING CANVAS */}
        {question.type === 'blind_tracing' && (
          <BlindTracingQuizCanvas
            character={targetChar}
            onAnswerSubmit={handleBlindTracingSubmit}
            disabled={isAnswered}
          />
        )}
      </div>

      {/* POST-ANSWER FEEDBACK BANNER & NEXT BUTTON */}
      {isAnswered && (
        <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div>
            {question.isCorrect ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                  ✓
                </span>
                <span>Jawaban Benar! ({targetSymbol} = /{targetRomaji}/)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">
                  ✕
                </span>
                <span>
                  Kurang Tepat. Jawaban benar: <strong className="text-slate-900 dark:text-white">{targetSymbol} (/{targetRomaji}/)</strong>
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onNextQuestion}
            type="button"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-lg shadow-sky-600/25 cursor-pointer transition active:scale-98 flex items-center justify-center gap-2"
          >
            <span>{isLastQuestion ? 'Lihat Hasil Ujian 🏁' : 'Soal Berikutnya ➔'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
