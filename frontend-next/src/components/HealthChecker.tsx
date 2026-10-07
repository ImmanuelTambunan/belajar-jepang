'use client'

import React, { useState } from 'react'
import { HealthCheckResponse } from '@/types/character'

interface HealthCheckerProps {
  apiBaseUrl: string
}

export const HealthChecker: React.FC<HealthCheckerProps> = ({ apiBaseUrl }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [data, setData] = useState<HealthCheckResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | null>(null)

  const checkHealth = async () => {
    setStatus('loading')
    setErrorMsg(null)
    const start = performance.now()

    try {
      const res = await fetch(`${apiBaseUrl}/health`)
      const end = performance.now()
      setLatency(Math.round(end - start))

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`)
      }

      const json = await res.json()
      setData(json)
      setStatus('success')
    } catch (err: unknown) {
      setStatus('error')
      if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('Gagal menghubungi Golang API di port 8000.')
      }
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 mt-10 text-slate-800 dark:text-slate-200 shadow-sm dark:shadow-none transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🔌</span> Uji Koneksi REST API (Decoupled Bridge)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Target Endpoint: <code className="bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded font-mono">{apiBaseUrl}/health</code>
          </p>
        </div>

        <button
          onClick={checkHealth}
          disabled={status === 'loading'}
          className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-950/20"
        >
          {status === 'loading' ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              <span>Menghubungkan...</span>
            </>
          ) : (
            <>
              <span>⚡ Ping Golang Fiber API</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-4">
        {status === 'idle' && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Klik tombol di atas untuk memverifikasi komunikasi langsung antara Next.js Client dan Golang Fiber API.
          </p>
        )}

        {status === 'success' && data && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span> API Berhasil Terhubung!
              </span>
              <span className="text-xs font-mono bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                Latensi: {latency}ms
              </span>
            </div>
            <pre className="text-xs font-mono bg-slate-900 text-emerald-300 dark:bg-slate-950/80 p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-200">
            <div className="font-semibold text-sm flex items-center gap-2 text-rose-700 dark:text-rose-400 mb-1">
              <span>❌</span> Gagal Terhubung ke Backend Golang
            </div>
            <p className="text-xs text-rose-800 dark:text-rose-300">{errorMsg}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Pastikan Anda sudah menjalankan backend dengan perintah <code className="text-sky-700 dark:text-sky-300 bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">go run main.go</code> di folder <code className="text-sky-700 dark:text-sky-300 bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">backend-go</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
