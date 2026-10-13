'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { AudioManagerModal } from './AudioManagerModal'
import { getAllCustomAudio } from '@/utils/audioStorage'

export const Header: React.FC = () => {
  const pathname = usePathname()
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false)
  const [customAudioCount, setCustomAudioCount] = useState(0)

  const updateCount = useCallback(async () => {
    try {
      const records = await getAllCustomAudio()
      setCustomAudioCount(Object.keys(records).length)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    updateCount()
    const handleUpdate = () => updateCount()
    window.addEventListener('nihongo_sora_custom_audio_updated', handleUpdate)
    return () => {
      window.removeEventListener('nihongo_sora_custom_audio_updated', handleUpdate)
    }
  }, [updateCount])

  const navLinks = [
    { href: '/', label: 'Koleksi Huruf', icon: '🔤', desc: 'Hiragana & Katakana Stroke Tracing' },
    { href: '/practice', label: 'Latihan Hafalan', icon: '🧠', desc: 'Memorize Mode & Antrean Review' },
    { href: '/exam', label: 'Ujian Hafalan', icon: '📝', desc: 'Quiz Mode & Blind Tracing' },
    { href: '/analytics', label: 'Dasbor Analitik', icon: '📊', desc: 'Statistik & Riwayat Belajar' },
  ]

  return (
    <header className="relative text-center py-6 sm:py-8 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top right floating Theme Toggle */}
      <div className="absolute right-0 top-4 sm:top-6 z-20">
        <ThemeToggle />
      </div>

      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-sky-600 dark:text-sky-400 mb-4 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
        <span>IT DEL • Nihongo Sora v2.0 (Golang + Next.js Native)</span>
      </div>

      <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white flex flex-col sm:flex-row items-center justify-center gap-3">
        <span>
          Nihongo{' '}
          <span className="bg-gradient-to-r from-sky-600 via-indigo-500 to-rose-500 dark:from-sky-400 dark:via-indigo-300 dark:to-rose-400 bg-clip-text text-transparent">
            Sora
          </span>
        </span>
        <span className="text-2xl sm:text-3xl text-slate-400 dark:text-slate-500 font-light tracking-widest">
          日本語の空
        </span>
      </h1>

      <p className="max-w-2xl mx-auto mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
        Platform Pembelajaran Hiragana &amp; Katakana Interaktif dengan Arsitektur Decoupled:
        <span className="text-slate-900 dark:text-slate-200 font-medium"> Next.js 16 (App Router + Tailwind)</span> di Frontend dan
        <span className="text-slate-900 dark:text-slate-200 font-medium"> Golang Fiber + GORM</span> di Backend.
      </p>

      {/* Main Navigation Tabs */}
      <nav className="flex items-center justify-center gap-2 mt-6 flex-wrap">
        {navLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border ${
                isActive
                  ? 'bg-sky-600 dark:bg-sky-500 text-white border-sky-600 dark:border-sky-500 shadow-md shadow-sky-600/25 ring-2 ring-sky-400/40'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          )
        })}

        {/* Audio Manager Modal Trigger */}
        <button
          type="button"
          onClick={() => setIsAudioModalOpen(true)}
          className="px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border-purple-300 dark:border-purple-700/60 text-purple-700 dark:text-purple-300 cursor-pointer shadow-xs active:scale-98"
        >
          <span>🎙️</span>
          <span>Studio Audio</span>
          {customAudioCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-xs">
              {customAudioCount} Kustom
            </span>
          )}
        </button>
      </nav>

      {/* Audio Manager Modal */}
      <AudioManagerModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />
    </header>
  )
}
