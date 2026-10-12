'use client'

import React from 'react'
import Link from 'next/link'

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xs py-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-sky-600 dark:bg-sky-500 flex items-center justify-center text-white font-serif font-bold text-sm shadow-xs">
              空
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Nihongo Sora (日本語の空) • v2.0 MPA
              </p>
              <p className="text-[11px] text-slate-400">
                Belajar Hiragana Tracing & Kaligrafi Interaktif
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link
              href="/"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition"
            >
              Beranda
            </Link>
            <Link
              href="/learn"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition"
            >
              Koleksi Huruf
            </Link>
            <Link
              href="/practice"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition"
            >
              Studio Tracing
            </Link>
            <Link
              href="/exam"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition"
            >
              Arena Ujian
            </Link>
            <Link
              href="/analytics"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition"
            >
              Analitik
            </Link>
            <Link
              href="/settings"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition"
            >
              Pengaturan & Audio
            </Link>
          </div>

          <div className="text-center md:text-right text-[11px]">
            <p>Next.js 16 App Router + Tailwind CSS</p>
            <p className="text-slate-400">Golang Fiber REST API (:8000) • GORM</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
