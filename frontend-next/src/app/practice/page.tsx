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
  Flame,
} from 'lucide-react'
import { CharacterData } from '@/types/character'
import { UserProgress, ProgressSummary, PracticeSessionStats } from '@/types/progress'
import { OverallAccuracyResult } from '@/types/accuracy'
import { ExamResultSummary } from '@/types/exam'
import { StrokeCanvas } from '@/components/StrokeCanvas'
import { PracticeSummaryModal } from '@/components/PracticeSummaryModal'
import { AudioSpeakerButton } from '@/components/AudioSpeakerButton'
import { useCharacterAudio } from '@/hooks/useCharacterAudio'
import { useGamification } from '@/context/GamificationContext'
import { useLanguage } from '@/context/LanguageContext'
import { useScript } from '@/context/ScriptContext'
import { KanaSwitcher } from '@/components/KanaSwitcher'
import {
  evaluateCharacterReviewStatus,
  getCharactersNeedingReview,
  getLatestExamFromStorage,
} from '@/utils/srs'
import rawHiraganaData from '@/data/hiragana_107.json'
import rawKatakanaData from '@/data/katakana_107.json'
import rawKanjiData from '@/data/kanji_n5_batch1.json'

interface RawKanaItem {
  symbol: string
  script_type: string
  category?: string
  row_group: string
  stroke_count: number
  reading: string
  strokes: string[]
}

interface RawKanjiItem {
  id: number
  character: string
  jlpt_level: string
  stroke_count: number
  onyomi: string
  kunyomi: string
  meaning_id: string
  meaning_en: string
  category: string
  strokes: string[]
  svg_strokes: string
  examples: Array<{
    word: string
    reading: string
    meaning_id: string
    meaning_en: string
  }>
}

