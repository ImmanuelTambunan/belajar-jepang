import { CharacterData } from '@/types/character'
import { ExamConfig, ExamOption, ExamQuestion, ExamQuestionType, ExamScope } from '@/types/exam'

// Fisher-Yates array shuffle helper
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Filters character candidates based on category scope (Gojuon, Dakuon/Handakuon, Yoon, or All).
 */
export function filterCandidatesByScope(
  characters: CharacterData[],
  scope?: ExamScope
): CharacterData[] {
  if (!scope || scope === 'all') return characters
  if (scope === 'gojuon') {
    return characters.filter((c) => !c.category || c.category === 'gojuon')
  }
  if (scope === 'dakuon_handakuon') {
    return characters.filter(
      (c) => c.category === 'dakuon' || c.category === 'handakuon'
    )
  }
  if (scope === 'yoon') {
    return characters.filter((c) => c.category === 'yoon')
  }
  return characters
}

/**
 * Filters character candidates based on the selected row group configuration.
 */
export function filterCandidatesByRow(
  characters: CharacterData[],
  rowGroup: string
): CharacterData[] {
  if (rowGroup === 'all') return characters

  switch (rowGroup) {
    case 'vowel_ka':
      return characters.filter(
        (c) => c.row_group === 'vowel' || c.row_group === 'ka'
      )
    case 'sa_ta':
      return characters.filter(
        (c) => c.row_group === 'sa' || c.row_group === 'ta'
      )
    case 'na_ha_ma':
      return characters.filter(
        (c) =>
          c.row_group === 'na' ||
          c.row_group === 'ha' ||
          c.row_group === 'ma'
      )
    case 'ya_ra_wa_n':
      return characters.filter(
        (c) =>
          c.row_group === 'ya' ||
          c.row_group === 'ra' ||
          c.row_group === 'wa' ||
          c.row_group === 'n'
      )
    default:
      return characters
  }
}

/**
 * Generates randomized multiple choice options with 1 correct answer and 3 distractors.
 */
function generateOptions(
  target: CharacterData,
  pool: CharacterData[]
): ExamOption[] {
  const targetOption: ExamOption = {
    id: target.id,
    symbol: target.character || target.symbol || '',
    romaji: target.readings?.[0]?.romaji || '-',
  }

  // Filter distractors pool
  const distractorsPool = pool.filter((c) => c.id !== target.id)
  const shuffledPool = shuffleArray(distractorsPool)

  const selectedDistractors: ExamOption[] = shuffledPool.slice(0, 3).map((c) => ({
    id: c.id,
    symbol: c.character || c.symbol || '',
    romaji: c.readings?.[0]?.romaji || '-',
  }))

  return shuffleArray([targetOption, ...selectedDistractors])
}

/**
 * Assembles a dynamic quiz question set based on user's exam configuration.
 */
export function generateExamQuestions(
  allCharacters: CharacterData[],
  config: ExamConfig
): ExamQuestion[] {
  if (!allCharacters || allCharacters.length === 0) return []

  const scopedCharacters = filterCandidatesByScope(allCharacters, config.scope)
  const candidates = filterCandidatesByRow(scopedCharacters, config.rowGroup)
  if (candidates.length === 0) return []

  // Ensure enabledTypes has at least one type
  const availableTypes: ExamQuestionType[] =
    config.enabledTypes.length > 0
      ? config.enabledTypes
      : ['romaji_to_kana', 'kana_to_romaji']

  // Shuffle candidates and pick required count
  const shuffledCandidates = shuffleArray(candidates)
  const selectedChars = shuffledCandidates.slice(
    0,
    Math.min(config.questionCount, shuffledCandidates.length)
  )

  const questions: ExamQuestion[] = selectedChars.map((char, index) => {
    // Pick question type randomly or in rotation
    const chosenType =
      availableTypes[Math.floor(Math.random() * availableTypes.length)]

    let options: ExamOption[] | undefined
    if (chosenType === 'romaji_to_kana' || chosenType === 'kana_to_romaji') {
      options = generateOptions(char, allCharacters)
    }

    return {
      id: index + 1,
      type: chosenType,
      targetCharacter: char,
      options,
      correctAnswerId: char.id,
      timeSpentSeconds: 0,
    }
  })

  return questions
}

/**
 * Formulates the letter grade and Japanese praise based on accuracy percentage.
 */
export function calculateExamGrade(score: number): {
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  gradeLabel: string
  gradeJapanese: string
  badgeColor: string
} {
  if (score >= 90) {
    return {
      grade: 'S',
      gradeLabel: 'Sempurna! Nilai Istimewa',
      gradeJapanese: '大変よくできました (S)',
      badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    }
  }
  if (score >= 75) {
    return {
      grade: 'A',
      gradeLabel: 'Lulus Sangat Memuaskan',
      gradeJapanese: 'よくできました (A)',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    }
  }
  if (score >= 60) {
    return {
      grade: 'B',
      gradeLabel: 'Lulus Kompeten',
      gradeJapanese: '合格 • もうすこし (B)',
      badgeColor: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
    }
  }
  if (score >= 45) {
    return {
      grade: 'C',
      gradeLabel: 'Perlu Penguatan',
      gradeJapanese: 'がんばりましょう (C)',
      badgeColor: 'text-amber-600 bg-amber-600/10 border-amber-600/30',
    }
  }
  return {
    grade: 'D',
    gradeLabel: 'Belum Lulus (Perlu Diulang)',
    gradeJapanese: 'もういちど練習しましょう (D)',
    badgeColor: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
  }
}
