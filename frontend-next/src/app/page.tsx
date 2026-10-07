'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CharacterData } from '@/types/character'
import { Header } from '@/components/Header'
import { ServiceCards } from '@/components/ServiceCards'
import { StrokeCanvas } from '@/components/StrokeCanvas'
import { HealthChecker } from '@/components/HealthChecker'

// Default fallback data for offline / preview mode
const FALLBACK_VOWELS: CharacterData[] = [
  {
    id: 1,
    character: 'あ',
    type: 'hiragana',
    strokes_count: 3,
    jlpt_level: 'N5',
    readings: [
      {
        id: 1,
        romaji: 'a',
        meaning: 'Huruf vokal Hiragana A',
      },
    ],
    strokes: [
      {
        id: 1,
        stroke_order: 1,
        svg_path:
          'M31.01,33c0.88,0.88,2.75,1.82,5.25,1.75c8.62-0.25,20-2.12,29.5-4.25c1.51-0.34,4.62-0.88,6.62-0.5',
      },
      {
        id: 2,
        stroke_order: 2,
        svg_path:
          'M49.76,17.62c0.88,1,1.82,3.26,1.38,5.25c-3.75,16.75-6.25,38.13-5.13,53.63c0.41,5.7,1.88,10.88,3.38,13.62',
      },
      {
        id: 3,
        stroke_order: 3,
        svg_path:
          'M65.63,44.12c0.75,1.12,1.16,4.39,0.5,6.12c-4.62,12.26-11.24,23.76-25.37,35.76c-6.86,5.83-15.88,3.75-16.25-8.38c-0.34-10.87,13.38-23.12,32.38-26.74c12.42-2.37,27,1.38,30.5,12.75c4.05,13.18-3.76,26.37-20.88,30.49',
      },
    ],
  },
  {
    id: 2,
    character: 'い',
    type: 'hiragana',
    strokes_count: 2,
    jlpt_level: 'N5',
    readings: [
      {
        id: 2,
        romaji: 'i',
        meaning: 'Huruf vokal Hiragana I',
      },
    ],
    strokes: [
      {
        id: 4,
        stroke_order: 1,
        svg_path:
          'M21.5,29.66c2.01,2.17,2.61,4.68,2.17,7.43c-3.09,19.16-1.03,32.01,7.93,41.45c6.12,6.45,6.26,3.14,7.04-5.21',
      },
      {
        id: 5,
        stroke_order: 2,
        svg_path: 'M72.96,36.51c9.44,8.05,17.79,18.82,18.41,33.83',
      },
    ],
  },
  {
    id: 3,
    character: 'う',
    type: 'hiragana',
    strokes_count: 2,
    jlpt_level: 'N5',
    readings: [
      {
        id: 3,
        romaji: 'u',
        meaning: 'Huruf vokal Hiragana U',
      },
    ],
    strokes: [
      {
        id: 6,
        stroke_order: 1,
        svg_path:
          'M42,15.5c5.62,2.12,9.62,3,12.88,3c8.27,0,8,1.12-0.38,5.5',
      },
      {
        id: 7,
        stroke_order: 2,
        svg_path:
          'M33,42.38c2.12,1.12,4.12,2.88,8.5,1.38c4.38-1.5,12.75-7.12,18.5-7c5.75,0.12,10.25,5,10.25,18c0,15.49-8.25,30.24-24.37,41.24',
      },
    ],
  },
  {
    id: 4,
    character: 'え',
    type: 'hiragana',
    strokes_count: 2,
    jlpt_level: 'N5',
    readings: [
      {
        id: 4,
        romaji: 'e',
        meaning: 'Huruf vokal Hiragana E',
      },
    ],
    strokes: [
      {
        id: 8,
        stroke_order: 1,
        svg_path:
          'M40.52,13.25c5.62,2.12,10,3,14.12,3c8.27,0,8,1.12-0.38,5.5',
      },
      {
        id: 9,
        stroke_order: 2,
        svg_path:
          'M32.52,45.12c1.88,1.25,4.5,1.75,7.38,0.62c3.29-1.29,17-7.88,21.25-9.88c4.25-2,8.32,0.04,4.38,4.62c-12.26,14.27-27.26,31.52-39.51,44.4c-3.26,3.42-0.58,3.54,1.5,1.37c13.5-14.12,18.12-20.12,23.62-20.12c7.13,0,3.5,16.75,6.75,22.38c3.25,5.63,19.12,3.75,26.12,2.12',
      },
    ],
  },
  {
    id: 5,
    character: 'お',
    type: 'hiragana',
    strokes_count: 3,
    jlpt_level: 'N5',
    readings: [
      {
        id: 5,
        romaji: 'o',
        meaning: 'Huruf vokal Hiragana O',
      },
    ],
    strokes: [
      {
        id: 10,
        stroke_order: 1,
        svg_path:
          'M22.88,35.12c1.38,1,3.62,2.38,6,2.12c2.38-0.26,19.62-5.12,21.12-5.74c1.5-0.62,4-1.25,5.88-2',
      },
      {
        id: 11,
        stroke_order: 2,
        svg_path:
          'M41.5,16.12c2.25,1,3.59,4.39,3.12,7.38c-2.5,16.12-3.37,45.53-2.25,58.38c0.75,8.62-0.64,10.45-7.12,7.12c-5.13-2.62-13.75-8-13.75-12.38c0-7.5,24.38-23.62,44.75-23.62c17.25,0,25,8.25,25,17.25c0,8.25-9.38,18.88-26.75,21',
      },
      {
        id: 12,
        stroke_order: 3,
        svg_path:
          'M73,22.12c5.38,2.62,8.88,5.88,10.62,8.25c2.27,3.08,0.38,4.5-1.12,5',
      },
    ],
  },
]

