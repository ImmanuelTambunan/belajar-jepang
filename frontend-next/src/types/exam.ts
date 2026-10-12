import { CharacterData } from './character'

export type ExamQuestionType = 'romaji_to_kana' | 'kana_to_romaji' | 'blind_tracing'

export interface ExamOption {
  id: number
  symbol: string
  romaji: string
}

export interface ExamQuestion {
  id: number
  type: ExamQuestionType
  targetCharacter: CharacterData
  options?: ExamOption[]
  correctAnswerId: number
  userAnswerId?: number
  userTracingScore?: number
  isCorrect?: boolean
  answeredAt?: string
  timeSpentSeconds: number
}

export interface ExamConfig {
  questionCount: number // 10, 20, 46
  rowGroup: string // 'all', 'vowel_ka', 'sa_ta', 'na_ha_ma', 'ya_ra_wa_n'
  enabledTypes: ExamQuestionType[]
  timerSecondsPerQuestion: number // 0 (unlimited), 15, 30
}

export interface ExamResultSummary {
  id?: number
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  score: number // 0 - 100
  durationSeconds: number
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  gradeLabel: string
  gradeJapanese: string
  wrongCharacters: CharacterData[]
  questions: ExamQuestion[]
  createdAt: string
}
