/**
 * Audio Utility Module for Japanese Hiragana Pronunciation
 * Layered Playback Architecture:
 * 1. Primary: Local or remote native speaker audio (/audio/hiragana/{romaji}.mp3 or .ogg)
 * 2. Fallback: Web Speech API (window.speechSynthesis) with ja-JP voice, rate=0.85, pitch=1.0
 * 3. Browser AudioContext & Autoplay policy protection
 */

import { getCustomAudio } from './audioStorage'

export interface CharacterAudioInput {
  symbol?: string
  character?: string
  romaji?: string
  readings?: Array<{ romaji?: string }>
}

export type AudioPlaybackSource = 'custom' | 'native' | 'speech'

export interface PlaybackOptions {
  rate?: number // Default: 0.85 for articulate learning pace
  pitch?: number // Default: 1.0
  nativeBasePath?: string // Default: '/audio/hiragana'
  onStart?: (source: AudioPlaybackSource) => void
  onEnd?: () => void
  onError?: (error: Error) => void
  onFallback?: (reason: string) => void
}

/**
 * Gojūon 46 standard Hiragana to Romaji mapping table
 */
export const HIRAGANA_TO_ROMAJI: Record<string, string> = {
  // Gojūon 46 Dasar
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'wo', ん: 'n',

  // Dakuon 20
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',

  // Handakuon 5
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',

  // Yōon 36 Gabungan
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
  ぢゃ: 'dya', ぢゅ: 'dyu', ぢょ: 'dyo',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
}

/**
 * Reverse mapping Romaji to Hiragana
 */
export const ROMAJI_TO_HIRAGANA: Record<string, string> = Object.entries(
  HIRAGANA_TO_ROMAJI
).reduce<Record<string, string>>((acc, [kana, rom]) => {
  acc[rom] = kana
  return acc
}, {})

/**
 * Normalizes and extracts symbol and romaji from any character input representation
 */
export function extractCharacterAudioInfo(input: CharacterAudioInput): {
  symbol: string
  romaji: string
} {
  const symbol = (input.character || input.symbol || '').trim()
  let romaji = (
    input.romaji ||
    input.readings?.[0]?.romaji ||
    ''
  ).toLowerCase().trim()

  if (!romaji && symbol && HIRAGANA_TO_ROMAJI[symbol]) {
    romaji = HIRAGANA_TO_ROMAJI[symbol]
  }

  if (!symbol && romaji && ROMAJI_TO_HIRAGANA[romaji]) {
    return { symbol: ROMAJI_TO_HIRAGANA[romaji], romaji }
  }

  return { symbol, romaji }
}

/**
 * Global singleton state to manage single-stream audio playback
 * Prevents overlapping audio streams when user clicks quickly.
 */
let activeAudioElement: HTMLAudioElement | null = null
let activeSpeechUtterance: SpeechSynthesisUtterance | null = null
let isPlayingGlobally: boolean = false
let cachedJapaneseVoices: SpeechSynthesisVoice[] = []

/**
 * Cache voices when available and listen for voice list changes
 */
export function initVoiceCache(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  const updateVoices = () => {
    try {
      const allVoices = window.speechSynthesis.getVoices()
      cachedJapaneseVoices = allVoices.filter(
        (v) =>
          v.lang === 'ja-JP' ||
          v.lang === 'ja_JP' ||
          v.lang.toLowerCase().startsWith('ja')
      )
    } catch {
      // Ignore voice enumeration errors
    }
  }

  updateVoices()
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoices
  }
}

/**
 * Returns the best available Japanese voice
 */
export function getBestJapaneseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null

  if (cachedJapaneseVoices.length === 0) {
    initVoiceCache()
  }

  if (cachedJapaneseVoices.length === 0) return null

  // Prioritize high-quality natural/online voices
  const naturalVoice = cachedJapaneseVoices.find((v) =>
    /natural|online|google|kyoko|otoya|nanami|ayumi|haruka|ichiro/i.test(v.name)
  )

  return naturalVoice || cachedJapaneseVoices[0]
}

