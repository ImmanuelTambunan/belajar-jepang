'use client'

import React from 'react'
import { Volume2, Loader2 } from 'lucide-react'
import { CharacterAudioInput, AudioPlaybackSource } from '@/utils/audio'

interface AudioSpeakerButtonProps {
  character: CharacterAudioInput
  isPlaying?: boolean
  isLoading?: boolean
  activeSource?: AudioPlaybackSource | null
  onPlay: (char: CharacterAudioInput) => void
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'icon' | 'badge' | 'button'
  label?: string
  stopPropagation?: boolean
  className?: string
  title?: string
}

// Soundwave Equalizer Bars Component
const SoundWaveBars: React.FC<{
  barHeight?: string
  barWidth?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}> = ({
  barHeight = 'h-3.5',
  barWidth = 'w-0.5',
  size = 'md',
}) => (
  <div
    className="flex items-end justify-center gap-0.5"
    style={{ height: size === 'xs' ? '12px' : size === 'sm' ? '14px' : '18px' }}
    aria-label="Audio sedang diputar"
  >
    <span
      className={`${barWidth} ${barHeight} bg-current rounded-full animate-soundwave-1 inline-block`}
    />
    <span
      className={`${barWidth} ${barHeight} bg-current rounded-full animate-soundwave-2 inline-block`}
    />
    <span
      className={`${barWidth} ${barHeight} bg-current rounded-full animate-soundwave-3 inline-block`}
    />
    {size !== 'xs' && (
      <span
        className={`${barWidth} ${barHeight} bg-current rounded-full animate-soundwave-4 inline-block`}
      />
    )}
  </div>
)

export const AudioSpeakerButton: React.FC<AudioSpeakerButtonProps> = ({
  character,
  isPlaying = false,
  isLoading = false,
  activeSource = null,
  onPlay,
  size = 'md',
  variant = 'icon',
  label = 'Dengarkan Pelafalan',
  stopPropagation = true,
  className = '',
  title,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      e.stopPropagation()
    }
    onPlay(character)
  }

  const tooltipTitle =
    title ||
    `Dengarkan pelafalan ${character.symbol || character.character || ''} (${
      character.romaji || character.readings?.[0]?.romaji || ''
    })`

  // Variant 1: Compact Icon-Only (Ideal for character grid cards & small tags)
  if (variant === 'icon') {
    const sizeClasses = {
      xs: 'w-6 h-6 p-1 text-[11px]',
      sm: 'w-7 h-7 p-1.5 text-xs',
      md: 'w-9 h-9 p-2 text-sm',
      lg: 'w-11 h-11 p-2.5 text-base',
    }[size]

    const iconSizes = {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
    }[size]

    return (
      <button
        type="button"
        onClick={handleClick}
        title={tooltipTitle}
        aria-label={tooltipTitle}
        className={`rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center relative overflow-hidden group select-none ${sizeClasses} ${
          isPlaying
            ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30 scale-105 ring-2 ring-sky-400/40'
            : 'bg-white/80 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-slate-600 shadow-xs'
        } ${className}`}
      >
        {isLoading ? (
          <Loader2 className="animate-spin text-current" size={iconSizes} />
        ) : isPlaying ? (
          <SoundWaveBars
            barHeight={size === 'xs' ? 'h-2.5' : size === 'sm' ? 'h-3' : 'h-3.5'}
            barWidth={size === 'xs' ? 'w-0.5' : 'w-0.5'}
          />
        ) : (
          <Volume2
            size={iconSizes}
            className="transition-transform group-hover:scale-110"
          />
        )}
      </button>
    )
  }

  // Variant 2: Badge with Source Indicator (Ideal for preview card headers)
  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={tooltipTitle}
        aria-label={tooltipTitle}
        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer inline-flex items-center gap-2 select-none ${
          isPlaying
            ? 'bg-sky-500 text-white border-sky-400 shadow-sm shadow-sky-500/30 ring-1 ring-sky-400/50'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 hover:text-sky-600 dark:hover:text-sky-400'
        } ${className}`}
      >
        {isLoading ? (
          <Loader2 className="animate-spin text-current" size={14} />
        ) : isPlaying ? (
          <SoundWaveBars barHeight="h-3" barWidth="w-0.5" />
        ) : (
          <Volume2 size={14} />
        )}
        <span>{isPlaying ? 'Memutar...' : label}</span>
        {activeSource && isPlaying && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 font-mono tracking-tight">
            {activeSource === 'custom'
              ? '✨ Kustom'
              : activeSource === 'native'
              ? 'Native'
              : 'ja-JP'}
          </span>
        )}
      </button>
    )
  }

  // Variant 3: Prominent Action Button (Ideal for Practice and Exam modes)
  const buttonPadding = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-sm sm:text-base',
  }[size]

  return (
    <button
      type="button"
      onClick={handleClick}
      title={tooltipTitle}
      aria-label={tooltipTitle}
      className={`rounded-2xl font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 shadow-sm active:scale-98 select-none border ${buttonPadding} ${
        isPlaying
          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-sky-400 shadow-md shadow-sky-600/30 ring-2 ring-sky-400/40'
          : 'bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 hover:border-sky-300 dark:hover:border-slate-600 hover:text-sky-600 dark:hover:text-sky-400'
      } ${className}`}
    >
      {isLoading ? (
        <Loader2 className="animate-spin text-current shrink-0" size={18} />
      ) : isPlaying ? (
        <SoundWaveBars barHeight="h-4" barWidth="w-1" />
      ) : (
        <Volume2 size={18} className="shrink-0 text-sky-500 dark:text-sky-400" />
      )}
      <span>{isPlaying ? 'Sedang Memutar Pelafalan...' : label}</span>
      {isPlaying && activeSource && (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/20 uppercase tracking-wider font-mono font-bold">
          {activeSource === 'custom'
            ? '✨ Suara Kustom'
            : activeSource === 'native'
            ? 'Audio Asli'
            : 'Web Speech ja-JP'}
        </span>
      )}
    </button>
  )
}
