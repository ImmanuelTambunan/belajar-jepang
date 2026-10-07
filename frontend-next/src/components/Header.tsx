import React from 'react'

export const Header: React.FC = () => {
  return (
    <header className="text-center py-8 border-b border-slate-800 relative">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-sky-400 mb-4 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>IT DEL • Nihongo Sora v2.0 (Golang + Next.js Native)</span>
      </div>

      <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex flex-col sm:flex-row items-center justify-center gap-3">
        <span>
          Nihongo <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-rose-400 bg-clip-text text-transparent">Sora</span>
        </span>
        <span className="text-2xl sm:text-3xl text-slate-400 font-light tracking-widest">
          日本語の空
        </span>
      </h1>

      <p className="max-w-2xl mx-auto mt-3 text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
        Platform Pembelajaran Hiragana Interaktif dengan Arsitektur Decoupled:
        <span className="text-slate-200 font-medium"> Next.js 16 (App Router + Tailwind)</span> di Frontend dan
        <span className="text-slate-200 font-medium"> Golang Fiber + GORM</span> di Backend.
      </p>
    </header>
  )
}
