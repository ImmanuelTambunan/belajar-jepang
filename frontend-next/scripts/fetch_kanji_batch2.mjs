import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const batch2Definitions = [
  // Kategori Manusia (9)
  {
    id: 24,
    character: '人',
    hex: '04eba',
    jlpt_level: 'N5',
    stroke_count: 2,
    onyomi: 'ジン, ニン',
    kunyomi: 'ひと, -り, -と',
    meaning_id: 'Orang, manusia',
    meaning_en: 'Person, human',
    category: 'people_family',
    examples: [
      { word: '日本人', reading: 'にほんじん', meaning_id: 'Orang Jepang', meaning_en: 'Japanese person' },
      { word: '一人', reading: 'ひとり', meaning_id: 'Satu orang / sendiri', meaning_en: 'One person / alone' },
      { word: '人口', reading: 'じんこう', meaning_id: 'Populasi / jumlah penduduk', meaning_en: 'Population' }
    ]
  },
  {
    id: 25,
    character: '男',
    hex: '07537',
    jlpt_level: 'N5',
    stroke_count: 7,
    onyomi: 'ダン, ナン',
    kunyomi: 'おとこ, お',
    meaning_id: 'Laki-laki, pria',
    meaning_en: 'Man, male',
    category: 'people_family',
    examples: [
      { word: '男の人', reading: 'おとこのひと', meaning_id: 'Laki-laki / pria', meaning_en: 'Man' },
      { word: '男の子', reading: 'おとこのこ', meaning_id: 'Anak laki-laki', meaning_en: 'Boy' },
      { word: '男子', reading: 'だんし', meaning_id: 'Putra / pemuda', meaning_en: 'Boy / young man' }
    ]
  },
  {
    id: 26,
    character: '女',
    hex: '05973',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'ジョ, ニョ',
    kunyomi: 'おんな, め',
    meaning_id: 'Perempuan, wanita',
    meaning_en: 'Woman, female',
    category: 'people_family',
    examples: [
      { word: '女の人', reading: 'おんなのひと', meaning_id: 'Wanita', meaning_en: 'Woman' },
      { word: '女の子', reading: 'おんなのこ', meaning_id: 'Anak perempuan', meaning_en: 'Girl' },
      { word: '彼女', reading: 'かのじょ', meaning_id: 'Dia (perempuan) / pacar', meaning_en: 'She / girlfriend' }
    ]
  },
  {
    id: 27,
    character: '子',
    hex: '05b50',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'シ, ス',
    kunyomi: 'こ, -こ',
    meaning_id: 'Anak',
    meaning_en: 'Child',
    category: 'people_family',
    examples: [
      { word: '子供', reading: 'こども', meaning_id: 'Anak-anak', meaning_en: 'Children' },
      { word: '女の子', reading: 'おんなのこ', meaning_id: 'Anak perempuan', meaning_en: 'Girl' },
      { word: '男の子', reading: 'おとこのこ', meaning_id: 'Anak laki-laki', meaning_en: 'Boy' }
    ]
  },
  {
    id: 28,
    character: '父',
    hex: '07236',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'フ',
    kunyomi: 'ちち, とう',
    meaning_id: 'Ayah',
    meaning_en: 'Father',
    category: 'people_family',
    examples: [
      { word: '父', reading: 'ちち', meaning_id: 'Ayah (saya)', meaning_en: 'My father' },
      { word: 'お父さん', reading: 'おとうさん', meaning_id: 'Ayah', meaning_en: 'Father' },
      { word: '父母', reading: 'ふぼ', meaning_id: 'Orang tua / ayah-ibu', meaning_en: 'Parents' }
    ]
  },
  {
    id: 29,
    character: '母',
    hex: '06bcd',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'ボ',
    kunyomi: 'はは, かあ',
    meaning_id: 'Ibu',
    meaning_en: 'Mother',
    category: 'people_family',
    examples: [
      { word: '母', reading: 'はは', meaning_id: 'Ibu (saya)', meaning_en: 'My mother' },
      { word: 'お母さん', reading: 'おかあさん', meaning_id: 'Ibu', meaning_en: 'Mother' },
      { word: '母国', reading: 'ぼこく', meaning_id: 'Negara asal / tanah air', meaning_en: 'Motherland' }
    ]
  },
  {
    id: 30,
    character: '友',
    hex: '053cb',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'ユウ',
    kunyomi: 'とも',
    meaning_id: 'Teman, sahabat',
    meaning_en: 'Friend',
    category: 'people_family',
    examples: [
      { word: '友達', reading: 'ともだち', meaning_id: 'Teman', meaning_en: 'Friend' },
      { word: '友人', reading: 'ゆうじん', meaning_id: 'Sahabat / kawan', meaning_en: 'Friend / companion' },
      { word: '親友', reading: 'しんゆう', meaning_id: 'Sahabat dekat', meaning_en: 'Best friend' }
    ]
  },
  {
    id: 31,
    character: '先',
    hex: '05148',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'セン',
    kunyomi: 'さき, ま・ず',
    meaning_id: 'Terdahulu, sebelum, depan',
    meaning_en: 'Previous, ahead, before',
    category: 'people_family',
    examples: [
      { word: '先生', reading: 'せんせい', meaning_id: 'Guru / pengajar', meaning_en: 'Teacher' },
      { word: '先月', reading: 'せんげつ', meaning_id: 'Bulan lalu', meaning_en: 'Last month' },
      { word: '先週', reading: 'せんしゅう', meaning_id: 'Minggu lalu', meaning_en: 'Last week' }
    ]
  },
  {
    id: 32,
    character: '生',
    hex: '0751f',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'セイ, ショウ',
    kunyomi: 'い・きる, う・まれる, なま',
    meaning_id: 'Hidup, lahir, mentah',
    meaning_en: 'Life, birth, raw',
    category: 'people_family',
    examples: [
      { word: '学生', reading: 'がくせい', meaning_id: 'Siswa / mahasiswa', meaning_en: 'Student' },
      { word: '先生', reading: 'せんせい', meaning_id: 'Guru', meaning_en: 'Teacher' },
      { word: '生まれる', reading: 'うまれる', meaning_id: 'Lahir', meaning_en: 'To be born' }
    ]
  },

  // Kategori Tubuh (5)
  {
    id: 33,
    character: '目',
    hex: '076ee',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'モク, ボク',
    kunyomi: 'め, -め, ま-',
    meaning_id: 'Mata, urutan ke-',
    meaning_en: 'Eye, item',
    category: 'body_parts',
    examples: [
      { word: '目', reading: 'め', meaning_id: 'Mata', meaning_en: 'Eye' },
      { word: '一番目', reading: 'いちばんめ', meaning_id: 'Urutan pertama / nomor satu', meaning_en: 'The first' },
      { word: '目的', reading: 'もくてき', meaning_id: 'Tujuan', meaning_en: 'Purpose / objective' }
    ]
  },
  {
    id: 34,
    character: '口',
    hex: '053e3',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'コウ, ク',
    kunyomi: 'くち',
    meaning_id: 'Mulut, pintu gerbang',
    meaning_en: 'Mouth, opening',
    category: 'body_parts',
    examples: [
      { word: '口', reading: 'くち', meaning_id: 'Mulut', meaning_en: 'Mouth' },
      { word: '入口', reading: 'いりぐち', meaning_id: 'Pintu masuk', meaning_en: 'Entrance' },
      { word: '出口', reading: 'でぐち', meaning_id: 'Pintu keluar', meaning_en: 'Exit' }
    ]
  },
  {
    id: 35,
    character: '耳',
    hex: '08033',
    jlpt_level: 'N5',
    stroke_count: 6,
    onyomi: 'ジ',
    kunyomi: 'みみ',
    meaning_id: 'Telinga',
    meaning_en: 'Ear',
    category: 'body_parts',
    examples: [
      { word: '耳', reading: 'みみ', meaning_id: 'Telinga', meaning_en: 'Ear' },
      { word: '初耳', reading: 'はつみみ', meaning_id: 'Baru pertama kali dengar', meaning_en: 'First time hearing' },
      { word: '耳鼻科', reading: 'じびか', meaning_id: 'Dokter THT', meaning_en: 'ENT clinic' }
    ]
  },
  {
    id: 36,
    character: '手',
    hex: '0624b',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'シュ, ズ',
    kunyomi: 'て, て-, た-',
    meaning_id: 'Tangan, keahlian',
    meaning_en: 'Hand, skill',
    category: 'body_parts',
    examples: [
      { word: '手', reading: 'て', meaning_id: 'Tangan', meaning_en: 'Hand' },
      { word: '手紙', reading: 'てがみ', meaning_id: 'Surat', meaning_en: 'Letter' },
      { word: '上手', reading: 'じょうず', meaning_id: 'Pandai / mahir', meaning_en: 'Skillful' }
    ]
  },
  {
    id: 37,
    character: '足',
    hex: '08db3',
    jlpt_level: 'N5',
    stroke_count: 7,
    onyomi: 'ソク',
    kunyomi: 'あし, た・りる, た・す',
    meaning_id: 'Kaki, cukup',
    meaning_en: 'Leg, foot, sufficient',
    category: 'body_parts',
    examples: [
      { word: '足', reading: 'あし', meaning_id: 'Kaki', meaning_en: 'Foot / leg' },
      { word: '足りる', reading: 'たりる', meaning_id: 'Cukup', meaning_en: 'To be sufficient' },
      { word: '遠足', reading: 'えんそく', meaning_id: 'Piknik jalan kaki', meaning_en: 'Excursion / picnic' }
    ]
  },

  // Kategori Arah & Ukuran (9)
  {
    id: 38,
    character: '上',
    hex: '04e0a',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'ジョウ, ショウ',
    kunyomi: 'うえ, あ・がる, のぼ・る',
    meaning_id: 'Atas, naik',
    meaning_en: 'Above, up',
    category: 'direction_size',
    examples: [
      { word: '上', reading: 'うえ', meaning_id: 'Atas', meaning_en: 'Above / on' },
      { word: '上手', reading: 'じょうず', meaning_id: 'Mahir / pandai', meaning_en: 'Skillful' },
      { word: '上がる', reading: 'あがる', meaning_id: 'Naik', meaning_en: 'To go up' }
    ]
  },
  {
    id: 39,
    character: '下',
    hex: '04e0b',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'カ, ゲ',
    kunyomi: 'した, さ・がる, くだ・る',
    meaning_id: 'Bawah, turun',
    meaning_en: 'Below, down',
    category: 'direction_size',
    examples: [
      { word: '下', reading: 'した', meaning_id: 'Bawah', meaning_en: 'Below / under' },
      { word: '下手', reading: 'へた', meaning_id: 'Kurang pandai / kikuk', meaning_en: 'Unskillful / clumsy' },
      { word: '地下鉄', reading: 'ちかてつ', meaning_id: 'Kereta bawah tanah', meaning_en: 'Subway' }
    ]
  },
  {
    id: 40,
    character: '左',
    hex: '05de6',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'サ',
    kunyomi: 'ひだり',
    meaning_id: 'Kiri',
    meaning_en: 'Left',
    category: 'direction_size',
    examples: [
      { word: '左', reading: 'ひだり', meaning_id: 'Kiri', meaning_en: 'Left' },
      { word: '左手', reading: 'ひだりて', meaning_id: 'Tangan kiri', meaning_en: 'Left hand' },
      { word: '左右', reading: 'さゆう', meaning_id: 'Kiri dan kanan', meaning_en: 'Left and right' }
    ]
  },
  {
    id: 41,
    character: '右',
    hex: '053f3',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'ウ, ユウ',
    kunyomi: 'みぎ',
    meaning_id: 'Kanan',
    meaning_en: 'Right',
    category: 'direction_size',
    examples: [
      { word: '右', reading: 'みぎ', meaning_id: 'Kanan', meaning_en: 'Right' },
      { word: '右手', reading: 'みぎて', meaning_id: 'Tangan kanan', meaning_en: 'Right hand' },
      { word: '右側', reading: 'みぎがわ', meaning_id: 'Sisi kanan', meaning_en: 'Right side' }
    ]
  },
  {
    id: 42,
    character: '中',
    hex: '04e2d',
    jlpt_level: 'N5',
    stroke_count: 4,
    onyomi: 'チュウ',
    kunyomi: 'なか',
    meaning_id: 'Tengah, dalam',
    meaning_en: 'Middle, inside',
    category: 'direction_size',
    examples: [
      { word: '中', reading: 'なか', meaning_id: 'Di dalam', meaning_en: 'Inside' },
      { word: '中国', reading: 'ちゅうごく', meaning_id: 'Tiongkok / China', meaning_en: 'China' },
      { word: '一日中', reading: 'いちにちじゅう', meaning_id: 'Sepanjang hari', meaning_en: 'All day long' }
    ]
  },
  {
    id: 43,
    character: '大',
    hex: '05927',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'ダイ, タイ',
    kunyomi: 'おお, おお・きい',
    meaning_id: 'Besar',
    meaning_en: 'Big, large',
    category: 'direction_size',
    examples: [
      { word: '大きい', reading: 'おおきい', meaning_id: 'Besar', meaning_en: 'Big' },
      { word: '大学', reading: 'だいがく', meaning_id: 'Universitas', meaning_en: 'University' },
      { word: '大人', reading: 'おとな', meaning_id: 'Orang dewasa', meaning_en: 'Adult' }
    ]
  },
  {
    id: 44,
    character: '小',
    hex: '05c0f',
    jlpt_level: 'N5',
    stroke_count: 3,
    onyomi: 'ショウ',
    kunyomi: 'ちい・さい, こ-, お-',
    meaning_id: 'Kecil',
    meaning_en: 'Small, little',
    category: 'direction_size',
    examples: [
      { word: '小さい', reading: 'ちいさい', meaning_id: 'Kecil', meaning_en: 'Small' },
      { word: '小学校', reading: 'しょうがっこう', meaning_id: 'Sekolah Dasar (SD)', meaning_en: 'Elementary school' },
      { word: '小川', reading: 'おがわ', meaning_id: 'Sungai kecil', meaning_en: 'Brook / stream' }
    ]
  },
  {
    id: 45,
    character: '長',
    hex: '09577',
    jlpt_level: 'N5',
    stroke_count: 8,
    onyomi: 'チョウ',
    kunyomi: 'なが・い, おさ',
    meaning_id: 'Panjang, pemimpin',
    meaning_en: 'Long, leader',
    category: 'direction_size',
    examples: [
      { word: '長い', reading: 'ながい', meaning_id: 'Panjang', meaning_en: 'Long' },
      { word: '校長', reading: 'こうちょう', meaning_id: 'Kepala sekolah', meaning_en: 'Principal' },
      { word: '社長', reading: 'しゃちょう', meaning_id: 'Direktur / pimpinan perusahaan', meaning_en: 'Company president' }
    ]
  },
  {
    id: 46,
    character: '白',
    hex: '0767d',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'ハク, ビャク',
    kunyomi: 'しろ, しろ・い',
    meaning_id: 'Putih',
    meaning_en: 'White',
    category: 'direction_size',
    examples: [
      { word: '白い', reading: 'しろい', meaning_id: 'Putih', meaning_en: 'White' },
      { word: '面白い', reading: 'おもしろい', meaning_id: 'Menarik / seru', meaning_en: 'Interesting / fun' },
      { word: '告白', reading: 'こくはく', meaning_id: 'Pengakuan cinta', meaning_en: 'Confession' }
    ]
  },

  // Kategori Asal/Tempat (2)
  {
    id: 47,
    character: '本',
    hex: '0672c',
    jlpt_level: 'N5',
    stroke_count: 5,
    onyomi: 'ホン',
    kunyomi: 'もと',
    meaning_id: 'Buku, asal, dasar',
    meaning_en: 'Book, origin, main',
    category: 'origin_place',
    examples: [
      { word: '本', reading: 'ほん', meaning_id: 'Buku', meaning_en: 'Book' },
      { word: '日本', reading: 'にほん', meaning_id: 'Jepang', meaning_en: 'Japan' },
      { word: '本屋', reading: 'ほんや', meaning_id: 'Toko buku', meaning_en: 'Bookstore' }
    ]
  },
  {
    id: 48,
    character: '国',
    hex: '056fd',
    jlpt_level: 'N5',
    stroke_count: 8,
    onyomi: 'コク',
    kunyomi: 'くに',
    meaning_id: 'Negara',
    meaning_en: 'Country, nation',
    category: 'origin_place',
    examples: [
      { word: '国', reading: 'くに', meaning_id: 'Negara', meaning_en: 'Country' },
      { word: '外国', reading: 'がいこく', meaning_id: 'Luar negeri', meaning_en: 'Foreign country' },
      { word: '中国', reading: 'ちゅうごく', meaning_id: 'Tiongkok / China', meaning_en: 'China' }
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
  console.log('🚀 Membaca dataset Batch 1 yang sudah ada...')
  const batch1Path = path.resolve(__dirname, '../src/data/kanji_n5_batch1.json')
  const batch1Data = JSON.parse(fs.readFileSync(batch1Path, 'utf-8'))
  console.log(`📦 Batch 1 memiliki ${batch1Data.length} kanji.`)

  const results = [...batch1Data]

  console.log(`🚀 Mengunduh 25 KanjiVG SVG untuk Batch 2...`)
  for (const item of batch2Definitions) {
    const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${item.hex}.svg`
    console.log(`[${item.id}/48] Mengambil ${item.character} (${item.hex}) dari ${url}...`)

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
      stroke_count: paths.length, // use actual path count
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

  // Write updated 48-kanji dataset to backend-go
  const backendDataPath = path.resolve(__dirname, '../../backend-go/data/kanji_n5_batch1.json')
  fs.writeFileSync(backendDataPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`✅ Berhasil menulis dataset 48 Kanji ke ${backendDataPath}`)

  // Write updated 48-kanji dataset to frontend-next
  fs.writeFileSync(batch1Path, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`✅ Berhasil menulis dataset 48 Kanji ke ${batch1Path}`)

  console.log(`🎉 Total Kanji N5 aktif sekarang: ${results.length} karakter!`)
}

run().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
