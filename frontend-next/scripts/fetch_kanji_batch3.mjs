import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const batch3Definitions = [
  // 1. Alam & Cuaca (8)
  {
    id: 49,
    character: '山',
    hex: '05c71',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'サン, セン',
    kunyomi: 'やま',
    meaning_id: 'Gunung',
    meaning_en: 'Mountain',
    category: 'nature_weather',
    examples: [
      { word: '富士山', reading: 'ふじさん', meaning_id: 'Gunung Fuji', meaning_en: 'Mount Fuji' },
      { word: '山道', reading: 'やまみち', meaning_id: 'Jalan pegunungan', meaning_en: 'Mountain road' },
      { word: '火山', reading: 'かざん', meaning_id: 'Gunung berapi', meaning_en: 'Volcano' }
    ]
  },
  {
    id: 50,
    character: '川',
    hex: '05ddd',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'セン',
    kunyomi: 'かわ',
    meaning_id: 'Sungai',
    meaning_en: 'River',
    category: 'nature_weather',
    examples: [
      { word: '川', reading: 'かわ', meaning_id: 'Sungai', meaning_en: 'River' },
      { word: '小川', reading: 'おがわ', meaning_id: 'Sungai kecil / anak sungai', meaning_en: 'Stream / brook' },
      { word: 'ナイル川', reading: 'ナイルがわ', meaning_id: 'Sungai Nil', meaning_en: 'Nile River' }
    ]
  },
  {
    id: 51,
    character: '田',
    hex: '07530',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'デン',
    kunyomi: 'た',
    meaning_id: 'Sawah, ladang padi',
    meaning_en: 'Rice field, paddy',
    category: 'nature_weather',
    examples: [
      { word: '水田', reading: 'すいでん', meaning_id: 'Sawah berair', meaning_en: 'Water-filled paddy' },
      { word: '田んぼ', reading: 'たんぼ', meaning_id: 'Sawah ladang', meaning_en: 'Rice field' },
      { word: '田舎', reading: 'いなか', meaning_id: 'Pedesaan', meaning_en: 'Countryside' }
    ]
  },
  {
    id: 52,
    character: '天',
    hex: '05929',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'テン',
    kunyomi: 'あま, あめ',
    meaning_id: 'Langit, surga, cuaca',
    meaning_en: 'Heaven, sky',
    category: 'nature_weather',
    examples: [
      { word: '天気', reading: 'てんき', meaning_id: 'Cuaca', meaning_en: 'Weather' },
      { word: '天国', reading: 'てんごく', meaning_id: 'Surga', meaning_en: 'Heaven' },
      { word: '天才', reading: 'てんさい', meaning_id: 'Jenius', meaning_en: 'Genius' }
    ]
  },
  {
    id: 53,
    character: '気',
    hex: '06c17',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'キ, ケ',
    kunyomi: 'いき',
    meaning_id: 'Jiwa, semangat, udara, suasana',
    meaning_en: 'Spirit, mind, air, mood',
    category: 'nature_weather',
    examples: [
      { word: '元気', reading: 'げんき', meaning_id: 'Sehat / bugar / bersemangat', meaning_en: 'Healthy / energetic' },
      { word: '天気', reading: 'てんき', meaning_id: 'Cuaca', meaning_en: 'Weather' },
      { word: '気分', reading: 'きぶん', meaning_id: 'Perasaan / suasana hati', meaning_en: 'Mood / feeling' }
    ]
  },
  {
    id: 54,
    character: '雨',
    hex: '096e8',
    jlpt_level: 'N5',
    stroke_count: 8,
    onyomi: 'ウ',
    kunyomi: 'あめ, あま',
    meaning_id: 'Hujan',
    meaning_en: 'Rain',
    category: 'nature_weather',
    examples: [
      { word: '雨', reading: 'あめ', meaning_id: 'Hujan', meaning_en: 'Rain' },
      { word: '大雨', reading: 'おおあめ', meaning_id: 'Hujan lebat', meaning_en: 'Heavy rain' },
      { word: '雨水', reading: 'あまみず', meaning_id: 'Air hujan', meaning_en: 'Rainwater' }
    ]
  },
  {
    id: 55,
    character: '花',
    hex: '082b1',
    jlpt_level: 'N5',
    stroke_count: 7,
    onyomi: 'カ, ケ',
    kunyomi: 'はな',
    meaning_id: 'Bunga',
    meaning_en: 'Flower',
    category: 'nature_weather',
    examples: [
      { word: '花', reading: 'はな', meaning_id: 'Bunga', meaning_en: 'Flower' },
      { word: '花火', reading: 'はなび', meaning_id: 'Kembang api', meaning_en: 'Fireworks' },
      { word: '花見', reading: 'はなみ', meaning_id: 'Melihat bunga sakura', meaning_en: 'Cherry blossom viewing' }
    ]
  },
  {
    id: 56,
    character: '空',
    hex: '07a7a',
    jlpt_level: 'N5',
    stroke_count: 8,
    onyomi: 'クウ',
    kunyomi: 'そら, あ-く, から',
    meaning_id: 'Langit, kosong',
    meaning_en: 'Sky, empty',
    category: 'nature_weather',
    examples: [
      { word: '青空', reading: 'あおぞら', meaning_id: 'Langit biru cerah', meaning_en: 'Blue sky' },
      { word: '空港', reading: 'くうこう', meaning_id: 'Bandara', meaning_en: 'Airport' },
      { word: '空気', reading: 'くうき', meaning_id: 'Udara', meaning_en: 'Air / atmosphere' }
    ]
  },

  // 2. Hewan (3)
  {
    id: 57,
    character: '犬',
    hex: '072ac',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'ケン',
    kunyomi: 'いぬ',
    meaning_id: 'Anjing',
    meaning_en: 'Dog',
    category: 'animals',
    examples: [
      { word: '犬', reading: 'いぬ', meaning_id: 'Anjing', meaning_en: 'Dog' },
      { word: '子犬', reading: 'こいぬ', meaning_id: 'Anak anjing', meaning_en: 'Puppy' },
      { word: '番犬', reading: 'ばんけん', meaning_id: 'Anjing penjaga', meaning_en: 'Watchdog' }
    ]
  },
  {
    id: 58,
    character: '魚',
    hex: '09b5a',
    jlpt_level: 'N5',
    stroke_count: 11,
    onyomi: 'ギョ',
    kunyomi: 'さかな, うお',
    meaning_id: 'Ikan',
    meaning_en: 'Fish',
    category: 'animals',
    examples: [
      { word: '魚', reading: 'さかな', meaning_id: 'Ikan', meaning_en: 'Fish' },
      { word: '金魚', reading: 'きんぎょ', meaning_id: 'Ikan koki emas', meaning_en: 'Goldfish' },
      { word: '魚屋', reading: 'さかなや', meaning_id: 'Toko ikan', meaning_en: 'Fish market / shop' }
    ]
  },
  {
    id: 59,
    character: '鳥',
    hex: '09ce5',
    jlpt_level: 'N5',
    stroke_count: 11,
    onyomi: 'チョウ',
    kunyomi: 'とり',
    meaning_id: 'Burung',
    meaning_en: 'Bird',
    category: 'animals',
    examples: [
      { word: '鳥', reading: 'とり', meaning_id: 'Burung', meaning_en: 'Bird' },
      { word: '小鳥', reading: 'ことり', meaning_id: 'Burung kecil', meaning_en: 'Little bird' },
      { word: '白鳥', reading: 'はくちょう', meaning_id: 'Angsa putih', meaning_en: 'Swan' }
    ]
  },

  // 3. Sekolah & Belajar (6)
  {
    id: 60,
    character: '学',
    hex: '05b66',
    jlpt_level: 'N5',
    stroke_count: 8,
    onyomi: 'ガク',
    kunyomi: 'まな-ぶ',
    meaning_id: 'Belajar, ilmu',
    meaning_en: 'Study, learn, science',
    category: 'school_education',
    examples: [
      { word: '学校', reading: 'がっこう', meaning_id: 'Sekolah', meaning_en: 'School' },
      { word: '学生', reading: 'がくせい', meaning_id: 'Siswa / murid / mahasiswa', meaning_en: 'Student' },
      { word: '大学', reading: 'だいがく', meaning_id: 'Universitas', meaning_en: 'University' }
    ]
  },
  {
    id: 61,
    character: '校',
    hex: '06821',
    jlpt_level: 'N5',
    stroke_count: 10,
    onyomi: 'コウ',
    kunyomi: '-',
    meaning_id: 'Sekolah, lembaga pendidikan',
    meaning_en: 'School, institution',
    category: 'school_education',
    examples: [
      { word: '学校', reading: 'がっこう', meaning_id: 'Sekolah', meaning_en: 'School' },
      { word: '高校', reading: 'こうこう', meaning_id: 'SMA (Sekolah Menengah Atas)', meaning_en: 'High school' },
      { word: '校長', reading: 'こうちょう', meaning_id: 'Kepala sekolah', meaning_en: 'Principal' }
    ]
  },
  {
    id: 62,
    character: '名',
    hex: '0540d',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'メイ, ミョウ',
    kunyomi: 'な',
    meaning_id: 'Nama, reputasi',
    meaning_en: 'Name, reputation',
    category: 'school_education',
    examples: [
      { word: '名前', reading: 'なまえ', meaning_id: 'Nama', meaning_en: 'Name' },
      { word: '有名', reading: 'ゆうめい', meaning_id: 'Terkenal', meaning_en: 'Famous' },
      { word: '名刺', reading: 'めいし', meaning_id: 'Kartu nama', meaning_en: 'Business card' }
    ]
  },
  {
    id: 63,
    character: '前',
    hex: '0524d',
    jlpt_level: 'N5',
    stroke_count: 9,
    onyomi: 'ゼン',
    kunyomi: 'まえ',
    meaning_id: 'Depan, sebelum',
    meaning_en: 'Before, front',
    category: 'school_education',
    examples: [
      { word: '名前', reading: 'なまえ', meaning_id: 'Nama', meaning_en: 'Name' },
      { word: '午前', reading: 'ごぜん', meaning_id: 'Pagi hari / a.m.', meaning_en: 'Morning / a.m.' },
      { word: '前', reading: 'まえ', meaning_id: 'Depan / sebelum', meaning_en: 'Front / before' }
    ]
  },
  {
    id: 64,
    character: '後',
    hex: '05f8c',
    jlpt_level: 'N5',
    stroke_count: 9,
    onyomi: 'ゴ, コウ',
    kunyomi: 'のち, うし-ろ, あと',
    meaning_id: 'Belakang, setelah, nanti',
    meaning_en: 'Behind, after, later',
    category: 'school_education',
    examples: [
      { word: '後ろ', reading: 'うしろ', meaning_id: 'Belakang', meaning_en: 'Behind / back' },
      { word: '午後', reading: 'ごご', meaning_id: 'Sore hari / p.m.', meaning_en: 'Afternoon / p.m.' },
      { word: '後半', reading: 'こうはん', meaning_id: 'Babak kedua / paruh akhir', meaning_en: 'Second half' }
    ]
  },
  {
    id: 65,
    character: '何',
    hex: '04f55',
    jlpt_level: 'N5',
    stroke_count: 7,
    onyomi: 'カ',
    kunyomi: 'なに, なん',
    meaning_id: 'Apa',
    meaning_en: 'What',
    category: 'school_education',
    examples: [
      { word: '何', reading: 'なに', meaning_id: 'Apa', meaning_en: 'What' },
      { word: '何時', reading: 'なんじ', meaning_id: 'Jam berapa', meaning_en: 'What time' },
      { word: '何人', reading: 'なんにん', meaning_id: 'Berapa orang', meaning_en: 'How many people' }
    ]
  },

  // 4. Fasilitas, Tempat & Transportasi (10)
  {
    id: 66,
    character: '駅',
    hex: '099c5',
    jlpt_level: 'N5',
    stroke_count: 14,
    onyomi: 'エキ',
    kunyomi: '-',
    meaning_id: 'Stasiun',
    meaning_en: 'Station',
    category: 'places_transport',
    examples: [
      { word: '駅', reading: 'えき', meaning_id: 'Stasiun', meaning_en: 'Station' },
      { word: '駅前', reading: 'えきまえ', meaning_id: 'Depan stasiun', meaning_en: 'In front of station' },
      { word: '東京駅', reading: 'とうきょうえき', meaning_id: 'Stasiun Tokyo', meaning_en: 'Tokyo Station' }
    ]
  },
  {
    id: 67,
    character: '店',
    hex: '05e97',
    jlpt_level: 'N5',
    stroke_count: 8,
    onyomi: 'テン',
    kunyomi: 'みせ',
    meaning_id: 'Toko, kedai',
    meaning_en: 'Shop, store',
    category: 'places_transport',
    examples: [
      { word: '店', reading: 'みせ', meaning_id: 'Toko', meaning_en: 'Shop' },
      { word: '店員', reading: 'てんいん', meaning_id: 'Pelayan / pegawai toko', meaning_en: 'Clerk / shop assistant' },
      { word: '売店', reading: 'ばいてん', meaning_id: 'Kios / kantin', meaning_en: 'Kiosk / stall' }
    ]
  },
  {
    id: 68,
    character: '道',
    hex: '09053',
    jlpt_level: 'N5',
    stroke_count: 12,
    onyomi: 'ドウ, トウ',
    kunyomi: 'みち',
    meaning_id: 'Jalan, rute, ajaran',
    meaning_en: 'Road, street, way',
    category: 'places_transport',
    examples: [
      { word: '道', reading: 'みち', meaning_id: 'Jalan', meaning_en: 'Road / path' },
      { word: '車道', reading: 'しゃどう', meaning_id: 'Jalan raya kendaraan', meaning_en: 'Roadway' },
      { word: '北海道', reading: 'ほっかいどう', meaning_id: 'Hokkaido', meaning_en: 'Hokkaido' }
    ]
  },
  {
    id: 69,
    character: '町',
    hex: '0753a',
    jlpt_level: 'N5',
    stroke_count: 7,
    onyomi: 'チョウ',
    kunyomi: 'まち',
    meaning_id: 'Kota kecil, pemukiman',
    meaning_en: 'Town, neighborhood',
    category: 'places_transport',
    examples: [
      { word: '町', reading: 'まち', meaning_id: 'Kota / daerah pemukiman', meaning_en: 'Town' },
      { word: '町長', reading: 'ちょうちょう', meaning_id: 'Walikota kecil', meaning_en: 'Town mayor' },
      { word: '下町', reading: 'したまち', meaning_id: 'Kawasan tradisional / kota bawah', meaning_en: 'Downtown' }
    ]
  },
  {
    id: 70,
    character: '社',
    hex: '0793e',
    jlpt_level: 'N5',
    stroke_count: 7,
    onyomi: 'シャ',
    kunyomi: 'やしろ',
    meaning_id: 'Perusahaan, kuil Shinto',
    meaning_en: 'Company, shrine',
    category: 'places_transport',
    examples: [
      { word: '会社', reading: 'かいしゃ', meaning_id: 'Perusahaan', meaning_en: 'Company' },
      { word: '神社', reading: 'じんじゃ', meaning_id: 'Kuil Shinto', meaning_en: 'Shinto shrine' },
      { word: '社会', reading: 'しゃかい', meaning_id: 'Masyarakat', meaning_en: 'Society' }
    ]
  },
  {
    id: 71,
    character: '会',
    hex: '04f1a',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'カイ, エ',
    kunyomi: 'あ-う',
    meaning_id: 'Bertemu, perkumpulan, asosiasi',
    meaning_en: 'Meeting, meet, society',
    category: 'places_transport',
    examples: [
      { word: '会社', reading: 'かいしゃ', meaning_id: 'Perusahaan', meaning_en: 'Company' },
      { word: '会話', reading: 'かいわ', meaning_id: 'Percakapan', meaning_en: 'Conversation' },
      { word: '会う', reading: 'あう', meaning_id: 'Bertemu', meaning_en: 'To meet' }
    ]
  },
  {
    id: 72,
    character: '車',
    hex: '08eca',
    jlpt_level: 'N5',
    stroke_count: 7,
    onyomi: 'シャ',
    kunyomi: 'くるま',
    meaning_id: 'Mobil, kendaraan beroda',
    meaning_en: 'Car, vehicle',
    category: 'places_transport',
    examples: [
      { word: '車', reading: 'くるま', meaning_id: 'Mobil', meaning_en: 'Car' },
      { word: '電車', reading: 'でんしゃ', meaning_id: 'Kereta listrik', meaning_en: 'Train' },
      { word: '自転車', reading: 'じてんしゃ', meaning_id: 'Sepeda', meaning_en: 'Bicycle' }
    ]
  },
  {
    id: 73,
    character: '電',
    hex: '096fb',
    jlpt_level: 'N5',
    stroke_count: 13,
    onyomi: 'デン',
    kunyomi: '-',
    meaning_id: 'Listrik',
    meaning_en: 'Electricity',
    category: 'places_transport',
    examples: [
      { word: '電車', reading: 'でんしゃ', meaning_id: 'Kereta listrik', meaning_en: 'Train' },
      { word: '電気', reading: 'でんき', meaning_id: 'Listrik / lampu', meaning_en: 'Electricity / light' },
      { word: '電話', reading: 'でんわ', meaning_id: 'Telepon', meaning_en: 'Telephone' }
    ]
  },
  {
    id: 74,
    character: '円',
    hex: '05186',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'エン',
    kunyomi: 'まる-い',
    meaning_id: 'Yen (mata uang), lingkaran, bulat',
    meaning_en: 'Yen, circle, round',
    category: 'places_transport',
    examples: [
      { word: '百円', reading: 'ひゃくえん', meaning_id: '100 Yen', meaning_en: '100 Yen' },
      { word: '千円', reading: 'せんえん', meaning_id: '1.000 Yen', meaning_en: '1,000 Yen' },
      { word: '一万円', reading: 'いちまんえん', meaning_id: '10.000 Yen', meaning_en: '10,000 Yen' }
    ]
  },
  {
    id: 75,
    character: '語',
    hex: '08a9e',
    jlpt_level: 'N5',
    stroke_count: 14,
    onyomi: 'ゴ',
    kunyomi: 'かた-る, かた-らう',
    meaning_id: 'Bahasa, kata, berbicara',
    meaning_en: 'Language, word',
    category: 'places_transport',
    examples: [
      { word: '日本語', reading: 'にほんご', meaning_id: 'Bahasa Jepang', meaning_en: 'Japanese language' },
      { word: '英語', reading: 'えいご', meaning_id: 'Bahasa Inggris', meaning_en: 'English language' },
      { word: '単語', reading: 'たんご', meaning_id: 'Kosakata', meaning_en: 'Vocabulary / word' }
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
  console.log('🚀 Membaca dataset Batch 1 & 2 yang sudah ada...')
  const batch1Path = path.resolve(__dirname, '../src/data/kanji_n5_batch1.json')
  const batch1Data = JSON.parse(fs.readFileSync(batch1Path, 'utf-8'))
  console.log(`📦 Saat ini dataset memiliki ${batch1Data.length} kanji.`)

  const results = [...batch1Data]

  console.log(`🚀 Mengunduh 27 KanjiVG SVG untuk Batch 3...`)
  for (const item of batch3Definitions) {
    const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${item.hex}.svg`
    console.log(`[${item.id}/75] Mengambil ${item.character} (${item.hex}) dari ${url}...`)

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

  // Write updated 75-kanji dataset to backend-go
  const backendDataPath = path.resolve(__dirname, '../../backend-go/data/kanji_n5_batch1.json')
  fs.writeFileSync(backendDataPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`✅ Berhasil menulis dataset 75 Kanji ke ${backendDataPath}`)

  // Write updated 75-kanji dataset to frontend-next
  fs.writeFileSync(batch1Path, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`✅ Berhasil menulis dataset 75 Kanji ke ${batch1Path}`)

  console.log(`🎉 Total Kanji N5 aktif sekarang: ${results.length} karakter!`)
}

run().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
