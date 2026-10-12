'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CharacterData } from '@/types/character'
import { UserProgress } from '@/types/progress'
import { OverallAccuracyResult } from '@/types/accuracy'
import { StrokeCanvas } from './StrokeCanvas'
import { AudioSpeakerButton } from './AudioSpeakerButton'
import { useCharacterAudio } from '@/hooks/useCharacterAudio'

interface PracticeCardProps {
  character: CharacterData
  currentProgress?: UserProgress
  onMarkMemorized: (char: CharacterData) => Promise<void>
  onRepeatLater: (char: CharacterData) => Promise<void>
  onSkip: () => void
  isSubmitting: boolean
  onSaveAccuracyScore?: (char: CharacterData, score: OverallAccuracyResult) => Promise<void> | void
}

export const PracticeCard: React.FC<PracticeCardProps> = ({
  character,
  currentProgress,
  onMarkMemorized,
  onRepeatLater,
  onSkip,
  isSubmitting,
  onSaveAccuracyScore,
}) => {
  // Reveal state for active recall
  const [isRevealed, setIsRevealed] = useState<boolean>(false)

  // Modular Layered Audio Hook (Native Audio priority + Web Speech Fallback)
  const { play, isPlaying, activeSource } = useCharacterAudio()
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true)

  // Load autoplay preference from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('nihongo_sora_practice_autoplay')
      if (stored !== null) {
        setAutoPlayAudio(stored === 'true')
      }
    } catch {
      // ignore
    }
  }, [])

  // Toggle autoplay and persist setting
  const handleToggleAutoPlay = (checked: boolean) => {
    setAutoPlayAudio(checked)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nihongo_sora_practice_autoplay', String(checked))
      } catch {
        // ignore storage errors
      }
    }
  }

  // Trigger audio on character switch if autoplay is enabled
  useEffect(() => {
    setIsRevealed(false)
    if (autoPlayAudio) {
      const timer = setTimeout(() => {
        play(character)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [character.id, character.character, autoPlayAudio, play])

  const romaji = character.readings?.[0]?.romaji || '-'
  const meaning =
    character.readings?.[0]?.meaning ||
    `Karakter Hiragana ${character.character || character.symbol} (${romaji})`
  const isMemorized = currentProgress?.status === 'memorized'
  const reviewCount = currentProgress?.review_count || 0

  return (
    <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm transition-colors mb-8">
      {/* CARD HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            {character.script_type || character.type || 'Hiragana'}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            Baris: {character.row_group || 'vowel'}
          </span>
          {isMemorized && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <span>✓</span> Sudah Dihafal
            </span>
          )}
          {currentProgress?.accuracy_score !== undefined && currentProgress?.accuracy_score !== null && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
              <span>🎯</span> Skor: {currentProgress.accuracy_score}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* TOGGLE: Auto-play on character switch */}
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300 select-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition">
            <input
              type="checkbox"
              checked={autoPlayAudio}
              onChange={(e) => handleToggleAutoPlay(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 cursor-pointer"
            />
            <span>🔊 Putar suara otomatis</span>
          </label>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Riwayat: <strong className="text-slate-900 dark:text-white">{reviewCount}x</strong>
          </span>
        </div>
      </div>

      {/* CHARACTER RECALL & PRONUNCIATION SECTION */}
      <div className="py-8 flex flex-col items-center justify-center text-center">
        <div className="relative inline-block mb-3">
          <h2 className="text-7xl sm:text-8xl font-black text-slate-900 dark:text-white tracking-normal drop-shadow-sm select-none">
            {character.character || character.symbol}
          </h2>

          {/* Quick Corner Audio Button */}
          <div className="absolute -right-12 top-2">
            <AudioSpeakerButton
              character={character}
              isPlaying={isPlaying}
              activeSource={activeSource}
              onPlay={() => play(character)}
              size="md"
              variant="icon"
              title="Dengarkan pengucapan audio"
            />
          </div>
        </div>

        {/* PROMINENT AUDIO BUTTON */}
        <div className="mt-2 mb-4">
          <AudioSpeakerButton
            character={character}
            isPlaying={isPlaying}
            activeSource={activeSource}
            onPlay={() => play(character)}
            variant="button"
            size="md"
            label="Dengarkan Pelafalan"
          />
        </div>

        {/* ACTIVE RECALL REVEAL BOX */}
        <div className="mt-2 min-h-16 flex flex-col items-center justify-center">
          {isRevealed ? (
            <div className="flex flex-col items-center animate-fade-in">
              <span className="text-3xl sm:text-4xl font-mono font-black text-sky-600 dark:text-sky-400">
                /{romaji}/
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md">
                {meaning}
              </p>
            </div>
          ) : (
            <button
              onClick={() => setIsRevealed(true)}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <span>👁️</span>
              <span>Buka Romaji & Arti (Uji Ingatan)</span>
            </button>
          )}
        </div>
      </div>

      {/* INTERACTIVE TRACING CANVAS */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mb-8">
        <div className="mb-4 text-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <span>✍️</span> Kanvas Latihan Tracing (Memori Otot)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tulis ulang goresan di kanvas interaktif di bawah ini sebelum memutuskan hafalan
          </p>
        </div>

        <StrokeCanvas
          character={character}
          onSaveScore={(scoreResult) => {
            if (onSaveAccuracyScore) {
              onSaveAccuracyScore(character, scoreResult)
            }
          }}
          onNextCharacter={() => onMarkMemorized(character)}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* ACTION NAVIGATION BUTTONS */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onSkip}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-4 py-3 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          ⏭️ Lewati Karakter Ini
        </button>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          {/* Ulangi Nanti / Belum Hapal */}
          <button
            onClick={() => onRepeatLater(character)}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 transition cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-98"
          >
            <span>🔄</span>
            <span>Ulangi Nanti / Belum Hapal</span>
          </button>

          {/* Sudah Hapal */}
          <button
            onClick={() => onMarkMemorized(character)}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <span>✅</span>
            <span>Sudah Hapal!</span>
          </button>
        </div>
      </div>
    </div>
  )
}
