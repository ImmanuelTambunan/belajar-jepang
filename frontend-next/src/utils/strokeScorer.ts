import {
  Point,
  PointFeedback,
  StrokeEvaluation,
  OverallAccuracyResult,
  AccuracyGrade,
  AccuracyTierInfo,
} from '@/types/accuracy'

// Cache sampled reference paths to optimize recalculations
const refPointsCache = new Map<string, Point[]>()

/**
 * Normalizes KanjiVG SVG path (viewBox 0 0 109 109) into equidistant sample points
 * scaled to the active canvas coordinate space (e.g. 300x300 px).
 */
export function sampleSvgPath(
  svgPath: string,
  numPoints: number = 50,
  canvasSize: number = 300,
  viewBoxSize: number = 109
): Point[] {
  if (!svgPath || typeof window === 'undefined') {
    return []
  }

  const cacheKey = `${svgPath}_${numPoints}_${canvasSize}_${viewBoxSize}`
  if (refPointsCache.has(cacheKey)) {
    return refPointsCache.get(cacheKey)!
  }

  const scale = canvasSize / viewBoxSize

  try {
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    pathEl.setAttribute('d', svgPath)
    const totalLength = pathEl.getTotalLength()

    if (totalLength <= 0) {
      return []
    }

    const points: Point[] = []
    const step = totalLength / (numPoints - 1)

    for (let i = 0; i < numPoints; i++) {
      const len = Math.min(i * step, totalLength)
      const pt = pathEl.getPointAtLength(len)
      points.push({
        x: Math.round(pt.x * scale * 100) / 100,
        y: Math.round(pt.y * scale * 100) / 100,
      })
    }

    refPointsCache.set(cacheKey, points)
    return points
  } catch (err) {
    console.error('Gagal melakukan sampling SVG path:', err)
    return []
  }
}

/**
 * Resamples a raw user stroke trajectory into exactly `numPoints` equidistant
 * points based on cumulative arc length.
 */
export function resampleUserStroke(points: Point[], numPoints: number = 50): Point[] {
  if (!points || points.length === 0) return []
  if (points.length === 1) {
    return Array.from({ length: numPoints }, () => ({ ...points[0] }))
  }

  // Deduplicate consecutive identical points
  const cleanPoints: Point[] = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const prev = cleanPoints[cleanPoints.length - 1]
    const cur = points[i]
    const dist = Math.hypot(cur.x - prev.x, cur.y - prev.y)
    if (dist > 0.3) {
      cleanPoints.push(cur)
    }
  }

  if (cleanPoints.length === 1) {
    return Array.from({ length: numPoints }, () => ({ ...cleanPoints[0] }))
  }

  // Calculate cumulative arc lengths
  const cumLengths: number[] = [0]
  for (let i = 1; i < cleanPoints.length; i++) {
    const d = Math.hypot(
      cleanPoints[i].x - cleanPoints[i - 1].x,
      cleanPoints[i].y - cleanPoints[i - 1].y
    )
    cumLengths.push(cumLengths[i - 1] + d)
  }

  const totalLength = cumLengths[cumLengths.length - 1]
  if (totalLength < 1) {
    return Array.from({ length: numPoints }, () => ({ ...cleanPoints[0] }))
  }

  const resampled: Point[] = []
  const step = totalLength / (numPoints - 1)
  let segIndex = 0

  for (let i = 0; i < numPoints; i++) {
    const targetDist = i * step

    while (
      segIndex < cumLengths.length - 2 &&
      cumLengths[segIndex + 1] < targetDist
    ) {
      segIndex++
    }

    const segStartDist = cumLengths[segIndex]
    const segEndDist = cumLengths[segIndex + 1]
    const segLen = segEndDist - segStartDist

    const t = segLen > 0 ? (targetDist - segStartDist) / segLen : 0
    const clampedT = Math.max(0, Math.min(1, t))

    const pA = cleanPoints[segIndex]
    const pB = cleanPoints[segIndex + 1]

    resampled.push({
      x: Math.round((pA.x + (pB.x - pA.x) * clampedT) * 100) / 100,
      y: Math.round((pA.y + (pB.y - pA.y) * clampedT) * 100) / 100,
    })
  }

  return resampled
}

