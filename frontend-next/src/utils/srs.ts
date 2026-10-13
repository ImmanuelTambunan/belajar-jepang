import { CharacterData } from '@/types/character'
import { UserProgress } from '@/types/progress'
import { ExamResultSummary } from '@/types/exam'

export const LOCAL_STORAGE_EXAM_HISTORY = 'nihongo_sora_exam_history'
export const LOCAL_STORAGE_PROGRESS_KEY = 'nihongo_sora_character_progress'

export interface CharacterReviewStatus {
  needsReview: boolean
  hasLowAccuracy: boolean
  isWrongInExam: boolean
  accuracyScore?: number
  label?: string
}

/**
 * Safely retrieve the most recent exam summary from localStorage
 */
export function getLatestExamFromStorage(): ExamResultSummary | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EXAM_HISTORY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0] as ExamResultSummary
      }
    }
  } catch (err) {
    console.warn('Failed to parse exam history for SRS:', err)
  }
  return null
}

/**
 * Check if a specific character needs review based on SRS logic:
 * 1. Akurasi tracing terakhir < 70%
 * 2. ATAU pernah salah di sesi ujian terakhir
 */
export function evaluateCharacterReviewStatus(
  char: CharacterData,
  progressMap: Record<number, UserProgress>,
  latestExam: ExamResultSummary | null
): CharacterReviewStatus {
  const p = progressMap[char.id]
  const hasAccuracyRecord = p?.accuracy_score !== undefined && p?.accuracy_score !== null
  const hasLowAccuracy = Boolean(hasAccuracyRecord && (p?.accuracy_score ?? 0) < 70)

  let isWrongInExam = false
  if (latestExam) {
    const wrongChars = latestExam.wrongCharacters || []
    isWrongInExam = wrongChars.some(
      (w) =>
        w.id === char.id ||
        (w.symbol && (w.symbol === char.symbol || w.symbol === char.character)) ||
        (w.character && (w.character === char.character || w.character === char.symbol))
    )
  }

  const needsReview = hasLowAccuracy || isWrongInExam

  let label: string | undefined
  if (hasLowAccuracy && isWrongInExam) {
    label = `Akurasi Rendah (${p?.accuracy_score}%) & Salah di Ujian`
  } else if (hasLowAccuracy) {
    label = `Akurasi Rendah (${p?.accuracy_score}%)`
  } else if (isWrongInExam) {
    label = `Salah di Ujian Terakhir`
  }

  return {
    needsReview,
    hasLowAccuracy,
    isWrongInExam,
    accuracyScore: p?.accuracy_score ?? undefined,
    label,
  }
}

/**
 * Filter character list to only those requiring review
 */
export function getCharactersNeedingReview(
  allCharacters: CharacterData[],
  progressMap: Record<number, UserProgress>,
  latestExam: ExamResultSummary | null
): CharacterData[] {
  return allCharacters.filter((c) => {
    const status = evaluateCharacterReviewStatus(c, progressMap, latestExam)
    return status.needsReview
  })
}
