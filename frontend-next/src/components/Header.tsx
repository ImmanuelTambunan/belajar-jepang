'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

export const Header: React.FC = () => {
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Koleksi Huruf', icon: '🔤', desc: '46 Hiragana & Stroke Tracing' },
    { href: '/practice', label: 'Latihan Hafalan', icon: '🧠', desc: 'Memorize Mode & Antrean Review' },
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
        Platform Pembelajaran Hiragana Interaktif dengan Arsitektur Decoupled:
        <span className="text-slate-900 dark:text-slate-200 font-medium"> Next.js 16 (App Router + Tailwind)</span> di Frontend dan
        <span className="text-slate-900 dark:text-slate-200 font-medium"> Golang Fiber + GORM</span> di Backend.
      </p>

      {/* Main Navigation Tabs */}
      <nav className="flex items-center justify-center gap-2 mt-6">
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
      </nav>
    </header>
  )
}
