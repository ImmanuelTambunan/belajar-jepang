export interface GamificationState {
  currentXP: number
  currentLevel: number
  dailyStreak: number
  lastActiveDate: string | null // 'YYYY-MM-DD'
}

export interface LevelInfo {
  level: number
  title: string
  japaneseTitle: string
  icon: string
  currentLevelXP: number // XP within current level (0..99)
  nextLevelXP: number    // 100 XP per level
  percentage: number     // 0..100%
  totalXP: number
}

export interface XPToast {
  id: string
  amount: number
  reason: string
  timestamp: number
}

export interface LevelUpEvent {
  oldLevel: number
  newLevel: number
  title: string
  japaneseTitle: string
}
