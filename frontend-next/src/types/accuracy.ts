export interface Point {
  x: number
  y: number
  t?: number // timestamp in ms
}

export type PointAccuracyStatus = 'accurate' | 'warning' | 'error'

export interface PointFeedback {
  point: Point
  nearestRefPoint: Point
  distance: number
  status: PointAccuracyStatus
}

export interface StrokeEvaluation {
  strokeIndex: number // 0-based
  strokeOrder: number // 1-based
  score: number // 0 - 100
  averageDistance: number // in canvas px
  frechetDistance: number // discrete Fréchet / max bottleneck in px
  isDirectionInverted: boolean
  directionalPenalty: number
  coveragePenalty: number
  lengthRatio: number
  userLength: number
  refLength: number
  userPoints: Point[]
  resampledUserPoints: Point[]
  referencePoints: Point[]
  pointFeedbacks: PointFeedback[]
  feedbackNotes: string[]
}

export type AccuracyGrade = 'A' | 'B' | 'C' | 'D'

export interface AccuracyTierInfo {
  grade: AccuracyGrade
  minScore: number
  stars: number
  japaneseLabel: string
  romajiLabel: string
  indonesianLabel: string
  badgeBg: string
  badgeBorder: string
  badgeText: string
  ringColor: string
}

export interface OverallAccuracyResult {
  score: number // 0 - 100
  grade: AccuracyGrade
  stars: number
  japaneseLabel: string
  romajiLabel: string
  indonesianLabel: string
  summaryMessage: string
  totalExpectedStrokes: number
  totalDrawnStrokes: number
  isComplete: boolean
  strokeEvaluations: StrokeEvaluation[]
  timestamp: string
}
