import { useState } from 'react'
import './App.css'

interface CharacterStroke {
  id: number
  stroke_order: number
  svg_path: string
}

interface CharacterReading {
  id: number
  romaji: string
  meaning: string | null
}

interface CharacterItem {
  id: number
  character: string
  type: string
  strokes_count: number
  jlpt_level: string | null
  readings: CharacterReading[]
  strokes: CharacterStroke[]
}

interface ApiHealthResponse {
  status: string
  message: string
  timestamp: string
}

function App() {
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [apiData, setApiData] = useState<ApiHealthResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | null>(null)

  // Hiragana dataset state
  const [hiraganaList, setHiraganaList] = useState<CharacterItem[]>([])
  const [loadingHiragana, setLoadingHiragana] = useState(false)
  const [selectedChar, setSelectedChar] = useState<CharacterItem | null>(null)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

  const checkApiHealth = async () => {
    setApiStatus('loading')
    setErrorMessage(null)
    const startTime = performance.now()

    try {
      const response = await fetch(`${apiBaseUrl}/health`)
      const endTime = performance.now()
      setLatency(Math.round(endTime - startTime))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setApiData(data)
      setApiStatus('success')
    } catch (err: unknown) {
      setApiStatus('error')
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Gagal menghubungi backend API')
      }
    }
  }

  const fetchHiragana = async () => {
    setLoadingHiragana(true)
    try {
      const response = await fetch(`${apiBaseUrl}/characters/hiragana`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setHiraganaList(result.data || [])
      if (result.data && result.data.length > 0) {
        setSelectedChar(result.data[0])
      }
    } catch (err: unknown) {
      alert('Gagal mengambil data Hiragana dari API: ' + (err instanceof Error ? err.message : ''))
    } finally {
      setLoadingHiragana(false)
    }
  }

  return (
    <div className="container">
      {/* HEADER */}
      <header className="header">
        <div className="badge-pill">IT DEL • Nihongo Sora v2.0</div>
        <h1 className="title">
          Nihongo <span className="highlight">Sora</span>
          <span className="kanji-subtitle">日本語の空</span>
        </h1>
        <p className="subtitle">
          Arsitektur Decoupled: Frontend React TypeScript + Backend Laravel 11 REST API di Docker
        </p>
      </header>

      {/* DOCKER SERVICE CARDS */}
      <div className="cards-grid">
        <div className="service-card frontend-card">
          <div className="card-badge">Port 5173</div>
          <div className="card-icon">⚡</div>
          <h3>Frontend SPA</h3>
          <p className="tech-stack">React 19 • Vite • TypeScript</p>
          <p className="description">
            User Interface reaktif dengan Hot Module Replacement (HMR) aktif di Docker.
          </p>
          <span className="status-indicator online">● Host: localhost:5173</span>
        </div>

        <div className="service-card backend-card">
          <div className="card-badge">Port 8000</div>
          <div className="card-icon">🚀</div>
          <h3>Backend REST API</h3>
          <p className="tech-stack">Laravel 11 • PHP 8.3 FPM • Nginx</p>
          <p className="description">
            API Gateway menyajikan endpoints JSON, autentikasi, dan dataset karakter.
          </p>
          <span className="status-indicator online">● Host: localhost:8000</span>
        </div>

        <div className="service-card db-card">
          <div className="card-badge">Port 3307</div>
          <div className="card-icon">🗄️</div>
          <h3>Database Server</h3>
          <p className="tech-stack">MySQL 8.0 • utf8mb4</p>
          <p className="description">
            Menyimpan tabel characters, readings, dan koordinat goresan SVG KanjiVG.
          </p>
          <span className="status-indicator online">● Host: localhost:3307</span>
        </div>
      </div>

      {/* LIVE DATASET HIRAGANA (FASE 2) */}
      <section className="hiragana-section">
        <div className="section-head">
          <div>
            <h2>Karakter Hiragana Vokal (Dataset MySQL API)</h2>
            <p className="text-muted">Data diambil dari endpoint: <code>/api/characters/hiragana</code></p>
          </div>
          <button
            onClick={fetchHiragana}
            disabled={loadingHiragana}
            className="btn-primary"
          >
            {loadingHiragana ? 'Memuat Data...' : 'Muat Dataset Vokal (あ い う え お)'}
          </button>
        </div>

        {hiraganaList.length > 0 && (
          <div className="hiragana-content">
            <div className="vowel-tabs">
              {hiraganaList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedChar(item)}
                  className={`tab-btn ${selectedChar?.id === item.id ? 'active' : ''}`}
                >
                  <span className="tab-char">{item.character}</span>
                  <span className="tab-romaji">{item.readings[0]?.romaji}</span>
                </button>
              ))}
            </div>

            {selectedChar && (
              <div className="char-detail-card">
                <div className="char-preview">
                  <div className="svg-container">
                    <svg viewBox="0 0 109 109" className="stroke-svg">
                      {selectedChar.strokes.map((stroke, index) => {
                        const colors = ['#0284c7', '#ec4899', '#10b981', '#f59e0b']
                        const strokeColor = colors[index % colors.length]
                        return (
                          <path
                            key={stroke.id}
                            d={stroke.svg_path}
                            stroke={strokeColor}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        )
                      })}
                    </svg>
                  </div>
                  <div className="stroke-legend">
                    {selectedChar.strokes.map((stroke, index) => {
                      const colors = ['#0284c7', '#ec4899', '#10b981', '#f59e0b']
                      const strokeColor = colors[index % colors.length]
                      return (
                        <span key={stroke.id} className="stroke-tag" style={{ borderColor: strokeColor, color: strokeColor }}>
                          Goresan ke-{stroke.stroke_order}
                        </span>
                      )
                    })}
                  </div>
                </div>

                <div className="char-info">
                  <div className="badge-row">
                    <span className="badge-type">{selectedChar.type.toUpperCase()}</span>
                    <span className="badge-jlpt">{selectedChar.jlpt_level || 'N5'}</span>
                    <span className="badge-strokes">{selectedChar.strokes_count} Goresan</span>
                  </div>
                  <h3 className="char-title">
                    {selectedChar.character}
                    <span className="char-romaji-large">/{selectedChar.readings[0]?.romaji}/</span>
                  </h3>
                  <p className="char-meaning">{selectedChar.readings[0]?.meaning}</p>

                  <div className="stroke-list">
                    <h4>Koordinat SVG Path (KanjiVG):</h4>
                    {selectedChar.strokes.map((st) => (
                      <div key={st.id} className="stroke-code-item">
                        <span className="stroke-num">#{st.stroke_order}</span>
                        <code>{st.svg_path}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* INTERACTIVE API HEALTHCHECK */}
      <section className="healthcheck-box">
        <div className="healthcheck-header">
          <div>
            <h2>Uji Koneksi REST API (Decoupled Bridge)</h2>
            <p className="healthcheck-url">Target: <code>{apiBaseUrl}/health</code></p>
          </div>
          <button
            onClick={checkApiHealth}
            disabled={apiStatus === 'loading'}
            className="btn-ping"
          >
            {apiStatus === 'loading' ? 'Menghubungkan...' : 'Ping Laravel API'}
          </button>
        </div>

        {apiStatus === 'success' && apiData && (
          <div className="alert alert-success">
            <div className="alert-title">
              ✅ API Terhubung! ({latency}ms)
            </div>
            <pre className="json-display">{JSON.stringify(apiData, null, 2)}</pre>
          </div>
        )}

        {apiStatus === 'error' && (
          <div className="alert alert-error">
            <div className="alert-title">❌ Gagal Terhubung ke Backend API</div>
            <p>{errorMessage}</p>
            <small>
              Pastikan container backend dan Nginx sudah berjalan via <code>docker compose up -d</code>.
            </small>
          </div>
        )}

        {apiStatus === 'idle' && (
          <p className="healthcheck-hint">
            Klik tombol di atas untuk memverifikasi komunikasi antara Vite React dan Laravel 11.
          </p>
        )}
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>Proyek Belajar Bahasa Jepang — Arsitektur Micro-Services Bersama Docker Compose</p>
      </footer>
    </div>
  )
}

export default App
