'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Volume2,
  Sliders,
  Upload,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Settings as SettingsIcon,
  Cpu,
  RefreshCw,
  Save,
  Check,
  Headphones,
  Languages,
  Sparkles,
  RotateCcw,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useScript } from '@/context/ScriptContext'
import { useGamification } from '@/context/GamificationContext'
import { ResetConfirmModal } from '@/components/ResetConfirmModal'
import { performFullReset } from '@/utils/reset'
import {
  saveCustomAudio,
  deleteCustomAudio,
  getAllCustomAudio,
  clearAllCustomAudio,
  CustomAudioRecord,
} from '@/utils/audioStorage'
import {
  getAudioPreferences,
  saveAudioPreferences,
  getAllJapaneseVoices,
  playCharacterAudio,
} from '@/utils/audio'
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

const ALL_HIRAGANA = (rawHiraganaData as RawKanaItem[]).map((item) => ({
  symbol: item.symbol,
  romaji: item.reading,
  category: item.category || 'gojuon',
  row_group: item.row_group,
  script_type: 'hiragana' as const,
}))

const ALL_KATAKANA = (rawKatakanaData as RawKanaItem[]).map((item) => ({
  symbol: item.symbol,
  romaji: item.reading,
  category: item.category || 'gojuon',
  row_group: item.row_group,
  script_type: 'katakana' as const,
}))

const SETTINGS_CATEGORY_TABS = [
  { id: 'all', label: 'Semua (107)' },
  { id: 'gojuon', label: 'Gojūon (46)' },
  { id: 'dakuon_handakuon', label: 'Turunan (25)' },
  { id: 'yoon', label: 'Yōon (36)' },
] as const

