import React from 'react'

export const ServiceCards: React.FC = () => {
  const services = [
    {
      title: 'Frontend Next.js',
      port: 'Port 3000',
      icon: '⚡',
      badge: 'React 19 • App Router • TS',
      desc: 'Client-side rendering dengan kanvas interaktif Hiragana, Tailwind CSS, dan visualisasi stroke SVG KanjiVG.',
      color: 'border-sky-500/30 hover:border-sky-500/60 bg-sky-950/20',
      host: 'localhost:3000',
    },
    {
      title: 'Backend Golang Fiber',
      port: 'Port 8000',
      icon: '🚀',
      badge: 'Go 1.27 • Fiber v2 • GORM',
      desc: 'High-performance REST API menyajikan relasi data Hiragana, readings, dan koordinat goresan dengan AutoMigrate & Seeder.',
      color: 'border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-950/20',
      host: 'localhost:8000',
    },
    {
      title: 'Database Server',
      port: 'Port 3306',
      icon: '🗄️',
      badge: 'MySQL Laragon • utf8mb4',
      desc: 'Tabel characters, character_readings, dan character_strokes yang terhubung langsung secara native tanpa Docker.',
      color: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/20',
      host: '127.0.0.1:3306',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-8">
      {services.map((svc) => (
        <div
          key={svc.title}
          className={`p-6 rounded-2xl border transition-all duration-200 backdrop-blur-sm ${svc.color} flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{svc.icon}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800/90 text-sky-400 border border-slate-700">
                {svc.port}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">{svc.title}</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{svc.badge}</p>
            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">{svc.desc}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Host: {svc.host}</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Native Windows
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
