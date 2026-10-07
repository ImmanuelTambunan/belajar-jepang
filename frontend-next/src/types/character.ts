export interface StrokeItem {
  id: number
  character_id?: number
  stroke_order: number
  svg_path: string
}

export interface CharacterReading {
  id: number
  character_id?: number
  romaji: string
  onyomi?: string | null
  kunyomi?: string | null
  meaning?: string | null
}

export interface CharacterData {
  id: number
  character: string
  type: string
  strokes_count: number
  jlpt_level?: string | null
  readings: CharacterReading[]
  strokes: StrokeItem[]
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
