import { LevelInfo, GamificationState } from '@/types/gamification'

export const GAMIFICATION_STORAGE_KEY = 'nihongo_sora_gamification'
export const GAMIFICATION_UPDATE_EVENT = 'nihongo_sora_gamification_updated'

export const LEVEL_TIERS: { title: string; japaneseTitle: string; icon: string }[] = [
  { title: 'Pemula', japaneseTitle: '初心者', icon: '🌱' },
  { title: 'Pelajar Tekun', japaneseTitle: '努力家', icon: '📖' },
  { title: 'Penjelajah Hiragana', japaneseTitle: '探求者', icon: '🧭' },
  { title: 'Pendekar Hiragana', japaneseTitle: '侍', icon: '⚔️' },
  { title: 'Ahli Kaligrafi', japaneseTitle: '書道家', icon: '🖌️' },
  { title: 'Sensei Muda', japaneseTitle: '若き先生', icon: '🎓' },
  { title: 'Master Gojūon', japaneseTitle: '五十音の達人', icon: '🥋' },
  { title: 'Grandmaster Nihongo', japaneseTitle: '日本語師範', icon: '🏯' },
  { title: 'Bintang Sora', japaneseTitle: '空の星', icon: '⭐' },
  { title: 'Dewa Huruf', japaneseTitle: '言語の神', icon: '👑' },
]

/**
 * Format local calendar date to 'YYYY-MM-DD'
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get yesterday's local date string 'YYYY-MM-DD'
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return getLocalDateString(yesterday)
}

/**
 * Calculate level number, title, progress bar percentage from total XP.
 * Rule: 100 XP per level.
 */
export function calculateLevelInfo(totalXP: number): LevelInfo {
  const validXP = Math.max(0, totalXP || 0)
  const level = Math.floor(validXP / 100) + 1
  const currentLevelXP = validXP % 100
  const nextLevelXP = 100
  const percentage = Math.min(100, Math.round((currentLevelXP / nextLevelXP) * 100))

  const tierIndex = Math.min(level - 1, LEVEL_TIERS.length - 1)
  const tier = LEVEL_TIERS[tierIndex]

  return {
    level,
    title: tier.title,
    japaneseTitle: tier.japaneseTitle,
    icon: tier.icon,
    currentLevelXP,
    nextLevelXP,
    percentage,
    totalXP: validXP,
  }
}

/**
 * Evaluates streak status on application load.
 * If user hasn't trained today or yesterday, streak is reset to 0.
 */
export function evaluateStreak(lastActiveDate: string | null, currentStreak: number): number {
  if (!lastActiveDate || currentStreak <= 0) return 0

  const today = getLocalDateString()
  const yesterday = getYesterdayDateString()

  if (lastActiveDate === today || lastActiveDate === yesterday) {
    return currentStreak
  }

  // Broken streak (more than 1 day missed)
  return 0
}

/**
 * Update daily streak upon completing a learning activity today.
 */
export function updateStreakOnActivity(
  lastActiveDate: string | null,
  currentStreak: number
): { newStreak: number; newDate: string } {
  const today = getLocalDateString()
  const yesterday = getYesterdayDateString()

  if (lastActiveDate === today) {
    // Already active today, streak remains steady
    return { newStreak: Math.max(1, currentStreak), newDate: today }
  }

  if (lastActiveDate === yesterday) {
    // Continued streak from yesterday
    return { newStreak: currentStreak + 1, newDate: today }
  }

  // First day or streak was reset
  return { newStreak: 1, newDate: today }
}

/**
 * Read gamification state from localStorage
 */
export function loadGamificationFromStorage(): GamificationState {
  if (typeof window === 'undefined') {
    return {
      currentXP: 0,
      currentLevel: 1,
      dailyStreak: 0,
      lastActiveDate: null,
    }
  }

  try {
    const raw = localStorage.getItem(GAMIFICATION_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const currentXP = Number(parsed.currentXP) || 0
      const storedStreak = Number(parsed.dailyStreak) || 0
      const lastActiveDate = parsed.lastActiveDate || null
      const dailyStreak = evaluateStreak(lastActiveDate, storedStreak)
      const currentLevel = Math.floor(currentXP / 100) + 1

      return {
        currentXP,
        currentLevel,
        dailyStreak,
        lastActiveDate,
      }
    }
  } catch (err) {
    console.warn('Failed to load gamification state:', err)
  }

  return {
    currentXP: 0,
    currentLevel: 1,
    dailyStreak: 0,
    lastActiveDate: null,
  }
}

/**
 * Persist gamification state to localStorage and notify listeners
 */
export function saveGamificationToStorage(state: GamificationState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(state))
    window.dispatchEvent(new CustomEvent(GAMIFICATION_UPDATE_EVENT, { detail: state }))
  } catch (err) {
    console.warn('Failed to save gamification state:', err)
  }
}
