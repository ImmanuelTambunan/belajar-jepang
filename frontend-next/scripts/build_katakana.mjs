import fs from 'node:fs'
import path from 'node:path'

// Helper to tokenize SVG path into command tokens and numeric arguments
function transformSvgPath(pathStr, sx, sy, tx, ty) {
  const tokens = []
  const regex = /([MmLlHhVvCcSsQqTtZz])|([+-]?(?:\d*\.\d+|\d+)(?:[eE][+-]?\d+)?)/g
  let match
  while ((match = regex.exec(pathStr)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'cmd', val: match[1] })
    } else if (match[2]) {
      tokens.push({ type: 'num', val: parseFloat(match[2]) })
    }
  }

  let result = ''
  let i = 0
  let currentCmd = ''

  while (i < tokens.length) {
    const token = tokens[i]
    if (token.type === 'cmd') {
      currentCmd = token.val
      result += currentCmd
      i++
      continue
    }

    // Number arguments depending on command
    const round = (num) => Math.round(num * 100) / 100

    switch (currentCmd) {
      case 'M':
      case 'L':
      case 'T': {
        const x = tokens[i++].val
        const y = tokens[i++].val
        result += `${round(x * sx + tx)},${round(y * sy + ty)} `
        break
      }
      case 'm':
      case 'l':
      case 't': {
        const dx = tokens[i++].val
        const dy = tokens[i++].val
        result += `${round(dx * sx)},${round(dy * sy)} `
        break
      }
      case 'H': {
        const x = tokens[i++].val
        result += `${round(x * sx + tx)} `
        break
      }
      case 'h': {
        const dx = tokens[i++].val
        result += `${round(dx * sx)} `
        break
      }
      case 'V': {
        const y = tokens[i++].val
        result += `${round(y * sy + ty)} `
        break
      }
      case 'v': {
        const dy = tokens[i++].val
        result += `${round(dy * sy)} `
        break
      }
      case 'C': {
        const x1 = tokens[i++].val
        const y1 = tokens[i++].val
        const x2 = tokens[i++].val
        const y2 = tokens[i++].val
        const x = tokens[i++].val
        const y = tokens[i++].val
        result += `${round(x1 * sx + tx)},${round(y1 * sy + ty)},${round(x2 * sx + tx)},${round(y2 * sy + ty)},${round(x * sx + tx)},${round(y * sy + ty)} `
        break
      }
      case 'c': {
        const dx1 = tokens[i++].val
        const dy1 = tokens[i++].val
        const dx2 = tokens[i++].val
        const dy2 = tokens[i++].val
        const dx = tokens[i++].val
        const dy = tokens[i++].val
        result += `${round(dx1 * sx)},${round(dy1 * sy)},${round(dx2 * sx)},${round(dy2 * sy)},${round(dx * sx)},${round(dy * sy)} `
        break
      }
      case 'S':
      case 'Q': {
        const x1 = tokens[i++].val
        const y1 = tokens[i++].val
        const x = tokens[i++].val
        const y = tokens[i++].val
        result += `${round(x1 * sx + tx)},${round(y1 * sy + ty)},${round(x * sx + tx)},${round(y * sy + ty)} `
        break
      }
      case 's':
      case 'q': {
        const dx1 = tokens[i++].val
        const dy1 = tokens[i++].val
        const dx = tokens[i++].val
        const dy = tokens[i++].val
        result += `${round(dx1 * sx)},${round(dy1 * sy)},${round(dx * sx)},${round(dy * sy)} `
        break
      }
      default:
        result += `${tokens[i++].val} `
        break
    }
  }

  // Clean trailing spaces and normalize commas
  return result
    .trim()
    .replace(/\s+([a-df-z])/gi, '$1')
    .replace(/,\s+/g, ',')
    .replace(/\s+/g, ' ')
}

// Extract <path d="..." from SVG text
function extractPathsFromSvg(svgContent) {
  const paths = []
  const regex = /<path[^>]+d="([^"]+)"/g
  let match
  while ((match = regex.exec(svgContent)) !== null) {
    paths.push(match[1])
  }
  return paths
}

async function fetchSvgFromKanjiVG(hexCode) {
  const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${hexCode}.svg`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`)
  }
  const text = await res.text()
  return extractPathsFromSvg(text)
}

