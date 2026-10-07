'use client'

import React, { useEffect, useRef, useState } from 'react'
import { CharacterData } from '@/types/character'

interface StrokeCanvasProps {
  character: CharacterData
}

export const StrokeCanvas: React.FC<StrokeCanvasProps> = ({ character }) => {
  // Modes & toggles
  const [showGuide, setShowGuide] = useState<boolean>(true)
  const [isAnimating, setIsAnimating] = useState<boolean>(false)
  const [activeStrokeIndex, setActiveStrokeIndex] = useState<number | null>(null)
  const [brushColor, setBrushColor] = useState<string>('#0284c7')
  const [brushWidth, setBrushWidth] = useState<number>(6)

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // SVG path references for animated playback
  const animatedPathRefs = useRef<Array<SVGPathElement | null>>([])
  const animationTimerRef = useRef<number | null>(null)

  // Palette for distinguishing strokes
  const strokeColors = ['#0284c7', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6']

  // Sort strokes by stroke_order
  const sortedStrokes = [...(character.strokes || [])].sort(
    (a, b) => a.stroke_order - b.stroke_order
  )

  // Extract starting coordinate from SVG path definition (e.g. M31.01,33...)
  const getStartPoint = (d: string): { x: number; y: number } => {
    const match = d.match(/^[Mm]\s*([0-9.-]+)[,\s]+([0-9.-]+)/)
    if (match) {
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
    }
    return { x: 54.5, y: 54.5 }
  }

  // Clear freehand canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // Reset animated paths to fully hidden
  const resetAnimationPaths = () => {
    animatedPathRefs.current.forEach((path) => {
      if (path) {
        const len = path.getTotalLength()
        path.style.transition = 'none'
        path.style.strokeDasharray = `${len}`
        path.style.strokeDashoffset = `${len}`
      }
    })
    setActiveStrokeIndex(null)
  }

  // Stop any active animation sequence
  const stopAnimation = () => {
    if (animationTimerRef.current !== null) {
      window.clearTimeout(animationTimerRef.current)
      animationTimerRef.current = null
    }
    setIsAnimating(false)
  }

  // Clear canvas & reset animations whenever character changes
  useEffect(() => {
    clearCanvas()
    stopAnimation()
    resetAnimationPaths()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id])

  // Play stroke order demo sequentially
  const playAnimation = () => {
    stopAnimation()
    setIsAnimating(true)
    resetAnimationPaths()

    let currentIndex = 0
    const strokeDuration = 700 // ms per stroke
    const pauseBetween = 250 // ms pause

    const animateNextStroke = () => {
      if (currentIndex >= sortedStrokes.length) {
        setIsAnimating(false)
        setActiveStrokeIndex(null)
        return
      }

      setActiveStrokeIndex(currentIndex)
      const pathEl = animatedPathRefs.current[currentIndex]

      if (pathEl) {
        pathEl.style.transition = `stroke-dashoffset ${strokeDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
        pathEl.style.strokeDashoffset = '0'
      }

      currentIndex++
      animationTimerRef.current = window.setTimeout(
        animateNextStroke,
        strokeDuration + pauseBetween
      )
    }

    // Small delay before starting
    animationTimerRef.current = window.setTimeout(animateNextStroke, 150)
  }

  // Drawing event handlers using Pointer Events (mouse, touch, stylus)
  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    setIsDrawing(true)

    const pos = getCanvasCoordinates(e)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = brushColor
    ctx.lineWidth = brushWidth
    lastPos.current = pos
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getCanvasCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(
      lastPos.current ? lastPos.current.x : pos.x,
      lastPos.current ? lastPos.current.y : pos.y
    )
    ctx.lineTo(pos.x, pos.y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = brushColor
    ctx.lineWidth = brushWidth
    ctx.stroke()
    lastPos.current = pos
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        // pointer capture already released
      }
    }
    setIsDrawing(false)
    lastPos.current = null
  }

  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg dark:shadow-2xl text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold bg-gradient-to-r from-sky-600 via-indigo-600 to-rose-600 dark:from-sky-400 dark:via-indigo-300 dark:to-rose-400 bg-clip-text text-transparent">
              {character.character}
            </span>
            <span className="text-lg text-slate-500 dark:text-slate-400 font-medium">
              ({character.readings?.[0]?.romaji || '-'})
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-600/50 text-sky-700 dark:text-sky-300 font-medium">
              筆順 Hitsujun Tracing
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Praktek urutan menulis karakter Jepang dengan bantuan kotak kaligrafi (原稿用紙).
          </p>
        </div>

        {/* Counter Badge */}
        <div className="inline-flex items-center self-start sm:self-center px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-sky-700 dark:text-sky-300">
          {isAnimating && activeStrokeIndex !== null ? (
            <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"></span>
              Memutar Goresan #{activeStrokeIndex + 1} dari {sortedStrokes.length}
            </span>
          ) : (
            <span>Total: {character.strokes_count} Goresan</span>
          )}
        </div>
      </div>

      {/* Main Grid: Interactive Stage + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Stage Area: Calligraphy Canvas (300 x 300) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] rounded-2xl overflow-hidden shadow-xl border-2 border-slate-300 dark:border-slate-700 bg-white select-none touch-none">
            {/* LAYER 1: Calligraphy Grid (Genko Yoshi) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 300 300"
            >
              <rect
                x="2"
                y="2"
                width="296"
                height="296"
                rx="12"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <rect
                x="20"
                y="20"
                width="260"
                height="260"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="1.5"
              />
              {/* Vertical guideline */}
              <line
                x1="150"
                y1="4"
                x2="150"
                y2="296"
                stroke="#94a3b8"
                strokeWidth="1.2"
                strokeDasharray="6,6"
              />
              {/* Horizontal guideline */}
              <line
                x1="4"
                y1="150"
                x2="296"
                y2="150"
                stroke="#94a3b8"
                strokeWidth="1.2"
                strokeDasharray="6,6"
              />
              {/* Diagonals */}
              <line
                x1="20"
                y1="20"
                x2="280"
                y2="280"
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4,6"
              />
              <line
                x1="280"
                y1="20"
                x2="20"
                y2="280"
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4,6"
              />
            </svg>

            {/* LAYER 2: Guide Outline & Animated Strokes (KanjiVG 109x109 viewBox) */}
            <svg
              className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
                showGuide ? 'opacity-100' : 'opacity-0'
              }`}
              viewBox="0 0 109 109"
            >
              {/* Static faint guide paths */}
              {sortedStrokes.map((stroke, index) => (
                <path
                  key={`guide-${stroke.id}`}
                  d={stroke.svg_path}
                  fill="none"
                  stroke={strokeColors[index % strokeColors.length]}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.25"
                />
              ))}

              {/* Animated active paths */}
              {sortedStrokes.map((stroke, index) => (
                <path
                  key={`anim-${stroke.id}`}
                  ref={(el) => {
                    animatedPathRefs.current[index] = el
                  }}
                  d={stroke.svg_path}
                  fill="none"
                  stroke={strokeColors[index % strokeColors.length]}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={activeStrokeIndex === index ? 1 : 0.85}
                  style={{
                    filter:
                      activeStrokeIndex === index
                        ? 'drop-shadow(0 0 6px currentColor)'
                        : 'none',
                  }}
                />
              ))}

              {/* Stroke Order Badges */}
              {showGuide &&
                sortedStrokes.map((stroke, index) => {
                  const pt = getStartPoint(stroke.svg_path)
                  const isCurrent = activeStrokeIndex === index
                  return (
                    <g
                      key={`badge-${stroke.id}`}
                      className="transition-transform duration-200"
                      transform={isCurrent ? `scale(1.2) translate(${pt.x * -0.2}, ${pt.y * -0.2})` : undefined}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isCurrent ? '5.2' : '4.2'}
                        fill={strokeColors[index % strokeColors.length]}
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                      <text
                        x={pt.x}
                        y={pt.y + 1.2}
                        fontSize="3.8"
                        fontWeight="bold"
                        fill="#ffffff"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {stroke.stroke_order}
                      </text>
                    </g>
                  )
                })}
            </svg>

            {/* LAYER 3: Interactive Freehand HTML5 Canvas */}
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="absolute inset-0 w-full h-full cursor-crosshair z-10"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
            💡 Goreskan kursor mouse, jari (touch screen), atau stylus di atas kanvas.
          </p>
        </div>

        {/* Sidebar Controls Area */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Section: Mode 1 - Animasi Goresan */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 transition-colors">
            <h4 className="text-sm font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wider flex items-center gap-2">
              <span>▶</span> Mode 1: Animasi Urutan Goresan (Hitsujun)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Pelajari urutan resmi KanjiVG satu demi satu secara halus dan bertahap.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={playAnimation}
                disabled={isAnimating}
                className="px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isAnimating ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    <span>Memutar Animasi...</span>
                  </>
                ) : (
                  <>
                    <span>🎬 Putar Animasi</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  stopAnimation()
                  resetAnimationPaths()
                }}
                disabled={!isAnimating && activeStrokeIndex === null}
                className="px-4 py-2.5 rounded-xl font-medium text-sm transition-all border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                Reset Animasi
              </button>
            </div>
          </div>

          {/* Section: Mode 2 - Tracing & Menulis Mandiri */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 transition-colors">
            <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-2">
              <span>✏️</span> Mode 2: Tracing & Kuas Mandiri
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Atur kuas kaligrafi dan latih ingatan goresan Anda.
            </p>

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border cursor-pointer ${
                  showGuide
                    ? 'bg-sky-50 dark:bg-sky-500/20 border-sky-400 dark:border-sky-500 text-sky-700 dark:text-sky-300'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {showGuide ? '👁️ Panduan Aktif' : '🙈 Panduan Disembunyikan'}
              </button>

              <button
                onClick={clearCanvas}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all bg-rose-50 dark:bg-rose-600/20 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white cursor-pointer"
              >
                🗑️ Hapus Coretan
              </button>
            </div>

            {/* Brush Settings */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700/60">
              {/* Color picker */}
              <div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                  Warna Tinta:
                </span>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Biru Sora', color: '#0284c7' },
                    { label: 'Sumi Hitam', color: '#0f172a' },
                    { label: 'Merah Kuas', color: '#e11d48' },
                    { label: 'Bambu Hijau', color: '#059669' },
                    { label: 'Sakura Pink', color: '#ec4899' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      title={c.label}
                      onClick={() => setBrushColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                        brushColor === c.color
                          ? 'border-sky-500 scale-110 shadow-md ring-2 ring-sky-400/50'
                          : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Brush Width */}
              <div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                  Tebal Kuas:
                </span>
                <div className="inline-flex rounded-xl bg-slate-200 dark:bg-slate-900 p-1 border border-slate-300 dark:border-slate-700">
                  {[
                    { label: 'Tipis', size: 4 },
                    { label: 'Sedang', size: 7 },
                    { label: 'Tebal', size: 12 },
                  ].map((s) => (
                    <button
                      key={s.size}
                      onClick={() => setBrushWidth(s.size)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        brushWidth === s.size
                          ? 'bg-white dark:bg-sky-600 text-sky-700 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stroke Legend */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 transition-colors">
            <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Daftar Goresan Terdaftar ({sortedStrokes.length}):
            </h5>
            <div className="flex flex-wrap gap-2">
              {sortedStrokes.map((st, i) => (
                <div
                  key={st.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    activeStrokeIndex === i
                      ? 'bg-sky-100 dark:bg-sky-500/20 border-sky-400 text-sky-800 dark:text-sky-200 ring-1 ring-sky-400'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: strokeColors[i % strokeColors.length] }}
                  >
                    {st.stroke_order}
                  </span>
                  <span>
                    Goresan #{st.stroke_order} ({character.character})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
