'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { CharacterData } from '@/types/character'
import { Header } from '@/components/Header'
import { ServiceCards } from '@/components/ServiceCards'
import { StrokeCanvas } from '@/components/StrokeCanvas'
import { HealthChecker } from '@/components/HealthChecker'
import rawHiraganaData from '@/data/hiragana_46.json'

interface RawHiraganaItem {
  symbol: string
  script_type: string
  row_group: string
  stroke_count: number
  reading: string
  strokes: string[]
}

// Generate complete fallback dataset from hiragana_46.json (46 characters)
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
  { id: 'vowel', label: 'Vokal', sublabel: 'A, I, U, E, O', rowGroups: ['vowel'] },
  { id: 'ka', label: 'K', sublabel: 'Ka, Ki, Ku, Ke, Ko', rowGroups: ['ka'] },
  { id: 'sa', label: 'S', sublabel: 'Sa, Shi, Su, Se, So', rowGroups: ['sa'] },
  { id: 'ta', label: 'T', sublabel: 'Ta, Chi, Tsu, Te, To', rowGroups: ['ta'] },
  { id: 'na', label: 'N', sublabel: 'Na, Ni, Nu, Ne, No', rowGroups: ['na'] },
  { id: 'ha', label: 'H', sublabel: 'Ha, Hi, Fu, He, Ho', rowGroups: ['ha'] },
  { id: 'ma', label: 'M', sublabel: 'Ma, Mi, Mu, Me, Mo', rowGroups: ['ma'] },
  { id: 'ya', label: 'Y', sublabel: 'Ya, Yu, Yo', rowGroups: ['ya'] },
  { id: 'ra', label: 'R', sublabel: 'Ra, Ri, Ru, Re, Ro', rowGroups: ['ra'] },
  { id: 'wa_n', label: 'W/N', sublabel: 'Wa, Wo, N', rowGroups: ['wa', 'n'] },
]