function getSettingsRowFilters(scriptMode: 'hiragana' | 'katakana'): Record<string, { id: string; label: string }[]> {
  const isK = scriptMode === 'katakana'
  return {
    all: [
      { id: 'all', label: 'Semua Baris (107)' },
      { id: 'vowel', label: isK ? 'A (Vokal - ア)' : 'A (Vokal - あ)' },
      { id: 'ka', label: isK ? 'Ka (カ)' : 'Ka (か)' },
      { id: 'sa', label: isK ? 'Sa (サ)' : 'Sa (sa)' },
      { id: 'ta', label: isK ? 'Ta (タ)' : 'Ta (た)' },
      { id: 'na', label: isK ? 'Na (ナ)' : 'Na (な)' },
      { id: 'ha', label: isK ? 'Ha (ハ)' : 'Ha (は)' },
      { id: 'ma', label: isK ? 'Ma (マ)' : 'Ma (ま)' },
      { id: 'ya', label: isK ? 'Ya (ヤ)' : 'Ya (や)' },
      { id: 'ra', label: isK ? 'Ra (ラ)' : 'Ra (ら)' },
      { id: 'wa_n', label: isK ? 'Wa/N (ワ/ン)' : 'Wa/N (わ/ん)' },
      { id: 'ga', label: isK ? 'Ga (ガ)' : 'Ga (が)' },
      { id: 'za', label: isK ? 'Za (ザ)' : 'Za (ざ)' },
      { id: 'da', label: isK ? 'Da (ダ)' : 'Da (だ)' },
      { id: 'ba', label: isK ? 'Ba (バ)' : 'Ba (ば)' },
      { id: 'pa', label: isK ? 'Pa (パ)' : 'Pa (ぱ)' },
      { id: 'kya', label: isK ? 'Kya (キャ)' : 'Kya (きゃ)' },
      { id: 'sha', label: isK ? 'Sha (シャ)' : 'Sha (しゃ)' },
      { id: 'cha', label: isK ? 'Cha (チャ)' : 'Cha (ちゃ)' },
      { id: 'nya', label: isK ? 'Nya (ニャ)' : 'Nya (にゃ)' },
      { id: 'hya', label: isK ? 'Hya (ヒャ)' : 'Hya (ひゃ)' },
      { id: 'mya', label: isK ? 'Mya (ミャ)' : 'Mya (みゃ)' },
      { id: 'rya', label: isK ? 'Rya (リャ)' : 'Rya (りゃ)' },
      { id: 'gya', label: isK ? 'Gya (ギャ)' : 'Gya (ぎゃ)' },
      { id: 'ja', label: isK ? 'Ja (ジャ)' : 'Ja (じゃ)' },
      { id: 'dya', label: isK ? 'Dya (ヂャ)' : 'Dya (ぢゃ)' },
      { id: 'bya', label: isK ? 'Bya (ビャ)' : 'Bya (びゃ)' },
      { id: 'pya', label: isK ? 'Pya (ピャ)' : 'Pya (ぴゃ)' },
    ],
    gojuon: [
      { id: 'all', label: 'Semua Gojūon (46)' },
      { id: 'vowel', label: isK ? 'A (Vokal - ア)' : 'A (Vokal - あ)' },
      { id: 'ka', label: isK ? 'Ka (カ)' : 'Ka (か)' },
      { id: 'sa', label: isK ? 'Sa (サ)' : 'Sa (sa)' },
      { id: 'ta', label: isK ? 'Ta (タ)' : 'Ta (た)' },
      { id: 'na', label: isK ? 'Na (ナ)' : 'Na (な)' },
      { id: 'ha', label: isK ? 'Ha (ハ)' : 'Ha (は)' },
      { id: 'ma', label: isK ? 'Ma (マ)' : 'Ma (ま)' },
      { id: 'ya', label: isK ? 'Ya (ヤ)' : 'Ya (や)' },
      { id: 'ra', label: isK ? 'Ra (ラ)' : 'Ra (ら)' },
      { id: 'wa_n', label: isK ? 'Wa / N (ワ/ン)' : 'Wa / N (わ/ん)' },
    ],
    dakuon_handakuon: [
      { id: 'all', label: 'Semua Turunan (25)' },
      { id: 'ga', label: isK ? 'Ga (ガ)' : 'Ga (が)' },
      { id: 'za', label: isK ? 'Za (ザ)' : 'Za (ざ)' },
      { id: 'da', label: isK ? 'Da (ダ)' : 'Da (だ)' },
      { id: 'ba', label: isK ? 'Ba (バ)' : 'Ba (ば)' },
      { id: 'pa', label: isK ? 'Pa (パ)' : 'Pa (ぱ)' },
    ],
    yoon: [
      { id: 'all', label: 'Semua Yōon (36)' },
      { id: 'kya', label: isK ? 'Kya (キャ)' : 'Kya (きゃ)' },
      { id: 'sha', label: isK ? 'Sha (シャ)' : 'Sha (しゃ)' },
      { id: 'cha', label: isK ? 'Cha (チャ)' : 'Cha (ちゃ)' },
      { id: 'nya', label: isK ? 'Nya (ニャ)' : 'Nya (にゃ)' },
      { id: 'hya', label: isK ? 'Hya (ヒャ)' : 'Hya (ひゃ)' },
      { id: 'mya', label: isK ? 'Mya (ミャ)' : 'Mya (みゃ)' },
      { id: 'rya', label: isK ? 'Rya (リャ)' : 'Rya (りゃ)' },
      { id: 'gya', label: isK ? 'Gya (ギャ)' : 'Gya (ぎゃ)' },
      { id: 'ja', label: isK ? 'Ja (ジャ)' : 'Ja (じゃ)' },
      { id: 'dya', label: isK ? 'Dya (ヂャ)' : 'Dya (ぢゃ)' },
      { id: 'bya', label: isK ? 'Bya (ビャ)' : 'Bya (びゃ)' },
      { id: 'pya', label: isK ? 'Pya (ピャ)' : 'Pya (ぴゃ)' },
    ],
  }
}

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage()
  const { script, setScript } = useScript()
  const { resetGamification } = useGamification()
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [activeTab, setActiveTab] = useState<'language' | 'appearance' | 'audio' | 'voice' | 'practice' | 'system'>('language')
  const [sakuraEnabled, setSakuraEnabled] = useState<boolean>(true)

  // Audio Manager State
  const [audioManagerScript, setAudioManagerScript] = useState<'hiragana' | 'katakana'>('hiragana')
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'gojuon' | 'dakuon_handakuon' | 'yoon'
  >('all')
  const [selectedRomaji, setSelectedRomaji] = useState<string>('a')
  const [selectedSymbol, setSelectedSymbol] = useState<string>('あ')
  const [selectedRowGroup, setSelectedRowGroup] = useState<string>('all')
  const [customAudioMap, setCustomAudioMap] = useState<Record<string, CustomAudioRecord>>({})
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [stagedAudioUrl, setStagedAudioUrl] = useState<string | null>(null)
  const [audioStatusMsg, setAudioStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  // Voice Preferences State
  const [speechRate, setSpeechRate] = useState<number>(0.85)
  const [speechPitch, setSpeechPitch] = useState<number>(1.0)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('')
  const [voiceSavedMsg, setVoiceSavedMsg] = useState(false)

  // Practice Preferences State
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true)
  const [confirmResetProgress, setConfirmResetProgress] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [resetSuccessText, setResetSuccessText] = useState('')
  const [resetDoneMsg, setResetDoneMsg] = useState(false)

  // Backend System State
  const [backendPingStatus, setBackendPingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [backendLatency, setBackendLatency] = useState<number | null>(null)
  const [backendResponse, setBackendResponse] = useState<Record<string, unknown> | null>(null)

  // Load Custom Audio Records
  const refreshCustomAudio = useCallback(async () => {
    try {
      const records = await getAllCustomAudio()
      setCustomAudioMap(records)
    } catch {
      // ignore
    }
  }, [])

  // Load Preferences on mount
  useEffect(() => {
    refreshCustomAudio()

    const prefs = getAudioPreferences()
    setSpeechRate(prefs.rate)
    setSpeechPitch(prefs.pitch)
    if (prefs.selectedVoiceURI) {
      setSelectedVoiceURI(prefs.selectedVoiceURI)
    }

    // Load available Japanese voices
    const loadVoices = () => {
      const voices = getAllJapaneseVoices()
      setAvailableVoices(voices)
      if (voices.length > 0 && !prefs.selectedVoiceURI) {
        setSelectedVoiceURI(voices[0].voiceURI)
      }
    }
    loadVoices()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    // Load Practice autoplay preference
    try {
      const storedSakura = localStorage.getItem('nihongo_sora_sakura_rain')
      if (storedSakura !== null) {
        setSakuraEnabled(storedSakura === 'true')
      }
    } catch {}

    const handleSyncSakura = () => {
      try {
        const updated = localStorage.getItem('nihongo_sora_sakura_rain')
        if (updated !== null) {
          setSakuraEnabled(updated === 'true')
        }
      } catch {}
    }
    window.addEventListener('nihongo_sora_sakura_toggled', handleSyncSakura)

    try {
      const storedAutoplay = localStorage.getItem('nihongo_sora_practice_autoplay')
      if (storedAutoplay !== null) {
        setAutoPlayAudio(storedAutoplay === 'true')
      }
    } catch {
      // ignore
    }
  }, [refreshCustomAudio])

  const activeKanaList = audioManagerScript === 'katakana' ? ALL_KATAKANA : ALL_HIRAGANA
  const rowFilters = getSettingsRowFilters(audioManagerScript)

  const handleSwitchAudioScript = (newScript: 'hiragana' | 'katakana') => {
    setAudioManagerScript(newScript)
    const targetList = newScript === 'katakana' ? ALL_KATAKANA : ALL_HIRAGANA
    const match = targetList.find((k) => k.romaji === selectedRomaji) || targetList[0]
    setSelectedSymbol(match.symbol)
    setSelectedRomaji(match.romaji)
  }

  // Filtered Kana list for Audio Manager
  const filteredKana = activeKanaList.filter((item) => {
    if (selectedCategory === 'gojuon' && (item.category || 'gojuon') !== 'gojuon') return false
    if (
      selectedCategory === 'dakuon_handakuon' &&
      item.category !== 'dakuon' &&
      item.category !== 'handakuon'
    )
      return false
    if (selectedCategory === 'yoon' && item.category !== 'yoon') return false

    if (selectedRowGroup === 'all') return true
    if (selectedRowGroup === 'wa_n') {
      return item.row_group === 'wa' || item.row_group === 'n'
    }
    return item.row_group === selectedRowGroup
  })

  const currentCharObj =
    activeKanaList.find((h) => h.symbol === selectedSymbol) ||
    activeKanaList.find((h) => h.romaji === selectedRomaji) ||
    activeKanaList[0]
  const currentCustomRecord = customAudioMap[currentCharObj.romaji]

  // File Upload Handlers
  const handleSelectFile = (file: File) => {
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/webm']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|ogg|wav|webm)$/i)) {
      setAudioStatusMsg({
        type: 'error',
        text: 'Format file tidak didukung. Harap gunakan format .mp3, .ogg, atau .wav.',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setAudioStatusMsg({
        type: 'error',
        text: 'Ukuran file melebihi 5MB. Harap gunakan klip audio pendek (< 5MB).',
      })
      return
    }

    if (stagedAudioUrl) URL.revokeObjectURL(stagedAudioUrl)
    setStagedFile(file)
    setStagedAudioUrl(URL.createObjectURL(file))
    setAudioStatusMsg(null)
  }

  const handleSaveStagedAudio = async () => {
    if (!stagedFile) return
    setIsUploading(true)
    try {
      await saveCustomAudio(
        currentCharObj.romaji,
        currentCharObj.symbol,
        stagedFile,
        stagedFile.name
      )
      await refreshCustomAudio()
      setStagedFile(null)
      if (stagedAudioUrl) URL.revokeObjectURL(stagedAudioUrl)
      setStagedAudioUrl(null)
      setAudioStatusMsg({
        type: 'success',
        text: `Suara kustom untuk huruf ${currentCharObj.symbol} (/${currentCharObj.romaji}/) berhasil disimpan!`,
      })
    } catch {
      setAudioStatusMsg({
        type: 'error',
        text: 'Gagal menyimpan file audio ke database browser.',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAudio = async (romaji: string) => {
    try {
      await deleteCustomAudio(romaji)
      await refreshCustomAudio()
      setAudioStatusMsg({
        type: 'success',
        text: `Suara kustom untuk /${romaji}/ telah dihapus. Menggunakan audio default.`,
      })
    } catch {
      setAudioStatusMsg({
        type: 'error',
        text: 'Gagal menghapus rekaman suara kustom.',
      })
    }
  }

  const handleClearAllCustomAudio = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus SEMUA rekaman suara kustom?')) return
    try {
      await clearAllCustomAudio()
      await refreshCustomAudio()
      setAudioStatusMsg({
        type: 'success',
        text: 'Semua rekaman audio kustom telah dibersihkan.',
      })
    } catch {
      setAudioStatusMsg({
        type: 'error',
        text: 'Gagal membersihkan database audio.',
      })
    }
  }

  // Play testing audio
  const handleTestAudio = async (item: { symbol: string; romaji: string }) => {
    setIsAudioPlaying(item.symbol)
    try {
      await playCharacterAudio(
        {
          symbol: item.symbol,
          character: item.symbol,
          romaji: item.romaji,
          script_type: audioManagerScript,
          readings: [{ romaji: item.romaji }],
        },
        {
          rate: speechRate,
          pitch: speechPitch,
          selectedVoiceURI,
          onEnd: () => setIsAudioPlaying(null),
          onError: () => setIsAudioPlaying(null),
        }
      )
    } catch {
      setIsAudioPlaying(null)
    }
  }

  // Save Voice Preferences
  const handleSaveVoicePreferences = () => {
    saveAudioPreferences({
      rate: speechRate,
      pitch: speechPitch,
      selectedVoiceURI: selectedVoiceURI || undefined,
    })
    setVoiceSavedMsg(true)
    setTimeout(() => setVoiceSavedMsg(false), 2500)
  }

  // Reset Voice Preferences to default
  const handleResetVoicePreferences = () => {
    setSpeechRate(0.85)
    setSpeechPitch(1.0)
    saveAudioPreferences({ rate: 0.85, pitch: 1.0 })
    setVoiceSavedMsg(true)
    setTimeout(() => setVoiceSavedMsg(false), 2500)
  }

  // Toggle Practice Autoplay
  const handleToggleSakura = (val: boolean) => {
    setSakuraEnabled(val)
    try {
      localStorage.setItem('nihongo_sora_sakura_rain', String(val))
      window.dispatchEvent(new Event('nihongo_sora_sakura_toggled'))
    } catch {}
  }

  const handleToggleAutoplay = (val: boolean) => {
    setAutoPlayAudio(val)
    try {
      localStorage.setItem('nihongo_sora_practice_autoplay', String(val))
    } catch {
      // ignore
    }
  }

  // Reset Progress
  const handleResetAllProgress = async () => {
    try {
      resetGamification()
      const res = await performFullReset(apiBaseUrl)
      setResetSuccessText(res.message || t('settings.practice_reset_done'))
      setConfirmResetProgress(false)
      setResetDoneMsg(true)
      setTimeout(() => setResetDoneMsg(false), 4000)
    } catch {
      // ignore
    }
  }

  // Ping Backend
  const handlePingBackend = async () => {
    setBackendPingStatus('loading')
    setBackendLatency(null)
    setBackendResponse(null)
    const t0 = performance.now()
    try {
      const res = await fetch(`${apiBaseUrl}/health`)
      const t1 = performance.now()
      setBackendLatency(Math.round(t1 - t0))
      const json = await res.json()
      setBackendResponse(json)
      setBackendPingStatus(res.ok ? 'success' : 'error')
    } catch (err: unknown) {
      setBackendPingStatus('error')
      const msg = err instanceof Error ? err.message : 'Koneksi gagal'
      setBackendResponse({ error: msg })
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 transition-colors duration-300">
      {/* PAGE HEADER */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold mb-2">
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>{t('settings.header_badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('settings.header_title')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          {t('settings.header_desc')}
        </p>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8 overflow-x-auto">
        {[
          { id: 'language', label: t('settings.tab_language'), icon: <Languages className="w-4 h-4" /> },
          { id: 'appearance', label: t('settings.tab_appearance'), icon: <Sparkles className="w-4 h-4 text-rose-500" /> },
          { id: 'audio', label: t('settings.tab_audio'), icon: <Volume2 className="w-4 h-4" /> },
          { id: 'voice', label: t('settings.tab_voice'), icon: <Sliders className="w-4 h-4" /> },
          { id: 'practice', label: t('settings.tab_practice'), icon: <Headphones className="w-4 h-4" /> },
          { id: 'system', label: t('settings.tab_system'), icon: <Cpu className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'language' | 'audio' | 'voice' | 'practice' | 'system')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap border ${
                isActive
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: LANGUAGE SELECTION (BILINGUAL ID & EN) */}
      {/* ========================================================================= */}
      {activeTab === 'language' && (
        <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Languages className="w-5 h-5 text-amber-500" />
              <span>{t('settings.lang_title')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('settings.lang_subtitle')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {/* Option 1: Bahasa Indonesia */}
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between relative cursor-pointer ${
                  language === 'id'
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-400/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">🇮🇩</span>
                    {language === 'id' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{t('settings.lang_active_badge')}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {t('settings.lang_id_badge')}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {t('settings.lang_id_name')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {t('settings.lang_id_desc')}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span>{language === 'id' ? '✓ Aktif' : t('settings.lang_switch_btn')}</span>
                </div>
              </button>

              {/* Option 2: English */}
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between relative cursor-pointer ${
                  language === 'en'
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-400/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">🇬🇧</span>
                    {language === 'en' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{t('settings.lang_active_badge')}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {t('settings.lang_en_badge')}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {t('settings.lang_en_name')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {t('settings.lang_en_desc')}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span>{language === 'en' ? '✓ Active' : t('settings.lang_switch_btn')}</span>
                </div>
              </button>
            </div>

            {/* Note Callout */}
            <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                {t('settings.lang_note')}
              </p>
            </div>

            {/* Active Script Preference Card */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🎌</span>
                <span>{language === 'id' ? 'Pilihan Aksara Utama (Active Script)' : 'Active Script Preference'}</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'id'
                  ? 'Tentukan aksara yang aktif secara default di seluruh antarmuka (Koleksi Huruf, Studio Tracing, dan Evaluasi).'
                  : 'Select your default active script across the entire app (Library, Tracing Studio, and Evaluation).'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setScript('hiragana')}
                  className={`p-4 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
                    script === 'hiragana'
                      ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 shadow-md ring-2 ring-sky-400/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-serif">あ</span>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">Hiragana (ひらがな)</div>
                      <div className="text-[11px] text-slate-500">107 Aksara Baku (Gojūon, Dakuon, Yōon)</div>
                    </div>
                  </div>
                  {script === 'hiragana' && (
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400">✓ {language === 'id' ? 'Aktif' : 'Active'}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setScript('katakana')}
                  className={`p-4 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
                    script === 'katakana'
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-400/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-serif">ア</span>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">Katakana (カタカナ)</div>
                      <div className="text-[11px] text-slate-500">107 Aksara Lengkap (Gojūon, Dakuon, Yōon)</div>
                    </div>
                  </div>
                  {script === 'katakana' && (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">✓ {language === 'id' ? 'Aktif' : 'Active'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: ATMOSPHERIC AESTHETICS & SAKURA RAIN */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
          {/* 1. Sakura Rain Toggle Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌸</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t('settings.sakura_toggle_title')}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                  {t('settings.sakura_toggle_desc')}
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    sakuraEnabled
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sakuraEnabled ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`} />
                    {sakuraEnabled ? t('settings.sakura_status_active') : t('settings.sakura_status_inactive')}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    • 60 FPS GPU-accelerated CSS
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={sakuraEnabled}
                  onChange={(e) => handleToggleSakura(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6.5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-rose-500 shadow-inner"></div>
              </label>
            </div>
          </div>

          {/* 2. Page-Based Animated Backgrounds Information */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 shadow-xs backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>{t('settings.sky_bg_title')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('settings.sky_bg_desc')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Home Dashboard */}
              <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <span>☀️</span>
                    <span>Beranda (Dashboard)</span>
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-sky-200/60 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                    animation.gif
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Langit anime biru cerah berpadu awan berarak lembut untuk menyambut Anda setiap kali membuka aplikasi.
                </p>
              </div>

              {/* Studio Tracing */}
              <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <span>🌸</span>
                    <span>Studio Tracing (Latihan)</span>
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-rose-200/60 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                    animation1.gif
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Atmosfer dojō tenang bernuansa langit dan kelopak sakura untuk menjaga fokus mendalam saat menggores kanvas kaligrafi.
                </p>
              </div>
            </div>

            {/* WCAG AA Accessibility Guarantee */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <span className="text-emerald-500 font-bold shrink-0">✓ WCAG 2.1 AA</span>
              <span>{t('settings.wcag_badge')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: AUDIO MANAGER (CUSTOM MP3 INDEXEDDB) */}
      {/* ========================================================================= */}
      {activeTab === 'audio' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Status Alert */}
          {audioStatusMsg && (
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
                audioStatusMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {audioStatusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{audioStatusMsg.text}</span>
            </div>
          )}

          {/* Top Info Banner */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🎙️</span> {t('settings.audio_title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('settings.audio_desc', { count: Object.keys(customAudioMap).length })}
              </p>
            </div>

            {Object.keys(customAudioMap).length > 0 && (
              <button
                type="button"
                onClick={handleClearAllCustomAudio}
                className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('settings.audio_reset_all')}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Upload & Preview Box */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>⬆️</span> Unggah Audio Karakter
              </h4>

              {/* Target Character Selection Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-3xl font-black shadow-sm">
                    {currentCharObj.symbol}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase text-sky-600 dark:text-sky-400">
                      /{currentCharObj.romaji}/
                    </span>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Baris: {currentCharObj.row_group}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {currentCustomRecord ? '✓ Ada audio kustom' : 'Audio default/speech'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTestAudio(currentCharObj)}
                  className="p-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="Dengarkan suara saat ini"
                >
                  <Play className={`w-4 h-4 ${isAudioPlaying === currentCharObj.symbol ? 'text-amber-500' : ''}`} />
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-950/40"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleSelectFile(file)
                  }}
                />
                <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {stagedFile ? stagedFile.name : 'Klik untuk memilih file .mp3 / .ogg'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Maksimal 5MB per file rekaman
                </p>
              </div>

              {/* Staged Audio Actions */}
              {stagedFile && (
                <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 truncate">
                    <FileAudio className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-semibold truncate">{stagedFile.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {stagedAudioUrl && (
                      <audio ref={previewAudioRef} src={stagedAudioUrl} controls className="h-7 w-32" />
                    )}
                    <button
                      type="button"
                      onClick={handleSaveStagedAudio}
                      disabled={isUploading}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Menyimpan...' : 'Simpan'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Character Audio Directory */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>🔤</span> Pilih Karakter untuk Dikelola
                  </h4>

                  {/* Filter row */}
                  <select
                    value={selectedRowGroup}
                    onChange={(e) => setSelectedRowGroup(e.target.value)}
                    className="py-1 px-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    {(rowFilters[selectedCategory] || rowFilters.all).map(
                      (r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Hiragana | Katakana Segmented Switcher for Audio Manager */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSwitchAudioScript('hiragana')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        audioManagerScript === 'hiragana'
                          ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/80 dark:border-slate-600'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className="font-serif text-sm">あ</span>
                      <span>Hiragana (107)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchAudioScript('katakana')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        audioManagerScript === 'katakana'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-600'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className="font-serif text-sm">ア</span>
                      <span>Katakana (107)</span>
                    </button>
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
                  {SETTINGS_CATEGORY_TABS.map((cat) => {
                    const isSelected = selectedCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id)
                          setSelectedRowGroup('all')
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer text-center truncate ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    )
                  })}
                </div>

                {/* Character Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-96 overflow-y-auto pr-1">
                  {filteredKana.map((item) => {
                    const isSelected = item.symbol === currentCharObj.symbol
                    const hasCustom = !!customAudioMap[item.romaji]
                    const isYoon = item.category === 'yoon' && item.symbol.length === 2

                    return (
                      <div
                        key={item.symbol}
                        onClick={() => {
                          setSelectedSymbol(item.symbol)
                          setSelectedRomaji(item.romaji)
                        }}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition relative select-none ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300'
                            : hasCustom
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-slate-900 dark:text-slate-100'
                            : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                        }`}
                      >
                        {hasCustom && (
                          <span
                            className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-purple-500'
                            }`}
                            title="Ada rekaman audio kustom"
                          />
                        )}
                        {isYoon ? (
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-[8px] font-bold -mb-0.5 ${
                                isSelected ? 'text-amber-100' : 'text-slate-400'
                              }`}
                            >
                              {item.symbol[0]}+{item.symbol[1]}
                            </span>
                            <span className="text-xl font-black">{item.symbol}</span>
                          </div>
                        ) : (
                          <span className="text-2xl font-black">{item.symbol}</span>
                        )}
                        <span
                          className={`text-[10px] font-mono uppercase font-bold mt-0.5 ${
                            isSelected ? 'text-amber-100' : 'text-slate-400'
                          }`}
                        >
                          /{item.romaji}/
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Bottom detail row */}
              {currentCustomRecord && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      File: {currentCustomRecord.fileName}
                    </span>
                    <span className="text-slate-400 ml-2">
                      ({Math.round(currentCustomRecord.fileSize / 1024)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAudio(selectedRomaji)}
                    className="text-rose-600 dark:text-rose-400 hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Kustom</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SPEECH SYNTHESIS RATE & PITCH (WEB SPEECH API) */}
      {/* ========================================================================= */}
      {activeTab === 'voice' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              <span>{t('settings.voice_title')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('settings.voice_desc')}
            </p>
          </div>

          {/* Success toast */}
          {voiceSavedMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{t('settings.voice_saved')}</span>
            </div>
          )}

          {/* Voice Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              {t('settings.voice_select_label')}
            </label>
            {availableVoices.length > 0 ? (
              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
              >
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang}) {v.default ? '• Default' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Browser menggunakan suara ja-JP standar sistem operasi Anda.
              </p>
            )}
          </div>

          {/* Rate Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-700 dark:text-slate-300">
                {t('settings.voice_rate_label')}
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400">{speechRate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0.5x (Lambat / Belajar)</span>
              <span>0.85x (Optimal)</span>
              <span>1.5x (Cepat)</span>
            </div>
          </div>

          {/* Pitch Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-700 dark:text-slate-300">
                {t('settings.voice_pitch_label')}
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400">{speechPitch.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.4"
              step="0.05"
              value={speechPitch}
              onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0.8 (Berat)</span>
              <span>1.0 (Normal)</span>
              <span>1.4 (Tinggi)</span>
            </div>
          </div>

          {/* Test Audio Button */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {t('settings.voice_test_phrase')}
            </span>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel()
                  const u = new SpeechSynthesisUtterance('こんにちは、あいうえお')
                  u.lang = 'ja-JP'
                  u.rate = speechRate
                  u.pitch = speechPitch
                  const v = availableVoices.find((item) => item.voiceURI === selectedVoiceURI)
                  if (v) u.voice = v
                  window.speechSynthesis.speak(u)
                }
              }}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{t('settings.voice_test_btn')}</span>
            </button>
          </div>

          {/* Save / Reset Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSaveVoicePreferences}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t('settings.voice_save_btn')}</span>
            </button>
            <button
              type="button"
              onClick={handleResetVoicePreferences}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold transition cursor-pointer"
            >
              {t('settings.voice_reset_btn')}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRACTICE & PROGRESS PREFERENCES */}
      {/* ========================================================================= */}
      {activeTab === 'practice' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Headphones className="w-5 h-5 text-amber-500" />
              <span>{t('settings.practice_title')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('settings.practice_autoplay_desc')}
            </p>
          </div>

          {resetDoneMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{resetSuccessText || t('settings.practice_reset_done')}</span>
            </div>
          )}

          {/* Quick Sakura Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>🌸</span>
                <span>{t('settings.sakura_toggle_title')}</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {sakuraEnabled ? t('settings.sakura_status_active') : t('settings.sakura_status_inactive')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sakuraEnabled}
                onChange={(e) => handleToggleSakura(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>

          {/* Autoplay Audio Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t('settings.practice_autoplay_title')}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {t('settings.practice_autoplay_desc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoPlayAudio}
                onChange={(e) => handleToggleAutoplay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Reset Progress Section */}
          <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-1">
              {t('settings.practice_danger_title')}
            </h4>
            <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mb-3">
              {t('settings.practice_danger_desc')}
            </p>

            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('settings.practice_reset_btn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BACKEND CONNECTION & SYSTEM */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-500" />
              <span>{t('settings.system_decoupled_title')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('settings.system_decoupled_desc')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Target Base URL:</span>
              <code className="text-sky-600 dark:text-sky-400 font-mono font-bold">{apiBaseUrl}</code>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Database Backend:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">MySQL Laragon (Port 3306)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Framework API:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Go Fiber v2 + GORM</span>
            </div>
          </div>

          {/* Test Ping Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePingBackend}
              disabled={backendPingStatus === 'loading'}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${backendPingStatus === 'loading' ? 'animate-spin' : ''}`} />
              <span>{backendPingStatus === 'loading' ? 'Menghubungkan...' : t('settings.system_ping_btn')}</span>
            </button>
          </div>

          {/* Ping Results */}
          {backendPingStatus === 'success' && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
              <div className="flex items-center justify-between font-bold mb-2">
                <span>{t('settings.system_ping_success')}</span>
                {backendLatency !== null && <span className="font-mono">Latensi: {backendLatency}ms</span>}
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(backendResponse, null, 2)}
              </pre>
            </div>
          )}

          {backendPingStatus === 'error' && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs">
              <div className="font-bold mb-1">{t('settings.system_ping_error')}</div>
              <p className="text-[11px] mb-2">
                {t('settings.system_ping_error_desc')}
              </p>
              <pre className="p-2 rounded-lg bg-slate-900 text-rose-300 font-mono text-[10px]">
                {JSON.stringify(backendResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* FULL RESET CONFIRMATION MODAL */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={(msg) => {
          setResetSuccessText(msg)
          setResetDoneMsg(true)
          setTimeout(() => setResetDoneMsg(false), 4000)
        }}
      />
    </main>
  )
}
