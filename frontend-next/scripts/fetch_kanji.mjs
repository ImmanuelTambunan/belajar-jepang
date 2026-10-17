import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const kanjiDefinitions = [
  // Angka (13 kanji)
  {
    id: 1,
    character: '一',
    hex: '04e00',
    jlpt_level: 'N5',
    stroke_count: 1,
    onyomi: 'イチ, イツ',
    kunyomi: 'ひと, ひと・つ',
    meaning_id: 'Satu',
    meaning_en: 'One',
    category: 'numbers',
    examples: [
      { word: '一つ', reading: 'ひとつ', meaning_id: 'Satu buah', meaning_en: 'One (thing)' },
      { word: '一日', reading: 'ついたち / いちにち', meaning_id: 'Tanggal satu / satu hari', meaning_en: 'First of month / one day' },
      { word: '一人', reading: 'ひとり', meaning_id: 'Satu orang (sendiri)', meaning_en: 'One person (alone)' }
    ]
  },
  {
    id: 2,
    character: '二',
    hex: '04e8c',
    jlpt_level: 'N5',
    stroke_count: 2,
    onyomi: 'ニ, ジ',
    kunyomi: 'ふた, ふた・つ',
    meaning_id: 'Dua',
    meaning_en: 'Two',
    category: 'numbers',
    examples: [
      { word: '二つ', reading: 'ふたつ', meaning_id: 'Dua buah', meaning_en: 'Two (things)' },
      { word: '二日', reading: 'ふつか', meaning_id: 'Tanggal dua / dua hari', meaning_en: 'Second day / two days' },
      { word: '二人', reading: 'ふたり', meaning_id: 'Dua orang', meaning_en: 'Two people' }
    ]
  },
  {
    id: 3,
    character: '三',
    hex: '04e09',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'サン',
    kunyomi: 'み, み・つ, みっ・つ',
    meaning_id: 'Tiga',
    meaning_en: 'Three',
    category: 'numbers',
    examples: [
      { word: '三つ', reading: 'みっつ', meaning_id: 'Tiga buah', meaning_en: 'Three (things)' },
      { word: '三日', reading: 'みっか', meaning_id: 'Tanggal tiga / tiga hari', meaning_en: 'Third day / three days' },
      { word: '三角', reading: 'さんかく', meaning_id: 'Segitiga', meaning_en: 'Triangle' }
    ]
  },
  {
    id: 4,
    character: '四',
    hex: '056db',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'シ',
    kunyomi: 'よ, よ・つ, よっ・つ, よん',
    meaning_id: 'Empat',
    meaning_en: 'Four',
    category: 'numbers',
    examples: [
      { word: '四つ', reading: 'よっつ', meaning_id: 'Empat buah', meaning_en: 'Four (things)' },
      { word: '四日', reading: 'よっか', meaning_id: 'Tanggal empat / empat hari', meaning_en: 'Fourth day / four days' },
      { word: '四月', reading: 'しがつ', meaning_id: 'Bulan April', meaning_en: 'April' }
    ]
  },
  {
    id: 5,
    character: '五',
    hex: '04e94',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'ゴ',
    kunyomi: 'いつ, いつ・つ',
    meaning_id: 'Lima',
    meaning_en: 'Five',
    category: 'numbers',
    examples: [
      { word: '五つ', reading: 'いつつ', meaning_id: 'Lima buah', meaning_en: 'Five (things)' },
      { word: '五日', reading: 'いつか', meaning_id: 'Tanggal lima / lima hari', meaning_en: 'Fifth day / five days' },
      { word: '五月', reading: 'ごがつ', meaning_id: 'Bulan Mei', meaning_en: 'May' }
    ]
  },
  {
    id: 6,
    character: '六',
    hex: '0516d',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'ロク, リク',
    kunyomi: 'む, む・つ, むっ・つ, むい',
    meaning_id: 'Enam',
    meaning_en: 'Six',
    category: 'numbers',
    examples: [
      { word: '六つ', reading: 'むっつ', meaning_id: 'Enam buah', meaning_en: 'Six (things)' },
      { word: '六日', reading: 'むいか', meaning_id: 'Tanggal enam / enam hari', meaning_en: 'Sixth day / six days' },
      { word: '六月', reading: 'ろくがつ', meaning_id: 'Bulan Juni', meaning_en: 'June' }
    ]
  },
  {
    id: 7,
    character: '七',
    hex: '04e03',
    jlpt_level: 'N5',
    stroke_count: 2,
    onyomi: 'シチ',
    kunyomi: 'なな, なな・つ, なの',
    meaning_id: 'Tujuh',
    meaning_en: 'Seven',
    category: 'numbers',
    examples: [
      { word: '七つ', reading: 'ななつ', meaning_id: 'Tujuh buah', meaning_en: 'Seven (things)' },
      { word: '七日', reading: 'なのか', meaning_id: 'Tanggal tujuh / tujuh hari', meaning_en: 'Seventh day / seven days' },
      { word: '七月', reading: 'しちがつ', meaning_id: 'Bulan Juli', meaning_en: 'July' }
    ]
  },
  {
    id: 8,
    character: '八',
    hex: '0516b',
    jlpt_level: 'N5',
    stroke_count: 2,
    onyomi: 'ハチ',
    kunyomi: 'や, や・つ, やっ・つ, よう',
    meaning_id: 'Delapan',
    meaning_en: 'Eight',
    category: 'numbers',
    examples: [
      { word: '八つ', reading: 'やっつ', meaning_id: 'Delapan buah', meaning_en: 'Eight (things)' },
      { word: '八日', reading: 'ようか', meaning_id: 'Tanggal delapan / delapan hari', meaning_en: 'Eighth day / eight days' },
      { word: '八百屋', reading: 'やおや', meaning_id: 'Toko sayur / buah', meaning_en: 'Greengrocer' }
    ]
  },
  {
    id: 9,
    character: '九',
    hex: '04e5d',
    jlpt_level: 'N5',
    stroke_count: 2,
    onyomi: 'キュウ, ク',
    kunyomi: 'ここの, ここの・つ',
    meaning_id: 'Sembilan',
    meaning_en: 'Nine',
    category: 'numbers',
    examples: [
      { word: '九つ', reading: 'ここのつ', meaning_id: 'Sembilan buah', meaning_en: 'Nine (things)' },
      { word: '九日', reading: 'ここのか', meaning_id: 'Tanggal sembilan / sembilan hari', meaning_en: 'Ninth day / nine days' },
      { word: '九月', reading: 'くがつ', meaning_id: 'Bulan September', meaning_en: 'September' }
    ]
  },
  {
    id: 10,
    character: '十',
    hex: '05341',
    jlpt_level: 'N5',
    stroke_count: 2,
    onyomi: 'ジュウ, ジッ',
    kunyomi: 'とお, と',
    meaning_id: 'Sepuluh',
    meaning_en: 'Ten',
    category: 'numbers',
    examples: [
      { word: '十', reading: 'とお / じゅう', meaning_id: 'Sepuluh', meaning_en: 'Ten' },
      { word: '十日', reading: 'とおか', meaning_id: 'Tanggal sepuluh / sepuluh hari', meaning_en: 'Tenth day / ten days' },
      { word: '十分', reading: 'じゅっぷん / じっぷん', meaning_id: 'Sepuluh menit', meaning_en: 'Ten minutes' }
    ]
  },
  {
    id: 11,
    character: '百',
    hex: '0767e',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'ヒャク, ビャク',
    kunyomi: 'もも',
    meaning_id: 'Ratus, seratus',
    meaning_en: 'Hundred',
    category: 'numbers',
    examples: [
      { word: '百', reading: 'ひゃく', meaning_id: 'Seratus', meaning_en: 'Hundred' },
      { word: '三百', reading: 'さんびゃく', meaning_id: 'Tiga ratus', meaning_en: 'Three hundred' },
      { word: '六百', reading: 'ろっぴゃく', meaning_id: 'Enam ratus', meaning_en: 'Six hundred' }
    ]
  },
  {
    id: 12,
    character: '千',
    hex: '05343',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'セン',
    kunyomi: 'ち',
    meaning_id: 'Ribu, seribu',
    meaning_en: 'Thousand',
    category: 'numbers',
    examples: [
      { word: '千', reading: 'せん', meaning_id: 'Seribu', meaning_en: 'Thousand' },
      { word: '三千', reading: 'さんぜん', meaning_id: 'Tiga ribu', meaning_en: 'Three thousand' },
      { word: '千円', reading: 'せんえん', meaning_id: 'Seribu yen', meaning_en: 'One thousand yen' }
    ]
  },
  {
    id: 13,
    character: '万',
    hex: '04e07',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'マン, バン',
    kunyomi: 'よろず',
    meaning_id: 'Puluh ribu, sepuluh ribu',
    meaning_en: 'Ten thousand',
    category: 'numbers',
    examples: [
      { word: '一万', reading: 'いちまん', meaning_id: 'Sepuluh ribu', meaning_en: 'Ten thousand' },
      { word: '万国', reading: 'ばんこく', meaning_id: 'Semua bangsa / dunia', meaning_en: 'All countries / universal' },
      { word: '万年筆', reading: 'まんねんひつ', meaning_id: 'Pena air / fountain pen', meaning_en: 'Fountain pen' }
    ]
  },

  // Waktu & Alam (10 kanji)
  {
    id: 14,
    character: '日',
    hex: '065e5',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'ニチ, ジツ',
    kunyomi: 'ひ, -び, -か',
    meaning_id: 'Matahari, hari',
    meaning_en: 'Sun, day',
    category: 'calendar_time',
    examples: [
      { word: '日曜日', reading: 'にちようび', meaning_id: 'Hari Minggu', meaning_en: 'Sunday' },
      { word: '日本', reading: 'にほん / にっぽん', meaning_id: 'Jepang', meaning_en: 'Japan' },
      { word: '今日', reading: 'きょう', meaning_id: 'Hari ini', meaning_en: 'Today' }
    ]
  },
  {
    id: 15,
    character: '月',
    hex: '06708',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'ゲツ, ガツ',
    kunyomi: 'つき',
    meaning_id: 'Bulan',
    meaning_en: 'Moon, month',
    category: 'calendar_time',
    examples: [
      { word: '月曜日', reading: 'げつようび', meaning_id: 'Hari Senin', meaning_en: 'Monday' },
      { word: '今月', reading: 'こんげつ', meaning_id: 'Bulan ini', meaning_en: 'This month' },
      { word: '一月', reading: 'いちがつ', meaning_id: 'Bulan Januari', meaning_en: 'January' }
    ]
  },
  {
    id: 16,
    character: '火',
    hex: '0706b',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'カ',
    kunyomi: 'ひ, -び, ほ-',
    meaning_id: 'Api',
    meaning_en: 'Fire',
    category: 'calendar_time',
    examples: [
      { word: '火曜日', reading: 'かようび', meaning_id: 'Hari Selasa', meaning_en: 'Tuesday' },
      { word: '火事', reading: 'かじ', meaning_id: 'Kebakaran', meaning_en: 'Fire (conflagration)' },
      { word: '花火', reading: 'はなび', meaning_id: 'Kembang api', meaning_en: 'Fireworks' }
    ]
  },
  {
    id: 17,
    character: '水',
    hex: '06c34',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'スイ',
    kunyomi: 'みず, みず-',
    meaning_id: 'Air',
    meaning_en: 'Water',
    category: 'calendar_time',
    examples: [
      { word: '水曜日', reading: 'すいようび', meaning_id: 'Hari Rabu', meaning_en: 'Wednesday' },
      { word: '水', reading: 'みず', meaning_id: 'Air minum', meaning_en: 'Water' },
      { word: '水泳', reading: 'すいえい', meaning_id: 'Berenang', meaning_en: 'Swimming' }
    ]
  },
  {
    id: 18,
    character: '木',
    hex: '06728',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'ボク, モク',
    kunyomi: 'き, こ-',
    meaning_id: 'Pohon, kayu',
    meaning_en: 'Tree, wood',
    category: 'calendar_time',
    examples: [
      { word: '木曜日', reading: 'もくようび', meaning_id: 'Hari Kamis', meaning_en: 'Thursday' },
      { word: '木', reading: 'き', meaning_id: 'Pohon', meaning_en: 'Tree' },
      { word: '木造', reading: 'もくぞう', meaning_id: 'Terbuat dari kayu', meaning_en: 'Wooden construction' }
    ]
  },
  {
    id: 19,
    character: '金',
    hex: '091d1',
    jlpt_level: 'N5',
    stroke_count: 8,
    onyomi: 'キン, コン',
    kunyomi: 'かね, かな-',
    meaning_id: 'Emas, uang, logam',
    meaning_en: 'Gold, money, metal',
    category: 'calendar_time',
    examples: [
      { word: '金曜日', reading: 'きんようび', meaning_id: 'Hari Jumat', meaning_en: 'Friday' },
      { word: 'お金', reading: 'おかね', meaning_id: 'Uang', meaning_en: 'Money' },
      { word: '金魚', reading: 'きんぎょ', meaning_id: 'Ikan mas', meaning_en: 'Goldfish' }
    ]
  },
  {
    id: 20,
    character: '土',
    hex: '0571f',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'ド, ト',
    kunyomi: 'つち',
    meaning_id: 'Tanah, bumi',
    meaning_en: 'Earth, soil',
    category: 'calendar_time',
    examples: [
      { word: '土曜日', reading: 'どようび', meaning_id: 'Hari Sabtu', meaning_en: 'Saturday' },
      { word: '土地', reading: 'とち', meaning_id: 'Tanah / lahan', meaning_en: 'Land / estate' },
      { word: '土', reading: 'つち', meaning_id: 'Tanah', meaning_en: 'Earth / soil' }
    ]
  },
  {
    id: 21,
    character: '年',
    hex: '05e74',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'ネン',
    kunyomi: 'とし',
    meaning_id: 'Tahun',
    meaning_en: 'Year',
    category: 'calendar_time',
    examples: [
      { word: '今年', reading: 'ことし', meaning_id: 'Tahun ini', meaning_en: 'This year' },
      { word: '来年', reading: 'らいねん', meaning_id: 'Tahun depan', meaning_en: 'Next year' },
      { word: '一年', reading: 'いちねん', meaning_id: 'Satu tahun', meaning_en: 'One year' }
    ]
  },
  {
    id: 22,
    character: '時',
    hex: '06642',
    jlpt_level: 'N5',
    stroke_count: 10,
    onyomi: 'ジ',
    kunyomi: 'とき, -どき',
    meaning_id: 'Waktu, jam',
    meaning_en: 'Time, hour',
    category: 'calendar_time',
    examples: [
      { word: '時間', reading: 'じかん', meaning_id: 'Waktu / durasi jam', meaning_en: 'Time / hours' },
      { word: '時計', reading: 'とけい', meaning_id: 'Jam dinding / tangan', meaning_en: 'Clock / watch' },
      { word: '時々', reading: 'ときどき', meaning_id: 'Kadang-kadang', meaning_en: 'Sometimes' }
    ]
  },
  {
    id: 23,
    character: '分',
    hex: '05206',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'ブン, フン, ブ',
    kunyomi: 'わ・ける, わ・かる',
    meaning_id: 'Menit, bagian, mengerti',
    meaning_en: 'Minute, part, divide',
    category: 'calendar_time',
    examples: [
      { word: '五分', reading: 'ごふん', meaning_id: 'Lima menit', meaning_en: 'Five minutes' },
      { word: '分かる', reading: 'わかる', meaning_id: 'Mengerti / paham', meaning_en: 'To understand' },
      { word: '半分', reading: 'はんぶん', meaning_id: 'Setengah bagian', meaning_en: 'Half' }
    ]
  }
]