/**
 * Calculates Euclidean distance from point P to line segment AB,
 * returning both the minimum distance and projected point on the segment.
 */
function distToSegment(
  p: Point,
  a: Point,
  b: Point
): { distance: number; projected: Point } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const l2 = dx * dx + dy * dy

  if (l2 === 0) {
    return {
      distance: Math.hypot(p.x - a.x, p.y - a.y),
      projected: { x: a.x, y: a.y },
    }
  }

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2
  t = Math.max(0, Math.min(1, t))

  const projX = a.x + t * dx
  const projY = a.y + t * dy

  return {
    distance: Math.hypot(p.x - projX, p.y - projY),
    projected: { x: projX, y: projY },
  }
}

/**
 * Computes Discrete Fréchet Distance between two polygonal curves P and Q.
 * Uses dynamic programming with O(N*M) complexity.
 */
export function computeDiscreteFrechet(P: Point[], Q: Point[]): number {
  const n = P.length
  const m = Q.length
  if (n === 0 || m === 0) return 999

  const ca: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: m }, () => -1)
  )

  function c(i: number, j: number): number {
    if (ca[i][j] > -1) return ca[i][j]

    const d = Math.hypot(P[i].x - Q[j].x, P[i].y - Q[j].y)

    if (i === 0 && j === 0) {
      ca[i][j] = d
    } else if (i > 0 && j === 0) {
      ca[i][j] = Math.max(c(i - 1, 0), d)
    } else if (i === 0 && j > 0) {
      ca[i][j] = Math.max(c(0, j - 1), d)
    } else if (i > 0 && j > 0) {
      ca[i][j] = Math.max(
        Math.min(c(i - 1, j), c(i - 1, j - 1), c(i, j - 1)),
        d
      )
    }

    return ca[i][j]
  }

  return Math.round(c(n - 1, m - 1) * 100) / 100
}

/**
 * Calculates total arc length of a point polyline.
 */
export function calculatePolylineLength(points: Point[]): number {
  if (points.length < 2) return 0
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }
  return total
}

/**
 * Evaluates a single user stroke against the official reference SVG stroke.
 */
