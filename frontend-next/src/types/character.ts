export interface StrokeItem {
  id?: number
  character_id?: number
  stroke_order: number
  stroke_number?: number
  svg_path: string
  path_data?: string
}

export type StrokeData = StrokeItem

export interface CharacterReading {
  id?: number
  character_id?: number
  romaji: string
  onyomi?: string | null
  kunyomi?: string | null
  meaning?: string | null
}

export type ScriptType = 'hiragana' | 'katakana' | 'kanji'

export interface KanjiExample {
  word: string
  reading: string
  meaning_id: string
  meaning_en: string
}

export interface KanjiData {
  id: number
  character: string
  jlpt_level: string
  stroke_count: number
  onyomi: string
  kunyomi: string
  meaning_id: string
  meaning_en: string
  category: string
  svg_strokes: string
  strokes: string[]
  examples?: KanjiExample[]
}

export interface CharacterData {
  id: number
  character: string
  symbol?: string
  type: string
  script_type?: ScriptType | string
  category?: 'gojuon' | 'dakuon' | 'handakuon' | 'yoon' | 'numbers' | 'calendar_time' | string
  row_group?: string
  strokes_count: number
  stroke_count?: number
  jlpt_level?: string | null
  readings: CharacterReading[]
  strokes: StrokeItem[]
  onyomi?: string
  kunyomi?: string
  meaning_id?: string
  meaning_en?: string
  examples?: KanjiExample[]
}

export interface ApiResponse<T> {
  status: string
  type?: string
  count?: number
  data: T
  message?: string
}

export interface HealthCheckResponse {
  status: string
  message: string
  database?: string
  timestamp: string
}
