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
  Flame,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useGamification } from '@/context/GamificationContext'
import { useLanguage } from '@/context/LanguageContext'

interface NavItem {
  href: string
  label: string
  sublabel: string
  icon: React.ReactNode
}

export const Navbar: React.FC = () => {
  const pathname = usePathname()
  const { dailyStreak, levelInfo } = useGamification()
  const { t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isBackendLive, setIsBackendLive] = useState<boolean | null>(null)
  const [memorizedCount, setMemorizedCount] = useState<number>(0)
  const totalCharactersCount = 107
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false)

  const navItems: NavItem[] = [
    {
      href: '/',
      label: t('nav.home'),
      sublabel: t('nav.home_sub'),
      icon: <Home className="w-4 h-4" />,
    },
    {
      href: '/learn',
      label: t('nav.learn'),
      sublabel: t('nav.learn_sub'),
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      href: '/practice',
      label: t('nav.practice'),
      sublabel: t('nav.practice_sub'),
      icon: <PenTool className="w-4 h-4" />,
    },
    {
      href: '/exam',
      label: t('nav.exam'),
      sublabel: t('nav.exam_sub'),
      icon: <Award className="w-4 h-4" />,
    },
    {
      href: '/analytics',
      label: t('nav.analytics'),
      sublabel: t('nav.analytics_sub'),
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      href: '/settings',
      label: t('nav.settings'),
      sublabel: t('nav.settings_sub'),
      icon: <Settings className="w-4 h-4" />,
    },
  ]

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
        setMemorizedCount((prev) => (prev === count ? prev : count))
      } else {
        setMemorizedCount((prev) => (prev === 0 ? prev : 0))
      }
    } catch {
      setMemorizedCount((prev) => (prev === 0 ? prev : 0))
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

  // Listen to custom progress update events (mount only)
  useEffect(() => {
    refreshMasteryBadge()

    const handleProgressUpdate = () => {
      refreshMasteryBadge()
    }

    window.addEventListener('nihongo_sora_progress_updated', handleProgressUpdate)
    window.addEventListener('storage', handleProgressUpdate)

    return () => {
      window.removeEventListener('nihongo_sora_progress_updated', handleProgressUpdate)
      window.removeEventListener('storage', handleProgressUpdate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Periodic backend status check
  useEffect(() => {
    checkBackendStatus()
    const interval = setInterval(checkBackendStatus, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [checkBackendStatus])

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
            {navItems.map((item) => {
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

          {/* RIGHT SIDE TOOLS (BADGE, LANGUAGE SWITCHER, THEME TOGGLE, MOBILE BUTTON) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Daily Streak Fire Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-400 shadow-2xs"
              title={t('nav.streak_title', { count: dailyStreak })}
            >
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
              <span>{dailyStreak} {t('nav.streak')}</span>
            </div>

            {/* Level & XP Bar Badge */}
            <div
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-300 shadow-2xs"
              title={t('nav.level_tooltip', {
                level: levelInfo.level,
                title: levelInfo.title,
                japaneseTitle: levelInfo.japaneseTitle,
                currentXP: levelInfo.currentLevelXP,
                nextXP: levelInfo.nextLevelXP,
                totalXP: levelInfo.totalXP,
              })}
            >
              <span className="text-sm leading-none">{levelInfo.icon}</span>
              <span className="font-extrabold whitespace-nowrap">Lv.{levelInfo.level}</span>
              <div className="w-14 h-2 bg-indigo-200/80 dark:bg-indigo-900/80 rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full transition-all duration-300"
                  style={{ width: `${levelInfo.percentage}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hidden xl:inline">
                {levelInfo.currentLevelXP} XP
              </span>
            </div>

            {/* Quick Character Mastery Badge */}
            <Link
              href="/learn"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition shadow-2xs"
              title={t('nav.memorized_title')}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              <span>
                <strong className="font-extrabold">{memorizedCount}</strong>/{totalCharactersCount}{' '}
                {t('nav.memorized')}
              </span>
            </Link>

            {/* Language Switcher (ID / EN) */}
            <LanguageSwitcher />

            {/* Dark/Light Theme Toggle */}
            <ThemeToggle />

            {/* Hamburger Button for Mobile / Tablet */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label={t('nav.menu_open')}
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
            {/* Mobile Gamification & Mastery summary card */}
            <div className="p-3 mb-2 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50 to-amber-50 dark:from-sky-950/40 dark:via-indigo-950/40 dark:to-amber-950/40 border border-sky-200 dark:border-sky-800/60 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{levelInfo.icon}</span>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      Lv.{levelInfo.level} {levelInfo.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-serif ml-1">
                      {levelInfo.japaneseTitle}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100/60 dark:bg-orange-950/60 px-2 py-0.5 rounded-full">
                  <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                  <span>{dailyStreak} {t('nav.streak')}</span>
                </div>
              </div>
              {/* XP progress bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full"
                    style={{ width: `${levelInfo.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono">{levelInfo.currentLevelXP} / {levelInfo.nextLevelXP} XP ({levelInfo.totalXP} Total)</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{memorizedCount}/{totalCharactersCount} {t('nav.memorized')}</span>
                </div>
              </div>
            </div>

            {navItems.map((item) => {
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
                    <span>{t('nav.backend_offline')}</span>
                  </>
                )}
              </span>
              <div className="flex items-center gap-2">
                <LanguageSwitcher compact={true} />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
