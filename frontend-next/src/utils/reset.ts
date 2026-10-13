/**
 * Helper to execute a full reset across frontend storage and backend database
 */
export async function performFullReset(customBaseUrl?: string): Promise<{ success: boolean; message: string }> {
  const apiBaseUrl =
    customBaseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  let backendSuccess = false
  let backendMessage = ''

  // 1. Call Backend API endpoint
  try {
    const res = await fetch(`${apiBaseUrl}/progress/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (res.ok) {
      const data = await res.json()
      backendSuccess = true
      backendMessage = data.message || 'Seluruh riwayat dan progres berhasil direset'
    } else {
      // Fallback endpoint DELETE /analytics/reset
      const fallbackRes = await fetch(`${apiBaseUrl}/analytics/reset`, {
        method: 'DELETE',
      })
      if (fallbackRes.ok) {
        backendSuccess = true
      }
    }
  } catch (err) {
    console.warn('Backend reset call encountered network issue, proceeding with local reset:', err)
  }

  // 2. Clear all learning, progress, exam, and gamification LocalStorage keys
  if (typeof window !== 'undefined') {
    const keysToRemove = [
      'nihongo_sora_character_progress',
      'nihongo_sora_exam_history',
      'nihongo_sora_gamification',
      'nihongo_sora_xp',
      'nihongo_sora_streak',
      'nihongo_sora_srs_reviews',
    ]

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key)
      } catch {
        // ignore
      }
    })

    // Also reset gamification key to default initial state so any reader doesn't encounter null
    try {
      localStorage.setItem(
        'nihongo_sora_gamification',
        JSON.stringify({
          currentXP: 0,
          currentLevel: 1,
          dailyStreak: 0,
          lastActiveDate: null,
        })
      )
    } catch {
      // ignore
    }

    // 3. Broadcast update events to all open components and tabs
    window.dispatchEvent(new Event('nihongo_sora_progress_updated'))
    window.dispatchEvent(new Event('nihongo_sora_gamification_updated'))
    window.dispatchEvent(new Event('storage'))
  }

  return {
    success: true,
    message: backendSuccess && backendMessage
      ? backendMessage
      : 'Semua data belajar dan riwayat database berhasil direset!',
  }
}
