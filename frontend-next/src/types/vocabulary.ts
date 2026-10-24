export interface VocabularyItem {
  id: number
  word: string
  reading: string
  romaji: string
  meaning_id: string
  meaning_en: string
  category: string
  jlpt_level: string
  example_jp: string
  example_id: string
}

export type VocabularyCategoryFilter =
  | 'all'
  | 'Keselamatan Kerja (Anzen)'
  | 'Instruksi Kerja & 5S'
  | 'Etika Kerja & Hou-Ren-So'
  | 'Manufaktur & Kaigo'

export interface VocabularyApiResponse {
  status: string
  data: VocabularyItem[]
  meta?: {
    total: number
    category?: string
    search?: string
  }
}