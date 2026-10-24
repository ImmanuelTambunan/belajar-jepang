'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Search,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Flame,
  ArrowRight,
  BookOpen,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react'
import { VocabularyItem } from '@/types/vocabulary'
import { playWebSpeech, stopAllAudioPlayback } from '@/utils/audio'
import { useLanguage } from '@/context/LanguageContext'
import rawVocabData from '@/data/vocabularies_30.json'

const CATEGORY_TABS = [
  { id: 'all', label_id: 'Semua', label_en: 'All', count: 30, color: 'sky' },
  {
    id: 'Keselamatan Kerja (Anzen)',
    label_id: 'Keselamatan (Anzen)',
    label_en: 'Safety (Anzen)',
    count: 8,
    color: 'emerald',
  },
  {
    id: 'Instruksi Kerja & 5S',
    label_id: 'Instruksi & 5S',
    label_en: 'Instructions & 5S',
    count: 8,
    color: 'blue',
  },
  {
    id: 'Etika Kerja & Hou-Ren-So',
    label_id: 'Etika & Hou-Ren-So',
    label_en: 'Hou-Ren-So & Etiquette',
    count: 7,
    color: 'purple',
  },
  {
    id: 'Manufaktur & Kaigo',
    label_id: 'Manufaktur & Kaigo',
    label_en: 'Manufacturing & Care',
    count: 7,
    color: 'amber',
  },
] as const