async function run() {
  console.log('🚀 Generating 107 Katakana dataset from KanjiVG...')

  // 1. Single Katakana definition table (71 characters)
  const singleList = [
    // Gojuon (46)
    { symbol: 'ア', category: 'gojuon', row_group: 'vowel', reading: 'a', code: '030a2' },
    { symbol: 'イ', category: 'gojuon', row_group: 'vowel', reading: 'i', code: '030a4' },
    { symbol: 'ウ', category: 'gojuon', row_group: 'vowel', reading: 'u', code: '030a6' },
    { symbol: 'エ', category: 'gojuon', row_group: 'vowel', reading: 'e', code: '030a8' },
    { symbol: 'オ', category: 'gojuon', row_group: 'vowel', reading: 'o', code: '030aa' },

    { symbol: 'カ', category: 'gojuon', row_group: 'ka', reading: 'ka', code: '030ab' },
    { symbol: 'キ', category: 'gojuon', row_group: 'ka', reading: 'ki', code: '030ad' },
    { symbol: 'ク', category: 'gojuon', row_group: 'ka', reading: 'ku', code: '030af' },
    { symbol: 'ケ', category: 'gojuon', row_group: 'ka', reading: 'ke', code: '030b1' },
    { symbol: 'コ', category: 'gojuon', row_group: 'ka', reading: 'ko', code: '030b3' },

    { symbol: 'サ', category: 'gojuon', row_group: 'sa', reading: 'sa', code: '030b5' },
    { symbol: 'シ', category: 'gojuon', row_group: 'sa', reading: 'shi', code: '030b7' },
    { symbol: 'ス', category: 'gojuon', row_group: 'sa', reading: 'su', code: '030b9' },
    { symbol: 'セ', category: 'gojuon', row_group: 'sa', reading: 'se', code: '030bb' },
    { symbol: 'ソ', category: 'gojuon', row_group: 'sa', reading: 'so', code: '030bd' },

    { symbol: 'タ', category: 'gojuon', row_group: 'ta', reading: 'ta', code: '030bf' },
    { symbol: 'チ', category: 'gojuon', row_group: 'ta', reading: 'chi', code: '030c1' },
    { symbol: 'ツ', category: 'gojuon', row_group: 'ta', reading: 'tsu', code: '030c4' },
    { symbol: 'テ', category: 'gojuon', row_group: 'ta', reading: 'te', code: '030c6' },
    { symbol: 'ト', category: 'gojuon', row_group: 'ta', reading: 'to', code: '030c8' },

    { symbol: 'ナ', category: 'gojuon', row_group: 'na', reading: 'na', code: '030ca' },
    { symbol: 'ニ', category: 'gojuon', row_group: 'na', reading: 'ni', code: '030cb' },
    { symbol: 'ヌ', category: 'gojuon', row_group: 'na', reading: 'nu', code: '030cc' },
    { symbol: 'ネ', category: 'gojuon', row_group: 'na', reading: 'ne', code: '030cd' },
    { symbol: 'ノ', category: 'gojuon', row_group: 'na', reading: 'no', code: '030ce' },

    { symbol: 'ハ', category: 'gojuon', row_group: 'ha', reading: 'ha', code: '030cf' },
    { symbol: 'ヒ', category: 'gojuon', row_group: 'ha', reading: 'hi', code: '030d2' },
    { symbol: 'フ', category: 'gojuon', row_group: 'ha', reading: 'fu', code: '030d5' },
    { symbol: 'ヘ', category: 'gojuon', row_group: 'ha', reading: 'he', code: '030d8' },
    { symbol: 'ホ', category: 'gojuon', row_group: 'ha', reading: 'ho', code: '030db' },

    { symbol: 'マ', category: 'gojuon', row_group: 'ma', reading: 'ma', code: '030de' },
    { symbol: 'ミ', category: 'gojuon', row_group: 'ma', reading: 'mi', code: '030df' },
    { symbol: 'ム', category: 'gojuon', row_group: 'ma', reading: 'mu', code: '030e0' },
    { symbol: 'メ', category: 'gojuon', row_group: 'ma', reading: 'me', code: '030e1' },
    { symbol: 'モ', category: 'gojuon', row_group: 'ma', reading: 'mo', code: '030e2' },

    { symbol: 'ヤ', category: 'gojuon', row_group: 'ya', reading: 'ya', code: '030e4' },
    { symbol: 'ユ', category: 'gojuon', row_group: 'ya', reading: 'yu', code: '030e6' },
    { symbol: 'ヨ', category: 'gojuon', row_group: 'ya', reading: 'yo', code: '030e8' },

    { symbol: 'ラ', category: 'gojuon', row_group: 'ra', reading: 'ra', code: '030e9' },
    { symbol: 'リ', category: 'gojuon', row_group: 'ra', reading: 'ri', code: '030ea' },
    { symbol: 'ル', category: 'gojuon', row_group: 'ra', reading: 'ru', code: '030eb' },
    { symbol: 'レ', category: 'gojuon', row_group: 'ra', reading: 're', code: '030ec' },
    { symbol: 'ロ', category: 'gojuon', row_group: 'ra', reading: 'ro', code: '030ed' },

    { symbol: 'ワ', category: 'gojuon', row_group: 'wa', reading: 'wa', code: '030ef' },
    { symbol: 'ヲ', category: 'gojuon', row_group: 'wa', reading: 'wo', code: '030f2' },
    { symbol: 'ン', category: 'gojuon', row_group: 'n', reading: 'n', code: '030f3' },

    // Dakuon (20)
    { symbol: 'ガ', category: 'dakuon', row_group: 'ga', reading: 'ga', code: '030ac' },
    { symbol: 'ギ', category: 'dakuon', row_group: 'ga', reading: 'gi', code: '030ae' },
    { symbol: 'グ', category: 'dakuon', row_group: 'ga', reading: 'gu', code: '030b0' },
    { symbol: 'ゲ', category: 'dakuon', row_group: 'ga', reading: 'ge', code: '030b2' },
    { symbol: 'ゴ', category: 'dakuon', row_group: 'ga', reading: 'go', code: '030b4' },

    { symbol: 'ザ', category: 'dakuon', row_group: 'za', reading: 'za', code: '030b6' },
    { symbol: 'ジ', category: 'dakuon', row_group: 'za', reading: 'ji', code: '030b8' },
    { symbol: 'ズ', category: 'dakuon', row_group: 'za', reading: 'zu', code: '030ba' },
    { symbol: 'ゼ', category: 'dakuon', row_group: 'za', reading: 'ze', code: '030bc' },
    { symbol: 'ゾ', category: 'dakuon', row_group: 'za', reading: 'zo', code: '030be' },

    { symbol: 'ダ', category: 'dakuon', row_group: 'da', reading: 'da', code: '030c0' },
    { symbol: 'ヂ', category: 'dakuon', row_group: 'da', reading: 'ji', code: '030c2' },
    { symbol: 'ヅ', category: 'dakuon', row_group: 'da', reading: 'zu', code: '030c5' },
    { symbol: 'デ', category: 'dakuon', row_group: 'da', reading: 'de', code: '030c7' },
    { symbol: 'ド', category: 'dakuon', row_group: 'da', reading: 'do', code: '030c9' },

    { symbol: 'バ', category: 'dakuon', row_group: 'ba', reading: 'ba', code: '030d0' },
    { symbol: 'ビ', category: 'dakuon', row_group: 'ba', reading: 'bi', code: '030d3' },
    { symbol: 'ブ', category: 'dakuon', row_group: 'ba', reading: 'bu', code: '030d6' },
    { symbol: 'ベ', category: 'dakuon', row_group: 'ba', reading: 'be', code: '030d9' },
    { symbol: 'ボ', category: 'dakuon', row_group: 'ba', reading: 'bo', code: '030dc' },

    // Handakuon (5)
    { symbol: 'パ', category: 'handakuon', row_group: 'pa', reading: 'pa', code: '030d1' },
    { symbol: 'ピ', category: 'handakuon', row_group: 'pa', reading: 'pi', code: '030d4' },
    { symbol: 'プ', category: 'handakuon', row_group: 'pa', reading: 'pu', code: '030d7' },
    { symbol: 'ペ', category: 'handakuon', row_group: 'pa', reading: 'pe', code: '030da' },
    { symbol: 'ポ', category: 'handakuon', row_group: 'pa', reading: 'po', code: '030dd' },
  ]

  // Yoon definition table (36 items)
  const yoonGroups = [
    { base: 'キ', row: 'kya', prefix: 'ky', baseCode: '030ad' },
    { base: 'シ', row: 'sha', prefix: 'sh', baseCode: '030b7' },
    { base: 'チ', row: 'cha', prefix: 'ch', baseCode: '030c1' },
    { base: 'ニ', row: 'nya', prefix: 'ny', baseCode: '030cb' },
    { base: 'ヒ', row: 'hya', prefix: 'hy', baseCode: '030d2' },
    { base: 'ミ', row: 'mya', prefix: 'my', baseCode: '030df' },
    { base: 'リ', row: 'rya', prefix: 'ry', baseCode: '030ea' },
    { base: 'ギ', row: 'gya', prefix: 'gy', baseCode: '030ae' },
    { base: 'ジ', row: 'ja', prefix: 'j', baseCode: '030b8' },
    { base: 'ヂ', row: 'dya', prefix: 'dy', baseCode: '030c2' },
    { base: 'ビ', row: 'bya', prefix: 'by', baseCode: '030d3' },
    { base: 'ピ', row: 'pya', prefix: 'py', baseCode: '030d4' },
  ]

  const yoonSuffixes = [
    { kana: 'ャ', suffix: 'a', code: '030e3' },
    { kana: 'ュ', suffix: 'u', code: '030e5' },
    { kana: 'ョ', suffix: 'o', code: '030e7' },
  ]

  // Cache fetched paths by code
  const svgCache = new Map()

  async function getSvgPaths(code) {
    if (svgCache.has(code)) return svgCache.get(code)
    const paths = await fetchSvgFromKanjiVG(code)
    svgCache.set(code, paths)
    return paths
  }

  // Pre-fetch small ya, yu, yo
  await getSvgPaths('030e3')
  await getSvgPaths('030e5')
  await getSvgPaths('030e7')

  const resultItems = []

  // 1. Process 71 Single Kana
  for (const item of singleList) {
    console.log(`Processing single: ${item.symbol} (${item.code})`)
    const strokes = await getSvgPaths(item.code)
    resultItems.push({
      symbol: item.symbol,
      script_type: 'katakana',
      category: item.category,
      row_group: item.row_group,
      stroke_count: strokes.length,
      reading: item.reading,
      strokes: strokes,
    })
  }

  // 2. Process 36 Yoon Kana
  for (const group of yoonGroups) {
    const baseStrokes = await getSvgPaths(group.baseCode)

    for (const sfx of yoonSuffixes) {
      const smallStrokes = await getSvgPaths(sfx.code)
      const symbol = group.base + sfx.kana
      const reading = group.prefix + sfx.suffix

      console.log(`Processing yoon: ${symbol} (${reading})`)

      // Left base character: scale sx=0.58, sy=0.82, tx=2, ty=10
      const leftTransformed = baseStrokes.map((p) =>
        transformSvgPath(p, 0.58, 0.82, 2, 10)
      )

      // Right small kana:
      // small ャ (030e3), small ュ (030e5), small ョ (030e7)
      // scale sx=0.68, sy=0.72, tx=34, ty=22
      const rightTransformed = smallStrokes.map((p) =>
        transformSvgPath(p, 0.68, 0.72, 34, 22)
      )

      const combinedStrokes = [...leftTransformed, ...rightTransformed]

      resultItems.push({
        symbol: symbol,
        script_type: 'katakana',
        category: 'yoon',
        row_group: group.row,
        stroke_count: combinedStrokes.length,
        reading: reading,
        strokes: combinedStrokes,
      })
    }
  }

  console.log(`✨ Total Katakana generated: ${resultItems.length}`)

  // Write to both backend and frontend data folders
  const backendDest = path.resolve('backend-go/data/katakana_107.json')
  const frontendDest = path.resolve('frontend-next/src/data/katakana_107.json')

  const jsonStr = JSON.stringify(resultItems, null, 2)
  fs.writeFileSync(backendDest, jsonStr, 'utf-8')
  fs.writeFileSync(frontendDest, jsonStr, 'utf-8')

  console.log(`✅ Saved to ${backendDest}`)
  console.log(`✅ Saved to ${frontendDest}`)
}

run().catch((err) => {
  console.error('Error running generator:', err)
  process.exit(1)
})