export function evaluateSingleStroke(
  userStroke: Point[],
  refSvgPath: string,
  strokeIndex: number,
  canvasSize: number = 300
): StrokeEvaluation {
  const strokeOrder = strokeIndex + 1
  const feedbackNotes: string[] = []

  const refPoints = sampleSvgPath(refSvgPath, 50, canvasSize, 109)
  const resampledUser = resampleUserStroke(userStroke, 50)

  if (refPoints.length < 2 || resampledUser.length < 2) {
    return {
      strokeIndex,
      strokeOrder,
      score: 0,
      averageDistance: 999,
      frechetDistance: 999,
      isDirectionInverted: false,
      directionalPenalty: 50,
      coveragePenalty: 50,
      lengthRatio: 0,
      userLength: 0,
      refLength: 0,
      userPoints: userStroke,
      resampledUserPoints: resampledUser,
      referencePoints: refPoints,
      pointFeedbacks: [],
      feedbackNotes: ['Coretan terlalu pendek atau tidak terdeteksi.'],
    }
  }

  const userLen = calculatePolylineLength(resampledUser)
  const refLen = calculatePolylineLength(refPoints)
  const lengthRatio = refLen > 0 ? userLen / refLen : 1

  // 1. DIRECTIONAL ANALYSIS (Arah Goresan)
  const uStart = resampledUser[0]
  const uEnd = resampledUser[resampledUser.length - 1]
  const rStart = refPoints[0]
  const rEnd = refPoints[refPoints.length - 1]

  const uVec = { x: uEnd.x - uStart.x, y: uEnd.y - uStart.y }
  const rVec = { x: rEnd.x - rStart.x, y: rEnd.y - rStart.y }

  const uMag = Math.hypot(uVec.x, uVec.y)
  const rMag = Math.hypot(rVec.x, rVec.y)

  const dot = uVec.x * rVec.x + uVec.y * rVec.y
  const cosAngle = uMag > 0 && rMag > 0 ? dot / (uMag * rMag) : 1

  // Point sequence forward alignment vs reverse alignment
  let forwardDistSum = 0
  let reverseDistSum = 0
  const n = resampledUser.length

  for (let i = 0; i < n; i++) {
    forwardDistSum += Math.hypot(
      resampledUser[i].x - refPoints[i].x,
      resampledUser[i].y - refPoints[i].y
    )
    reverseDistSum += Math.hypot(
      resampledUser[n - 1 - i].x - refPoints[i].x,
      resampledUser[n - 1 - i].y - refPoints[i].y
    )
  }

  const avgForwardDist = forwardDistSum / n
  const avgReverseDist = reverseDistSum / n

  // Determine if user drew in reverse direction (start to end inverted)
  const isDirectionInverted =
    (avgReverseDist < avgForwardDist * 0.75 && uMag > 20 && rMag > 20) ||
    (cosAngle < -0.3 && uMag > 25 && rMag > 25)

  let directionalPenalty = 0
  if (isDirectionInverted) {
    directionalPenalty = 35
    feedbackNotes.push('Arah goresan terbalik (harus ditarik searah urutan resmi KanjiVG).')
  } else if (cosAngle < 0.2 && uMag > 30 && rMag > 30) {
    directionalPenalty = 15
    feedbackNotes.push('Arah goresan kurang lurus / miring dari garis acuan.')
  }

  // 2. MODIFIED CHAMFER / AVERAGE EUCLIDEAN DEVIATION
  // For each user point, find closest point along the reference polyline
  const pointFeedbacks: PointFeedback[] = []
  let totalMinDist = 0

  for (let i = 0; i < resampledUser.length; i++) {
    const pt = resampledUser[i]
    let minDist = Infinity
    let bestProj: Point = refPoints[0]

    for (let j = 0; j < refPoints.length - 1; j++) {
      const res = distToSegment(pt, refPoints[j], refPoints[j + 1])
      if (res.distance < minDist) {
        minDist = res.distance
        bestProj = res.projected
      }
    }

    totalMinDist += minDist

    // Classification threshold (canvas 300x300, brush size 6px)
    let status: 'accurate' | 'warning' | 'error' = 'accurate'
    if (isDirectionInverted) {
      status = 'error'
    } else if (minDist <= 13) {
      status = 'accurate' // within tolerance
    } else if (minDist <= 26) {
      status = 'warning' // slightly deviated
    } else {
      status = 'error' // significantly off
    }

    pointFeedbacks.push({
      point: pt,
      nearestRefPoint: bestProj,
      distance: Math.round(minDist * 10) / 10,
      status,
    })
  }

  const averageChamferDist = totalMinDist / resampledUser.length
  // Blend chamfer deviation with ordered forward distance
  const effectiveDistance = isDirectionInverted
    ? Math.max(averageChamferDist, avgReverseDist)
    : averageChamferDist * 0.75 + avgForwardDist * 0.25

  // 3. COVERAGE / LENGTH PENALTY
  let coveragePenalty = 0
  if (lengthRatio < 0.6) {
    coveragePenalty = Math.min(30, Math.round((0.6 - lengthRatio) * 55))
    feedbackNotes.push('Goresan terlalu pendek (belum mencakup seluruh panjang garis).')
  } else if (lengthRatio > 1.6) {
    coveragePenalty = Math.min(20, Math.round((lengthRatio - 1.6) * 30))
    feedbackNotes.push('Goresan terlalu panjang / berlebih keluar dari batas.')
  }

  // 4. BOUNDING BOX SPREAD PENALTY
  let refMinX = Infinity,
    refMaxX = -Infinity,
    refMinY = Infinity,
    refMaxY = -Infinity
  for (const p of refPoints) {
    if (p.x < refMinX) refMinX = p.x
    if (p.x > refMaxX) refMaxX = p.x
    if (p.y < refMinY) refMinY = p.y
    if (p.y > refMaxY) refMaxY = p.y
  }

  const bboxPadding = 30
  let outOfBoundsCount = 0
  for (const p of resampledUser) {
    if (
      p.x < refMinX - bboxPadding ||
      p.x > refMaxX + bboxPadding ||
      p.y < refMinY - bboxPadding ||
      p.y > refMaxY + bboxPadding
    ) {
      outOfBoundsCount++
    }
  }

  if (outOfBoundsCount > 5) {
    coveragePenalty += Math.min(15, outOfBoundsCount * 2)
    feedbackNotes.push('Sebagian goresan melenceng jauh keluar kotak area.')
  }

  // 5. DISCRETE FRÉCHET BOTTLENECK
  const frechetDist = computeDiscreteFrechet(resampledUser, refPoints)

  // 6. SCORE CALCULATION (0 - 100)
  // Distance scoring curve:
  // 0 - 6px: 100 - 98
  // 6 - 15px: 98 - 85
  // 15 - 28px: 85 - 65
  // 28 - 45px: 65 - 35
  // > 45px: decaying to 0
  let baseScore = 0
  if (effectiveDistance <= 6) {
    baseScore = 100 - effectiveDistance * 0.4
  } else if (effectiveDistance <= 15) {
    baseScore = 97.6 - (effectiveDistance - 6) * 1.4
  } else if (effectiveDistance <= 28) {
    baseScore = 85 - (effectiveDistance - 15) * 1.6
  } else if (effectiveDistance <= 45) {
    baseScore = 64.2 - (effectiveDistance - 28) * 1.7
  } else {
    baseScore = Math.max(5, 35 - (effectiveDistance - 45) * 0.8)
  }

  // Apply penalties
  const rawScore = baseScore - directionalPenalty - coveragePenalty
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)))

  if (feedbackNotes.length === 0) {
    if (finalScore >= 85) {
      feedbackNotes.push('Bentuk dan lekukan sangat presisi.')
    } else {
      feedbackNotes.push('Posisi coretan sudah baik, tingkatkan kestabilan tangan.')
    }
  }

  return {
    strokeIndex,
    strokeOrder,
    score: finalScore,
    averageDistance: Math.round(averageChamferDist * 10) / 10,
    frechetDistance: frechetDist,
    isDirectionInverted,
    directionalPenalty,
    coveragePenalty,
    lengthRatio: Math.round(lengthRatio * 100) / 100,
    userLength: Math.round(userLen),
    refLength: Math.round(refLen),
    userPoints: userStroke,
    resampledUserPoints: resampledUser,
    referencePoints: refPoints,
    pointFeedbacks,
    feedbackNotes,
  }
}

