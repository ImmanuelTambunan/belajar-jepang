import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nihongo Sora (日本語の空) — Belajar Hiragana Tracing & Calligraphy',
  description:
    'Aplikasi interaktif belajar menulis karakter vokal Hiragana dengan animasi stroke KanjiVG dan kanvas kaligrafi native berbasis Golang Fiber + Next.js.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  )
}
