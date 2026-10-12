'use client'

import React from 'react'
import { StrokeEvaluation } from '@/types/accuracy'

interface AccuracyVisualOverlayProps {
  strokeEvaluations: StrokeEvaluation[]
  canvasSize?: number
}

export const AccuracyVisualOverlay: React.FC<AccuracyVisualOverlayProps> = ({
  strokeEvaluations,
  canvasSize = 300,
}) => {
  if (!strokeEvaluations || strokeEvaluations.length === 0) return null

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20 transition-opacity duration-300"
      viewBox={`0 0 ${canvasSize} ${canvasSize}`}
    >
      <defs>
        <filter id="glow-accurate" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#10b981" floodOpacity="0.6" />
        </filter>
        <filter id="glow-warning" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.6" />
        </filter>
        <filter id="glow-error" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#f43f5e" floodOpacity="0.7" />
        </filter>
      </defs>

      {strokeEvaluations.map((evalItem) => {
        const { strokeIndex, pointFeedbacks, isDirectionInverted, referencePoints } = evalItem
        if (!pointFeedbacks || pointFeedbacks.length < 2) return null

        return (
          <g key={`stroke-overlay-${strokeIndex}`}>
            {/* Target Reference Ghost Line */}
            {referencePoints && referencePoints.length > 1 && (
              <polyline
                points={referencePoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="3,3"
                opacity="0.45"
              />
            )}

            {/* Deviation connector lines for error/warning points */}
            {pointFeedbacks
              .filter((_, idx) => idx % 6 === 0)
              .map((fb, idx) => {
                if (fb.status === 'accurate' || fb.distance < 10) return null
                return (
                  <line
                    key={`conn-${strokeIndex}-${idx}`}
                    x1={fb.point.x}
                    y1={fb.point.y}
                    x2={fb.nearestRefPoint.x}
                    y2={fb.nearestRefPoint.y}
                    stroke={fb.status === 'error' ? '#f43f5e' : '#f59e0b'}
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity="0.5"
                  />
                )
              })}

            {/* Colored Segment Highlighting */}
            {pointFeedbacks.slice(0, -1).map((fb, idx) => {
              const nextFb = pointFeedbacks[idx + 1]
              const status = isDirectionInverted ? 'error' : fb.status

              let strokeColor = '#10b981'
              let haloColor = 'rgba(16, 185, 129, 0.35)'
              let filterId = 'url(#glow-accurate)'

              if (status === 'warning') {
                strokeColor = '#f59e0b'
                haloColor = 'rgba(245, 158, 11, 0.35)'
                filterId = 'url(#glow-warning)'
              } else if (status === 'error') {
                strokeColor = '#f43f5e'
                haloColor = 'rgba(244, 63, 94, 0.4)'
                filterId = 'url(#glow-error)'
              }

              return (
                <g key={`seg-${strokeIndex}-${idx}`}>
                  {/* Outer transparent glow / halo */}
                  <line
                    x1={fb.point.x}
                    y1={fb.point.y}
                    x2={nextFb.point.x}
                    y2={nextFb.point.y}
                    stroke={haloColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* Core highlight path */}
                  <line
                    x1={fb.point.x}
                    y1={fb.point.y}
                    x2={nextFb.point.x}
                    y2={nextFb.point.y}
                    stroke={strokeColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter={filterId}
                  />
                </g>
              )
            })}

            {/* Start point marker */}
            {pointFeedbacks.length > 0 && (
              <g>
                <circle
                  cx={pointFeedbacks[0].point.x}
                  cy={pointFeedbacks[0].point.y}
                  r="5"
                  fill={isDirectionInverted ? '#f43f5e' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle
                  cx={pointFeedbacks[pointFeedbacks.length - 1].point.x}
                  cy={pointFeedbacks[pointFeedbacks.length - 1].point.y}
                  r="4"
                  fill="#64748b"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              </g>
            )}

            {/* Direction Inverted Warning Alert Indicator */}
            {isDirectionInverted && pointFeedbacks.length > 0 && (
              <g
                transform={`translate(${pointFeedbacks[Math.floor(pointFeedbacks.length / 2)].point.x}, ${
                  pointFeedbacks[Math.floor(pointFeedbacks.length / 2)].point.y
                })`}
              >
                <circle r="11" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#ffffff"
                >
                  ↩
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
