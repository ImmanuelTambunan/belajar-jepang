'use client'

import React, { useState, useEffect, useCallback } from 'react'

export const SAKURA_STORAGE_KEY = 'nihongo_sora_sakura_rain'
export const SAKURA_TOGGLE_EVENT = 'nihongo_sora_sakura_toggled'

interface PetalConfig {
  id: number
  left: string
  fallDuration: string
  fallDelay: string
  swayDuration: string
  swayDelay: string
  scale: number
  opacity: number
  type: 1 | 2 | 3
}

// 12 carefully balanced, lightweight petals for continuous 60fps drift
const SAKURA_PETALS: PetalConfig[] = [
  { id: 1, left: '-3%', fallDuration: '12s', fallDelay: '0s', swayDuration: '4.2s', swayDelay: '0s', scale: 0.95, opacity: 0.85, type: 1 },
  { id: 2, left: '8%', fallDuration: '15s', fallDelay: '2.5s', swayDuration: '5.1s', swayDelay: '1.2s', scale: 0.8, opacity: 0.75, type: 2 },
  { id: 3, left: '18%', fallDuration: '11s', fallDelay: '5s', swayDuration: '3.8s', swayDelay: '0.5s', scale: 1.1, opacity: 0.9, type: 1 },
  { id: 4, left: '28%', fallDuration: '17s', fallDelay: '1s', swayDuration: '4.7s', swayDelay: '2s', scale: 0.75, opacity: 0.7, type: 3 },
  { id: 5, left: '40%', fallDuration: '13s', fallDelay: '7s', swayDuration: '4.0s', swayDelay: '1.5s', scale: 1.0, opacity: 0.88, type: 1 },
  { id: 6, left: '50%', fallDuration: '16s', fallDelay: '3.5s', swayDuration: '5.4s', swayDelay: '0.8s', scale: 0.85, opacity: 0.8, type: 2 },
  { id: 7, left: '62%', fallDuration: '12.5s', fallDelay: '8.5s', swayDuration: '3.9s', swayDelay: '2.3s', scale: 1.05, opacity: 0.92, type: 1 },
  { id: 8, left: '72%', fallDuration: '14s', fallDelay: '4s', swayDuration: '4.8s', swayDelay: '1.1s', scale: 0.9, opacity: 0.82, type: 3 },
  { id: 9, left: '82%', fallDuration: '18s', fallDelay: '6s', swayDuration: '5.2s', swayDelay: '0.3s', scale: 0.7, opacity: 0.72, type: 2 },
  { id: 10, left: '92%', fallDuration: '13.5s', fallDelay: '1.8s', swayDuration: '4.1s', swayDelay: '2.7s', scale: 1.0, opacity: 0.86, type: 1 },
  { id: 11, left: '98%', fallDuration: '15.5s', fallDelay: '9s', swayDuration: '4.5s', swayDelay: '1.7s', scale: 0.85, opacity: 0.78, type: 2 },
  { id: 12, left: '33%', fallDuration: '11.5s', fallDelay: '10.5s', swayDuration: '3.6s', swayDelay: '0.9s', scale: 0.95, opacity: 0.84, type: 3 },
]