const FALLBACK_HIRAGANA: CharacterData[] = (rawHiraganaData as RawKanaItem[]).map((item, idx) => ({
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

const FALLBACK_KATAKANA: CharacterData[] = (rawKatakanaData as RawKanaItem[]).map((item, idx) => ({
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
      meaning: `Huruf Katakana ${item.symbol} (${item.reading})`,
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
}))

const FALLBACK_KANJI: CharacterData[] = (rawKanjiData as RawKanjiItem[]).map((item) => ({
  id: 2000 + item.id,
  character: item.character,
  symbol: item.character,
  type: 'kanji',
  script_type: 'kanji',
  category: item.category,
  row_group: item.category,
  strokes_count: item.stroke_count,
  stroke_count: item.stroke_count,
  jlpt_level: item.jlpt_level || 'N5',
  onyomi: item.onyomi,
  kunyomi: item.kunyomi,
  meaning_id: item.meaning_id,
  meaning_en: item.meaning_en,
  examples: item.examples,
  readings: [
    {
      id: 2000 + item.id,
      character_id: 2000 + item.id,
      romaji: item.kunyomi || item.onyomi,
      onyomi: item.onyomi,
      kunyomi: item.kunyomi,
      meaning: item.meaning_id,
    },
  ],
  strokes: item.strokes.map((st, sIdx) => ({
    id: (2000 + item.id) * 100 + sIdx + 1,
    character_id: 2000 + item.id,
    stroke_order: sIdx + 1,
    stroke_number: sIdx + 1,
    svg_path: st,
    path_data: st,
  })),
}))

const PRACTICE_CATEGORY_TABS = [
  { id: 'all', label: 'Semua', count: 107 },
  { id: 'gojuon', label: 'Gojūon', count: 46 },
  { id: 'dakuon_handakuon', label: 'Turunan', count: 25 },
  { id: 'yoon', label: 'Yōon', count: 36 },
] as const

const KANJI_PRACTICE_CATEGORY_TABS = [
  { id: 'all', label: 'Semua', count: 103 },
  { id: 'verbs', label: 'Verba', count: 14 },
  { id: 'adjectives', label: 'Sifat', count: 7 },
  { id: 'cardinal_positions', label: 'Mata Angin', count: 7 },
  { id: 'nature_weather', label: 'Alam/Cuaca', count: 8 },
  { id: 'animals', label: 'Hewan', count: 3 },
  { id: 'school_education', label: 'Sekolah', count: 6 },
  { id: 'places_transport', label: 'Tempat/Trans.', count: 10 },
  { id: 'people_family', label: 'Manusia', count: 9 },
  { id: 'body_parts', label: 'Tubuh', count: 5 },
  { id: 'direction_size', label: 'Arah/Ukuran', count: 9 },
  { id: 'numbers', label: 'Angka', count: 13 },
  { id: 'calendar_time', label: 'Hari/Waktu', count: 10 },
  { id: 'origin_place', label: 'Asal/Tempat', count: 2 },
] as const

function getRowFiltersByCategory(script: 'hiragana' | 'katakana' | 'kanji'): Record<string, { id: string; label: string }[]> {
  if (script === 'kanji') {
    return {
      all: [
        { id: 'all', label: 'Semua Kanji N5 (103)' },
        { id: 'verbs', label: 'Kata Kerja / Verba (14)' },
        { id: 'adjectives', label: 'Kata Sifat (7)' },
        { id: 'cardinal_positions', label: 'Arah Mata Angin (7)' },
        { id: 'nature_weather', label: 'Alam & Cuaca (8)' },
        { id: 'animals', label: 'Hewan (3)' },
        { id: 'school_education', label: 'Sekolah & Belajar (6)' },
        { id: 'places_transport', label: 'Tempat & Transportasi (10)' },
        { id: 'people_family', label: 'Manusia & Keluarga (9)' },
        { id: 'body_parts', label: 'Bagian Tubuh (5)' },
        { id: 'direction_size', label: 'Arah & Ukuran (9)' },
        { id: 'numbers', label: 'Angka & Kuantitas (13)' },
        { id: 'calendar_time', label: 'Hari & Waktu (10)' },
        { id: 'origin_place', label: 'Asal & Tempat (2)' },
      ],
      verbs: [{ id: 'all', label: 'Semua Kata Kerja (14)' }],
      adjectives: [{ id: 'all', label: 'Semua Kata Sifat (7)' }],
      cardinal_positions: [{ id: 'all', label: 'Semua Arah Mata Angin (7)' }],
      nature_weather: [{ id: 'all', label: 'Semua Alam & Cuaca (8)' }],
      animals: [{ id: 'all', label: 'Semua Hewan (3)' }],
      school_education: [{ id: 'all', label: 'Semua Sekolah & Belajar (6)' }],
      places_transport: [{ id: 'all', label: 'Semua Tempat & Transportasi (10)' }],
      people_family: [{ id: 'all', label: 'Semua Manusia & Keluarga (9)' }],
      body_parts: [{ id: 'all', label: 'Semua Bagian Tubuh (5)' }],
      direction_size: [{ id: 'all', label: 'Semua Arah & Ukuran (9)' }],
      numbers: [{ id: 'all', label: 'Semua Angka (13)' }],
      calendar_time: [{ id: 'all', label: 'Semua Hari & Waktu (10)' }],
      origin_place: [{ id: 'all', label: 'Semua Asal & Tempat (2)' }],
    }
  }

  const isKatakana = script === 'katakana'
  return {
    all: [
      { id: 'all', label: 'Semua (107)' },
      { id: 'vowel', label: isKatakana ? 'A, I, U, E, O (ア..オ)' : 'A, I, U, E, O (あ..お)' },
      { id: 'ka', label: isKatakana ? 'Ka - Ko (カ..コ)' : 'Ka - Ko (か..こ)' },
      { id: 'sa', label: isKatakana ? 'Sa - So (サ..ソ)' : 'Sa - So (さ..そ)' },
      { id: 'ta', label: isKatakana ? 'Ta - To (タ..ト)' : 'Ta - To (た..と)' },
      { id: 'na', label: isKatakana ? 'Na - No (ナ..ノ)' : 'Na - No (な..の)' },
      { id: 'ha', label: isKatakana ? 'Ha - Ho (ハ..ホ)' : 'Ha - Ho (は..ほ)' },
      { id: 'ma', label: isKatakana ? 'Ma - Mo (マ..モ)' : 'Ma - Mo (ま..も)' },
      { id: 'ya', label: isKatakana ? 'Ya, Yu, Yo (ヤ, ユ, ヨ)' : 'Ya, Yu, Yo (や, ゆ, よ)' },
      { id: 'ra', label: isKatakana ? 'Ra - Ro (ラ..ロ)' : 'Ra - Ro (ら..ろ)' },
      { id: 'wa_n', label: isKatakana ? 'Wa, Wo, N (ワ, ヲ, ン)' : 'Wa, Wo, N (わ, を, ん)' },
      { id: 'ga', label: isKatakana ? 'Ga - Go (ガ..ゴ)' : 'Ga - Go (が..ご)' },
      { id: 'za', label: isKatakana ? 'Za - Zo (ザ..ゾ)' : 'Za - Zo (ざ..ぞ)' },
      { id: 'da', label: isKatakana ? 'Da - Do (ダ..ド)' : 'Da - Do (だ..ど)' },
      { id: 'ba', label: isKatakana ? 'Ba - Bo (バ..ボ)' : 'Ba - Bo (ば..ぼ)' },
      { id: 'pa', label: isKatakana ? 'Pa - Po (パ..ポ)' : 'Pa - Po (ぱ..ぽ)' },
      { id: 'kya', label: isKatakana ? 'Kya (キャ)' : 'Kya (きゃ)' },
      { id: 'sha', label: isKatakana ? 'Sha (シャ)' : 'Sha (しゃ)' },
      { id: 'cha', label: isKatakana ? 'Cha (チャ)' : 'Cha (ちゃ)' },
      { id: 'nya', label: isKatakana ? 'Nya (ニャ)' : 'Nya (にゃ)' },
      { id: 'hya', label: isKatakana ? 'Hya (ヒャ)' : 'Hya (ひゃ)' },
      { id: 'mya', label: isKatakana ? 'Mya (ミャ)' : 'Mya (みゃ)' },
      { id: 'rya', label: isKatakana ? 'Rya (リャ)' : 'Rya (りゃ)' },
      { id: 'gya', label: isKatakana ? 'Gya (ギャ)' : 'Gya (ぎゃ)' },
      { id: 'ja', label: isKatakana ? 'Ja (ジャ)' : 'Ja (じゃ)' },
      { id: 'dya', label: isKatakana ? 'Dya (ヂャ)' : 'Dya (ぢゃ)' },
      { id: 'bya', label: isKatakana ? 'Bya (ビャ)' : 'Bya (びゃ)' },
      { id: 'pya', label: isKatakana ? 'Pya (ピャ)' : 'Pya (ぴゃ)' },
    ],
    gojuon: [
      { id: 'all', label: 'Semua Gojūon (46)' },
      { id: 'vowel', label: isKatakana ? 'A (ア)' : 'A (あ)' },
      { id: 'ka', label: isKatakana ? 'Ka (カ)' : 'Ka (か)' },
      { id: 'sa', label: isKatakana ? 'Sa (サ)' : 'Sa (さ)' },
      { id: 'ta', label: isKatakana ? 'Ta (タ)' : 'Ta (た)' },
      { id: 'na', label: isKatakana ? 'Na (ナ)' : 'Na (な)' },
      { id: 'ha', label: isKatakana ? 'Ha (ハ)' : 'Ha (は)' },
      { id: 'ma', label: isKatakana ? 'Ma (マ)' : 'Ma (ま)' },
      { id: 'ya', label: isKatakana ? 'Ya (ヤ)' : 'Ya (や)' },
      { id: 'ra', label: isKatakana ? 'Ra (ラ)' : 'Ra (ら)' },
      { id: 'wa_n', label: isKatakana ? 'Wa / N (ワ/ン)' : 'Wa / N (わ/ん)' },
    ],
    dakuon_handakuon: [
      { id: 'all', label: 'Semua Turunan (25)' },
      { id: 'ga', label: isKatakana ? 'Ga (ガ)' : 'Ga (が)' },
      { id: 'za', label: isKatakana ? 'Za (ザ)' : 'Za (ざ)' },
      { id: 'da', label: isKatakana ? 'Da (ダ)' : 'Da (だ)' },
      { id: 'ba', label: isKatakana ? 'Ba (バ)' : 'Ba (ば)' },
      { id: 'pa', label: isKatakana ? 'Pa (パ)' : 'Pa (ぱ)' },
    ],
    yoon: [
      { id: 'all', label: 'Semua Yōon (36)' },
      { id: 'kya', label: isKatakana ? 'Kya (キャ)' : 'Kya (きゃ)' },
      { id: 'sha', label: isKatakana ? 'Sha (シャ)' : 'Sha (しゃ)' },
      { id: 'cha', label: isKatakana ? 'Cha (チャ)' : 'Cha (ちゃ)' },
      { id: 'nya', label: isKatakana ? 'Nya (ニャ)' : 'Nya (にゃ)' },
      { id: 'hya', label: isKatakana ? 'Hya (ヒャ)' : 'Hya (ひゃ)' },
      { id: 'mya', label: isKatakana ? 'Mya (ミャ)' : 'Mya (みゃ)' },
      { id: 'rya', label: isKatakana ? 'Rya (リャ)' : 'Rya (りゃ)' },
      { id: 'gya', label: isKatakana ? 'Gya (ギャ)' : 'Gya (ぎゃ)' },
      { id: 'ja', label: isKatakana ? 'Ja (ジャ)' : 'Ja (じゃ)' },
      { id: 'dya', label: isKatakana ? 'Dya (ヂャ)' : 'Dya (ぢゃ)' },
      { id: 'bya', label: isKatakana ? 'Bya (ビャ)' : 'Bya (びゃ)' },
      { id: 'pya', label: isKatakana ? 'Pya (ピャ)' : 'Pya (ぴゃ)' },
    ],
  }
}

const LOCAL_STORAGE_KEY = 'nihongo_sora_character_progress'

function PracticeStudioContent() {
  const { t, language } = useLanguage()
  const { script, setScript } = useScript()
  const searchParams = useSearchParams()
  const initialCharParam = searchParams.get('char')
  const initialIdParam = searchParams.get('id')
  const initialScriptParam = searchParams.get('script')
  const initialFilterParam = searchParams.get('filter')

  const { awardXP } = useGamification()
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Master character pool & progress
  const [allCharacters, setAllCharacters] = useState<CharacterData[]>(
    script === 'kanji'
      ? FALLBACK_KANJI
      : script === 'katakana'
      ? FALLBACK_KATAKANA
      : FALLBACK_HIRAGANA
  )
  const [progressMap, setProgressMap] = useState<Record<number, UserProgress>>({})
  const [latestExam, setLatestExam] = useState<ExamResultSummary | null>(null)
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Selected character & queue
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedChar, setSelectedChar] = useState<CharacterData>(
    script === 'kanji'
      ? FALLBACK_KANJI[0]
      : script === 'katakana'
      ? FALLBACK_KATAKANA[0]
      : FALLBACK_HIRAGANA[0]
  )
  const [selectedRowGroup, setSelectedRowGroup] = useState<string>(
    initialFilterParam === 'needs_review' ? 'needs_review' : 'all'
  )
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

  // Dynamic row filters by category
  const rowFiltersByCategory = useMemo(() => getRowFiltersByCategory(script), [script])

  // Session stats
  const [sessionStats, setSessionStats] = useState<PracticeSessionStats>({
    totalReviewed: 0,
    newlyMemorized: 0,
    repeatedCount: 0,
  })
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false)

  // Audio Hook
  const { play: playAudio, isItemPlaying, activeSource } = useCharacterAudio()

  // Safe audio playback handler wrapped in try-catch
  const handlePlayAudio = useCallback(
    async (char: CharacterData) => {
      try {
        await playAudio(char)
      } catch (err) {
        console.warn('PracticePage audio playback error:', err)
      }
    },
    [playAudio]
  )

  // Synchronize script from query params if specified
  useEffect(() => {
    if (initialScriptParam === 'kanji' && script !== 'kanji') {
      setScript('kanji')
    } else if (initialScriptParam === 'katakana' && script !== 'katakana') {
      setScript('katakana')
    } else if (initialScriptParam === 'hiragana' && script !== 'hiragana') {
      setScript('hiragana')
    } else if (initialCharParam) {
      // Check if requested character is in Kanji dataset
      const isKanjiChar = FALLBACK_KANJI.some(
        (k) => k.character === initialCharParam || k.symbol === initialCharParam
      )
      if (isKanjiChar && script !== 'kanji') {
        setScript('kanji')
        return
      }
      // Check if requested character is in Katakana dataset
      const isKatakanaChar = FALLBACK_KATAKANA.some(
        (k) => k.character === initialCharParam || k.symbol === initialCharParam
      )
      if (isKatakanaChar && script !== 'katakana') {
        setScript('katakana')
      }
    } else if (initialIdParam) {
      const numId = parseInt(initialIdParam, 10)
      if (numId > 2000 && script !== 'kanji') {
        setScript('kanji')
      } else if (numId > 107 && numId <= 2000 && script !== 'katakana') {
        setScript('katakana')
      }
    }
  }, [initialScriptParam, initialCharParam, initialIdParam, script, setScript])

  // Load progress and latest exam from localStorage on mount
  const loadLocalData = useCallback(() => {
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

  useEffect(() => {
    loadLocalData()
    const handleUpdate = () => loadLocalData()
    window.addEventListener('nihongo_sora_progress_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('nihongo_sora_progress_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [loadLocalData])

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
      if (script === 'kanji') {
        const res = await fetch(`${apiBaseUrl}/kanjis`)
        if (res.ok) {
          const json = await res.json()
          if (json.data && json.data.length > 0) {
            const normalized: CharacterData[] = json.data.map((k: any) => {
              const strokesList: string[] = Array.isArray(k.strokes)
                ? k.strokes
                : k.svg_strokes
                ? JSON.parse(k.svg_strokes)
                : []
              const examplesList = Array.isArray(k.examples)
                ? k.examples
                : k.examples
                ? JSON.parse(k.examples)
                : []
              const kanjiId = k.id > 2000 ? k.id : 2000 + k.id
              return {
                id: kanjiId,
                character: k.character,
                symbol: k.character,
                type: 'kanji',
                script_type: 'kanji',
                category: k.category,
                row_group: k.category,
                strokes_count: k.stroke_count || strokesList.length,
                stroke_count: k.stroke_count || strokesList.length,
                jlpt_level: k.jlpt_level || 'N5',
                onyomi: k.onyomi,
                kunyomi: k.kunyomi,
                meaning_id: k.meaning_id,
                meaning_en: k.meaning_en,
                examples: examplesList,
                readings: [
                  {
                    id: kanjiId,
                    character_id: kanjiId,
                    romaji: k.kunyomi || k.onyomi,
                    onyomi: k.onyomi,
                    kunyomi: k.kunyomi,
                    meaning: k.meaning_id,
                  },
                ],
                strokes: strokesList.map((st: string, sIdx: number) => ({
                  id: kanjiId * 100 + sIdx + 1,
                  character_id: kanjiId,
                  stroke_order: sIdx + 1,
                  stroke_number: sIdx + 1,
                  svg_path: st,
                  path_data: st,
                })),
              }
            })
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
              const numId = parseInt(initialIdParam, 10)
              const found = normalized.find(
                (item) =>
                  String(item.id) === initialIdParam ||
                  item.id === numId ||
                  item.id === 2000 + numId
              )
              if (found) {
                setSelectedChar(found)
                setLoading(false)
                return
              }
            }

            setSelectedChar((prev) => {
              const belongsToScript = normalized.some((item) => item.id === prev?.id)
              return belongsToScript ? prev : normalized[0]
            })
            setLoading(false)
            return
          }
        }
      } else {
        const res = await fetch(`${apiBaseUrl}/characters?script=${script}`)
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

            // Ensure selectedChar belongs to current script
            setSelectedChar((prev) => {
              const belongsToScript = normalized.some((item) => item.id === prev?.id)
              return belongsToScript ? prev : normalized[0]
            })
            setLoading(false)
            return
          }
        }
      }
      throw new Error('API offline')
    } catch {
      setIsLiveApi(false)
      const fallback =
        script === 'kanji'
          ? FALLBACK_KANJI
          : script === 'katakana'
          ? FALLBACK_KATAKANA
          : FALLBACK_HIRAGANA
      setAllCharacters(fallback)

      if (initialCharParam) {
        const found = fallback.find(
          (item) => item.character === initialCharParam || item.symbol === initialCharParam
        )
        if (found) {
          setSelectedChar(found)
          setLoading(false)
          return
        }
      } else if (initialIdParam) {
        const numId = parseInt(initialIdParam, 10)
        const found = fallback.find(
          (item) =>
            String(item.id) === initialIdParam ||
            item.id === numId ||
            item.id === 2000 + numId
        )
        if (found) {
          setSelectedChar(found)
          setLoading(false)
          return
        }
      }

      setSelectedChar((prev) => {
        const belongs = fallback.some((item) => item.id === prev?.id)
        return belongs ? prev : fallback[0]
      })
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, script, initialCharParam, initialIdParam])

  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])

  // Characters requiring review based on SRS criteria
  const needsReviewList = useMemo(() => {
    return getCharactersNeedingReview(allCharacters, progressMap, latestExam)
  }, [allCharacters, progressMap, latestExam])

  // If navigated with ?filter=needs_review, select first review character
  useEffect(() => {
    if (
      initialFilterParam === 'needs_review' &&
      !initialCharParam &&
      !initialIdParam &&
      needsReviewList.length > 0
    ) {
      setSelectedChar(needsReviewList[0])
    }
  }, [initialFilterParam, initialCharParam, initialIdParam, needsReviewList])

  // Characters in current active category
  const sidebarCategoryCharacters = useMemo(() => {
    let list = allCharacters
    if (script === 'kanji') {
      if (selectedCategory !== 'all') {
        list = list.filter((c) => c.category === selectedCategory)
      }
      return list
    }

    if (selectedCategory === 'gojuon') {
      list = list.filter((c) => (c.category || 'gojuon') === 'gojuon')
    } else if (selectedCategory === 'dakuon_handakuon') {
      list = list.filter((c) => c.category === 'dakuon' || c.category === 'handakuon')
    } else if (selectedCategory === 'yoon') {
      list = list.filter((c) => c.category === 'yoon')
    }
    return list
  }, [allCharacters, selectedCategory, script])

  // Filtered sidebar characters
  const sidebarCharacters = useMemo(() => {
    if (selectedRowGroup === 'needs_review') {
      return needsReviewList.filter((c) => {
        if (script === 'kanji') {
          if (selectedCategory !== 'all') return c.category === selectedCategory
          return true
        }
        if (selectedCategory === 'gojuon') return (c.category || 'gojuon') === 'gojuon'
        if (selectedCategory === 'dakuon_handakuon')
          return c.category === 'dakuon' || c.category === 'handakuon'
        if (selectedCategory === 'yoon') return c.category === 'yoon'
        return true
      })
    }
    if (selectedRowGroup === 'all') return sidebarCategoryCharacters
    if (script === 'kanji') {
      return sidebarCategoryCharacters.filter((c) => c.category === selectedRowGroup)
    }
    if (selectedRowGroup === 'wa_n') {
      return sidebarCategoryCharacters.filter((c) => c.row_group === 'wa' || c.row_group === 'n')
    }
    return sidebarCategoryCharacters.filter((c) => c.row_group === selectedRowGroup)
  }, [sidebarCategoryCharacters, selectedRowGroup, needsReviewList, selectedCategory, script])

  // Summary statistics (Dynamic 107 characters for active script)
  const summary: ProgressSummary = useMemo(() => {
    const total = allCharacters.length || 107
    let memorized = 0
    let activeLearning = 0

    allCharacters.forEach((c) => {
      const p = progressMap[c.id]
      if (p?.status === 'memorized') memorized++
      else if (p?.status === 'learning') activeLearning++
    })

    const percentage = total > 0 ? Math.round((memorized / total) * 1000) / 10 : 0
    return {
      total_characters: total,
      memorized_count: memorized,
      learning_count: total - memorized,
      active_learning_count: activeLearning,
      percentage,
    }
  }, [allCharacters, progressMap])

  // Advance to next character seamlessly
  const handleNextCharacter = useCallback(() => {
    const list = sidebarCharacters.length > 0 ? sidebarCharacters : allCharacters
    const currentIndex = list.findIndex((c) => c.id === selectedChar.id)
    if (currentIndex === -1) {
      setSelectedChar(list[0])
      return
    }

    const nextIndex = (currentIndex + 1) % list.length
    setSelectedChar(list[nextIndex])
  }, [sidebarCharacters, allCharacters, selectedChar.id])

  // Advance to previous character
  const handlePrevCharacter = useCallback(() => {
    const list = sidebarCharacters.length > 0 ? sidebarCharacters : allCharacters
    const currentIndex = list.findIndex((c) => c.id === selectedChar.id)
    if (currentIndex === -1) {
      setSelectedChar(list[0])
      return
    }

    const prevIndex = (currentIndex - 1 + list.length) % list.length
    setSelectedChar(list[prevIndex])
  }, [sidebarCharacters, allCharacters, selectedChar.id])

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

    if (isLiveApi && script !== 'kanji') {
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

    if (isLiveApi && script !== 'kanji') {
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

    // Gamification: Berhasil menyelesaikan tracing karakter (akurasi >= 70%): +10 XP
    if (evalResult.score >= 70) {
      awardXP(
        10,
        `Presisi Tracing ${selectedChar.character || selectedChar.symbol} (${evalResult.score}%)`
      )
    }

    if (isLiveApi && script !== 'kanji') {
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
  const currentCharReviewStatus = useMemo(() => {
    return evaluateCharacterReviewStatus(selectedChar, progressMap, latestExam)
  }, [selectedChar, progressMap, latestExam])

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] flex flex-col bg-slate-50/70 dark:bg-slate-950/75 backdrop-blur-[1.5px] transition-colors">
      {/* ========================================================================= */}
      {/* 1. STUDIO HEADER CONTROL BAR */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sticky top-16 z-30 backdrop-blur-md">
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
            title={sidebarOpen ? t('common.close') : t('common.search')}
          >
            <Sidebar className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex items-baseline gap-1.5">
              {(() => {
                const selectedCharText = selectedChar.character || selectedChar.symbol || ''
                if (selectedChar.category === 'yoon' && selectedCharText.length === 2) {
                  return (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {selectedCharText[0]}+{selectedCharText[1]}=
                      </span>
                      <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                        {selectedCharText}
                      </span>
                    </div>
                  )
                }
                return (
                  <span className={`text-2xl font-black text-slate-900 dark:text-white ${script === 'kanji' ? 'font-serif' : ''}`}>
                    {selectedCharText}
                  </span>
                )
              })()}
              {script === 'kanji' ? (
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'id'
                    ? selectedChar.meaning_id || selectedChar.readings?.[0]?.meaning
                    : selectedChar.meaning_en || selectedChar.meaning_id || selectedChar.readings?.[0]?.meaning}
                </span>
              ) : (
                <span className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400">
                  /{selectedChar.readings?.[0]?.romaji}/
                </span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5">
              {script === 'kanji' ? (
                <>
                  <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    JLPT {selectedChar.jlpt_level || 'N5'}
                  </span>
                  {selectedChar.onyomi && (
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-mono"
                      title={`On'yomi: ${selectedChar.onyomi}`}
                    >
                      ON: {selectedChar.onyomi.split(',')[0]}
                    </span>
                  )}
                  {selectedChar.kunyomi && (
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono"
                      title={`Kun'yomi: ${selectedChar.kunyomi}`}
                    >
                      KUN: {selectedChar.kunyomi.split(',')[0]}
                    </span>
                  )}
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {selectedChar.strokes_count || selectedChar.stroke_count} {language === 'id' ? 'Goresan' : 'Strokes'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                    Baris {selectedChar.row_group}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {selectedChar.strokes_count} Goresan
                  </span>
                </>
              )}
              {isCurrentMemorized && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  ✓ {t('common.mastered')}
                </span>
              )}
              {currentAccuracy !== undefined && currentAccuracy !== null && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-mono">
                  🎯 {currentAccuracy}%
                </span>
              )}
              {currentCharReviewStatus.needsReview && (
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 flex items-center gap-1"
                  title={currentCharReviewStatus.label}
                >
                  <Flame className="w-3 h-3 text-amber-600 fill-amber-500 animate-pulse" />
                  <span>{t('learn.filter_needs_review')} (SRS)</span>
                </span>
              )}
            </div>

            {/* Audio Button */}
            <AudioSpeakerButton
              character={selectedChar}
              isPlaying={isItemPlaying(selectedChar)}
              activeSource={activeSource}
              onPlay={() => handlePlayAudio(selectedChar)}
              size="sm"
              title={t('learn.modal_listen')}
            />
          </div>
        </div>

        {/* Right: Quick Spaced Repetition Actions & Kana Switcher */}
        <div className="flex items-center gap-2">
          <KanaSwitcher size="sm" />

          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrevCharacter}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
            title={t('practice.prev_char')}
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
            <span className="hidden md:inline">{t('common.retry')}</span>
          </button>

          {/* Mark Memorized */}
          <button
            type="button"
            onClick={handleMarkMemorized}
            disabled={isSubmitting}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title={t('practice.mark_memorized')}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('common.mastered')}</span>
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNextCharacter}
            className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition cursor-pointer shadow-xs flex items-center gap-1"
            title={t('practice.next_char')}
          >
            <span className="hidden sm:inline font-bold">{t('common.next')}</span>
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
                  <span>{script === 'kanji' ? `${allCharacters.length || 103} Kanji N5` : script === 'katakana' ? '107 Katakana' : '107 Hiragana'}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {summary.memorized_count}/{allCharacters.length} {t('nav.memorized')}
                </span>
              </div>

              {/* Script Selector in Drawer */}
              <div className="mb-2">
                <KanaSwitcher size="sm" className="w-full justify-center" />
              </div>

              {/* Category Filter Tabs */}
              <div className={`grid ${script === 'kanji' ? 'grid-cols-3' : 'grid-cols-2'} gap-1 mb-2`}>
                {(script === 'kanji' ? KANJI_PRACTICE_CATEGORY_TABS : PRACTICE_CATEGORY_TABS).map((cat) => {
                  const isCatSelected = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id)
                        setSelectedRowGroup('all')
                      }}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer text-center truncate ${
                        isCatSelected
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat.label} ({cat.count})
                    </button>
                  )
                })}
              </div>

              {/* Quick Filter Switch: All vs Needs Review */}
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => setSelectedRowGroup('all')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer text-center ${
                    selectedRowGroup !== 'needs_review'
                      ? 'bg-sky-50 dark:bg-sky-950/70 border border-sky-400 dark:border-sky-700 text-sky-700 dark:text-sky-300 font-extrabold shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {t('common.all')} ({sidebarCategoryCharacters.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRowGroup('needs_review')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 text-center ${
                    selectedRowGroup === 'needs_review'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                  }`}
                  title="Karakter dengan akurasi < 70% atau salah di ujian"
                >
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Review ({needsReviewList.length})</span>
                </button>
              </div>

              {/* Row Filter dropdown */}
              <select
                value={selectedRowGroup}
                onChange={(e) => setSelectedRowGroup(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="needs_review">
                  ⚠️ {t('practice.srs_drawer_title')} ({needsReviewList.length})
                </option>
                {(rowFiltersByCategory[selectedCategory] || rowFiltersByCategory.all).map(
                  (r) => (
                    <option key={r.id} value={r.id}>
                      Baris: {r.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Character List Grid in Sidebar */}
            <div className="p-2 grid grid-cols-4 gap-1.5 overflow-y-auto max-h-[calc(100vh-14rem)]">
              {sidebarCharacters.length === 0 ? (
                <div className="col-span-4 p-4 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center mb-1">
                    ✓
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('practice.srs_all_good')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedRowGroup('all')}
                    className="mt-2 text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                  >
                    {t('common.all')}
                  </button>
                </div>
              ) : (
                sidebarCharacters.map((char) => {
                  const isSelected = char.id === selectedChar.id
                  const isMemorized = progressMap[char.id]?.status === 'memorized'
                  const score = progressMap[char.id]?.accuracy_score
                  const reviewStatus = evaluateCharacterReviewStatus(
                    char,
                    progressMap,
                    latestExam
                  )
                  const charText = char.character || char.symbol || ''
                  const isYoon = char.category === 'yoon' && charText.length === 2

                  return (
                    <button
                      key={char.id}
                      onClick={() => setSelectedChar(char)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer select-none relative ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-400/50 scale-105 z-10'
                          : reviewStatus.needsReview
                          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 text-slate-900 dark:text-slate-100 hover:border-amber-400'
                          : isMemorized
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-slate-900 dark:text-slate-100'
                          : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Review warning dot */}
                      {reviewStatus.needsReview && !isSelected && (
                        <span
                          className="absolute top-1 left-1 flex h-2 w-2"
                          title={reviewStatus.label}
                        >
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}

                      {isMemorized && !isSelected && (
                        <span className="absolute top-1 right-1 text-emerald-500 text-[9px] font-bold">
                          ✓
                        </span>
                      )}

                      {isYoon ? (
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-[8px] font-bold -mb-0.5 ${
                              isSelected ? 'text-sky-200' : 'text-slate-400'
                            }`}
                          >
                            {charText[0]}+{charText[1]}
                          </span>
                          <span className="text-lg font-black leading-tight">
                            {charText}
                          </span>
                        </div>
                      ) : (
                        <span className={`text-xl font-bold leading-tight ${script === 'kanji' ? 'font-serif' : ''}`}>
                          {charText}
                        </span>
                      )}

                      <span
                        className={`text-[9px] font-medium leading-tight truncate max-w-full px-0.5 ${
                          isSelected ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                        title={
                          (script === 'kanji'
                            ? (language === 'id'
                                ? (char.meaning_id || char.readings?.[0]?.meaning)
                                : (char.meaning_en || char.meaning_id))
                            : char.readings?.[0]?.romaji) || undefined
                        }
                      >
                        {script === 'kanji'
                          ? (language === 'id'
                              ? (char.meaning_id || char.readings?.[0]?.romaji || char.readings?.[0]?.meaning || '')
                              : (char.meaning_en || char.meaning_id || ''))
                          : char.readings?.[0]?.romaji}
                      </span>

                      {score !== undefined && score !== null && (
                        <span
                          className={`text-[8px] font-mono mt-0.5 ${
                            isSelected
                              ? 'text-sky-100'
                              : score >= 70
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'text-amber-600 dark:text-amber-400 font-bold'
                          }`}
                        >
                          {score}%
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </aside>
        )}

        {/* CENTRAL STAGE: FOCUSED STROKE CANVAS */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-4xl">
            {/* SRS Active Banner */}
            {selectedRowGroup === 'needs_review' && (
              <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-500 text-white shrink-0">
                    <Flame className="w-4 h-4 fill-white" />
                  </span>
                  <div>
                    <strong className="font-extrabold">Antrean Spaced Repetition (SRS):</strong>{' '}
                    Menampilkan karakter dengan akurasi &lt; 70% atau salah di sesi ujian terakhir. Selesaikan goresan dengan akurasi ≥ 70% untuk meraih +10 XP!
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRowGroup('all')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 font-bold hover:bg-amber-50 text-[11px] whitespace-nowrap cursor-pointer shrink-0"
                >
                  Lihat Semua
                </button>
              </div>
            )}
            {/* DISTRACTION-FREE CANVAS */}
            <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 shadow-xl shadow-sky-500/5">
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
