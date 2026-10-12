import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const audioDir = path.resolve(__dirname, '../public/audio/hiragana')
const manifestPath = path.join(audioDir, 'manifest.json')

if (!fs.existsSync(manifestPath)) {
  console.error('❌ File manifest.json tidak ditemukan di:', manifestPath)
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
const characters = manifest.characters || []

console.log('\n============================================================')
console.log('🎙️  PEMERIKSAAN FILE AUDIO NATIVE HIRAGANA (NIHONGO SORA)')
console.log('============================================================')
console.log(`Folder target: ${audioDir}\n`)

let foundCount = 0
let missingCount = 0

// Group by row_group
const rowGroups = {}
for (const char of characters) {
  const group = char.row_group || 'other'
  if (!rowGroups[group]) rowGroups[group] = []
  rowGroups[group].push(char)
}

for (const [groupName, chars] of Object.entries(rowGroups)) {
  console.log(`📂 Baris: [${groupName.toUpperCase()}]`)
  for (const char of chars) {
    const filePath = path.join(audioDir, char.file)
    const exists = fs.existsSync(filePath)
    if (exists) {
      foundCount++
      console.log(`   ✅ ${char.symbol} (/${char.romaji}/) -> ${char.file} [Native MP3 Siap]`)
    } else {
      missingCount++
      console.log(`   🟡 ${char.symbol} (/${char.romaji}/) -> ${char.file} [Belum ada - Menggunakan Web Speech Fallback]`)
    }
  }
  console.log('')
}

console.log('------------------------------------------------------------')
console.log(`📊 Total Karakter     : ${characters.length}`)
console.log(`✅ File Native Siap   : ${foundCount} file`)
console.log(`🟡 Mode Fallback TTS  : ${missingCount} file`)
console.log('------------------------------------------------------------')

if (foundCount === characters.length) {
  console.log('🎉 Sempurna! Seluruh 46 file audio penutur asli telah lengkap!\n')
} else {
  console.log(`💡 Info: Anda dapat meletakkan file .mp3 di "public/audio/hiragana/"`)
  console.log(`   File yang belum ada akan tetap bersuara normal menggunakan Web Speech API ja-JP.\n`)
}
