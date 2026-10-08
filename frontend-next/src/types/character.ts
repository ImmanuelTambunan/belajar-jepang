export interface StrokeItem {
  id?: number
  character_id?: number
  stroke_order: number
  stroke_number?: number
  svg_path: string
  path_data?: string
}

export interface CharacterReading {
  id?: number
  character_id?: number
  romaji: string
  onyomi?: string | null
  kunyomi?: string | null
  meaning?: string | null
}

export interface CharacterData {
  id: number
  character: string
  symbol?: string
  type: string
  script_type?: string
  row_group?: string
  strokes_count: number
  stroke_count?: number
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
