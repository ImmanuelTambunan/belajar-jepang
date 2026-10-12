'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  CharacterAudioInput,
  AudioPlaybackSource,
  PlaybackOptions,
  extractCharacterAudioInfo,
  playCharacterAudio,
  stopAllAudioPlayback,
  initVoiceCache,
  getBestJapaneseVoice,
} from '@/utils/audio'

export interface UseCharacterAudioState {
  isPlaying: boolean
  playingSymbol: string | null
  playingRomaji: string | null
  activeSource: AudioPlaybackSource | null
  isLoading: boolean
  error: string | null
  isSpeechAvailable: boolean
}

export interface UseCharacterAudioReturn extends UseCharacterAudioState {
  play: (
    character: CharacterAudioInput,
    customOptions?: Partial<PlaybackOptions>
  ) => Promise<void>
  stop: () => void
  isItemPlaying: (item: CharacterAudioInput | string) => boolean
}

export function useCharacterAudio(): UseCharacterAudioReturn {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playingSymbol, setPlayingSymbol] = useState<string | null>(null)
  const [playingRomaji, setPlayingRomaji] = useState<string | null>(null)
  const [activeSource, setActiveSource] = useState<AudioPlaybackSource | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isSpeechAvailable, setIsSpeechAvailable] = useState<boolean>(false)

  // Track currently active play token to prevent race conditions
  const currentPlayToken = useRef<number>(0)

  // Initialize SpeechSynthesis and Voice Cache on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSpeechAvailable(true)
      initVoiceCache()
    }
  }, [])

  const stop = useCallback(() => {
    currentPlayToken.current += 1
    stopAllAudioPlayback()
    setIsPlaying(false)
    setPlayingSymbol(null)
    setPlayingRomaji(null)
    setActiveSource(null)
    setIsLoading(false)
  }, [])

  const play = useCallback(
    async (
      character: CharacterAudioInput,
      customOptions: Partial<PlaybackOptions> = {}
    ) => {
      const { symbol, romaji } = extractCharacterAudioInfo(character)
      if (!symbol && !romaji) return

      const thisToken = ++currentPlayToken.current
      setError(null)
      setIsLoading(true)
      setPlayingSymbol(symbol || null)
      setPlayingRomaji(romaji || null)

      try {
        await playCharacterAudio(character, {
          rate: customOptions.rate ?? 0.85,
          pitch: customOptions.pitch ?? 1.0,
          nativeBasePath: customOptions.nativeBasePath,
          onStart: (source) => {
            if (thisToken !== currentPlayToken.current) return
            setIsLoading(false)
            setIsPlaying(true)
            setActiveSource(source)
            customOptions.onStart?.(source)
          },
          onEnd: () => {
            if (thisToken !== currentPlayToken.current) return
            setIsPlaying(false)
            setPlayingSymbol(null)
            setPlayingRomaji(null)
            setActiveSource(null)
            setIsLoading(false)
            customOptions.onEnd?.()
          },
          onError: (err) => {
            if (thisToken !== currentPlayToken.current) return
            setIsPlaying(false)
            setPlayingSymbol(null)
            setPlayingRomaji(null)
            setActiveSource(null)
            setIsLoading(false)
            setError(err.message)
            customOptions.onError?.(err)
          },
          onFallback: (reason) => {
            if (thisToken !== currentPlayToken.current) return
            customOptions.onFallback?.(reason)
          },
        })
      } catch (err: unknown) {
        if (thisToken === currentPlayToken.current) {
          setIsPlaying(false)
          setPlayingSymbol(null)
          setPlayingRomaji(null)
          setActiveSource(null)
          setIsLoading(false)
          const errorMsg =
            err instanceof Error ? err.message : 'Gagal memutar audio pelafalan'
          setError(errorMsg)
        }
      }
    },
    []
  )

  const isItemPlaying = useCallback(
    (item: CharacterAudioInput | string): boolean => {
      if (!isPlaying) return false

      if (typeof item === 'string') {
        const query = item.toLowerCase().trim()
        return (
          playingSymbol === query ||
          (playingRomaji !== null && playingRomaji === query)
        )
      }

      const { symbol, romaji } = extractCharacterAudioInfo(item)
      return (
        (symbol !== '' && symbol === playingSymbol) ||
        (romaji !== '' && romaji === playingRomaji)
      )
    },
    [isPlaying, playingSymbol, playingRomaji]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudioPlayback()
    }
  }, [])

  return {
    play,
    stop,
    isPlaying,
    playingSymbol,
    playingRomaji,
    activeSource,
    isLoading,
    error,
    isSpeechAvailable,
    isItemPlaying,
  }
}
