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

const FALLBACK_HIRAGANA: CharacterData[] = (rawHiraganaData as RawKanaItem[]).map(
  (item, idx) => ({
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
  })
)

const FALLBACK_KATAKANA: CharacterData[] = (rawKatakanaData as RawKanaItem[]).map(
  (item, idx) => ({
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
  })
)

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

interface RowTab {
  id: string
  label: string
  sublabel: string
  rowGroups: string[]
}

export type CategoryId =
  | 'all'
  | 'gojuon'
  | 'dakuon_handakuon'
  | 'yoon'
  | 'nature_weather'
  | 'animals'
  | 'school_education'
  | 'places_transport'
  | 'people_family'
  | 'body_parts'
  | 'direction_size'
  | 'numbers'
  | 'calendar_time'
  | 'origin_place'

function getRowTabsByCategory(script: 'hiragana' | 'katakana' | 'kanji'): Record<CategoryId, RowTab[]> {
  if (script === 'kanji') {
    return {
      all: [
        { id: 'all', label: 'Semua', sublabel: '75 Kanji N5', rowGroups: [] },
        { id: 'nature_weather', label: 'Alam & Cuaca', sublabel: '8 Karakter', rowGroups: ['nature_weather'] },
        { id: 'animals', label: 'Hewan', sublabel: '3 Karakter', rowGroups: ['animals'] },
        { id: 'school_education', label: 'Sekolah & Belajar', sublabel: '6 Karakter', rowGroups: ['school_education'] },
        { id: 'places_transport', label: 'Tempat & Transportasi', sublabel: '10 Karakter', rowGroups: ['places_transport'] },
        { id: 'people_family', label: 'Manusia & Keluarga', sublabel: '9 Karakter', rowGroups: ['people_family'] },
        { id: 'body_parts', label: 'Bagian Tubuh', sublabel: '5 Karakter', rowGroups: ['body_parts'] },
        { id: 'direction_size', label: 'Arah & Ukuran', sublabel: '9 Karakter', rowGroups: ['direction_size'] },
        { id: 'numbers', label: 'Angka', sublabel: '13 Karakter', rowGroups: ['numbers'] },
        { id: 'calendar_time', label: 'Hari & Waktu', sublabel: '10 Karakter', rowGroups: ['calendar_time'] },
        { id: 'origin_place', label: 'Asal & Tempat', sublabel: '2 Karakter', rowGroups: ['origin_place'] },
      ],
      nature_weather: [
        { id: 'all', label: 'Semua Alam & Cuaca', sublabel: '8 Karakter (山..空)', rowGroups: ['nature_weather'] },
      ],
      animals: [
        { id: 'all', label: 'Semua Hewan', sublabel: '3 Karakter (犬, 魚, 鳥)', rowGroups: ['animals'] },
      ],
      school_education: [
        { id: 'all', label: 'Semua Sekolah & Belajar', sublabel: '6 Karakter (学..何)', rowGroups: ['school_education'] },
      ],
      places_transport: [
        { id: 'all', label: 'Semua Tempat & Transportasi', sublabel: '10 Karakter (駅..語)', rowGroups: ['places_transport'] },
      ],
      people_family: [
        { id: 'all', label: 'Semua Manusia & Keluarga', sublabel: '9 Karakter (人..生)', rowGroups: ['people_family'] },
      ],
      body_parts: [
        { id: 'all', label: 'Semua Bagian Tubuh', sublabel: '5 Karakter (目..足)', rowGroups: ['body_parts'] },
      ],
      direction_size: [
        { id: 'all', label: 'Semua Arah & Ukuran', sublabel: '9 Karakter (上..白)', rowGroups: ['direction_size'] },
      ],
      numbers: [
        { id: 'all', label: 'Semua Angka', sublabel: '13 Karakter (一..万)', rowGroups: ['numbers'] },
      ],
      calendar_time: [
        { id: 'all', label: 'Semua Hari & Waktu', sublabel: '10 Karakter (日..分)', rowGroups: ['calendar_time'] },
      ],
      origin_place: [
        { id: 'all', label: 'Semua Asal & Tempat', sublabel: '2 Karakter (本, 国)', rowGroups: ['origin_place'] },
      ],
      gojuon: [],
      dakuon_handakuon: [],
      yoon: [],
    }
  }

  const isKatakana = script === 'katakana'

  return {
    all: [
      { id: 'all', label: 'Semua', sublabel: '107 Karakter', rowGroups: [] },
      { id: 'gojuon', label: 'Gojūon', sublabel: '46 Dasar', rowGroups: ['vowel', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'n'] },
      { id: 'dakuon', label: 'Dakuon', sublabel: isKatakana ? '20 Tenten (ガ..ボ)' : '20 Tenten (が..ぼ)', rowGroups: ['ga', 'za', 'da', 'ba'] },
      { id: 'handakuon', label: 'Handakuon', sublabel: isKatakana ? '5 Maru (パ..ポ)' : '5 Maru (ぱ..ぽ)', rowGroups: ['pa'] },
      { id: 'yoon', label: 'Yōon', sublabel: isKatakana ? '36 Gabungan (キャ..)' : '36 Gabungan (きゃ..)', rowGroups: ['kya', 'sha', 'cha', 'nya', 'hya', 'mya', 'rya', 'gya', 'ja', 'dya', 'bya', 'pya'] },
    ],
    gojuon: [
      { id: 'all', label: 'Semua Gojūon', sublabel: '46 Huruf', rowGroups: ['vowel', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'n'] },
      { id: 'vowel', label: 'A', sublabel: isKatakana ? 'ア, イ, ウ, エ, オ' : 'あ, い, う, え, お', rowGroups: ['vowel'] },
      { id: 'ka', label: 'Ka', sublabel: isKatakana ? 'カ, キ, ク, ケ, コ' : 'か, き, く, け, こ', rowGroups: ['ka'] },
      { id: 'sa', label: 'Sa', sublabel: isKatakana ? 'サ, シ, ス, セ, ソ' : 'さ, し, す, せ, そ', rowGroups: ['sa'] },
      { id: 'ta', label: 'Ta', sublabel: isKatakana ? 'タ, チ, ツ, テ, ト' : 'た, ち, つ, て, と', rowGroups: ['ta'] },
      { id: 'na', label: 'Na', sublabel: isKatakana ? 'ナ, ニ, ヌ, ネ, ノ' : 'な, に, ぬ, ね, の', rowGroups: ['na'] },
      { id: 'ha', label: 'Ha', sublabel: isKatakana ? 'ハ, ヒ, フ, ヘ, ホ' : 'は, ひ, ふ, へ, ほ', rowGroups: ['ha'] },
      { id: 'ma', label: 'Ma', sublabel: isKatakana ? 'マ, ミ, ム, メ, モ' : 'ま, み, む, め, も', rowGroups: ['ma'] },
      { id: 'ya', label: 'Ya', sublabel: isKatakana ? 'ヤ, ユ, ヨ' : 'や, ゆ, よ', rowGroups: ['ya'] },
      { id: 'ra', label: 'Ra', sublabel: isKatakana ? 'ラ, リ, ル, レ, ロ' : 'ら, り, る, れ, ろ', rowGroups: ['ra'] },
      { id: 'wa_n', label: 'Wa/N', sublabel: isKatakana ? 'ワ, ヲ, ン' : 'わ, を, ん', rowGroups: ['wa', 'n'] },
    ],
    dakuon_handakuon: [
      { id: 'all', label: 'Semua Turunan', sublabel: '25 Huruf', rowGroups: ['ga', 'za', 'da', 'ba', 'pa'] },
      { id: 'ga', label: isKatakana ? 'Ga (ガ)' : 'Ga (が)', sublabel: isKatakana ? 'ガ, ギ, グ, ゲ, ゴ' : 'が, ぎ, ぐ, げ, ご', rowGroups: ['ga'] },
      { id: 'za', label: isKatakana ? 'Za (ザ)' : 'Za (ざ)', sublabel: isKatakana ? 'ザ, ジ, ズ, ゼ, ゾ' : 'ざ, じ, ず, ぜ, ぞ', rowGroups: ['za'] },
      { id: 'da', label: isKatakana ? 'Da (ダ)' : 'Da (だ)', sublabel: isKatakana ? 'ダ, ヂ, ヅ, デ, ド' : 'だ, ぢ, づ, で, ど', rowGroups: ['da'] },
      { id: 'ba', label: isKatakana ? 'Ba (バ)' : 'Ba (ば)', sublabel: isKatakana ? 'バ, ビ, ブ, ベ, ボ' : 'ば, び, ぶ, べ, ぼ', rowGroups: ['ba'] },
      { id: 'pa', label: isKatakana ? 'Pa (パ)' : 'Pa (ぱ)', sublabel: isKatakana ? 'パ, ピ, プ, ペ, ポ' : 'ぱ, ぴ, ぷ, ぺ, ぽ', rowGroups: ['pa'] },
    ],
    yoon: [
      { id: 'all', label: 'Semua Yōon', sublabel: '36 Huruf', rowGroups: ['kya', 'sha', 'cha', 'nya', 'hya', 'mya', 'rya', 'gya', 'ja', 'dya', 'bya', 'pya'] },
      { id: 'kya', label: 'Kya', sublabel: isKatakana ? 'キャ, キュ, キョ' : 'きゃ, きゅ, きょ', rowGroups: ['kya'] },
      { id: 'sha', label: 'Sha', sublabel: isKatakana ? 'シャ, シュ, ショ' : 'しゃ, しゅ, しょ', rowGroups: ['sha'] },
      { id: 'cha', label: 'Cha', sublabel: isKatakana ? 'チャ, チュ, チョ' : 'ちゃ, ちゅ, ちょ', rowGroups: ['cha'] },
      { id: 'nya', label: 'Nya', sublabel: isKatakana ? 'ニャ, ニュ, ニョ' : 'にゃ, にゅ, にょ', rowGroups: ['nya'] },
      { id: 'hya', label: 'Hya', sublabel: isKatakana ? 'ヒャ, ヒュ, ヒョ' : 'ひゃ, ひゅ, ひょ', rowGroups: ['hya'] },
      { id: 'mya', label: 'Mya', sublabel: isKatakana ? 'ミャ, ミュ, ミョ' : 'みゃ, みゅ, みょ', rowGroups: ['mya'] },
      { id: 'rya', label: 'Rya', sublabel: isKatakana ? 'リャ, リュ, リョ' : 'りゃ, りゅ, りょ', rowGroups: ['rya'] },
      { id: 'gya', label: 'Gya', sublabel: isKatakana ? 'ギャ, ギュ, ギョ' : 'ぎゃ, ぎゅ, ぎょ', rowGroups: ['gya'] },
      { id: 'ja', label: 'Ja', sublabel: isKatakana ? 'ジャ, ジュ, ジョ' : 'じゃ, じゅ, じょ', rowGroups: ['ja'] },
      { id: 'dya', label: 'Dya', sublabel: isKatakana ? 'ヂャ, ヂュ, ヂョ' : 'ぢゃ, ぢゅ, ぢょ', rowGroups: ['dya'] },
      { id: 'bya', label: 'Bya', sublabel: isKatakana ? 'ビャ, ビュ, ビョ' : 'びゃ, びゅ, びょ', rowGroups: ['bya'] },
      { id: 'pya', label: 'Pya', sublabel: isKatakana ? 'ピャ, ピュ, ピョ' : 'ぴゃ, ぴゅ, ぴょ', rowGroups: ['pya'] },
    ],
    nature_weather: [],
    animals: [],
    school_education: [],
    places_transport: [],
    numbers: [],
    calendar_time: [],
    people_family: [],
    body_parts: [],
    direction_size: [],
    origin_place: [],
  }
}

