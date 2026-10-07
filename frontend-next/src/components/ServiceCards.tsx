import React from 'react'

export const ServiceCards: React.FC = () => {
  const services = [
    {
      title: 'Frontend Next.js',
      port: 'Port 3000',
      icon: '⚡',
      badge: 'React 19 • App Router • TS',
      desc: 'Client-side rendering dengan kanvas interaktif Hiragana, Tailwind CSS, dan visualisasi stroke SVG KanjiVG.',
      theme: 'hover:border-sky-500/50 dark:hover:border-sky-500/60',
      host: 'localhost:3000',
    },
    {
      title: 'Backend Golang Fiber',
      port: 'Port 8000',
      icon: '🚀',
      badge: 'Go 1.27 • Fiber v2 • GORM',
      desc: 'High-performance REST API menyajikan relasi data Hiragana, readings, dan koordinat goresan dengan AutoMigrate & Seeder.',
      theme: 'hover:border-indigo-500/50 dark:hover:border-indigo-500/60',
      host: 'localhost:8000',
    },
    {
      title: 'Database Server',
      port: 'Port 3306',
      icon: '🗄️',
      badge: 'MySQL Laragon • utf8mb4',
      desc: 'Tabel characters, character_readings, dan character_strokes yang terhubung langsung secara native tanpa Docker.',
      theme: 'hover:border-emerald-500/50 dark:hover:border-emerald-500/60',
      host: '127.0.0.1:3306',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-8">
      {services.map((svc) => (
        <div
          key={svc.title}
          className={`p-6 rounded-2xl border transition-all duration-300 backdrop-blur-sm bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none hover:shadow-md ${svc.theme} flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{svc.icon}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700">
                {svc.port}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{svc.title}</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{svc.badge}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">{svc.desc}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Host: {svc.host}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span> Native Windows
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