export const SakuraRain: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(true)
  const [mounted, setMounted] = useState<boolean>(false)

  // Initialize from localStorage and listen to external setting changes
  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(SAKURA_STORAGE_KEY)
      if (stored !== null) {
        setEnabled(stored === 'true')
      }
    } catch {
      // ignore
    }

    const handleSync = () => {
      try {
        const updated = localStorage.getItem(SAKURA_STORAGE_KEY)
        if (updated !== null) {
          setEnabled(updated === 'true')
        }
      } catch {
        // ignore
      }
    }

    window.addEventListener(SAKURA_TOGGLE_EVENT, handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener(SAKURA_TOGGLE_EVENT, handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  // Toggle handler
  const toggleSakura = useCallback(() => {
    const nextVal = !enabled
    setEnabled(nextVal)
    try {
      localStorage.setItem(SAKURA_STORAGE_KEY, String(nextVal))
      window.dispatchEvent(new Event(SAKURA_TOGGLE_EVENT))
    } catch {
      // ignore
    }
  }, [enabled])

  // Don't render particle DOM if disabled or not yet mounted
  return (
    <>
      {mounted && enabled && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none select-none overflow-hidden z-30"
        >
          {SAKURA_PETALS.map((petal) => (
            <div
              key={petal.id}
              className="absolute pointer-events-none"
              style={{
                left: petal.left,
                animation: `sakura-fall ${petal.fallDuration} linear infinite`,
                animationDelay: petal.fallDelay,
                willChange: 'top, transform',
              }}
            >
              <div
                style={{
                  animation: `sakura-sway ${petal.swayDuration} ease-in-out infinite`,
                  animationDelay: petal.swayDelay,
                  transform: `scale(${petal.scale})`,
                  opacity: petal.opacity,
                  willChange: 'transform',
                }}
              >
                {/* Organic Sakura Petal SVG with Soft Gradient */}
                {petal.type === 1 && (
                  <svg
                    width="22"
                    height="24"
                    viewBox="0 0 24 26"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-[0_2px_4px_rgba(244,63,94,0.18)]"
                  >
                    <path
                      d="M12 2C9.5 2 4 8 3 14C2 20 7 24 12 24C17 24 22 20 21 14C20 8 14.5 2 12 2ZM12 4.5C12.8 5.8 13.8 6.5 15 6C13.8 7.5 13.5 8.8 12 8.8C10.5 8.8 10.2 7.5 9 6C10.2 6.5 11.2 5.8 12 4.5Z"
                      fill="url(#sakuraGradPrimary)"
                    />
                    <defs>
                      <linearGradient id="sakuraGradPrimary" x1="12" y1="2" x2="12" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ffe4e6" />
                        <stop offset="50%" stopColor="#fbcfe8" />
                        <stop offset="100%" stopColor="#f43f5e" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}

                {petal.type === 2 && (
                  <svg
                    width="18"
                    height="20"
                    viewBox="0 0 20 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-[0_2px_3px_rgba(244,63,94,0.15)]"
                  >
                    <path
                      d="M10 2C7 3 2 8 2 13C2 18 6 20 10 20C14 20 18 18 18 13C18 8 13 3 10 2Z"
                      fill="url(#sakuraGradSoft)"
                    />
                    <defs>
                      <linearGradient id="sakuraGradSoft" x1="10" y1="2" x2="10" y2="20" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="60%" stopColor="#fbcfe8" />
                        <stop offset="100%" stopColor="#fb7185" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}

                {petal.type === 3 && (
                  <svg
                    width="16"
                    height="18"
                    viewBox="0 0 18 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-[0_1px_3px_rgba(244,63,94,0.12)]"
                  >
                    <path
                      d="M9 1.5C7.2 2.5 3 6.5 2.5 11C2 15.5 5.5 18.5 9 18.5C12.5 18.5 16 15.5 15.5 11C15 6.5 10.8 2.5 9 1.5Z"
                      fill="url(#sakuraGradMini)"
                    />
                    <defs>
                      <linearGradient id="sakuraGradMini" x1="9" y1="1.5" x2="9" y2="18.5" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#fff1f2" />
                        <stop offset="60%" stopColor="#fda4af" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MINIMALIST FLOATING SAKURA TOGGLE (BOTTOM-LEFT CORNER)                    */}
      {/* ========================================================================= */}
      <div className="fixed bottom-4 left-4 z-40 hidden sm:block">
        <button
          type="button"
          onClick={toggleSakura}
          aria-label={enabled ? 'Matikan efek kelopak sakura' : 'Nyalakan efek kelopak sakura'}
          title={enabled ? 'Efek Sakura: Aktif (Klik untuk nonaktifkan)' : 'Efek Sakura: Nonaktif (Klik untuk aktifkan)'}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all duration-200 border shadow-xs cursor-pointer ${
            enabled
              ? 'bg-white/85 dark:bg-slate-900/85 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:border-rose-400 hover:shadow-rose-500/10'
              : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <span className={`text-sm transition-transform duration-300 ${enabled ? 'scale-110 group-hover:rotate-12' : 'grayscale opacity-60'}`}>
            🌸
          </span>
          <span className="hidden md:inline font-medium">Sakura</span>
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              enabled ? 'bg-rose-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          />
        </button>
      </div>
    </>
  )
}