export default function Home() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [characters, setCharacters] = useState<CharacterData[]>(FALLBACK_HIRAGANA)
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(
    FALLBACK_HIRAGANA[0]
  )
  const [activeTab, setActiveTab] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [isLiveApi, setIsLiveApi] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Fetch Hiragana dataset from Golang Fiber Backend
  const fetchHiragana = useCallback(async () => {
    setLoading(true)
    setFetchError(null)

    try {
      const res = await fetch(`${apiBaseUrl}/characters/hiragana`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      const json = await res.json()
      if (json.data && json.data.length > 0) {
        // Normalize any missing fields for frontend compatibility
        const normalized: CharacterData[] = json.data.map((c: CharacterData, idx: number) => ({
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
        // Keep current selected character if exists, else first
        setSelectedChar((prev) => {
          if (!prev) return normalized[0]
          const match = normalized.find(
            (item) => item.character === prev.character || item.symbol === prev.symbol
          )
          return match || normalized[0]
        })
        setIsLiveApi(true)
      } else {
        throw new Error('Endpoint tidak mengembalikan data karakter')
      }
    } catch (err: unknown) {
      setIsLiveApi(false)
      if (err instanceof Error) {
        setFetchError(err.message)
      } else {
        setFetchError('Gagal memuat data dari Golang backend.')
      }
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    fetchHiragana()
  }, [fetchHiragana])

  // Filter characters according to selected row tab
  const filteredCharacters = useMemo(() => {
    const currentTabConfig = ROW_TABS.find((t) => t.id === activeTab)
    if (!currentTabConfig || currentTabConfig.id === 'all') {
      return characters
    }
    return characters.filter((c) => {
      const group = (c.row_group || '').toLowerCase()
      return currentTabConfig.rowGroups.includes(group)
    })
  }, [characters, activeTab])

  // Distinct palette colors for stroke segments
  const strokeColors = ['#0284c7', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      {/* HEADER WITH THEME TOGGLE */}
      <Header />

      {/* SERVICE ARCHITECTURE CARDS */}
      <ServiceCards />

      {/* STATUS BANNER */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 gap-4 mb-8 shadow-sm dark:shadow-none transition-colors">
        <div className="flex items-center gap-3">
          <span
            className={`w-3 h-3 rounded-full ${
              isLiveApi ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'
            }`}
          />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {isLiveApi
                ? `🟢 Terhubung ke Backend Golang Fiber (${characters.length} Karakter Hiragana Live)`
                : `🟡 Mode Fallback Lokal (Menampilkan ${characters.length} Karakter Lengkap)`}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Endpoint: <code className="text-sky-700 dark:text-sky-300 font-mono">{apiBaseUrl}/characters/hiragana</code>
              {fetchError && ` • Info: ${fetchError}`}
            </p>
          </div>
        </div>

        <button
          onClick={fetchHiragana}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-sm"
        >
          {loading ? (
            <>
              <span className="w-3 h-3 border-2 border-sky-500 dark:border-sky-300 border-t-transparent rounded-full animate-spin"></span>
              <span>Memuat...</span>
            </>
          ) : (
            <>
              <span>🔄 Refresh Data API</span>
            </>
          )}
        </button>
      </div>

      {/* HIRAGANA ROW FILTER TABS */}
      <section className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎌</span> Koleksi Hiragana 46 Karakter (Gojūon)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelompok baris: Vokal, Ka, Sa, Ta, Na, Ha, Ma, Ya, Ra, Wa/N
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium self-start sm:self-auto border border-slate-200 dark:border-slate-700">
            Menampilkan {filteredCharacters.length} dari {characters.length} Huruf
          </span>
        </div>

        {/* Tab / Grid Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 mb-4">
          {ROW_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex flex-col items-center border ${
                  isActive
                    ? 'bg-sky-600 dark:bg-sky-500 text-white border-sky-600 dark:border-sky-500 shadow-sm shadow-sky-500/30'
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

        {/* CHARACTER GRID */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-2.5">
          {filteredCharacters.map((item) => {
            const isSelected =
              selectedChar?.id === item.id ||
              selectedChar?.character === item.character ||
              selectedChar?.symbol === item.symbol

            return (
              <button
                key={item.id || item.character}
                onClick={() => setSelectedChar(item)}
                className={`py-3 px-2 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-b from-sky-50 to-indigo-50 dark:from-sky-500/20 dark:to-indigo-600/20 border-sky-500 text-slate-950 dark:text-white shadow-md dark:shadow-lg dark:shadow-sky-950 scale-105 ring-2 ring-sky-400/50'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-sky-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-sm dark:shadow-none'
                }`}
              >
                <span className="text-2xl sm:text-3xl font-black mb-0.5 group-hover:scale-110 transition-transform">
                  {item.character || item.symbol}
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-sky-700 dark:text-sky-400 font-semibold">
                  /{item.readings?.[0]?.romaji || '-'}/
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">
                  {item.strokes_count || item.stroke_count || item.strokes?.length} Goresan
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* SELECTED CHARACTER DETAIL & PREVIEW */}
      {selectedChar && (
        <section className="mb-10">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center shadow-sm dark:shadow-none transition-colors">
            {/* SVG Visual preview */}
            <div className="md:col-span-4 flex flex-col items-center">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-700/80 p-4 flex items-center justify-center relative shadow-inner">
                <svg viewBox="0 0 109 109" className="w-full h-full drop-shadow-md">
                  {selectedChar.strokes.map((stroke, index) => {
                    const strokeColor =
                      strokeColors[index % strokeColors.length]
                    return (
                      <path
                        key={stroke.id || index}
                        d={stroke.svg_path || stroke.path_data}
                        stroke={strokeColor}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    )
                  })}
                </svg>
              </div>

              {/* Stroke tags */}
              <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                {selectedChar.strokes.map((stroke, index) => {
                  const strokeColor =
                    strokeColors[index % strokeColors.length]
                  return (
                    <span
                      key={stroke.id || index}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md border font-semibold"
                      style={{
                        borderColor: `${strokeColor}55`,
                        color: strokeColor,
                        backgroundColor: `${strokeColor}15`,
                      }}
                    >
                      Goresan #{stroke.stroke_order ?? stroke.stroke_number ?? index + 1}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Information & Metadata */}
            <div className="md:col-span-8 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-sky-100 dark:bg-sky-950 border border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300">
                    {selectedChar.script_type || selectedChar.type || 'hiragana'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300">
                    Baris: {selectedChar.row_group || 'vowel'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300">
                    JLPT {selectedChar.jlpt_level || 'N5'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                    {selectedChar.strokes_count || selectedChar.stroke_count || selectedChar.strokes?.length} Goresan
                  </span>
                </div>

                <div className="flex items-baseline gap-4">
                  <h3 className="text-5xl font-black text-slate-900 dark:text-white">
                    {selectedChar.character || selectedChar.symbol}
                  </h3>
                  <span className="text-2xl font-mono text-sky-600 dark:text-sky-400 font-semibold">
                    /{selectedChar.readings?.[0]?.romaji}/
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium">
                  {selectedChar.readings?.[0]?.meaning ||
                    `Karakter Hiragana ${selectedChar.character} (${selectedChar.readings?.[0]?.romaji})`}
                </p>
              </div>

              {/* Stroke coordinates preview */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Koordinat KanjiVG SVG Path:
                </h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
                  {selectedChar.strokes.map((st, sIdx) => (
                    <div
                      key={st.id || sIdx}
                      className="flex items-center gap-2 text-xs font-mono bg-slate-50 dark:bg-slate-950/70 p-2 rounded-lg border border-slate-200 dark:border-slate-800/80"
                    >
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                        #{st.stroke_order ?? st.stroke_number ?? sIdx + 1}
                      </span>
                      <code className="text-slate-600 dark:text-slate-400 truncate select-all">
                        {st.svg_path || st.path_data}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE STROKE CANVAS (CLIENT COMPONENT) */}
          <StrokeCanvas character={selectedChar} />
        </section>
      )}

      {/* HEALTH CHECKER INTERFACE */}
      <HealthChecker apiBaseUrl={apiBaseUrl} />

      {/* FOOTER */}
      <footer className="text-center py-10 mt-12 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <p>
          Nihongo Sora v2.0 • Proyek Belajar Bahasa Jepang (Hiragana 46 Karakter Lengkap)
        </p>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Backend Golang Fiber + GORM • Frontend Next.js 16 (App Router + Tailwind CSS) • Native Laragon MySQL
        </p>
      </footer>
    </main>
  )
}
