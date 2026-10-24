import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/context/LanguageContext'
import { GamificationProvider } from '@/context/GamificationContext'
import { ScriptProvider } from '@/context/ScriptContext'
import { XPToastContainer } from '@/components/XPToastContainer'
import { LevelUpModal } from '@/components/LevelUpModal'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SoraBackground } from '@/components/ui/SoraBackground'
import { SakuraRain } from '@/components/ui/SakuraRain'

export const metadata: Metadata = {
  title: 'Nihongo Sora (日本語の空) — Belajar Hiragana & Katakana Tracing Calligraphy',
  description:
    'Aplikasi interaktif belajar menulis karakter Hiragana dan Katakana lengkap (107 karakter masing-masing) dengan animasi stroke KanjiVG dan kanvas kaligrafi native berbasis Golang Fiber + Next.js.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 antialiased selection:bg-sky-500 selection:text-white flex flex-col relative bg-slate-50/20 dark:bg-slate-950/40">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
        >
          <LanguageProvider>
            <ScriptProvider>
              <GamificationProvider>
                {/* 1. Global Atmospheric Sora Anime Sky Background */}
                <SoraBackground />

                {/* 2. Global Falling Sakura Petal Particles */}
                <SakuraRain />

                {/* 3. Main App Content */}
                <div className="flex min-h-screen flex-col relative z-10">
                  <Navbar />
                  <div className="flex-1 w-full animate-fade-in">{children}</div>
                  <Footer />
                </div>

                {/* 4. Global Modals & Notifications */}
                <XPToastContainer />
                <LevelUpModal />
              </GamificationProvider>
            </ScriptProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
