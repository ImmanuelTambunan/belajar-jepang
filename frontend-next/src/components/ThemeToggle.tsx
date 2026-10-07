'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/50 animate-pulse" />
    )
  }

  const isDark = resolvedTheme === 'dark' || theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="group relative flex items-center justify-center w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all duration-300 cursor-pointer backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-sky-500"
      aria-label="Ganti Tema (Dark / Light Mode)"
      title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
    >
      {/* Sun Icon (Visible in light mode) */}
      <Sun className="h-5 w-5 text-amber-500 transition-transform duration-500 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />

      {/* Moon Icon (Visible in dark mode) */}
      <Moon className="absolute h-5 w-5 text-sky-400 transition-transform duration-500 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />

      {/* Screen-reader text */}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
