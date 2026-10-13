'use client'

import React from 'react'
import { useLanguage } from '@/context/LanguageContext'

export const Footer: React.FC = () => {
  const { language } = useLanguage()

  return (
    <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Brand & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-rose-500 flex items-center justify-center text-white font-serif font-black text-sm shadow-sm shrink-0">
              空
            </div>
            <div>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 justify-center sm:justify-start">
                <span>Nihongo Sora</span>
                <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 font-serif">日本語の空</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-bold border border-slate-200 dark:border-slate-700/60">
                  v2.0 MPA
                </span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'id'
                  ? 'Platform Pembelajaran Aksara & Kaligrafi Digital Jepang Interaktif'
                  : 'Interactive Japanese Script & Digital Calligraphy Learning Platform'}
              </p>
            </div>
          </div>

          {/* Copyright & Architecture Stack */}
          <div className="flex flex-col sm:items-end text-[11px] text-slate-400 dark:text-slate-500 gap-0.5">
            <p>
              © 2026 <span className="font-semibold text-slate-700 dark:text-slate-300">Nihongo Sora</span> • Institut Teknologi Del
            </p>
            <p className="text-[10px]">
              Next.js 16 (App Router) + Golang Fiber REST API
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