const STROKE_COLORS = ['#0284c7', '#ec4899', '#10b981', '#f97316', '#8b5cf6', '#06b6d4']
const LOCAL_STORAGE_KEY = 'nihongo_sora_character_progress'

export default function LearnPage() {
  const { t, language } = useLanguage()
  const { script, setScript } = useScript()
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [characters, setCharacters] = useState<CharacterData[]>(
    script === 'kanji' ? FALLBACK_KANJI : script === 'katakana' ? FALLBACK_KATAKANA : FALLBACK_HIRAGANA
  )
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'memorized' | 'learning' | 'needs_review'>('all')
  const [loading, setLoading] = useState<boolean>(false)
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false)

  // Dynamic row tabs based on active script
  const rowTabsByCategory = useMemo(() => getRowTabsByCategory(script), [script])

  // Category navigation tabs for Kana
  const categoryTabs = useMemo<{ id: CategoryId; label: string; sublabel: string; icon: string }[]>(
    () => [
      { id: 'all', label: t('categories.all'), sublabel: t('categories.all_count'), icon: '🎴' },
      { id: 'gojuon', label: t('categories.gojuon'), sublabel: t('categories.gojuon_sub'), icon: '🌱' },
      { id: 'dakuon_handakuon', label: t('categories.dakuon_handakuon'), sublabel: t('categories.dakuon_handakuon_sub'), icon: '⚡' },
      { id: 'yoon', label: t('categories.yoon'), sublabel: t('categories.yoon_sub'), icon: '✨' },
    ],
    [t]
  )

  // Category navigation tabs for Kanji
  const kanjiCategoryTabs = useMemo<{ id: CategoryId; label: string; sublabel: string; icon: string }[]>(
    () => [
      { id: 'all', label: t('categories.kanji_all') || 'Semua (75)', sublabel: t('categories.kanji_all_count') || '75 Kanji', icon: '🎴' },
      { id: 'nature_weather', label: t('categories.kanji_nature') || 'Alam & Cuaca', sublabel: t('categories.kanji_nature_sub') || '8 Karakter (山 .. 空)', icon: '🏔️' },
      { id: 'animals', label: t('categories.kanji_animals') || 'Hewan', sublabel: t('categories.kanji_animals_sub') || '3 Karakter (犬, 魚, 鳥)', icon: '🐕' },
      { id: 'school_education', label: t('categories.kanji_school') || 'Sekolah & Belajar', sublabel: t('categories.kanji_school_sub') || '6 Karakter (学 .. 何)', icon: '🏫' },
      { id: 'places_transport', label: t('categories.kanji_places') || 'Tempat & Transportasi', sublabel: t('categories.kanji_places_sub') || '10 Karakter (駅 .. 語)', icon: '🚆' },
      { id: 'people_family', label: t('categories.kanji_people') || 'Manusia & Keluarga', sublabel: t('categories.kanji_people_sub') || '9 Karakter (人 .. 生)', icon: '👥' },
      { id: 'body_parts', label: t('categories.kanji_body') || 'Bagian Tubuh', sublabel: t('categories.kanji_body_sub') || '5 Karakter (目 .. 足)', icon: '👁️' },
      { id: 'direction_size', label: t('categories.kanji_direction') || 'Arah & Ukuran', sublabel: t('categories.kanji_direction_sub') || '9 Karakter (上 .. 白)', icon: '🧭' },
      { id: 'numbers', label: t('categories.kanji_numbers') || 'Angka & Kuantitas', sublabel: t('categories.kanji_numbers_sub') || '13 Angka (一 .. 万)', icon: '🔢' },
      { id: 'calendar_time', label: t('categories.kanji_calendar') || 'Hari & Waktu', sublabel: t('categories.kanji_calendar_sub') || '10 Waktu & Alam (日 .. 分)', icon: '📅' },
      { id: 'origin_place', label: t('categories.kanji_origin') || 'Asal & Tempat', sublabel: t('categories.kanji_origin_sub') || '2 Karakter (本, 国)', icon: '🇯🇵' },
    ],
    [t]
  )

  const activeCategoryTabs = script === 'kanji' ? kanjiCategoryTabs : categoryTabs

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
            setCharacters(normalized)
            setIsLiveApi(true)
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
            setCharacters(normalized)
            setIsLiveApi(true)
            return
          }
        }
      }
      throw new Error('API offline')
    } catch {
      setIsLiveApi(false)
      setCharacters(
        script === 'kanji'
          ? FALLBACK_KANJI
          : script === 'katakana'
          ? FALLBACK_KATAKANA
          : FALLBACK_HIRAGANA
      )
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, script])

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

  // Reset tab to all on script or category change if needed
  useEffect(() => {
    setActiveTab('all')
  }, [script, selectedCategory])

  // Filtered characters
  const filteredList = useMemo(() => {
    let result = characters

    // Filter by selected category
    if (script === 'kanji') {
      if (selectedCategory !== 'all') {
        result = result.filter((c) => c.category === selectedCategory)
      }
    } else {
      if (selectedCategory === 'gojuon') {
        result = result.filter((c) => (c.category || 'gojuon') === 'gojuon')
      } else if (selectedCategory === 'dakuon_handakuon') {
        result = result.filter(
          (c) => c.category === 'dakuon' || c.category === 'handakuon'
        )
      } else if (selectedCategory === 'yoon') {
        result = result.filter((c) => c.category === 'yoon')
      }
    }

    // Filter by row group tab within the active category
    if (script !== 'kanji') {
      const rowTabs = rowTabsByCategory[selectedCategory] || rowTabsByCategory.all
      const currentTab = rowTabs?.find((t) => t.id === activeTab)
      if (currentTab && currentTab.id !== 'all' && currentTab.rowGroups.length > 0) {
        result = result.filter((c) => {
          const row = (c.row_group || '').toLowerCase()
          return currentTab.rowGroups.includes(row)
        })
      }
    }

    // Filter by search query (romaji, symbol, kanji readings, meanings)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((c) => {
        const symbol = (c.character || c.symbol || '').toLowerCase()
        const romaji = (c.readings?.[0]?.romaji || '').toLowerCase()
        const onyomi = (c.onyomi || '').toLowerCase()
        const kunyomi = (c.kunyomi || '').toLowerCase()
        const meaningId = (c.meaning_id || '').toLowerCase()
        const meaningEn = (c.meaning_en || '').toLowerCase()
        return (
          symbol.includes(q) ||
          romaji.includes(q) ||
          onyomi.includes(q) ||
          kunyomi.includes(q) ||
          meaningId.includes(q) ||
          meaningEn.includes(q)
        )
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
  }, [characters, script, selectedCategory, rowTabsByCategory, activeTab, searchQuery, masteryFilter, progressMap, latestExam])

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
            <span>
              {script === 'kanji'
                ? (language === 'id'
                    ? '75 Kanji JLPT N5 • Batch 1, 2 & 3'
                    : '75 JLPT N5 Kanji • Batch 1, 2 & 3')
                : `${t('categories.all_count')} • ${
                    script === 'katakana'
                      ? language === 'id'
                        ? 'Koleksi Katakana Lengkap'
                        : 'Complete Katakana Library'
                      : language === 'id'
                      ? 'Koleksi Hiragana Lengkap'
                      : 'Complete Hiragana Library'
                  }`}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {script === 'kanji'
              ? (t('learn.title_kanji') || 'Koleksi 75 Kanji JLPT N5')
              : script === 'katakana'
              ? t('learn.title_katakana')
              : t('learn.title_hiragana')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            {script === 'kanji'
              ? (t('learn.subtitle_kanji') || 'Kuasai 75 Kanji dasar JLPT N5 dengan urutan goresan presisi Hitsujun KanjiVG, bacaan On/Kun, arti dwibahasa, dan contoh jukugo.')
              : script === 'katakana'
              ? t('learn.subtitle_katakana')
              : t('learn.subtitle_hiragana')}
          </p>
        </div>

        {/* Live sync, script switcher & status */}
        <div className="flex items-center flex-wrap gap-3">
          <KanaSwitcher size="md" />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveApi ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isLiveApi ? `Golang API Live (${characters.length})` : `Data Lokal (${characters.length})`}</span>
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

      {/* PRIMARY SCRIPT SWITCHER TAB BAR (HIRAGANA | KATAKANA | KANJI) */}
      <div className="mb-6 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex max-w-lg shadow-xs">
        <button
          type="button"
          onClick={() => setScript('hiragana')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            script === 'hiragana'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span className="text-base font-serif font-black">あ</span>
          <span>Hiragana</span>
          <span className="text-[10px] font-mono opacity-75 px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700">107</span>
        </button>
        <button
          type="button"
          onClick={() => setScript('katakana')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            script === 'katakana'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span className="text-base font-serif font-black">ア</span>
          <span>Katakana</span>
          <span className="text-[10px] font-mono opacity-75 px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700">107</span>
        </button>
        <button
          type="button"
          onClick={() => setScript('kanji')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            script === 'kanji'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span className="text-base font-serif font-black text-emerald-500 dark:text-emerald-400">漢</span>
          <span>Kanji (N5)</span>
          <span className="text-[10px] font-mono opacity-75 px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700">{FALLBACK_KANJI.length || 75}</span>
        </button>
      </div>

      {/* CATEGORY TABS */}
      <div className={`grid ${script === 'kanji' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'} gap-3 mb-6`}>
        {activeCategoryTabs.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id)
                setActiveTab('all')
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                isSelected
                  ? script === 'kanji'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 dark:border-sky-400 shadow-md ring-2 ring-sky-500/20'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <span className="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                {cat.icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-black truncate ${
                      isSelected
                        ? script === 'kanji'
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-sky-700 dark:text-sky-300'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {cat.sublabel}
                </p>
              </div>
            </button>
          )
        })}
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
            placeholder={
              script === 'kanji'
                ? (t('learn.search_placeholder_kanji') || 'Cari Kanji, Onyomi, Kunyomi, arti ID/EN (mis: "日", "ichi", "satu", "day")...')
                : t('learn.search_placeholder')
            }
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
                { id: 'all', label: t('learn.filter_all') },
                { id: 'needs_review', label: `${t('learn.filter_needs_review')} (${needsReviewCount})` },
                { id: 'memorized', label: t('learn.filter_memorized') },
                { id: 'learning', label: t('learn.filter_learning') },
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

      {/* ROW GROUP FILTER TABS (Hide for Kanji) */}
      {script !== 'kanji' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {(rowTabsByCategory[selectedCategory] || rowTabsByCategory.all).map((tab) => {
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
      )}

      {/* CHARACTER COUNTER */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
        <span>Menampilkan {filteredList.length} dari {characters.length} {script === 'kanji' ? 'Kanji' : 'Karakter'}</span>
        <span>Klik kartu untuk detail urutan goresan & contoh kata</span>
      </div>

      {/* CHARACTER GRID */}
      {filteredList.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
          <p className="text-4xl mb-3">🔍</p>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Tidak ada karakter yang cocok
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Coba ubah kata kunci pencarian atau ganti filter kategori.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
              setActiveTab('all')
              setMasteryFilter('all')
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 transition cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : script === 'kanji' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {filteredList.map((item) => {
            const isMemorized = progressMap[item.id]?.status === 'memorized'
            const accuracyScore = progressMap[item.id]?.accuracy_score
            const isPlaying = isItemPlaying(item)
            const reviewStatus = evaluateCharacterReviewStatus(
              item,
              progressMap,
              latestExam
            )
            const charText = item.character || item.symbol || ''
            const activeMeaning = language === 'id' ? item.meaning_id : (item.meaning_en || item.meaning_id)

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
                className={`group relative p-3 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                  reviewStatus.needsReview
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 hover:border-amber-500 hover:shadow-lg'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {/* Top Bar: JLPT Badge, Stroke Count, Audio Speaker */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {item.jlpt_level || 'N5'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      {item.strokes_count} {language === 'id' ? 'Goresan' : 'Strokes'}
                    </span>
                    <AudioSpeakerButton
                      character={item}
                      isPlaying={isPlaying}
                      onPlay={() => handlePlayAudio(item)}
                      size="xs"
                      stopPropagation={true}
                      title={`Pelafalan audio ${charText}`}
                    />
                  </div>
                </div>

                {/* Big Kanji Symbol & Meaning */}
                <div className="flex flex-col items-center justify-center my-2 sm:my-3">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-serif group-hover:scale-110 transition-transform duration-200">
                    {charText}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1.5 text-center line-clamp-1 px-1">
                    {activeMeaning}
                  </span>
                </div>

                {/* Badges: On'yomi & Kun'yomi */}
                <div className="flex flex-col gap-1 w-full pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {item.onyomi && (
                    <div className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60 truncate">
                      <span className="font-extrabold text-[9px] text-sky-500 shrink-0">ON</span>
                      <span className="font-mono truncate">{item.onyomi}</span>
                    </div>
                  )}
                  {item.kunyomi && (
                    <div className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 truncate">
                      <span className="font-extrabold text-[9px] text-emerald-500 shrink-0">KUN</span>
                      <span className="truncate">{item.kunyomi}</span>
                    </div>
                  )}
                </div>

                {/* Review / Memorized badge */}
                {reviewStatus.needsReview && (
                  <div className="mt-2 text-center">
                    <span className="inline-block px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-[9px] font-extrabold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      Needs Review
                    </span>
                  </div>
                )}
                {isMemorized && !reviewStatus.needsReview && (
                  <div className="mt-2 text-center">
                    <span className="inline-block px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-[9px] font-extrabold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      ✓ {language === 'id' ? 'Hafal' : 'Mastered'}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
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
            const charText = item.character || item.symbol || ''
            const isYoonCombo = item.category === 'yoon' && charText.length === 2

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
                className={`group relative p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center select-none ${
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
                    title={`Putar audio pelafalan ${charText}`}
                  />
                </div>

                {/* Big Kana Symbol (Custom Yoon 2-Char Combination Layout) */}
                {isYoonCombo ? (
                  <div className="flex flex-col items-center justify-center mt-1">
                    <div className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{charText[0]}</span>
                      <span className="text-sky-500 text-[9px]">+</span>
                      <span className="text-indigo-600 dark:text-indigo-400 text-[10px]">{charText[1]}</span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform tracking-tight">
                      {charText}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1 group-hover:scale-110 transition-transform">
                    {charText}
                  </span>
                )}

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
                  <span>{item.strokes_count} {language === 'id' ? 'Goresan' : 'Strokes'}</span>
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
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  modalChar.type === 'kanji'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                }`}>
                  {modalChar.type === 'kanji' ? 'Kanji (N5)' : modalChar.script_type || 'Hiragana'}
                </span>
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                  {modalChar.type === 'kanji'
                    ? (modalChar.category === 'numbers' ? (language === 'id' ? 'Angka & Kuantitas' : 'Numbers') : (language === 'id' ? 'Hari & Waktu' : 'Calendar & Time'))
                    : (language === 'id' ? `Baris ${modalChar.row_group}` : `Row ${modalChar.row_group}`)}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {modalChar.strokes_count || modalChar.strokes.length} {language === 'id' ? 'Goresan' : 'Strokes'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigateModalChar('prev')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                  title={language === 'id' ? 'Karakter Sebelumnya' : 'Previous Character'}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateModalChar('next')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                  title={language === 'id' ? 'Karakter Selanjutnya' : 'Next Character'}
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
                  title={language === 'id' ? 'Tutup Modal' : 'Close Modal'}
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
                      <strong className="font-extrabold">{language === 'id' ? 'Karakter Perlu Diulang (SRS):' : 'Character Needs Review (SRS):'}</strong>{' '}
                      {modalReviewStatus.label}
                    </div>
                  </div>
                  <Link
                    href={`/practice?char=${encodeURIComponent(modalChar.symbol || modalChar.character || '')}&script=${modalChar.script_type || script}`}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs whitespace-nowrap self-start sm:self-auto shadow-xs"
                  >
                    {language === 'id' ? 'Latih di Studio Tracing →' : 'Practice in Studio →'}
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
                      {language === 'id' ? `Goresan #${activeAnimStrokeIdx !== null ? activeAnimStrokeIdx + 1 : 1}` : `Stroke #${activeAnimStrokeIdx !== null ? activeAnimStrokeIdx + 1 : 1}`}
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
                    <span>{isAnimatingStroke ? t('common.loading') : t('learn.modal_stroke_anim_start')}</span>
                  </button>
                  {isAnimatingStroke && (
                    <button
                      type="button"
                      onClick={stopStrokeAnimation}
                      className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition cursor-pointer"
                    >
                      {t('learn.modal_stroke_anim_stop')}
                    </button>
                  )}
                </div>
              </div>

              {/* Character Details & Actions */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline gap-3 mb-2">
                    <h2 className="text-5xl font-black text-slate-900 dark:text-white font-serif">
                      {modalChar.character || modalChar.symbol}
                    </h2>
                    {modalChar.type === 'kanji' ? (
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {language === 'id' ? modalChar.meaning_id : (modalChar.meaning_en || modalChar.meaning_id)}
                      </span>
                    ) : (
                      <span className="text-2xl font-mono font-bold text-sky-600 dark:text-sky-400">
                        /{modalChar.readings?.[0]?.romaji}/
                      </span>
                    )}
                  </div>

                  {/* Kanji Readings Boxes (On'yomi & Kun'yomi) */}
                  {modalChar.type === 'kanji' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
                      <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60">
                        <span className="text-[10px] font-extrabold uppercase text-sky-600 dark:text-sky-400 block mb-0.5">
                          {t('learn.onyomi_label') || "On'yomi"}
                        </span>
                        <span className="text-sm font-bold text-sky-900 dark:text-sky-100 font-mono">
                          {modalChar.onyomi || '-'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 block mb-0.5">
                          {t('learn.kunyomi_label') || "Kun'yomi"}
                        </span>
                        <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                          {modalChar.kunyomi || '-'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Yoon Combination Breakdown Badge */}
                      {(() => {
                        const modalCharText = modalChar.character || modalChar.symbol || ''
                        if (modalChar.category !== 'yoon' || modalCharText.length !== 2) return null
                        return (
                          <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                            <span>{t('categories.combo_label')}:</span>
                            <span className="font-black text-sm bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-2xs text-slate-900 dark:text-white">
                              {modalCharText[0]}
                            </span>
                            <span className="text-sky-500 font-bold">+</span>
                            <span className="font-black text-sm text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-2xs">
                              {modalCharText[1]}
                            </span>
                            <span>=</span>
                            <span className="font-black text-sm text-indigo-600 dark:text-indigo-300">
                              {modalCharText}
                            </span>
                          </div>
                        )
                      })()}

                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                        {modalChar.readings?.[0]?.meaning ||
                          `Karakter Hiragana ${modalChar.character} (${modalChar.readings?.[0]?.romaji})`}
                      </p>
                    </>
                  )}

                  {/* Audio Speaker */}
                  <div className="mt-2 flex items-center gap-3">
                    <AudioSpeakerButton
                      character={modalChar}
                      isPlaying={isItemPlaying(modalChar)}
                      activeSource={activeSource}
                      onPlay={() => handlePlayAudio(modalChar)}
                      size="md"
                      variant="badge"
                      label={t('learn.modal_listen')}
                    />
                  </div>

                  {/* Stroke Breakdown Tags */}
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      {t('learn.modal_stroke_order')} ({modalChar.strokes.length}):
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

                  {/* Jukugo / Vocabulary Examples */}
                  {modalChar.type === 'kanji' && modalChar.examples && modalChar.examples.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span>📖</span>
                        <span>{t('learn.examples_label') || (language === 'id' ? 'Contoh Kosakata (Jukugo)' : 'Vocabulary & Jukugo Examples')}:</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {modalChar.examples.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-bold text-base text-slate-900 dark:text-white font-serif">{ex.word}</span>
                              <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">{ex.reading}</span>
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                              {language === 'id' ? ex.meaning_id : (ex.meaning_en || ex.meaning_id)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct CTA: Jump to Tracing Studio */}
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <Link
                    href={`/practice?char=${encodeURIComponent(modalChar.character || modalChar.symbol || '')}&script=${modalChar.script_type || script}`}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-98"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>{t('learn.modal_practice_cta')} →</span>
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