export default function Home() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [characters, setCharacters] = useState<CharacterData[]>(FALLBACK_VOWELS)
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(
    FALLBACK_VOWELS[0]
  )
  const [loading, setLoading] = useState(false)
  const [isLiveApi, setIsLiveApi] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

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
        setCharacters(json.data)
        setSelectedChar(json.data[0])
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

  const strokeColors = ['#0284c7', '#ec4899', '#10b981', '#f59e0b']

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
                ? '🟢 Terhubung ke Backend Golang (MySQL Laragon Live)'
                : '🟡 Mode Fallback Lokal (Menunggu Backend Golang di Port 8000)'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Endpoint: <code className="text-sky-700 dark:text-sky-300 font-mono">{apiBaseUrl}/characters/hiragana</code>
              {fetchError && ` • Pesan: ${fetchError}`}
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

      {/* HIRAGANA VOWEL SELECTOR TABS */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🔤</span> Karakter Hiragana Vokal (5 Huruf)
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Pilih huruf untuk memulai latihan
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {characters.map((item) => {
            const isSelected = selectedChar?.id === item.id
            return (
              <button
                key={item.id}
                onClick={() => setSelectedChar(item)}
                className={`py-4 px-2 sm:px-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-b from-sky-50 to-indigo-50 dark:from-sky-500/20 dark:to-indigo-600/20 border-sky-500 text-slate-950 dark:text-white shadow-md dark:shadow-lg dark:shadow-sky-950 scale-102 ring-2 ring-sky-400/40'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-sm dark:shadow-none'
                }`}
              >
                <span className="text-3xl sm:text-4xl font-black mb-1 group-hover:scale-110 transition-transform">
                  {item.character}
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  /{item.readings?.[0]?.romaji || '-'}/
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  {item.strokes_count} Goresan
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
                        key={stroke.id}
                        d={stroke.svg_path}
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
                      key={stroke.id}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md border font-semibold"
                      style={{
                        borderColor: `${strokeColor}55`,
                        color: strokeColor,
                        backgroundColor: `${strokeColor}15`,
                      }}
                    >
                      Goresan #{stroke.stroke_order}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Information & Metadata */}
            <div className="md:col-span-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-sky-100 dark:bg-sky-950 border border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300">
                    {selectedChar.type}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300">
                    JLPT {selectedChar.jlpt_level || 'N5'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                    {selectedChar.strokes_count} Goresan
                  </span>
                </div>

                <div className="flex items-baseline gap-4">
                  <h3 className="text-5xl font-black text-slate-900 dark:text-white">
                    {selectedChar.character}
                  </h3>
                  <span className="text-2xl font-mono text-sky-600 dark:text-sky-400 font-semibold">
                    /{selectedChar.readings?.[0]?.romaji}/
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium">
                  {selectedChar.readings?.[0]?.meaning || 'Karakter Hiragana Vokal'}
                </p>
              </div>

              {/* Stroke coordinates preview */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Koordinat KanjiVG SVG Path:
                </h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
                  {selectedChar.strokes.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center gap-2 text-xs font-mono bg-slate-50 dark:bg-slate-950/70 p-2 rounded-lg border border-slate-200 dark:border-slate-800/80"
                    >
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                        #{st.stroke_order}
                      </span>
                      <code className="text-slate-600 dark:text-slate-400 truncate select-all">
                        {st.svg_path}
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
          Nihongo Sora v2.0 • Proyek Belajar Bahasa Jepang (Hiragana Tracing)
        </p>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Backend Golang Fiber + GORM • Frontend Next.js 16 (App Router + Tailwind CSS) • Native Laragon MySQL
        </p>
      </footer>
    </main>
  )
}