function extractPathsFromSvg(svgContent) {
  const paths = []
  // Matches all <path d="..." inside svg
  const regex = /<path[^>]+d="([^"]+)"/g
  let match
  while ((match = regex.exec(svgContent)) !== null) {
    paths.push(match[1])
  }
  return paths
}

async function run() {
  console.log('🚀 Mengambil data goresan KanjiVG untuk 23 Kanji N5...')

  const results = []

  for (const item of kanjiDefinitions) {
    const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${item.hex}.svg`
    console.log(`Mengunduh Kanji ${item.character} (${item.hex}) dari ${url}...`)
    
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Gagal mengunduh ${url}: ${res.statusText}`)
    }
    const svgText = await res.text()
    const paths = extractPathsFromSvg(svgText)

    if (paths.length !== item.stroke_count) {
      console.warn(`⚠️ Peringatan: jumlah path (${paths.length}) tidak sama dengan stroke_count (${item.stroke_count}) untuk ${item.character}`)
    }

    results.push({
      id: item.id,
      character: item.character,
      jlpt_level: item.jlpt_level,
      stroke_count: item.stroke_count,
      onyomi: item.onyomi,
      kunyomi: item.kunyomi,
      meaning_id: item.meaning_id,
      meaning_en: item.meaning_en,
      category: item.category,
      strokes: paths,
      svg_strokes: JSON.stringify(paths),
      examples: item.examples
    })
  }

  // Output to backend-go/data/kanji_n5_batch1.json
  const backendDataPath = path.resolve(__dirname, '../../backend-go/data/kanji_n5_batch1.json')
  fs.writeFileSync(backendDataPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`✅ Berhasil menulis dataset backend ke ${backendDataPath}`)

  // Output to frontend-next/src/data/kanji_n5_batch1.json
  const frontendDataPath = path.resolve(__dirname, '../src/data/kanji_n5_batch1.json')
  fs.writeFileSync(frontendDataPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`✅ Berhasil menulis dataset frontend ke ${frontendDataPath}`)

  console.log('🎉 23 Kanji N5 Batch 1 siap digunakan!')
}

run().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
