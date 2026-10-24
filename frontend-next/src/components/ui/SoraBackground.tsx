'use client'

import React, { useMemo } from 'react'
import { usePathname } from 'next/navigation'

export const SoraBackground: React.FC = () => {
  const pathname = usePathname()

  // Select animated background GIF based on current route
  // User spec: animation.gif for home dashboard (/), animation1.gif for practice studio (/practice)
  const activeGif = useMemo(() => {
    if (!pathname || pathname === '/') {
      return '/asset/image/animation.gif'
    }
    if (pathname.startsWith('/practice')) {
      return '/asset/image/animation1.gif'
    }
    return null
  }, [pathname])

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-[-1]"
    >
      {/* ========================================================================= */}
      {/* 1. BASE ANIMATED SKY / GIF LAYER                                          */}
      {/* ========================================================================= */}
      {activeGif ? (
        <div
          key={activeGif}
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-out transform scale-105"
          style={{ backgroundImage: `url('${activeGif}')` }}
        />
      ) : (
        /* Fallback Dynamic Sora Gradient for /learn, /exam, /analytics, /settings */
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-sky-200 via-sky-100 to-rose-50 dark:from-slate-950 dark:via-indigo-950/70 dark:to-slate-950 transition-colors duration-700" />
      )}

      {/* ========================================================================= */}
      {/* 2. CONTINUOUS DRIFTING CLOUDS LAYER (CSS PARALLAX)                        */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full overflow-hidden opacity-35 dark:opacity-20 pointer-events-none">
        {/* Cloud Layer 1 - Slow Majestic Drift */}
        <div
          className="absolute -top-10 -left-1/4 w-[150%] h-80 bg-repeat-x animate-sora-clouds-slow bg-contain"
          style={{
            backgroundImage: "url('/assets/sky/clouds-day.svg')",
            filter: 'blur(2px)',
          }}
        />

        {/* Cloud Layer 2 - Mid Altitude Parallax */}
        <div
          className="absolute top-1/4 -right-1/4 w-[160%] h-72 bg-repeat-x animate-sora-clouds-fast bg-contain opacity-70"
          style={{
            backgroundImage: "url('/assets/sky/clouds-twilight.svg')",
            filter: 'blur(3px)',
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. ATMOSPHERIC FROSTED GLASS & WCAG ACCESSIBLE OVERLAY                     */}
      {/* ========================================================================= */}
      {/* Ensures cards, Hiragana/Katakana calligraphy, and text stay ultra sharp   */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-sky-50/65 via-white/70 to-rose-50/70 dark:from-slate-950/80 dark:via-slate-900/75 dark:to-indigo-950/85 backdrop-blur-[1.5px] transition-colors duration-500" />

      {/* Ambient Vignette & Delicate Corner Glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-rose-300/15 dark:bg-rose-500/10 rounded-full blur-3xl animate-sora-shimmer" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-indigo-300/10 dark:bg-indigo-600/10 rounded-full blur-3xl" />
    </div>
  )
}
