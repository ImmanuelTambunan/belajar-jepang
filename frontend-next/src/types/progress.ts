export interface UserProgress {
  id?: number
  character_id: number
  status: 'learning' | 'memorized'
  review_count: number
  accuracy_score?: number | null
  accuracy_grade?: string | null
  last_practiced_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProgressSummary {
  total_characters: number
  memorized_count: number
  learning_count: number
  active_learning_count?: number
  percentage: number
}

export interface PracticeSessionStats {
  totalReviewed: number
  newlyMemorized: number
  repeatedCount: number
}