export default function VocabPage() {
  const { t, language } = useLanguage()
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // State
  const [vocabList, setVocabList] = useState<VocabularyItem[]>(rawVocabData as VocabularyItem[])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activePlayingId, setActivePlayingId] = useState<number | null>(null)
  const [activePlayingSentenceId, setActivePlayingSentenceId] = useState<number | null>(null)
  const [activeDetailItem, setActiveDetailItem] = useState<VocabularyItem | null>(null)

  // Fetch from API or fallback
  const fetchVocabularies = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/vocabularies`)
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setVocabList(json.data)
        }
      }
    } catch {
      // Graceful offline fallback already loaded
    }
  }, [apiBaseUrl])

  useEffect(() => {
    fetchVocabularies()
  }, [fetchVocabularies])

  // Audio playback handler for words
  const handlePlayWord = useCallback(
    async (item: VocabularyItem, e?: React.MouseEvent) => {
      e?.stopPropagation()
      stopAllAudioPlayback()
      setActivePlayingId(item.id)

      try {
        await playWebSpeech(item.word, {
          onStart: () => setActivePlayingId(item.id),
          onEnd: () => setActivePlayingId(null),
          onError: () => setActivePlayingId(null),
        })
      } catch {
        setActivePlayingId(null)
      }
    },
    []
  )

  // Audio playback handler for example sentence
  const handlePlaySentence = useCallback(
    async (item: VocabularyItem, e?: React.MouseEvent) => {
      e?.stopPropagation()
      stopAllAudioPlayback()
      setActivePlayingSentenceId(item.id)

      try {
        await playWebSpeech(item.example_jp, {
          rate: 0.82,
          onStart: () => setActivePlayingSentenceId(item.id),
          onEnd: () => setActivePlayingSentenceId(null),
          onError: () => setActivePlayingSentenceId(null),
        })
      } catch {
        setActivePlayingSentenceId(null)
      }
    },
    []
  )

  // Filtered vocabularies
  const filteredVocabularies = useMemo(() => {
    return vocabList.filter((item) => {
      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory

      // Search filter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.word.toLowerCase().includes(q) ||
        item.reading.toLowerCase().includes(q) ||
        item.romaji.toLowerCase().includes(q) ||
        item.meaning_id.toLowerCase().includes(q) ||
        item.meaning_en.toLowerCase().includes(q) ||
        item.example_jp.toLowerCase().includes(q)

      return matchesCategory && matchesSearch
    })
  }, [vocabList, selectedCategory, searchQuery])

  // Category Tag Styler
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Keselamatan Kerja (Anzen)':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
      case 'Instruksi Kerja & 5S':
        return 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
      case 'Etika Kerja & Hou-Ren-So':
        return 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800'
      case 'Manufaktur & Kaigo':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER BANNER                                                    */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-sky-200/80 dark:border-sky-800/60 p-6 sm:p-10 mb-8 shadow-xl shadow-sky-500/5">
        {/* Japanese Watermark in Background */}
        <div className="absolute right-4 -bottom-10 pointer-events-none select-none text-[120px] sm:text-[200px] font-serif font-black text-sky-900/[0.04] dark:text-sky-200/[0.04] leading-none z-0">
          仕事
        </div>

        <div className="relative z-10 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-100/90 via-indigo-100/90 to-rose-100/90 dark:from-sky-950/80 dark:via-indigo-950/80 dark:to-rose-950/80 border border-sky-200 dark:border-rose-900/60 text-sky-900 dark:text-sky-200 text-xs font-bold mb-3 shadow-xs backdrop-blur-sm">
            <Briefcase className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Fase 12: Shigoto Nihongo & Jukugo Industri</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">30 Kosakata Kerja</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Kosakata Kerja Praktis{' '}
            <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-rose-500 dark:from-sky-400 dark:via-indigo-300 dark:to-rose-400 bg-clip-text text-transparent">
              (仕事の日本語)
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {language === 'id'
              ? 'Kuasai 30 jukugo dan istilah esensial untuk keselamatan kerja (Anzen), prinsip 5S, komunikasi Hou-Ren-So, dan industri manufaktur/kaigo di tempat kerja Jepang.'
              : 'Master 30 essential compound words (Jukugo) for workplace safety (Anzen), 5S principles, Hou-Ren-So communication, and manufacturing/caregiving in Japan.'}
          </p>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5 text-xs text-slate-600 dark:text-slate-400">
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
              <span>Anzen (Keselamatan)</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Prinsip 5S</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Hou-Ren-So</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-600" />
              <span>Manufaktur & Kaigo</span>
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CONTROLS: CATEGORY TABS & REALTIME SEARCH BAR                         */}
      {/* ========================================================================= */}
      <section className="mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20'
                    : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-sky-300 dark:hover:border-sky-700'
                }`}
              >
                <span>{language === 'id' ? tab.label_id : tab.label_en}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'id'
                ? 'Cari kata (Kanji, Romaji, arti)...'
                : 'Search vocab (Kanji, Romaji, meaning)...'
            }
            className="w-full pl-9 pr-9 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. VOCABULARY FLASHCARD GRID                                             */}
      {/* ========================================================================= */}
      {filteredVocabularies.length === 0 ? (
        <div className="text-center py-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8">
          <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {language === 'id' ? 'Kosakata Tidak Ditemukan' : 'No Vocabulary Found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {language === 'id'
              ? 'Tidak ada kosakata yang cocok dengan kata kunci pencarian atau kategori ini.'
              : 'No vocabulary matches the current search keyword or category.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all')
              setSearchQuery('')
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition cursor-pointer"
          >
            {language === 'id' ? 'Reset Filter' : 'Reset Filter'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVocabularies.map((item) => {
            const isPlaying = activePlayingId === item.id

            return (
              <div
                key={item.id}
                onClick={() => setActiveDetailItem(item)}
                className="group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-sky-500/5 hover:border-sky-300 dark:hover:border-sky-700/80 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Card Top: Badges & Audio Button */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handlePlayWord(item, e)}
                      title="Dengarkan pelafalan kata"
                      aria-label={`Dengarkan pelafalan ${item.word}`}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-slate-750'
                      }`}
                    >
                      <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>

                  {/* Japanese Word with Furigana */}
                  <div className="text-center py-4">
                    <span className="block text-xs font-mono font-bold text-sky-600 dark:text-sky-400 tracking-wider">
                      {item.reading}
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black font-serif text-slate-900 dark:text-white mt-1 group-hover:scale-105 transition-transform duration-200">
                      {item.word}
                    </h3>
                    <span className="inline-block text-xs font-mono text-slate-400 dark:text-slate-500 mt-1">
                      /{item.romaji}/
                    </span>
                  </div>

                  {/* Meanings */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {item.meaning_id}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {item.meaning_en}
                    </p>
                  </div>
                </div>

                {/* Card Bottom: Quick Sentence Preview & Hint */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-sky-600 dark:text-sky-400 font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Info className="w-3.5 h-3.5" />
                    <span>Contoh Kalimat Kerja</span>
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DETAIL WORKPLACE EXAMPLE MODAL                                        */}
      {/* ========================================================================= */}
      {activeDetailItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveDetailItem(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Header Dialog */}
            <div className="flex items-start justify-between gap-3 mb-6 relative z-10">
              <div>
                <span
                  className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${getCategoryBadgeClass(
                    activeDetailItem.category
                  )}`}
                >
                  {activeDetailItem.category}
                </span>
                <div className="flex items-baseline gap-2.5 mt-2">
                  <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-white">
                    {activeDetailItem.word}
                  </h2>
                  <span className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400">
                    ({activeDetailItem.reading})
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    /{activeDetailItem.romaji}/
                  </span>
                </div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                  {activeDetailItem.meaning_id} ·{' '}
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    {activeDetailItem.meaning_en}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePlayWord(activeDetailItem)}
                  className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 hover:bg-sky-100 transition cursor-pointer"
                  title="Dengarkan kata"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailItem(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Real Workplace Example Sentence Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/50 dark:from-slate-850 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800/80 relative z-10 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-sky-500" />
                  <span>Contoh Kalimat di Tempat Kerja</span>
                </span>
                <button
                  type="button"
                  onClick={() => handlePlaySentence(activeDetailItem)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePlayingSentenceId === activeDetailItem.id
                      ? 'bg-sky-600 text-white shadow-md animate-pulse'
                      : 'bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Dengarkan Kalimat</span>
                </button>
              </div>

              {/* Japanese Sentence */}
              <p className="text-lg sm:text-xl font-bold font-serif text-slate-900 dark:text-white leading-relaxed mt-2">
                {activeDetailItem.example_jp}
              </p>

              {/* Indonesian Translation */}
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                &ldquo;{activeDetailItem.example_id}&rdquo;
              </p>
            </div>

            {/* Practical Workplace Tips */}
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 mb-6">
              <p className="flex items-start gap-2">
                <span className="text-sky-500 font-bold">•</span>
                <span>
                  <strong>Tips Praktis:</strong> Pelafalan jelas dan intonasi sopan sangat diutamakan saat berkomunikasi dengan rekan kerja (*douryou*) dan atasan (*joushi*).
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>
                  <strong>Standar 5S & Keselamatan:</strong> Selalu terapkan pengecekan ganda (*yubi-sashi koushou* / tunjuk dan sebut) untuk meminimalkan risiko kecelakaan kerja.
                </span>
              </p>
            </div>

            {/* Footer Close Button */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveDetailItem(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition cursor-pointer"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
