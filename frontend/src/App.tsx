import { useState } from 'react'
import './App.css'

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
            API Gateway menyajikan endpoints JSON, autentikasi, dan logika bisnis.
          </p>
          <span className="status-indicator online">● Host: localhost:8000</span>
        </div>

        <div className="service-card db-card">
          <div className="card-badge">Port 3307</div>
          <div className="card-icon">🗄️</div>
          <h3>Database Server</h3>
          <p className="tech-stack">MySQL 8.0 • utf8mb4</p>
          <p className="description">
            Persistent volume data, siap untuk migrasi tabel kana, kosakata, dan pengguna.
          </p>
          <span className="status-indicator online">● Host: localhost:3307</span>
        </div>
      </div>

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

      {/* FEATURE ROADMAP */}
      <section className="modules-section">
        <h2>Modul Belajar yang Siap Dikembangkan</h2>
        <div className="modules-grid">
          <div className="module-item">
            <span className="module-icon">🈁</span>
            <div>
              <h4>Kana Master</h4>
              <p>Latihan interaktif Hiragana & Katakana dengan sistem pengenalan kartu & kuis cepat.</p>
            </div>
          </div>
          <div className="module-item">
            <span className="module-icon">📖</span>
            <div>
              <h4>Jurnal Kosa Kata</h4>
              <p>Manajemen perbendaharaan kata: Kanji, Romaji, Arti Bahasa Indonesia, dan Level JLPT.</p>
            </div>
          </div>
          <div className="module-item">
            <span className="module-icon">📊</span>
            <div>
              <h4>Evaluasi & Statistik</h4>
              <p>Pelacakan kemajuan harian, streak belajar, dan visualisasi retensi hafalan kosa kata.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>Proyek Belajar Bahasa Jepang — Arsitektur Micro-Services Bersama Docker Compose</p>
      </footer>
    </div>
  )
}

export default App
