export interface AnalyticsOverview {
  total_characters: number
  memorized_count: number
  learning_count: number
  active_learning_count?: number
  completion_rate: number
  overall_accuracy_avg: number
  total_practice_count: number
  total_exams_taken: number
  exam_average_score: number
}

export type RowAccuracyStatus = 'proficient' | 'good' | 'needs_practice' | 'unpracticed'

export interface RowAccuracyMetric {
  row_group: string
  label: string
  sample_kana: string
  total_characters: number
  memorized_count: number
  average_accuracy: number
  total_reviews: number
  status: RowAccuracyStatus
}

export interface ExamHistoryAnalyticsItem {
  id: number
  exam_id: number
  total_questions: number
  correct_answers: number
  wrong_answers: number
  score: number
  duration_seconds: number
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  grade_label: string
  completed_at: string
}
