import React, { useEffect, useRef, useState } from 'react'

export interface StrokeItem {
  id: number
  stroke_order: number
  svg_path: string
}

export interface CharacterData {
  id: number
  character: string
  type: string
  strokes_count: number
  jlpt_level?: string | null
  readings?: Array<{
    id: number
    romaji: string
    meaning?: string | null
  }>
  strokes: StrokeItem[]
}

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

  // Sort strokes by stroke_order
  const sortedStrokes = [...character.strokes].sort(
    (a, b) => a.stroke_order - b.stroke_order
  )

  // Clear canvas when character changes
  useEffect(() => {
    clearCanvas()
    stopAnimation()
    resetAnimationPaths()
  }, [character.id])

  // Extract starting coordinate from SVG path definition (e.g. M31.01,33...)
  const getStartPoint = (d: string): { x: number; y: number } => {
    const match = d.match(/^[Mm]\s*([0-9.-]+)[,\s]+([0-9.-]+)/)
    if (match) {
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
    }
    return { x: 54.5, y: 54.5 }
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

  // Drawing event handlers (supports mouse, touch, and stylus via PointerEvents)
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
    ctx.moveTo(lastPos.current ? lastPos.current.x : pos.x, lastPos.current ? lastPos.current.y : pos.y)
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
        // pointer capture already lost
      }
    }
    setIsDrawing(false)
    lastPos.current = null
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // Stroke color palette for multi-stroke visualization
  const strokeColors = ['#0284c7', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6']

  return (
    <div className="stroke-canvas-component">
      <div className="canvas-header">
        <div className="canvas-title-group">
          <h3>
            Latihan Goresan: <span className="highlight-char">{character.character}</span>
            <span className="romaji-label">({character.readings?.[0]?.romaji})</span>
          </h3>
          <p className="canvas-subtitle">
            Praktek urutan menulis (筆順 - Hitsujun) dengan garis bantu kotak kaligrafi.
          </p>
        </div>

        {/* Status / Active stroke indicator */}
        <div className="stroke-counter-badge">
          {isAnimating && activeStrokeIndex !== null ? (
            <span className="animating-pulse">
              Memutar Goresan #{activeStrokeIndex + 1} dari {sortedStrokes.length}
            </span>
          ) : (
            <span>Total: {character.strokes_count} Goresan</span>
          )}
        </div>
      </div>

      <div className="canvas-main-area">
        {/* INTERACTIVE STAGE (300 x 300) */}
        <div className="canvas-stage">
          {/* LAYER 1: Japanese Calligraphy Practice Grid (原稿用紙) */}
          <svg className="stage-layer grid-layer" viewBox="0 0 300 300">
            {/* Outer practice box */}
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
            {/* Inner guideline box */}
            <rect
              x="20"
              y="20"
              width="260"
              height="260"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            {/* Vertical dashed center line */}
            <line
              x1="150"
              y1="4"
              x2="150"
              y2="296"
              stroke="#94a3b8"
              strokeWidth="1.2"
              strokeDasharray="6,6"
            />
            {/* Horizontal dashed center line */}
            <line
              x1="4"
              y1="150"
              x2="296"
              y2="150"
              stroke="#94a3b8"
              strokeWidth="1.2"
              strokeDasharray="6,6"
            />
            {/* Diagonal dashed guidelines */}
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

          {/* LAYER 2: Guide Outline & Animated Strokes (KanjiVG viewBox 0 0 109 109) */}
          <svg
            className={`stage-layer character-svg-layer ${showGuide ? 'guide-visible' : 'guide-hidden'}`}
            viewBox="0 0 109 109"
          >
            {/* Background static ghost outline */}
            {sortedStrokes.map((stroke, index) => (
              <path
                key={`guide-${stroke.id}`}
                d={stroke.svg_path}
                className="guide-stroke-path"
                stroke={strokeColors[index % strokeColors.length]}
              />
            ))}

            {/* Dynamic animated stroke playback layer */}
            {sortedStrokes.map((stroke, index) => (
              <path
                key={`anim-${stroke.id}`}
                ref={(el) => {
                  animatedPathRefs.current[index] = el
                }}
                d={stroke.svg_path}
                className={`animated-stroke-path ${activeStrokeIndex === index ? 'active-drawing' : ''}`}
                stroke={strokeColors[index % strokeColors.length]}
              />
            ))}

            {/* Stroke order number badges placed at stroke start coordinates */}
            {showGuide &&
              sortedStrokes.map((stroke, index) => {
                const pt = getStartPoint(stroke.svg_path)
                const isCurrent = activeStrokeIndex === index
                return (
                  <g
                    key={`badge-${stroke.id}`}
                    className={`stroke-badge-group ${isCurrent ? 'badge-highlight' : ''}`}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.2"
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

          {/* LAYER 3: User HTML5 Tracing & Freehand Canvas */}
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="stage-layer user-drawing-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>

        {/* CONTROLS & TOOLS PANEL */}
        <div className="canvas-sidebar">
          {/* Section: Mode 1 - Animasi Goresan */}
          <div className="control-card">
            <h4>Mode 1: Animasi Urutan Goresan</h4>
            <p className="card-desc">
              Pelajari urutan goresan resmi satu demi satu dengan animasi dinamis.
            </p>
            <div className="button-row">
              <button
                onClick={playAnimation}
                disabled={isAnimating}
                className="btn-action btn-play"
              >
                {isAnimating ? 'Memutar Animasi...' : 'Putar Animasi Goresan'}
              </button>
              <button
                onClick={() => {
                  stopAnimation()
                  resetAnimationPaths()
                }}
                disabled={!isAnimating && activeStrokeIndex === null}
                className="btn-action btn-secondary"
              >
                Reset Animasi
              </button>
            </div>
          </div>

          {/* Section: Mode 2 - Tracing & Menulis Mandiri */}
          <div className="control-card">
            <h4>Mode 2: Tracing & Menulis Mandiri</h4>
            <p className="card-desc">
              Goreskan kursor mouse atau sentuhan jari Anda di atas kanvas.
            </p>
            <div className="button-row">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className={`btn-action ${showGuide ? 'btn-toggle-active' : 'btn-toggle'}`}
              >
                {showGuide ? 'Sembunyikan Panduan' : 'Tampilkan Panduan'}
              </button>
              <button onClick={clearCanvas} className="btn-action btn-danger">
                Hapus Coretan
              </button>
            </div>

            {/* Brush Customization */}
            <div className="brush-settings">
              <div className="brush-row">
                <span className="setting-label">Warna Tinta:</span>
                <div className="color-palette">
                  {[
                    { label: 'Biru Sora', color: '#0284c7' },
                    { label: 'Tinta Kaligrafi Hitam', color: '#1e293b' },
                    { label: 'Merah Kuas', color: '#e11d48' },
                    { label: 'Hijau Bambu', color: '#059669' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      title={c.label}
                      onClick={() => setBrushColor(c.color)}
                      className={`color-dot ${brushColor === c.color ? 'active' : ''}`}
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                </div>
              </div>

              <div className="brush-row">
                <span className="setting-label">Tebal Kuas:</span>
                <div className="brush-size-group">
                  {[
                    { label: 'Tipis', size: 4 },
                    { label: 'Sedang', size: 7 },
                    { label: 'Tebal', size: 11 },
                  ].map((s) => (
                    <button
                      key={s.size}
                      onClick={() => setBrushWidth(s.size)}
                      className={`btn-size ${brushWidth === s.size ? 'active' : ''}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Info Card: Daftar Goresan */}
          <div className="stroke-legend-card">
            <h4>Daftar Urutan Goresan Karakter:</h4>
            <div className="legend-items">
              {sortedStrokes.map((st, i) => (
                <div
                  key={st.id}
                  className={`legend-item ${activeStrokeIndex === i ? 'highlighted' : ''}`}
                >
                  <span
                    className="legend-circle"
                    style={{ backgroundColor: strokeColors[i % strokeColors.length] }}
                  >
                    {st.stroke_order}
                  </span>
                  <span className="legend-text">
                    Goresan ke-{st.stroke_order} ({character.character})
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