/**
 * Information mapping for the 4 standard accuracy rating tiers.
 */
export const ACCURACY_TIERS: Record<AccuracyGrade, AccuracyTierInfo> = {
  A: {
    grade: 'A',
    minScore: 85,
    stars: 3,
    japaneseLabel: '大変よくできました',
    romajiLabel: 'Taihen yoku dekimashita',
    indonesianLabel: 'Sempurna',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80',
    badgeBorder: 'border-emerald-300 dark:border-emerald-700',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    ringColor: '#10b981',
  },
  B: {
    grade: 'B',
    minScore: 70,
    stars: 2,
    japaneseLabel: 'よくできました',
    romajiLabel: 'Yoku dekimashita',
    indonesianLabel: 'Bagus',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/80',
    badgeBorder: 'border-sky-300 dark:border-sky-700',
    badgeText: 'text-sky-700 dark:text-sky-300',
    ringColor: '#0ea5e9',
  },
  C: {
    grade: 'C',
    minScore: 50,
    stars: 1,
    japaneseLabel: 'もうすこし',
    romajiLabel: 'Mou sukoshi',
    indonesianLabel: 'Cukup',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/80',
    badgeBorder: 'border-amber-300 dark:border-amber-700',
    badgeText: 'text-amber-700 dark:text-amber-300',
    ringColor: '#f59e0b',
  },
  D: {
    grade: 'D',
    minScore: 0,
    stars: 0,
    japaneseLabel: 'もういちど',
    romajiLabel: 'Mou ichido',
    indonesianLabel: 'Perlu Diulang',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/80',
    badgeBorder: 'border-rose-300 dark:border-rose-700',
    badgeText: 'text-rose-700 dark:text-rose-300',
    ringColor: '#f43f5e',
  },
}

