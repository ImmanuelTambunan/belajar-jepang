import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const batch4Definitions = [
  // ==========================================
  // 1. Kata Kerja / Verba (14)
  // ==========================================
  {
    id: 76,
    character: '行',
    hex: '0884c',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'コウ, ギョウ',
    kunyomi: 'い-く, ゆ-く, おこな-う',
    meaning_id: 'Pergi, berjalan, melakukan',
    meaning_en: 'Go, conduct, carry out',
    category: 'verbs',
    examples: [
      { word: '行く', reading: 'いく', meaning_id: 'Pergi', meaning_en: 'To go' },
      { word: '旅行', reading: 'りょこう', meaning_id: 'Wisata / bepergian', meaning_en: 'Travel / trip' },
      { word: '銀行', reading: 'ぎんこう', meaning_id: 'Bank', meaning_en: 'Bank' }
    ]
  },
  {
    id: 77,
    character: '来',
    hex: '06765',
    jlpt_level: 'N5',
    stroke_count: 7,
    onyomi: 'ライ',
    kunyomi: 'く-る, きた-る',
    meaning_id: 'Datang, berikutnya',
    meaning_en: 'Come, next',
    category: 'verbs',
    examples: [
      { word: '来る', reading: 'くる', meaning_id: 'Datang', meaning_en: 'To come' },
      { word: '来年', reading: 'らいねん', meaning_id: 'Tahun depan', meaning_en: 'Next year' },
      { word: '来月', reading: 'らいげつ', meaning_id: 'Bulan depan', meaning_en: 'Next month' }
    ]
  },
  {
    id: 78,
    character: '帰',
    hex: '05e30',
    jlpt_level: 'N5',
    stroke_count: 10,
    onyomi: 'キ',
    kunyomi: 'かえ-る, かえ-す',
    meaning_id: 'Pulang, kembali',
    meaning_en: 'Return, go home',
    category: 'verbs',
    examples: [
      { word: '帰る', reading: 'かえる', meaning_id: 'Pulang ke rumah', meaning_en: 'To return home' },
      { word: '帰国', reading: 'きこく', meaning_id: 'Pulang ke tanah air', meaning_en: 'Return to one\'s country' },
      { word: '日帰り', reading: 'ひがえり', meaning_id: 'Perjalanan pulang-pergi satu hari', meaning_en: 'Day trip' }
    ]
  },
  {
    id: 79,
    character: '食',
    hex: '098df',
    jlpt_level: 'N5',
    stroke_count: 9,
    onyomi: 'ショク, ジキ',
    kunyomi: 'た-べる, く-う',
    meaning_id: 'Makan, makanan',
    meaning_en: 'Eat, food',
    category: 'verbs',
    examples: [
      { word: '食べる', reading: 'たべる', meaning_id: 'Makan', meaning_en: 'To eat' },
      { word: '食事', reading: 'しょくじ', meaning_id: 'Makan (kegiatan bersantap)', meaning_en: 'Meal' },
      { word: '朝食', reading: 'ちょうしょく', meaning_id: 'Sarapan', meaning_en: 'Breakfast' }
    ]
  },
  {
    id: 80,
    character: '飲',
    hex: '098f2',
    jlpt_level: 'N5',
    stroke_count: 12,
    onyomi: 'イン',
    kunyomi: 'の-む',
    meaning_id: 'Minum, minuman',
    meaning_en: 'Drink',
    category: 'verbs',
    examples: [
      { word: '飲む', reading: 'のむ', meaning_id: 'Minum', meaning_en: 'To drink' },
      { word: '飲み水', reading: 'のみみず', meaning_id: 'Air minum', meaning_en: 'Drinking water' },
      { word: '飲食店', reading: 'いんしょくてん', meaning_id: 'Restoran / tempat makan', meaning_en: 'Restaurant' }
    ]
  },
  {
    id: 81,
    character: '見',
    hex: '0898b',
    jlpt_level: 'N5',
    stroke_count: 7,
    onyomi: 'ケン',
    kunyomi: 'み-る, み-える, み-せる',
    meaning_id: 'Melihat, menonton, tampak',
    meaning_en: 'See, look, visible',
    category: 'verbs',
    examples: [
      { word: '見る', reading: 'みる', meaning_id: 'Melihat / menonton', meaning_en: 'To see / watch' },
      { word: '見学', reading: 'けんがく', meaning_id: 'Studi tur / kunjungan belajar', meaning_en: 'Field trip / inspection' },
      { word: '花見', reading: 'はなみ', meaning_id: 'Melihat bunga sakura', meaning_en: 'Cherry blossom viewing' }
    ]
  },
  {
    id: 82,
    character: '聞',
    hex: '0805e',
    jlpt_level: 'N5',
    stroke_count: 14,
    onyomi: 'ブン, モン',
    kunyomi: 'き-く, き-こえる',
    meaning_id: 'Mendengar, bertanya',
    meaning_en: 'Hear, listen, ask',
    category: 'verbs',
    examples: [
      { word: '聞く', reading: 'きく', meaning_id: 'Mendengarkan / bertanya', meaning_en: 'To hear / listen / ask' },
      { word: '新聞', reading: 'しんぶん', meaning_id: 'Koran / surat kabar', meaning_en: 'Newspaper' },
      { word: '聞こえる', reading: 'きこえる', meaning_id: 'Terdengar', meaning_en: 'Can be heard' }
    ]
  },
  {
    id: 83,
    character: '読',
    hex: '08aad',
    jlpt_level: 'N5',
    stroke_count: 14,
    onyomi: 'ドク, トク',
    kunyomi: 'よ-む',
    meaning_id: 'Membaca',
    meaning_en: 'Read',
    category: 'verbs',
    examples: [
      { word: '読む', reading: 'よむ', meaning_id: 'Membaca', meaning_en: 'To read' },
      { word: '読書', reading: 'どくしょ', meaning_id: 'Membaca buku (hobi)', meaning_en: 'Reading books' },
      { word: '読み方', reading: 'よみかた', meaning_id: 'Cara baca', meaning_en: 'Way of reading' }
    ]
  },
  {
    id: 84,
    character: '書',
    hex: '066f8',
    jlpt_level: 'N5',
    stroke_count: 10,
    onyomi: 'ショ',
    kunyomi: 'か-く',
    meaning_id: 'Menulis, dokumen, buku',
    meaning_en: 'Write, book, document',
    category: 'verbs',
    examples: [
      { word: '書く', reading: 'かく', meaning_id: 'Menulis', meaning_en: 'To write' },
      { word: '教科書', reading: 'きょうかしょ', meaning_id: 'Buku pelajaran', meaning_en: 'Textbook' },
      { word: '読書', reading: 'どくしょ', meaning_id: 'Membaca buku', meaning_en: 'Reading books' }
    ]
  },
  {
    id: 85,
    character: '話',
    hex: '08a71',
    jlpt_level: 'N5',
    stroke_count: 13,
    onyomi: 'ワ',
    kunyomi: 'はな-す, はなし',
    meaning_id: 'Berbicara, cerita',
    meaning_en: 'Talk, speak, story',
    category: 'verbs',
    examples: [
      { word: '話す', reading: 'はなす', meaning_id: 'Berbicara', meaning_en: 'To speak / talk' },
      { word: '会話', reading: 'かいわ', meaning_id: 'Percakapan', meaning_en: 'Conversation' },
      { word: '電話', reading: 'でんわ', meaning_id: 'Telepon', meaning_en: 'Telephone' }
    ]
  },
  {
    id: 86,
    character: '買',
    hex: '08cb7',
    jlpt_level: 'N5',
    stroke_count: 12,
    onyomi: 'バイ',
    kunyomi: 'か-う',
    meaning_id: 'Membeli',
    meaning_en: 'Buy',
    category: 'verbs',
    examples: [
      { word: '買う', reading: 'かう', meaning_id: 'Membeli', meaning_en: 'To buy' },
      { word: '買い物', reading: 'かいもの', meaning_id: 'Belanja', meaning_en: 'Shopping' },
      { word: '売買', reading: 'ばいばい', meaning_id: 'Jual beli', meaning_en: 'Buying and selling' }
    ]
  },
  {
    id: 87,
    character: '立',
    hex: '07acb',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'リツ, リュウ',
    kunyomi: 'た-つ, た-てる',
    meaning_id: 'Berdiri, mendirikan',
    meaning_en: 'Stand up, establish',
    category: 'verbs',
    examples: [
      { word: '立つ', reading: 'たつ', meaning_id: 'Berdiri', meaning_en: 'To stand' },
      { word: '国立', reading: 'こくりつ', meaning_id: 'Negeri / nasional', meaning_en: 'National' },
      { word: '私立', reading: 'しりつ', meaning_id: 'Swasta', meaning_en: 'Private' }
    ]
  },
  {
    id: 88,
    character: '休',
    hex: '04f11',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'キュウ',
    kunyomi: 'やす-む, やす-まる',
    meaning_id: 'Istirahat, libur',
    meaning_en: 'Rest, holiday',
    category: 'verbs',
    examples: [
      { word: '休む', reading: 'やすむ', meaning_id: 'Beristirahat / libur', meaning_en: 'To rest' },
      { word: '休み', reading: 'やすみ', meaning_id: 'Hari libur / istirahat', meaning_en: 'Holiday / rest' },
      { word: '休日', reading: 'きゅうじつ', meaning_id: 'Hari libur resmi', meaning_en: 'Day off' }
    ]
  },
  {
    id: 89,
    character: '入',
    hex: '05165',
    jlpt_level: 'N5',
    stroke_count: 2,
    onyomi: 'ニュウ',
    kunyomi: 'はい-る, い-れる',
    meaning_id: 'Masuk, memasukkan',
    meaning_en: 'Enter, insert',
    category: 'verbs',
    examples: [
      { word: '入る', reading: 'はいる', meaning_id: 'Masuk', meaning_en: 'To enter' },
      { word: '入口', reading: 'いりぐち', meaning_id: 'Pintu masuk', meaning_en: 'Entrance' },
      { word: '入学', reading: 'にゅうがく', meaning_id: 'Masuk sekolah / universitas', meaning_en: 'School admission' }
    ]
  },

  // ==========================================
  // 2. Kata Sifat (7)
  // ==========================================
  {
    id: 90,
    character: '高',
    hex: '09ad8',
    jlpt_level: 'N5',
    stroke_count: 10,
    onyomi: 'コウ',
    kunyomi: 'たか-い, たか-まる',
    meaning_id: 'Tinggi, mahal',
    meaning_en: 'High, tall, expensive',
    category: 'adjectives',
    examples: [
      { word: '高い', reading: 'たかい', meaning_id: 'Tinggi / mahal', meaning_en: 'Tall / expensive' },
      { word: '高校', reading: 'こうこう', meaning_id: 'SMA', meaning_en: 'High school' },
      { word: '円高', reading: 'えんだか', meaning_id: 'Penguatan nilai yen', meaning_en: 'Strong yen' }
    ]
  },
  {
    id: 91,
    character: '安',
    hex: '05b89',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'アン',
    kunyomi: 'やす-い',
    meaning_id: 'Murah, tenang, aman',
    meaning_en: 'Cheap, safe, peaceful',
    category: 'adjectives',
    examples: [
      { word: '安い', reading: 'やすい', meaning_id: 'Murah', meaning_en: 'Cheap' },
      { word: '安心', reading: 'あんしん', meaning_id: 'Lega / tenang hati', meaning_en: 'Relief / peace of mind' },
      { word: '安全', reading: 'あんぜん', meaning_id: 'Aman / keselamatan', meaning_en: 'Safe / safety' }
    ]
  },
  {
    id: 92,
    character: '新',
    hex: '065b0',
    jlpt_level: 'N5',
    stroke_count: 13,
    onyomi: 'シン',
    kunyomi: 'あたら-しい, あら-た',
    meaning_id: 'Baru',
    meaning_en: 'New',
    category: 'adjectives',
    examples: [
      { word: '新しい', reading: 'あたらしい', meaning_id: 'Baru', meaning_en: 'New' },
      { word: '新聞', reading: 'しんぶん', meaning_id: 'Surat kabar / koran', meaning_en: 'Newspaper' },
      { word: '新年', reading: 'しんねん', meaning_id: 'Tahun baru', meaning_en: 'New year' }
    ]
  },
  {
    id: 93,
    character: '古',
    hex: '053e4',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'コ',
    kunyomi: 'ふる-い, ふる-す',
    meaning_id: 'Lama, kuno, tua',
    meaning_en: 'Old, ancient',
    category: 'adjectives',
    examples: [
      { word: '古い', reading: 'ふるい', meaning_id: 'Lama / tua (benda)', meaning_en: 'Old' },
      { word: '中古', reading: 'ちゅうこ', meaning_id: 'Bekas / second-hand', meaning_en: 'Used / secondhand' },
      { word: '古代', reading: 'こだい', meaning_id: 'Zaman kuno', meaning_en: 'Ancient times' }
    ]
  },
  {
    id: 94,
    character: '多',
    hex: '0591a',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'タ',
    kunyomi: 'おお-い',
    meaning_id: 'Banyak',
    meaning_en: 'Many, much',
    category: 'adjectives',
    examples: [
      { word: '多い', reading: 'おおい', meaning_id: 'Banyak', meaning_en: 'Many' },
      { word: '多分', reading: 'たぶん', meaning_id: 'Mungkin / barangkali', meaning_en: 'Probably / perhaps' },
      { word: '多少', reading: 'たしょう', meaning_id: 'Sedikit banyak', meaning_en: 'More or less' }
    ]
  },
  {
    id: 95,
    character: '少',
    hex: '05c11',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'ショウ',
    kunyomi: 'すく-ない, すこ-し',
    meaning_id: 'Sedikit, sebentar',
    meaning_en: 'Few, little',
    category: 'adjectives',
    examples: [
      { word: '少ない', reading: 'すくない', meaning_id: 'Sedikit', meaning_en: 'Few / scarce' },
      { word: '少し', reading: 'すこし', meaning_id: 'Sedikit / sebentar', meaning_en: 'A little' },
      { word: '少年', reading: 'しょうねん', meaning_id: 'Anak laki-laki / pemuda', meaning_en: 'Boy / juvenile' }
    ]
  },
  {
    id: 96,
    character: '早',
    hex: '065e9',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'ソウ, サッ',
    kunyomi: 'はや-い, はや-まる',
    meaning_id: 'Cepat, awal, pagi',
    meaning_en: 'Early, fast',
    category: 'adjectives',
    examples: [
      { word: '早い', reading: 'はやい', meaning_id: 'Cepat (waktu) / lebih awal', meaning_en: 'Early' },
      { word: '早く', reading: 'はやく', meaning_id: 'Dengan cepat / segera', meaning_en: 'Early / soon' },
      { word: '早朝', reading: 'そうちょう', meaning_id: 'Pagi-pagi buta', meaning_en: 'Early morning' }
    ]
  },

  // ==========================================
  // 3. Arah Mata Angin, Posisi & Waktu (7)
  // ==========================================
  {
    id: 97,
    character: '東',
    hex: '06771',
    jlpt_level: 'N5',
    stroke_count: 8,
    onyomi: 'トウ',
    kunyomi: 'ひがし',
    meaning_id: 'Timur',
    meaning_en: 'East',
    category: 'cardinal_positions',
    examples: [
      { word: '東', reading: 'ひがし', meaning_id: 'Timur', meaning_en: 'East' },
      { word: '東京', reading: 'とうきょう', meaning_id: 'Tokyo', meaning_en: 'Tokyo' },
      { word: '東口', reading: 'ひがしぐち', meaning_id: 'Pintu keluar timur', meaning_en: 'East exit' }
    ]
  },
  {
    id: 98,
    character: '西',
    hex: '0897f',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'セイ, サイ',
    kunyomi: 'にし',
    meaning_id: 'Barat',
    meaning_en: 'West',
    category: 'cardinal_positions',
    examples: [
      { word: '西', reading: 'にし', meaning_id: 'Barat', meaning_en: 'West' },
      { word: '西口', reading: 'にしぐち', meaning_id: 'Pintu keluar barat', meaning_en: 'West exit' },
      { word: '関西', reading: 'かんさい', meaning_id: 'Wilayah Kansai', meaning_en: 'Kansai region' }
    ]
  },
  {
    id: 99,
    character: '南',
    hex: '05357',
    jlpt_level: 'N5',
    stroke_count: 9,
    onyomi: 'ナン, ナ',
    kunyomi: 'みなみ',
    meaning_id: 'Selatan',
    meaning_en: 'South',
    category: 'cardinal_positions',
    examples: [
      { word: '南', reading: 'みなみ', meaning_id: 'Selatan', meaning_en: 'South' },
      { word: '南口', reading: 'みなみぐち', meaning_id: 'Pintu keluar selatan', meaning_en: 'South exit' },
      { word: '東南アジア', reading: 'とうなんアジア', meaning_id: 'Asia Tenggara', meaning_en: 'Southeast Asia' }
    ]
  },
  {
    id: 100,
    character: '北',
    hex: '05317',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'ホク',
    kunyomi: 'きた',
    meaning_id: 'Utara',
    meaning_en: 'North',
    category: 'cardinal_positions',
    examples: [
      { word: '北', reading: 'きた', meaning_id: 'Utara', meaning_en: 'North' },
      { word: '北海道', reading: 'ほっかいどう', meaning_id: 'Hokkaido', meaning_en: 'Hokkaido' },
      { word: '北口', reading: 'きたぐち', meaning_id: 'Pintu keluar utara', meaning_en: 'North exit' }
    ]
  },
  {
    id: 101,
    character: '外',
    hex: '05916',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'ガイ, ゲ',
    kunyomi: 'そと, ほか, はず-す',
    meaning_id: 'Luar, selain',
    meaning_en: 'Outside, other',
    category: 'cardinal_positions',
    examples: [
      { word: '外', reading: 'そと', meaning_id: 'Luar', meaning_en: 'Outside' },
      { word: '外国', reading: 'がいこく', meaning_id: 'Luar negeri', meaning_en: 'Foreign country' },
      { word: '外国人', reading: 'がいこくじん', meaning_id: 'Orang asing / WNA', meaning_en: 'Foreigner' }
    ]
  },
  {
    id: 102,
    character: '間',
    hex: '09593',
    jlpt_level: 'N5',
    stroke_count: 12,
    onyomi: 'カン, ケン',
    kunyomi: 'あいだ, ま',
    meaning_id: 'Antara, jarak, selang waktu',
    meaning_en: 'Between, interval, space',
    category: 'cardinal_positions',
    examples: [
      { word: '間', reading: 'あいだ', meaning_id: 'Antara / jeda waktu', meaning_en: 'Between' },
      { word: '時間', reading: 'じかん', meaning_id: 'Waktu / jam', meaning_en: 'Time' },
      { word: '一週間', reading: 'いっしゅうかん', meaning_id: 'Satu minggu', meaning_en: 'One week' }
    ]
  },
  {
    id: 103,
    character: '半',
    hex: '0534a',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'ハン',
    kunyomi: 'なか-ば',
    meaning_id: 'Setengah, separuh',
    meaning_en: 'Half, middle',
    category: 'cardinal_positions',
    examples: [
      { word: '半分', reading: 'はんぶん', meaning_id: 'Setengah bagian', meaning_en: 'Half' },
      { word: '一時半', reading: 'いちじはん', meaning_id: 'Pukul 1.30 (setengah dua)', meaning_en: 'Half past one' },
      { word: '後半', reading: 'こうはん', meaning_id: 'Babak kedua / paruh akhir', meaning_en: 'Second half' }
    ]
  }
]