/**
 * Stops all currently active audio (both HTMLAudioElement and SpeechSynthesis)
 */
export function stopAllAudioPlayback(): void {
  if (typeof window === 'undefined') return

  // Stop active native audio element
  if (activeAudioElement) {
    try {
      activeAudioElement.pause()
      activeAudioElement.currentTime = 0
      activeAudioElement.removeAttribute('src')
      activeAudioElement.load()
    } catch {
      // Ignore cleanup error
    }
    activeAudioElement = null
  }

  // Cancel SpeechSynthesis
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      // Ignore cancel error
    }
    activeSpeechUtterance = null
  }

  isPlayingGlobally = false
}

export function isAudioPlaying(): boolean {
  return isPlayingGlobally
}

export function getActiveSpeechUtterance(): SpeechSynthesisUtterance | null {
  return activeSpeechUtterance
}

/**
 * User Preferences for Audio & Speech Synthesis
 */
export interface AudioUserPreferences {
  rate: number
  pitch: number
  selectedVoiceURI?: string
}

export function getAudioPreferences(): AudioUserPreferences {
  if (typeof window === 'undefined') {
    return { rate: 0.85, pitch: 1.0 }
  }
  try {
    const rate = parseFloat(localStorage.getItem('nihongo_sora_voice_rate') || '0.85')
    const pitch = parseFloat(localStorage.getItem('nihongo_sora_voice_pitch') || '1.0')
    const selectedVoiceURI = localStorage.getItem('nihongo_sora_voice_uri') || undefined
    return {
      rate: isNaN(rate) ? 0.85 : rate,
      pitch: isNaN(pitch) ? 1.0 : pitch,
      selectedVoiceURI,
    }
  } catch {
    return { rate: 0.85, pitch: 1.0 }
  }
}

export function saveAudioPreferences(prefs: AudioUserPreferences): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('nihongo_sora_voice_rate', prefs.rate.toString())
    localStorage.setItem('nihongo_sora_voice_pitch', prefs.pitch.toString())
    if (prefs.selectedVoiceURI) {
      localStorage.setItem('nihongo_sora_voice_uri', prefs.selectedVoiceURI)
    } else {
      localStorage.removeItem('nihongo_sora_voice_uri')
    }
  } catch {
    // ignore
  }
}

export function getAllJapaneseVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  if (cachedJapaneseVoices.length === 0) {
    initVoiceCache()
  }
  return cachedJapaneseVoices
}

/**
 * Plays speech using Web Speech API fallback
 */
export function playWebSpeech(
  textToSpeak: string,
  options: PlaybackOptions = {}
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      const err = new Error('Web Speech API tidak didukung di browser ini.')
      console.warn(err.message)
      options.onError?.(err)
      resolve()
      return
    }

    try {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = 'ja-JP'
      const prefs = getAudioPreferences()
      utterance.rate = options.rate ?? prefs.rate ?? 0.85
      utterance.pitch = options.pitch ?? prefs.pitch ?? 1.0

      const customVoice = prefs.selectedVoiceURI
        ? cachedJapaneseVoices.find((v) => v.voiceURI === prefs.selectedVoiceURI)
        : null
      const voice = customVoice || getBestJapaneseVoice()
      if (voice) {
        utterance.voice = voice
      }

      activeSpeechUtterance = utterance
      isPlayingGlobally = true

      utterance.onstart = () => {
        options.onStart?.('speech')
      }

      utterance.onend = () => {
        activeSpeechUtterance = null
        isPlayingGlobally = false
        options.onEnd?.()
        resolve()
      }

      utterance.onerror = (e) => {
        activeSpeechUtterance = null
        isPlayingGlobally = false
        // Interrupted errors happen when user clicks another character quickly
        if (e.error === 'interrupted' || e.error === 'canceled') {
          resolve()
          return
        }
        console.warn(`Web Speech Synthesis notice: ${e.error}`)
        const err = new Error(`Web Speech Error: ${e.error}`)
        options.onError?.(err)
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    } catch (err: unknown) {
      isPlayingGlobally = false
      activeSpeechUtterance = null
      console.warn('Web Speech Synthesis error:', err)
      const errorObj = err instanceof Error ? err : new Error(String(err))
      options.onError?.(errorObj)
      resolve()
    }
  })
}

