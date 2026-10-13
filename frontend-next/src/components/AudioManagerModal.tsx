'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  X,
  Upload,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  FileAudio,
} from 'lucide-react'
import {
  saveCustomAudio,
  deleteCustomAudio,
  getAllCustomAudio,
  clearAllCustomAudio,
  CustomAudioRecord,
} from '@/utils/audioStorage'
import { useCharacterAudio } from '@/hooks/useCharacterAudio'
import rawHiraganaData from '@/data/hiragana_107.json'
import rawKatakanaData from '@/data/katakana_107.json'

interface RawKanaItem {
  symbol: string
  script_type: string
  category?: string
  row_group: string
  stroke_count: number
  reading: string
  strokes: string[]
}

interface ModalKanaItem {
  symbol: string
  romaji: string
  row_group: string
  category: string
  script_type: 'hiragana' | 'katakana'
}

const ALL_HIRAGANA: ModalKanaItem[] = (rawHiraganaData as RawKanaItem[]).map((item) => ({
  symbol: item.symbol,
  romaji: item.reading,
  row_group: item.row_group,
  category: item.category || 'gojuon',
  script_type: 'hiragana',
}))

const ALL_KATAKANA: ModalKanaItem[] = (rawKatakanaData as RawKanaItem[]).map((item) => ({
  symbol: item.symbol,
  romaji: item.reading,
  row_group: item.row_group,
  category: item.category || 'gojuon',
  script_type: 'katakana',
}))

const CATEGORY_TABS = [
  { id: 'all', label: 'Semua (107)' },
  { id: 'gojuon', label: 'Gojūon (46)' },
  { id: 'dakuon_handakuon', label: 'Turunan (25)' },
  { id: 'yoon', label: 'Yōon (36)' },
]

const GOJUON_ROW_GROUPS = [
  { id: 'all', label: 'Semua Baris' },
  { id: 'vowel', label: 'Vokal (A)' },
  { id: 'ka', label: 'Ka' },
  { id: 'sa', label: 'Sa' },
  { id: 'ta', label: 'Ta' },
  { id: 'na', label: 'Na' },
  { id: 'ha', label: 'Ha' },
  { id: 'ma', label: 'Ma' },
  { id: 'ya', label: 'Ya' },
  { id: 'ra', label: 'Ra' },
  { id: 'wa_n', label: 'Wa/N' },
]

const DAKUON_ROW_GROUPS = [
  { id: 'all', label: 'Semua' },
  { id: 'ga', label: 'Ga' },
  { id: 'za', label: 'Za' },
  { id: 'da', label: 'Da' },
  { id: 'ba', label: 'Ba' },
  { id: 'pa', label: 'Pa' },
]

const YOON_ROW_GROUPS = [
  { id: 'all', label: 'Semua' },
  { id: 'kya', label: 'Kya' },
  { id: 'sha', label: 'Sha' },
  { id: 'cha', label: 'Cha' },
  { id: 'nya', label: 'Nya' },
  { id: 'hya', label: 'Hya' },
  { id: 'mya', label: 'Mya' },
  { id: 'rya', label: 'Rya' },
  { id: 'gya', label: 'Gya' },
  { id: 'ja', label: 'Ja' },
  { id: 'bya', label: 'Bya' },
  { id: 'pya', label: 'Pya' },
]

interface AudioManagerModalProps {
  isOpen: boolean
  onClose: () => void
  initialSelectedRomaji?: string
}