function extractPathsFromSvg(svgText) {
  const pathRegex = /<path[^>]*d="([^"]+)"[^>]*>/g
  const paths = []
  let match
  while ((match = pathRegex.exec(svgText)) !== null) {
    paths.push(match[1])
  }
  return paths
}

async function run() {
  console.log('🚀 Membaca dataset Batch 1..3 yang sudah ada...')
  const batch1Path = path.resolve(__dirname, '../src/data/kanji_n5_batch1.json')
  const batch1Data = JSON.parse(fs.readFileSync(batch1Path, 'utf-8'))
  console.log(`📦 Saat ini dataset memiliki ${batch1Data.length} kanji.`)

  const results = [...batch1Data]

  console.log(`🚀 Mengunduh 28 KanjiVG SVG untuk Batch 4...`)
  for (const item of batch4Definitions) {
    const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${item.hex}.svg`
    console.log(`[${item.id}/103] Mengambil ${item.character} (${item.hex}) dari ${url}...`)

    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Gagal fetch ${item.character} (${url}): HTTP ${res.status}`)
    }
    const svgText = await res.text()
    const paths = extractPathsFromSvg(svgText)

    if (paths.length !== item.stroke_count) {
      console.warn(`⚠️ Peringatan: jumlah path (${paths.length}) berbeda dengan stroke_count (${item.stroke_count}) untuk ${item.character}`)
    }

    results.push({
      id: item.id,
      character: item.character,
      jlpt_level: item.jlpt_level,
      stroke_count: paths.length,
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

  // Write updated 103-kanji dataset to backend-go
  const backendDataPath = path.resolve(__dirname, '../../backend-go/data/kanji_n5_batch1.json')
  fs.writeFileSync(backendDataPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`✅ Berhasil menulis dataset 103 Kanji ke ${backendDataPath}`)

  // Write updated 103-kanji dataset to frontend-next
  fs.writeFileSync(batch1Path, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`✅ Berhasil menulis dataset 103 Kanji ke ${batch1Path}`)

  console.log(`🎉 Total Kanji N5 aktif sekarang: ${results.length} karakter (100% COMPLETE)!`)
}

run().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