/**
 * Speaks a Japanese character or text using Web Speech API (speechSynthesis ja-JP)
 */
export async function speakWithWebSpeech(
  character: CharacterAudioInput | string,
  options: PlaybackOptions = {}
): Promise<void> {
  const { symbol, romaji } =
    typeof character === 'string'
      ? extractCharacterAudioInfo({ character })
      : extractCharacterAudioInfo(character)

  const textToSpeak =
    symbol ||
    (typeof character === 'string'
      ? character
      : character.character || character.symbol || romaji)

  if (!textToSpeak) return
  await playWebSpeech(textToSpeak, options)
}

/**
 * Plays character audio using layered approach:
 * 1. Priority 1 (Highest): Custom user-uploaded audio from IndexedDB
 * 2. Priority 2: Static local file `/audio/hiragana/{romaji}.mp3`
 * 3. Priority 3: Web Speech API `ja-JP`
 */
export async function playCharacterAudio(
  input: CharacterAudioInput,
  options: PlaybackOptions = {}
): Promise<void> {
  if (typeof window === 'undefined') return

  // Stop previous sounds
  stopAllAudioPlayback()

  const { symbol, romaji } = extractCharacterAudioInfo(input)
  if (!symbol && !romaji) {
    const err = new Error('Informasi karakter Hiragana atau Romaji tidak valid.')
    options.onError?.(err)
    return
  }

  const basePath = options.nativeBasePath || '/audio/hiragana'

  // Helper to fallback to speech synthesis
  const executeSpeechFallback = async (reason: string) => {
    options.onFallback?.(reason)
    await speakWithWebSpeech(input, options)
  }

  // If romaji is not available, jump directly to Web Speech
  if (!romaji) {
    await executeSpeechFallback('Romaji tidak ditemukan')
    return
  }

  // =========================================================================
  // LAYER 1: Custom User-Uploaded Audio in IndexedDB (Highest Priority)
  // =========================================================================
  try {
    const customRecord = await getCustomAudio(romaji).catch(() => null)
    if (customRecord && customRecord.blob) {
      const blobUrl = URL.createObjectURL(customRecord.blob)
      const customAudio = new Audio(blobUrl)
      activeAudioElement = customAudio

      let isCustomCleanedUp = false
      let customSucceeded = false

      await new Promise<void>((resolve) => {
        const cleanup = () => {
          if (isCustomCleanedUp) return
          isCustomCleanedUp = true
          customAudio.removeEventListener('playing', onPlaying)
          customAudio.removeEventListener('ended', onEnded)
          customAudio.removeEventListener('error', onError)
          URL.revokeObjectURL(blobUrl)
        }

        const onPlaying = () => {
          customSucceeded = true
          isPlayingGlobally = true
          options.onStart?.('custom')
        }

        const onEnded = () => {
          cleanup()
          if (activeAudioElement === customAudio) {
            activeAudioElement = null
          }
          isPlayingGlobally = false
          options.onEnd?.()
          resolve()
        }

        const onError = () => {
          cleanup()
          if (activeAudioElement === customAudio) {
            activeAudioElement = null
          }
          isPlayingGlobally = false
          console.warn('Audio kustom gagal dimuat, melanjutkan ke layer audio berikutnya.')
          resolve()
        }

        customAudio.addEventListener('playing', onPlaying)
        customAudio.addEventListener('ended', onEnded)
        customAudio.addEventListener('error', onError)

        const playPromise = customAudio.play()
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err instanceof Error && err.name === 'NotAllowedError') {
              cleanup()
              console.warn('Audio autoplay dihentikan oleh browser sebelum interaksi pengguna.')
              isPlayingGlobally = false
              if (activeAudioElement === customAudio) {
                activeAudioElement = null
              }
              options.onError?.(err)
              resolve()
              return
            }
            onError()
          })
        }
      })

      if (customSucceeded) {
        return // Successfully played custom audio!
      }
    }
  } catch (err: unknown) {
    // Autoplay browser policy detection (NotAllowedError)
    if (err instanceof Error && err.name === 'NotAllowedError') {
      console.warn('Audio autoplay dihentikan oleh browser sebelum interaksi pengguna.')
      isPlayingGlobally = false
      activeAudioElement = null
      options.onError?.(err)
      return
    }
    // If custom audio fails, fall through to Layer 2
  }

  // =========================================================================
  // LAYER 2: Native Audio Static File (/audio/hiragana/{romaji}.mp3)
  // =========================================================================
  const audioPathMp3 = `${basePath}/${romaji}.mp3`

  try {
    const audio = new Audio(audioPathMp3)
    activeAudioElement = audio

    let isCleanedUp = false
    let fallbackExecuted = false

    const triggerFallbackSafely = async (reason: string) => {
      if (fallbackExecuted) return
      fallbackExecuted = true

      if (activeAudioElement === audio) {
        activeAudioElement = null
      }
      isPlayingGlobally = false

      console.warn(
        `File native audio tidak ditemukan atau gagal dimuat (${audioPathMp3}). Mengalihkan otomatis ke Web Speech Synthesis fallback.`,
        reason
      )

      try {
        await executeSpeechFallback(reason)
      } catch (fallbackErr) {
        console.warn('Fallback Web Speech API gagal:', fallbackErr)
      }
    }

    await new Promise<void>((resolve) => {
      const cleanup = () => {
        if (isCleanedUp) return
        isCleanedUp = true
        audio.removeEventListener('playing', onPlaying)
        audio.removeEventListener('ended', onEnded)
        audio.removeEventListener('error', onError)
      }

      const onPlaying = () => {
        isPlayingGlobally = true
        options.onStart?.('native')
      }

      const onEnded = () => {
        cleanup()
        if (activeAudioElement === audio) {
          activeAudioElement = null
        }
        isPlayingGlobally = false
        options.onEnd?.()
        resolve()
      }

      const onError = async () => {
        cleanup()
        await triggerFallbackSafely(`Native audio error event (404/format): ${audioPathMp3}`)
        resolve()
      }

      audio.addEventListener('playing', onPlaying)
      audio.addEventListener('ended', onEnded)
      audio.addEventListener('error', onError)

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(async (playErr: unknown) => {
          cleanup()

          // Autoplay browser policy detection (NotAllowedError)
          if (playErr instanceof Error && playErr.name === 'NotAllowedError') {
            console.warn('Audio autoplay dihentikan oleh browser sebelum interaksi pengguna.')
            isPlayingGlobally = false
            if (activeAudioElement === audio) {
              activeAudioElement = null
            }
            options.onError?.(playErr)
            resolve()
            return
          }

          // Format error, 404, or abort
          await triggerFallbackSafely(
            playErr instanceof Error ? playErr.message : `Gagal memutar native audio: ${audioPathMp3}`
          )
          resolve()
        })
      }
    })

    return // Handled successfully (either native played or fallback resolved)
  } catch (err: unknown) {
    // Autoplay browser policy detection (NotAllowedError)
    if (err instanceof Error && err.name === 'NotAllowedError') {
      console.warn('Audio autoplay dihentikan oleh browser sebelum interaksi pengguna.')
      isPlayingGlobally = false
      activeAudioElement = null
      options.onError?.(err)
      return
    }

    // =========================================================================
    // LAYER 3: Web Speech API ja-JP (Fallback)
    // =========================================================================
    try {
      await executeSpeechFallback(
        err instanceof Error ? err.message : 'File audio lokal belum tersedia'
      )
    } catch {
      // Handled in speakWithWebSpeech
    }
  }
}

/**
 * Alias for playCharacterAudio
 */
export const playKanaAudio = playCharacterAudio
