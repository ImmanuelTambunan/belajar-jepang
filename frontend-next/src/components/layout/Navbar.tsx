'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

interface NavItem {
  href: string
  label: string
  sublabel: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Beranda',
    sublabel: 'Dashboard',
    icon: <Home className="w-4 h-4" />,
  },
  {
    href: '/learn',
    label: 'Koleksi Huruf',
    sublabel: '46 Hiragana',
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    href: '/practice',
    label: 'Studio Tracing',
    sublabel: 'Latihan Tulis',
    icon: <PenTool className="w-4 h-4" />,
  },
  {
    href: '/exam',
    label: 'Arena Ujian',
    sublabel: 'Kuis & Evaluasi',
    icon: <Award className="w-4 h-4" />,
  },
  {
    href: '/analytics',
    label: 'Dasbor Analitik',
    sublabel: 'Statistik Belajar',
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    href: '/settings',
    label: 'Pengaturan & Audio',
    sublabel: 'Audio Manager',
    icon: <Settings className="w-4 h-4" />,
  },
]

export const Navbar: React.FC = () => {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isBackendLive, setIsBackendLive] = useState<boolean | null>(null)
  const [memorizedCount, setMemorizedCount] = useState<number>(0)
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false)

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // Read memorized count from localStorage or progress API
  const refreshMasteryBadge = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('nihongo_sora_character_progress')
      if (stored) {
        const parsed = JSON.parse(stored)
        let count = 0
        Object.values(parsed).forEach((item: unknown) => {
          if (
            typeof item === 'object' &&
            item !== null &&
            (item as { status?: string }).status === 'memorized'
          ) {
            count++
          }
        })
        setMemorizedCount(count)
      }
    } catch {
      // ignore
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

  useEffect(() => {
    refreshMasteryBadge()
    checkBackendStatus()

    // Listen to custom progress update events
    const handleProgressUpdate = () => refreshMasteryBadge()
    window.addEventListener('nihongo_sora_progress_updated', handleProgressUpdate)
    window.addEventListener('storage', handleProgressUpdate)

    // Periodic backend status check every 30s
    const interval = setInterval(checkBackendStatus, 30000)

    return () => {
      window.removeEventListener('nihongo_sora_progress_updated', handleProgressUpdate)
      window.removeEventListener('storage', handleProgressUpdate)
      clearInterval(interval)
    }
  }, [refreshMasteryBadge, checkBackendStatus])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* BRAND LOGO */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="Nihongo Sora Beranda"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl font-bold font-serif leading-none">空</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {/* Live backend status dot */}
                <button
                  type="button"
                  onClick={checkBackendStatus}
                  title={
                    isBackendLive === true
                      ? 'Backend Golang Fiber Live di :8000 (Klik untuk refresh status)'
                      : isBackendLive === false
                      ? 'Backend Golang offline - menggunakan fallback lokal (Klik untuk coba hubungkan lagi)'
                      : 'Memeriksa status backend...'
                  }
                  className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span className="relative flex h-2 w-2">
                    {isBackendLive && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isBackendLive === true
                          ? 'bg-emerald-500'
                          : isBackendLive === false
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    ></span>
                  </span>
                  <span className="hidden xs:inline">
                    {isCheckingBackend
                      ? 'Cek...'
                      : isBackendLive
                      ? 'Fiber Live'
                      : 'Mode Offline'}
                  </span>
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>MPA v2.0</span>
              </div>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION LINKS */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 shadow-xs'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <span
                    className={`${
                      isActive
                        ? 'text-sky-600 dark:text-sky-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* RIGHT SIDE TOOLS (BADGE, THEME TOGGLE, MOBILE BUTTON) */}
          <div className="flex items-center gap-2.5">
            {/* Quick Character Mastery Badge */}
            <Link
              href="/learn"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition shadow-2xs"
              title="Penguasaan Hiragana: Klik untuk melihat detail koleksi"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              <span>
                <strong className="font-extrabold">{memorizedCount}</strong>/46
                Hafal
              </span>
            </Link>

            {/* Dark/Light Theme Toggle */}
            <ThemeToggle />

            {/* Hamburger Button for Mobile / Tablet */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Buka Menu Navigasi"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1.5">
            {/* Mobile Mastery summary card */}
            <div className="p-3 mb-2 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Hiragana:
                </span>
              </div>
              <span className="text-xs font-black text-sky-700 dark:text-sky-300">
                {memorizedCount} dari 46 Karakter Hafal
              </span>
            </div>

            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all border ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                      : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`p-2 rounded-xl ${
                        isActive
                          ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <p className="leading-tight">{item.label}</p>
                      <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                        {item.sublabel}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  )}
                </Link>
              )
            })}

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
                    <span>Mode Offline Standalone</span>
                  </>
                )}
              </span>
              <span className="font-mono text-[10px]">Laragon MySQL</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