/**
 * Evaluates all strokes drawn by the user against the character's reference stroke sequence.
 */
export function evaluateAllStrokes(
  userStrokes: Point[][],
  refSvgPaths: string[],
  canvasSize: number = 300
): OverallAccuracyResult {
  const totalExpected = refSvgPaths.length
  const totalDrawn = userStrokes.length
  const isComplete = totalDrawn >= totalExpected && totalExpected > 0

  if (totalDrawn === 0 || totalExpected === 0) {
    const tier = ACCURACY_TIERS.D
    return {
      score: 0,
      grade: 'D',
      stars: 0,
      japaneseLabel: tier.japaneseLabel,
      romajiLabel: tier.romajiLabel,
      indonesianLabel: tier.indonesianLabel,
      summaryMessage: 'Belum ada goresan yang digambar di kanvas.',
      totalExpectedStrokes: totalExpected,
      totalDrawnStrokes: 0,
      isComplete: false,
      strokeEvaluations: [],
      timestamp: new Date().toISOString(),
    }
  }

  const strokeEvaluations: StrokeEvaluation[] = []
  let totalScoreSum = 0

  // Evaluate strokes in sequential order
  const countToEvaluate = Math.min(totalDrawn, totalExpected)
  for (let i = 0; i < countToEvaluate; i++) {
    const evalResult = evaluateSingleStroke(
      userStrokes[i],
      refSvgPaths[i],
      i,
      canvasSize
    )
    strokeEvaluations.push(evalResult)
    totalScoreSum += evalResult.score
  }

  // Calculate average of evaluated strokes
  let finalScore = Math.round(totalScoreSum / totalExpected)

  // Incomplete stroke penalty: if user only drew 1 of 3 strokes
  if (totalDrawn < totalExpected) {
    const completenessRatio = totalDrawn / totalExpected
    finalScore = Math.round(finalScore * completenessRatio)
  }

  // Extra stray strokes penalty: if user drew extra scribbles beyond expected
  if (totalDrawn > totalExpected) {
    const extraStrokes = totalDrawn - totalExpected
    finalScore = Math.max(0, finalScore - extraStrokes * 12)
  }

  // Determine grade and tier
  let grade: AccuracyGrade = 'D'
  if (finalScore >= 85) {
    grade = 'A'
  } else if (finalScore >= 70) {
    grade = 'B'
  } else if (finalScore >= 50) {
    grade = 'C'
  } else {
    grade = 'D'
  }

  const tier = ACCURACY_TIERS[grade]

  let summaryMessage = ''
  if (!isComplete) {
    summaryMessage = `Baru ${totalDrawn} dari ${totalExpected} goresan yang dibuat. Selesaikan semua goresan untuk penilaian penuh!`
  } else if (grade === 'A') {
    summaryMessage = 'Luar biasa! Goresan Anda sangat presisi sesuai aturan kaligrafi KanjiVG.'
  } else if (grade === 'B') {
    summaryMessage = 'Bagus sekali! Proporsi goresan sudah rapi dan terbaca jelas.'
  } else if (grade === 'C') {
    summaryMessage = 'Cukup bagus, perhatikan arah tarikan garis dan lengkungan sudut.'
  } else {
    summaryMessage = 'Perlu latihan lagi. Gunakan mode animasi untuk mengingat arah goresan.'
  }

  return {
    score: finalScore,
    grade,
    stars: tier.stars,
    japaneseLabel: tier.japaneseLabel,
    romajiLabel: tier.romajiLabel,
    indonesianLabel: tier.indonesianLabel,
    summaryMessage,
    totalExpectedStrokes: totalExpected,
    totalDrawnStrokes: totalDrawn,
    isComplete,
    strokeEvaluations,
    timestamp: new Date().toISOString(),
  }
}
