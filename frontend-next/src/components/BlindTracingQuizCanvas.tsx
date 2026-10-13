'use client'

import React, { useRef, useState, useEffect } from 'react'
import { CharacterData } from '@/types/character'
import { Point, OverallAccuracyResult } from '@/types/accuracy'
import { evaluateAllStrokes } from '@/utils/strokeScorer'
import { AccuracyVisualOverlay } from './AccuracyVisualOverlay'
import { useLanguage } from '@/context/LanguageContext'

interface BlindTracingQuizCanvasProps {
  character: CharacterData
  onAnswerSubmit: (tracingScore: number, isCorrect: boolean) => void
  disabled?: boolean
}

export const BlindTracingQuizCanvas: React.FC<BlindTracingQuizCanvasProps> = ({
  character,
  onAnswerSubmit,
  disabled = false,
}) => {
  const { language } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const [userStrokes, setUserStrokes] = useState<Point[][]>([])
  const currentStrokePoints = useRef<Point[]>([])

  const [evaluation, setEvaluation] = useState<OverallAccuracyResult | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)

  const sortedStrokes = [...(character.strokes || [])]
    .map((s, idx) => ({
      ...s,
      stroke_order: s.stroke_order ?? s.stroke_number ?? idx + 1,
      svg_path: s.svg_path || s.path_data || '',
    }))
    .sort((a, b) => a.stroke_order - b.stroke_order)

  const handleClear = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setUserStrokes([])
    currentStrokePoints.current = []
    setEvaluation(null)
    setHasSubmitted(false)
  }

  // Reset state when character changes
  useEffect(() => {
    handleClear()
  }, [character.id])

  const redrawStrokes = (strokes: Point[][]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0284c7'
    ctx.lineWidth = 6

    strokes.forEach((stroke) => {
      if (stroke.length < 2) return
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y)
      }
      ctx.stroke()
    })
  }

  const handleUndo = () => {
    if (userStrokes.length === 0 || hasSubmitted) return
    const nextStrokes = userStrokes.slice(0, -1)
    setUserStrokes(nextStrokes)
    redrawStrokes(nextStrokes)
    setEvaluation(null)
  }

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      t: Date.now(),
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || hasSubmitted) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    setIsDrawing(true)

    const pos = getCanvasCoords(e)
    currentStrokePoints.current = [pos]

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0284c7'
    ctx.lineWidth = 6
    lastPos.current = pos
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || hasSubmitted) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getCanvasCoords(e)
    currentStrokePoints.current.push(pos)

    ctx.beginPath()
    ctx.moveTo(
      lastPos.current ? lastPos.current.x : pos.x,
      lastPos.current ? lastPos.current.y : pos.y
    )
    ctx.lineTo(pos.x, pos.y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0284c7'
    ctx.lineWidth = 6
    ctx.stroke()
    lastPos.current = pos
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
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

    if (currentStrokePoints.current.length > 1) {
      setUserStrokes((prev) => [...prev, currentStrokePoints.current])
    }
    currentStrokePoints.current = []
  }

  const handleSubmitDrawing = () => {
    if (userStrokes.length === 0 || hasSubmitted) return

    const refSvgPaths = sortedStrokes.map((s) => s.svg_path)
    const result = evaluateAllStrokes(userStrokes, refSvgPaths, 300)
    setEvaluation(result)
    setHasSubmitted(true)

    // Consider correct if score >= 70%
    const isCorrect = result.score >= 70
    onAnswerSubmit(result.score, isCorrect)
  }

  return (
    <div className="flex flex-col items-center">
      {/* Stage Box (300 x 300) */}
      <div className="relative w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] rounded-2xl overflow-hidden shadow-md border-2 border-slate-300 dark:border-slate-700 bg-white select-none touch-none">
        {/* Layer 1: Genko Yoshi Calligraphy Grid */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 300 300"
        >
          <rect x="2" y="2" width="296" height="296" rx="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="20" y="20" width="260" height="260" fill="none" stroke="#f1f5f9" strokeWidth="1.5" />
          <line x1="150" y1="4" x2="150" y2="296" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="6,6" />
          <line x1="4" y1="150" x2="296" y2="150" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="6,6" />
        </svg>

        {/* Layer 2: Ghost Reference - REVEALED ONLY AFTER SUBMIT! */}
        {hasSubmitted && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 animate-fade-in" viewBox="0 0 109 109">
            {sortedStrokes.map((stroke, idx) => (
              <path
                key={`ref-ghost-${idx}`}
                d={stroke.svg_path}
                fill="none"
                stroke="#64748b"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        )}

        {/* Layer 3: Visual Accuracy Feedback Overlay (post-submit) */}
        {evaluation && hasSubmitted && (
          <AccuracyVisualOverlay
            strokeEvaluations={evaluation.strokeEvaluations}
            canvasSize={300}
          />
        )}

        {/* Layer 4: HTML5 Drawing Canvas */}
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className={`absolute inset-0 w-full h-full z-10 ${
            hasSubmitted ? 'cursor-default' : 'cursor-crosshair'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {/* Control Buttons */}
      {!hasSubmitted ? (
        <div className="flex items-center gap-2 mt-4 w-full max-w-[300px]">
          <button
            onClick={handleUndo}
            disabled={userStrokes.length === 0}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition shadow-sm"
          >
            ↩️ Undo
          </button>
          <button
            onClick={handleClear}
            disabled={userStrokes.length === 0}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition shadow-sm"
          >
            🗑️ Reset
          </button>
          <button
            onClick={handleSubmitDrawing}
            disabled={userStrokes.length === 0}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-98"
          >
            {language === 'id' ? '✓ Kirim Goresan' : '✓ Submit Strokes'} ({userStrokes.length}/{sortedStrokes.length})
          </button>
        </div>
      ) : (
        <div className="mt-3 text-center">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              evaluation && evaluation.score >= 70
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300'
            }`}
          >
            <span>{language === 'id' ? 'Akurasi Bentuk' : 'Shape Accuracy'}: {evaluation?.score}%</span>
            <span>•</span>
            <span>
              {evaluation && evaluation.score >= 70
                ? (language === 'id' ? '✓ Tepat' : '✓ Accurate')
                : (language === 'id' ? '✕ Kurang Tepat' : '✕ Needs Practice')}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