export const AudioManagerModal: React.FC<AudioManagerModalProps> = ({
  isOpen,
  onClose,
  initialSelectedRomaji,
}) => {
  const [modalScript, setModalScript] = useState<'hiragana' | 'katakana'>('hiragana')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeRowTab, setActiveRowTab] = useState<string>('all')
  const [selectedRomaji, setSelectedRomaji] = useState<string>(
    initialSelectedRomaji || 'a'
  )
  const [customAudioMap, setCustomAudioMap] = useState<
    Record<string, CustomAudioRecord>
  >({})
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [stagedAudioUrl, setStagedAudioUrl] = useState<string | null>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Use character audio hook for playing existing sounds
  const { play: playLiveAudio, isPlaying: isLivePlaying } =
    useCharacterAudio()

  // Load custom audio database
  const refreshCustomAudioList = useCallback(async () => {
    try {
      const records = await getAllCustomAudio()
      setCustomAudioMap(records)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      refreshCustomAudioList()
      if (initialSelectedRomaji) {
        setSelectedRomaji(initialSelectedRomaji)
      }
    } else {
      // Cleanup preview audio when modal closes
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
      if (stagedAudioUrl) {
        URL.revokeObjectURL(stagedAudioUrl)
        setStagedAudioUrl(null)
      }
      setStagedFile(null)
      setIsPreviewPlaying(false)
      setStatusMessage(null)
    }
  }, [isOpen, initialSelectedRomaji, refreshCustomAudioList, stagedAudioUrl])

  const activeKanaList = useMemo(() => {
    return modalScript === 'katakana' ? ALL_KATAKANA : ALL_HIRAGANA
  }, [modalScript])

  // Get currently selected character item
  const selectedChar = useMemo(() => {
    return (
      activeKanaList.find((c) => c.romaji === selectedRomaji) || activeKanaList[0]
    )
  }, [activeKanaList, selectedRomaji])

  const existingCustomRecord = customAudioMap[selectedChar.romaji] || null

  // Reset staged file when selecting another character
  useEffect(() => {
    if (stagedAudioUrl) {
      URL.revokeObjectURL(stagedAudioUrl)
      setStagedAudioUrl(null)
    }
    setStagedFile(null)
    setIsPreviewPlaying(false)
    setStatusMessage(null)
  }, [selectedRomaji])

  // Get row tabs based on active category
  const availableRowGroups = useMemo(() => {
    if (activeCategory === 'gojuon') return GOJUON_ROW_GROUPS
    if (activeCategory === 'dakuon_handakuon') return DAKUON_ROW_GROUPS
    if (activeCategory === 'yoon') return YOON_ROW_GROUPS
    return []
  }, [activeCategory])

  // Filter characters by category & row tab
  const filteredList = useMemo(() => {
    let list: ModalKanaItem[] = activeKanaList
    if (activeCategory === 'gojuon') {
      list = list.filter((c) => c.category === 'gojuon')
    } else if (activeCategory === 'dakuon_handakuon') {
      list = list.filter((c) => c.category === 'dakuon' || c.category === 'handakuon')
    } else if (activeCategory === 'yoon') {
      list = list.filter((c) => c.category === 'yoon')
    }

    if (activeRowTab !== 'all') {
      if (activeRowTab === 'wa_n') {
        list = list.filter((c) => c.row_group === 'wa' || c.row_group === 'n')
      } else {
        list = list.filter((c) => c.row_group === activeRowTab)
      }
    }

    return list
  }, [activeKanaList, activeCategory, activeRowTab])

  // Handle file staging (either from file input or drag-and-drop)
  const handleStageFile = (file: File) => {
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/x-m4a', 'audio/aac']
    const hasValidExt = /\.(mp3|ogg|wav|m4a|aac)$/i.test(file.name)

    if (!validTypes.includes(file.type) && !hasValidExt) {
      setStatusMessage({
        type: 'error',
        text: 'Format file tidak didukung. Harap pilih file audio .mp3, .ogg, atau .wav.',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: 'error',
        text: 'Ukuran file melebihi batas 5MB.',
      })
      return
    }

    if (stagedAudioUrl) {
      URL.revokeObjectURL(stagedAudioUrl)
    }

    const objectUrl = URL.createObjectURL(file)
    setStagedFile(file)
    setStagedAudioUrl(objectUrl)
    setStatusMessage({
      type: 'info',
      text: `File "${file.name}" siap ditinjau. Klik "Simpan Suara Kustom" untuk menerapkan.`,
    })
  }

  // Drag and Drop event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleStageFile(e.dataTransfer.files[0])
    }
  }

  // Toggle preview playback of staged file
  const togglePreviewPlay = () => {
    if (!stagedAudioUrl) return

    if (isPreviewPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause()
      setIsPreviewPlaying(false)
      return
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
    }

    const audio = new Audio(stagedAudioUrl)
    previewAudioRef.current = audio
    setIsPreviewPlaying(true)

    audio.onended = () => setIsPreviewPlaying(false)
    audio.onerror = () => {
      setIsPreviewPlaying(false)
      setStatusMessage({
        type: 'error',
        text: 'Gagal memutar preview audio.',
      })
    }

    audio.play().catch(() => {
      setIsPreviewPlaying(false)
    })
  }

  // Save staged file to IndexedDB
  const handleSaveCustom = async () => {
    if (!stagedFile) return

    try {
      await saveCustomAudio(
        selectedChar.romaji,
        selectedChar.symbol,
        stagedFile,
        stagedFile.name
      )
      await refreshCustomAudioList()

      if (stagedAudioUrl) {
        URL.revokeObjectURL(stagedAudioUrl)
        setStagedAudioUrl(null)
      }
      setStagedFile(null)
      setIsPreviewPlaying(false)

      setStatusMessage({
        type: 'success',
        text: `Suara kustom untuk karakter "${selectedChar.symbol} (/${selectedChar.romaji}/)" berhasil disimpan! Berlaku untuk Hiragana & Katakana.`,
      })
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat menyimpan audio ke IndexedDB.',
      })
    }
  }

  // Delete custom audio for current character
  const handleDeleteCustom = async () => {
    try {
      await deleteCustomAudio(selectedChar.romaji)
      await refreshCustomAudioList()
      setStatusMessage({
        type: 'success',
        text: `Suara kustom "${selectedChar.symbol}" dihapus. Sistem kembali ke suara bawaan.`,
      })
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Gagal menghapus rekaman kustom.',
      })
    }
  }

  // Reset all custom audio records
  const handleResetAll = async () => {
    const count = Object.keys(customAudioMap).length
    if (count === 0) return

    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus seluruh ${count} rekaman audio kustom?`
      )
    ) {
      return
    }

    try {
      await clearAllCustomAudio()
      await refreshCustomAudioList()
      setStatusMessage({
        type: 'success',
        text: 'Seluruh audio kustom berhasil direset ke pengaturan bawaan.',
      })
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Gagal mereset audio kustom.',
      })
    }
  }

  if (!isOpen) return null

  const customCount = Object.keys(customAudioMap).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-600/30">
              🎙️
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Audio Studio &amp; Kustomisasi Suara</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold">
                  IndexedDB
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Unggah file rekaman .mp3 Anda sendiri untuk setiap huruf Hiragana &amp; Katakana.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {customCount > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900 transition flex items-center gap-1.5 cursor-pointer"
                title="Hapus semua audio kustom"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Reset Semua ({customCount})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (2-COLUMNS: SELECTOR & EDITOR) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* COLUMN 1: CHARACTER PICKER GRID */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col max-h-[75vh] overflow-y-auto">
            {/* SCRIPT SWITCHER: HIRAGANA VS KATAKANA */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-3">
              <button
                type="button"
                onClick={() => setModalScript('hiragana')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalScript === 'hiragana'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>あ</span>
                <span>Hiragana (107)</span>
              </button>
              <button
                type="button"
                onClick={() => setModalScript('katakana')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalScript === 'katakana'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>ア</span>
                <span>Katakana (107)</span>
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin mb-2">
              {CATEGORY_TABS.map((tab) => {
                const isActive = activeCategory === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(tab.id)
                      setActiveRowTab('all')
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                      isActive
                        ? modalScript === 'katakana'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Sub-row Filter Tabs if applicable */}
            {availableRowGroups.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin mb-3">
                {availableRowGroups.map((row) => {
                  const isActive = activeRowTab === row.id
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setActiveRowTab(row.id)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                          : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {row.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Character Selector Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 flex-1 overflow-y-auto pr-1">
              {filteredList.map((item) => {
                const isSelected = item.romaji === selectedRomaji
                const hasCustom = Boolean(customAudioMap[item.romaji])

                return (
                  <button
                    key={item.symbol}
                    type="button"
                    onClick={() => setSelectedRomaji(item.romaji)}
                    className={`p-2 rounded-2xl border transition text-center relative cursor-pointer select-none flex flex-col items-center justify-center ${
                      isSelected
                        ? modalScript === 'katakana'
                          ? 'bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border-purple-500 ring-2 ring-purple-400/50 shadow-sm'
                          : 'bg-gradient-to-b from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border-sky-500 ring-2 ring-sky-400/50 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {hasCustom && (
                      <span
                        className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500 ring-2 ring-white dark:ring-slate-900"
                        title="Menggunakan suara kustom"
                      />
                    )}
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {item.symbol}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                      /{item.romaji}/
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Legend & Stats */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Kustom: {customCount} total</span>
              </span>
              <span>107 Hiragana + 107 Katakana</span>
            </div>
          </div>

          {/* COLUMN 2: UPLOAD & PREVIEW STUDIO */}
          <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* CURRENT CHARACTER BANNER */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-sky-950/30 border border-purple-200 dark:border-purple-900/50 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700/60 flex items-center justify-center text-4xl font-black text-slate-900 dark:text-white shadow-sm">
                    {selectedChar.symbol}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-bold font-mono text-purple-700 dark:text-purple-300">
                        /{selectedChar.romaji}/
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300">
                        {modalScript === 'katakana' ? 'Katakana' : 'Hiragana'}
                      </span>
                      {existingCustomRecord ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500 text-white flex items-center gap-1">
                          <Sparkles size={11} />
                          Suara Kustom Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300">
                          Bawaan (Static/TTS)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Target file: <code className="font-mono text-purple-600 dark:text-purple-400">{selectedChar.romaji}.mp3</code> (berbagi audio untuk Hiragana &amp; Katakana)
                    </p>
                  </div>
                </div>

                {/* Live Play Current Active Sound */}
                <button
                  type="button"
                  onClick={() => {
                    try {
                      playLiveAudio({
                        symbol: selectedChar.symbol,
                        romaji: selectedChar.romaji,
                      }).catch((err) => {
                        console.warn('AudioManagerModal live test audio notice:', err)
                      })
                    } catch (err) {
                      console.warn('AudioManagerModal live test audio error:', err)
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-slate-750 shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95 shrink-0"
                >
                  <Volume2 size={15} />
                  <span>{isLivePlaying ? 'Memutar...' : 'Tes Suara'}</span>
                </button>
              </div>

              {/* STATUS ALERT NOTIFICATION */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold mb-4 flex items-center gap-2 animate-fade-in ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : statusMessage.type === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 size={16} className="shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* DRAG AND DROP UPLOAD ZONE */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer select-none mb-4 ${
                  isDragging
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 scale-102 ring-4 ring-purple-400/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/x-m4a,audio/aac,.mp3,.ogg,.wav,.m4a"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleStageFile(e.target.files[0])
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Upload size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Tarik &amp; Lepas File Rekaman .mp3 ke Sini
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  atau <span className="text-purple-600 dark:text-purple-400 font-bold underline">klik untuk memilih file</span> dari perangkat (Maks. 5MB)
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                  Mendukung format: MP3, OGG, WAV, M4A
                </p>
              </div>

              {/* STAGED FILE PREVIEW & SAVE BAR */}
              {stagedFile && (
                <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 mb-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0">
                        <FileAudio size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs">
                          {stagedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {(stagedFile.size / 1024).toFixed(1)} KB • Siap disimpan
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePreviewPlay}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs ${
                          isPreviewPlaying
                            ? 'bg-amber-500 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isPreviewPlaying ? <Pause size={13} /> : <Play size={13} />}
                        <span>{isPreviewPlaying ? 'Jeda' : 'Dengar Preview'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveCustom}
                        className="px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 cursor-pointer transition active:scale-95"
                      >
                        Simpan Suara Kustom
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* EXISTING CUSTOM AUDIO ACTIONS */}
              {existingCustomRecord && !stagedFile && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>{existingCustomRecord.fileName}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Ukuran: {(existingCustomRecord.fileSize / 1024).toFixed(1)} KB • Disimpan di IndexedDB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDeleteCustom}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900 transition flex items-center gap-1 cursor-pointer"
                    title="Hapus dan kembali ke suara default"
                  >
                    <Trash2 size={13} />
                    <span>Hapus Kustom</span>
                  </button>
                </div>
              )}
            </div>

            {/* MODAL FOOTER NOTE */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 mt-4 flex items-center justify-between">
              <span>💾 Disimpan secara instan di browser Anda (IndexedDB)</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
