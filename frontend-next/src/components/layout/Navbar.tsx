'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  BookOpen,
  PenTool,
  Award,
  BarChart3,
  Settings,
  Menu,
  X,
  Flame,
  ChevronDown,
  Sparkles,
  User,
  ArrowRight,
  Wifi,
  WifiOff,
  Check,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useGamification } from '@/context/GamificationContext'
import { useLanguage } from '@/context/LanguageContext'
import { useScript } from '@/context/ScriptContext'

export const Navbar: React.FC = () => {
  const pathname = usePathname()
  const { dailyStreak, levelInfo } = useGamification()
  const { t, language } = useLanguage()
  const { script, setScript } = useScript()

  // State dropdowns & popovers
  const [isPracticeOpen, setIsPracticeOpen] = useState(false)
  const [isStreakOpen, setIsStreakOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Refs for click outside
  const practiceDropdownRef = useRef<HTMLDivElement>(null)
  const streakPopoverRef = useRef<HTMLDivElement>(null)
  const profilePopoverRef = useRef<HTMLDivElement>(null)

  // Backend status & mastery counts
  const [isBackendLive, setIsBackendLive] = useState<boolean | null>(null)
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false)
  const [hiraganaCount, setHiraganaCount] = useState<number>(0)
  const [katakanaCount, setKatakanaCount] = useState<number>(0)

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Is any practice sub-route active
  const isPracticeActive =
    pathname === '/practice' ||
    pathname === '/exam' ||
    pathname === '/analytics'

  // Read memorized counts for both Hiragana and Katakana
  const refreshMasteryBadge = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('nihongo_sora_character_progress')
      if (stored) {
        const parsed = JSON.parse(stored)
        let hCount = 0
        let kCount = 0
        Object.entries(parsed).forEach(([key, item]: [string, unknown]) => {
          if (
            typeof item === 'object' &&
            item !== null &&
            (item as { status?: string }).status === 'memorized'
          ) {
            const charId = Number(
              (item as { character_id?: number }).character_id ?? key
            )
            if (charId >= 1 && charId <= 107) {
              hCount++
            } else if (charId >= 108 && charId <= 214) {
              kCount++
            }
          }
        })
        setHiraganaCount(hCount)
        setKatakanaCount(kCount)
      } else {
        setHiraganaCount(0)
        setKatakanaCount(0)
      }
    } catch {
      setHiraganaCount(0)
      setKatakanaCount(0)
    }
  }, [])

  // Check backend health
  const checkBackendStatus = useCallback(async () => {
    setIsCheckingBackend(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2500)
      const res = await fetch(`${apiBaseUrl}/health`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      setIsBackendLive(res.ok)
    } catch {
      setIsBackendLive(false)
    } finally {
      setIsCheckingBackend(false)
    }
  }, [apiBaseUrl])

  // Click outside & Escape key handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        practiceDropdownRef.current &&
        !practiceDropdownRef.current.contains(target)
      ) {
        setIsPracticeOpen(false)
      }
      if (
        streakPopoverRef.current &&
        !streakPopoverRef.current.contains(target)
      ) {
        setIsStreakOpen(false)
      }
      if (
        profilePopoverRef.current &&
        !profilePopoverRef.current.contains(target)
      ) {
        setIsProfileOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPracticeOpen(false)
        setIsStreakOpen(false)
        setIsProfileOpen(false)
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  // Listen to custom progress & script update events
  useEffect(() => {
    refreshMasteryBadge()

    const handleProgressUpdate = () => refreshMasteryBadge()
    window.addEventListener('nihongo_sora_progress_updated', handleProgressUpdate)
    window.addEventListener('nihongo_sora_script_changed', handleProgressUpdate)
    window.addEventListener('storage', handleProgressUpdate)

    return () => {
      window.removeEventListener('nihongo_sora_progress_updated', handleProgressUpdate)
      window.removeEventListener('nihongo_sora_script_changed', handleProgressUpdate)
      window.removeEventListener('storage', handleProgressUpdate)
    }
  }, [refreshMasteryBadge])

  // Periodic backend status check
  useEffect(() => {
    checkBackendStatus()
    const interval = setInterval(checkBackendStatus, 30000)
    return () => clearInterval(interval)
  }, [checkBackendStatus])

  // Close menus on route change
  useEffect(() => {
    setIsPracticeOpen(false)
    setIsStreakOpen(false)
    setIsProfileOpen(false)
    setMobileMenuOpen(false)
  }, [pathname])

  // Mutual exclusion toggle helpers
  const togglePractice = () => {
    setIsStreakOpen(false)
    setIsProfileOpen(false)
    setIsPracticeOpen((prev) => !prev)
  }

  const toggleStreak = () => {
    setIsPracticeOpen(false)
    setIsProfileOpen(false)
    setIsStreakOpen((prev) => !prev)
  }

  const toggleProfile = () => {
    setIsPracticeOpen(false)
    setIsStreakOpen(false)
    setIsProfileOpen((prev) => !prev)
  }

  const totalMemorized = hiraganaCount + katakanaCount
  const overallPercentage = Math.round((totalMemorized / 214) * 100)

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ========================================================================= */}
          {/* BAGIAN KIRI: BRAND & NAVIGASI UTAMA */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-6 sm:gap-8">
            {/* 1. BRAND / LOGO */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none shrink-0"
              aria-label="Nihongo Sora Beranda"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <span className="text-lg font-bold font-serif leading-none">空</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    Nihongo{' '}
                    <span className="bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      Sora
                    </span>
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-light tracking-wider hidden sm:inline">
                    日本語の空
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {/* Status backend mini */}
                  <button
                    type="button"
                    onClick={checkBackendStatus}
                    title={
                      isBackendLive === true
                        ? 'Backend Golang Fiber Live di :8000'
                        : isBackendLive === false
                        ? 'Backend offline (mode fallback lokal)'
                        : 'Memeriksa status backend...'
                    }
                    className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span
                      className={`inline-block rounded-full w-1.5 h-1.5 ${
                        isBackendLive === true
                          ? 'bg-emerald-500'
                          : isBackendLive === false
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="hidden xs:inline">
                      {isCheckingBackend
                        ? 'Cek...'
                        : isBackendLive
                        ? 'Fiber'
                        : 'Offline'}
                    </span>
                  </button>
                  <span>•</span>
                  <span>v2.0</span>
                </div>
              </div>
            </Link>

            {/* 2. LINK NAVIGASI UTAMA (DESKTOP) */}
            <nav className="hidden md:flex items-center gap-1">
              {/* Beranda */}
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  pathname === '/'
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 shadow-2xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-900/60'
                }`}
              >
                <Home
                  className={`w-3.5 h-3.5 ${
                    pathname === '/' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
                  }`}
                />
                <span>{t('nav.home')}</span>
              </Link>

              {/* Koleksi Huruf */}
              <Link
                href="/learn"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  pathname === '/learn'
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 shadow-2xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-900/60'
                }`}
              >
                <BookOpen
                  className={`w-3.5 h-3.5 ${
                    pathname === '/learn' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
                  }`}
                />
                <span>{t('nav.learn')}</span>
              </Link>

              {/* Dropdown "Latihan" */}
              <div ref={practiceDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={togglePractice}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
                    isPracticeActive || isPracticeOpen
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 shadow-2xs'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-900/60'
                  }`}
                  aria-expanded={isPracticeOpen}
                  aria-haspopup="true"
                >
                  <PenTool
                    className={`w-3.5 h-3.5 ${
                      isPracticeActive || isPracticeOpen
                        ? 'text-sky-600 dark:text-sky-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{language === 'id' ? 'Latihan' : 'Practice'}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      isPracticeOpen ? 'rotate-180 text-sky-600 dark:text-sky-400' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Dropdown Menu "Latihan" */}
                {isPracticeOpen && (
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {language === 'id' ? 'Menu Latihan & Evaluasi' : 'Practice & Evaluation'}
                    </div>

                    {/* Studio Tracing */}
                    <Link
                      href="/practice"
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                        pathname === '/practice'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <PenTool className="w-4 h-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold leading-tight flex items-center justify-between">
                          <span>Studio Tracing</span>
                          {pathname === '/practice' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {language === 'id' ? 'Simulasi kaligrafi KanjiVG' : 'KanjiVG brush calligraphy'}
                        </p>
                      </div>
                    </Link>

                    {/* Arena Ujian */}
                    <Link
                      href="/exam"
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                        pathname === '/exam'
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold leading-tight flex items-center justify-between">
                          <span>Arena Ujian</span>
                          {pathname === '/exam' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {language === 'id' ? 'Kuis hafalan & blind tracing' : 'Quiz & blind tracing exam'}
                        </p>
                      </div>
                    </Link>

                    {/* Dasbor Analitik */}
                    <Link
                      href="/analytics"
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                        pathname === '/analytics'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold leading-tight flex items-center justify-between">
                          <span>Dasbor Analitik</span>
                          {pathname === '/analytics' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {language === 'id' ? 'Statistik & histori belajar' : 'Learning stats & history'}
                        </p>
                      </div>
                    </Link>

                    {/* Pembatas & Switcher Cepat Aksara */}
                    <div className="my-1.5 border-t border-slate-100 dark:border-slate-800/80" />

                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 px-0.5">
                        <span>{language === 'id' ? 'Aksara Aktif' : 'Active Script'}</span>
                        <span className="font-mono text-[9px] uppercase text-sky-600 dark:text-sky-400">
                          {script}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-900/80">
                        <button
                          type="button"
                          onClick={() => setScript('hiragana')}
                          className={`py-1 px-2 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                            script === 'hiragana'
                              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-2xs font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span className="font-serif">あ</span>
                          <span>Hiragana</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setScript('katakana')}
                          className={`py-1 px-2 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                            script === 'katakana'
                              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span className="font-serif">ア</span>
                          <span>Katakana</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* ========================================================================= */}
          {/* BAGIAN KANAN: STREAK, BAHASA, TEMA, PENGATURAN, PROFIL */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* 1. STREAK WIDGET (DENGAN POPOVER CAPAIAN HAFALAN) */}
            <div ref={streakPopoverRef} className="relative">
              <button
                type="button"
                onClick={toggleStreak}
                className={`inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-xs font-bold border transition cursor-pointer select-none ${
                  isStreakOpen
                    ? 'bg-orange-100 dark:bg-orange-950/70 border-orange-400 dark:border-orange-700 text-orange-800 dark:text-orange-300 ring-2 ring-orange-400/30'
                    : 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/70 shadow-xs'
                }`}
                title={t('nav.streak_title', { count: dailyStreak })}
                aria-expanded={isStreakOpen}
                aria-haspopup="true"
              >
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse shrink-0" />
                <span suppressHydrationWarning className="font-black">
                  {dailyStreak} {t('nav.streak')}
                </span>
              </button>

              {/* Popover Capaian Hafalan & Streak */}
              {isStreakOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Streak Card Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xl shrink-0 shadow-inner">
                      🔥
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{dailyStreak} {t('nav.streak')}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 font-bold">
                          Daily Streak
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {language === 'id'
                          ? 'Tetap konsisten berlatih setiap hari untuk mengunci hafalan aksara.'
                          : 'Practice daily to strengthen muscle memory and recall.'}
                      </p>
                    </div>
                  </div>

                  {/* Status Capaian Hafalan (Hiragana vs Katakana) */}
                  <div className="py-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{language === 'id' ? 'Capaian Penguasaan Huruf' : 'Mastery Progress'}</span>
                      </span>
                      <span className="font-mono text-amber-600 dark:text-amber-400">
                        {totalMemorized}/214 ({overallPercentage}%)
                      </span>
                    </div>

                    {/* Progress Bar Hiragana */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1">
                          <span className="font-serif">あ</span>
                          <span>Hiragana</span>
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                          {hiraganaCount}/107
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (hiraganaCount / 107) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Progress Bar Katakana */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                          <span className="font-serif">ア</span>
                          <span>Katakana</span>
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                          {katakanaCount}/107
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (katakanaCount / 107) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Level & XP Mini Banner */}
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{levelInfo.icon}</span>
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                            Lv.{levelInfo.level} {levelInfo.title}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {levelInfo.currentLevelXP} / {levelInfo.nextLevelXP} XP
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                        {levelInfo.totalXP} XP
                      </span>
                    </div>
                  </div>

                  {/* Footer link to Learn Page */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <Link
                      href="/learn"
                      onClick={() => setIsStreakOpen(false)}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>{language === 'id' ? 'Buka Koleksi Huruf' : 'Open Kana Library'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      href="/analytics"
                      onClick={() => setIsStreakOpen(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition"
                    >
                      {language === 'id' ? 'Analitik' : 'Analytics'}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 2. LANGUAGE SWITCHER (TOGGLE TEKS RINGKAS ID / EN) */}
            <LanguageSwitcher />

            {/* 3. THEME SWITCHER (IKON MATAHARI / BULAN) */}
            <ThemeToggle />

            {/* 4. IKON PENGATURAN (HANYA IKON GEAR) */}
            <Link
              href="/settings"
              className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center cursor-pointer group ${
                pathname === '/settings'
                  ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-700 text-sky-600 dark:text-sky-300 ring-2 ring-sky-400/30 shadow-xs'
                  : 'border-slate-300 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs'
              }`}
              title={language === 'id' ? 'Pengaturan' : 'Settings'}
              aria-label="Pengaturan"
            >
              <Settings className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" />
            </Link>

            {/* 5. AVATAR / PROFIL PENGGUNA MINIMALIS */}
            <div ref={profilePopoverRef} className="relative">
              <button
                type="button"
                onClick={toggleProfile}
                className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center cursor-pointer relative ${
                  isProfileOpen
                    ? 'ring-2 ring-sky-500 border-sky-400 bg-sky-50 dark:bg-sky-950'
                    : 'border-slate-300 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs'
                }`}
                title={language === 'id' ? 'Profil Pengguna' : 'User Profile'}
                aria-label="Profil"
                aria-expanded={isProfileOpen}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-inner">
                  <span>{levelInfo.icon || '空'}</span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 px-1 rounded-full text-[9px] font-black bg-indigo-600 text-white ring-1 ring-white dark:ring-slate-900 leading-tight">
                  {levelInfo.level}
                </span>
              </button>

              {/* Popover Profil Ringkas */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                      {levelInfo.icon || '空'}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {language === 'id' ? 'Pembelajar Nihongo' : 'Nihongo Learner'}
                      </h4>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                        Lv.{levelInfo.level} • {levelInfo.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-serif">
                        {levelInfo.japaneseTitle}
                      </p>
                    </div>
                  </div>

                  {/* 3-column stats */}
                  <div className="grid grid-cols-3 gap-1.5 py-3 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
                      <p className="text-[10px] text-slate-400">Streak</p>
                      <p className="text-xs font-black text-orange-600 dark:text-orange-400">
                        {dailyStreak}d
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
                      <p className="text-[10px] text-slate-400">Total XP</p>
                      <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {levelInfo.totalXP}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
                      <p className="text-[10px] text-slate-400">Hafalan</p>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {totalMemorized}
                      </p>
                    </div>
                  </div>

                  {/* Quick Profile Links */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs font-bold">
                    <Link
                      href="/analytics"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                    >
                      <span className="flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{language === 'id' ? 'Statistik & Analitik' : 'Analytics & Stats'}</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>{language === 'id' ? 'Pengaturan Aplikasi' : 'App Settings'}</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 6. HAMBURGER BUTTON (MOBILE / TABLET) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label={t('nav.menu_open')}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE NAVIGATION DRAWER */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            {/* User & Streak Summary Card */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50 to-amber-50 dark:from-sky-950/40 dark:via-indigo-950/40 dark:to-amber-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{levelInfo.icon}</span>
                <div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Lv.{levelInfo.level} {levelInfo.title}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {totalMemorized}/214 Aksara • {levelInfo.totalXP} XP
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100/60 dark:bg-orange-950/60 px-2.5 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                <span>{dailyStreak} {t('nav.streak')}</span>
              </div>
            </div>

            {/* Quick Kana Script Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-850">
              <button
                type="button"
                onClick={() => setScript('hiragana')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  script === 'hiragana'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="font-serif">あ</span>
                <span>Hiragana ({hiraganaCount}/107)</span>
              </button>
              <button
                type="button"
                onClick={() => setScript('katakana')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  script === 'katakana'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="font-serif">ア</span>
                <span>Katakana ({katakanaCount}/107)</span>
              </button>
            </div>

            {/* Navigation links */}
            <div className="space-y-1 pt-1">
              {/* Beranda */}
              <Link
                href="/"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition border ${
                  pathname === '/'
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                    : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Home className="w-4 h-4 text-sky-500" />
                <span>{t('nav.home')}</span>
              </Link>

              {/* Koleksi Huruf */}
              <Link
                href="/learn"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition border ${
                  pathname === '/learn'
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                    : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4 text-sky-500" />
                <span>{t('nav.learn')}</span>
              </Link>

              {/* Latihan Group */}
              <div className="pt-2">
                <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {language === 'id' ? 'Latihan & Evaluasi' : 'Practice & Exam'}
                </p>
                <Link
                  href="/practice"
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                    pathname === '/practice'
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                      : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <PenTool className="w-4 h-4 text-sky-500" />
                  <span>Studio Tracing</span>
                </Link>

                <Link
                  href="/exam"
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                    pathname === '/exam'
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                      : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <Award className="w-4 h-4 text-purple-500" />
                  <span>Arena Ujian</span>
                </Link>

                <Link
                  href="/analytics"
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                    pathname === '/analytics'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span>Dasbor Analitik</span>
                </Link>
              </div>

              {/* Pengaturan */}
              <Link
                href="/settings"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition border ${
                  pathname === '/settings'
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                    : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>{language === 'id' ? 'Pengaturan' : 'Settings'}</span>
              </Link>
            </div>

            {/* Mobile Footer with Backend status */}
            <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                {isBackendLive ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Backend Live (:8000)</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                    <span>Mode Offline (Local Fallback)</span>
                  </>
                )}
              </span>
              <span className="font-mono text-[10px]">v2.0 MPA</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
