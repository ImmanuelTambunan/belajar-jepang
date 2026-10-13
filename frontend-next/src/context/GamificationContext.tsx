'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import {
  GamificationState,
  LevelInfo,
  XPToast,
  LevelUpEvent,
} from '@/types/gamification'
import {
  calculateLevelInfo,
  updateStreakOnActivity,
  loadGamificationFromStorage,
  saveGamificationToStorage,
  GAMIFICATION_UPDATE_EVENT,
} from '@/utils/gamification'

interface GamificationContextValue {
  currentXP: number
  currentLevel: number
  dailyStreak: number
  levelInfo: LevelInfo
  awardXP: (amount: number, reason: string) => void
  activeToasts: XPToast[]
  dismissToast: (id: string) => void
  levelUpModal: LevelUpEvent | null
  dismissLevelUpModal: () => void
  refreshGamification: () => void
}

const GamificationContext = createContext<GamificationContextValue | undefined>(
  undefined
)

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<GamificationState>({
    currentXP: 0,
    currentLevel: 1,
    dailyStreak: 0,
    lastActiveDate: null,
  })
  const [activeToasts, setActiveToasts] = useState<XPToast[]>([])
  const [levelUpModal, setLevelUpModal] = useState<LevelUpEvent | null>(null)
  const [isClientMounted, setIsClientMounted] = useState<boolean>(false)

  // Dismiss a toast
  const dismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Award XP function
  const awardXP = useCallback(
    (amount: number, reason: string) => {
      if (amount <= 0) return

      setState((prevState) => {
        const oldXP = prevState.currentXP
        const newXP = oldXP + amount
        const oldLevel = Math.floor(oldXP / 100) + 1
        const newLevel = Math.floor(newXP / 100) + 1

        const streakResult = updateStreakOnActivity(
          prevState.lastActiveDate,
          prevState.dailyStreak
        )

        const nextState: GamificationState = {
          currentXP: newXP,
          currentLevel: newLevel,
          dailyStreak: streakResult.newStreak,
          lastActiveDate: streakResult.newDate,
        }

        saveGamificationToStorage(nextState)

        // Trigger Level-up event if level increased
        if (newLevel > oldLevel) {
          const newLevelInfo = calculateLevelInfo(newXP)
          setLevelUpModal({
            oldLevel,
            newLevel,
            title: newLevelInfo.title,
            japaneseTitle: newLevelInfo.japaneseTitle,
          })
        }

        return nextState
      })

      // Add to XP toast queue
      const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const newToast: XPToast = {
        id: toastId,
        amount,
        reason,
        timestamp: Date.now(),
      }

      setActiveToasts((prev) => [...prev.slice(-4), newToast])

      // Auto dismiss after 3.8s
      setTimeout(() => {
        dismissToast(toastId)
      }, 3800)
    },
    [dismissToast]
  )

  // Sync state from localStorage
  const refreshGamification = useCallback(() => {
    const loaded = loadGamificationFromStorage()
    setState(loaded)
  }, [])

  useEffect(() => {
    setIsClientMounted(true)
    refreshGamification()

    const handleStorage = () => refreshGamification()
    window.addEventListener('storage', handleStorage)
    window.addEventListener(GAMIFICATION_UPDATE_EVENT, handleStorage)

    // Listen to custom award XP events if dispatched elsewhere
    const handleExternalAward = (e: Event) => {
      const customEvent = e as CustomEvent<{ amount: number; reason: string }>
      if (customEvent.detail) {
        awardXP(customEvent.detail.amount, customEvent.detail.reason)
      }
    }
    window.addEventListener('nihongo_sora_award_xp', handleExternalAward)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(GAMIFICATION_UPDATE_EVENT, handleStorage)
      window.removeEventListener('nihongo_sora_award_xp', handleExternalAward)
    }
  }, [refreshGamification, awardXP])

  const dismissLevelUpModal = useCallback(() => {
    setLevelUpModal(null)
  }, [])

  const levelInfo = useMemo(() => {
    return calculateLevelInfo(state.currentXP)
  }, [state.currentXP])

  return (
    <GamificationContext.Provider
      value={{
        currentXP: isClientMounted ? state.currentXP : 0,
        currentLevel: isClientMounted ? state.currentLevel : 1,
        dailyStreak: isClientMounted ? state.dailyStreak : 0,
        levelInfo,
        awardXP,
        activeToasts,
        dismissToast,
        levelUpModal,
        dismissLevelUpModal,
        refreshGamification,
      }}
    >
      {children}
    </GamificationContext.Provider>
  )
}

export function useGamification(): GamificationContextValue {
  const context = useContext(GamificationContext)
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider')
  }
  return context
}
