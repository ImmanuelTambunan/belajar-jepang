# Direktori Audio Pelafalan Karakter Hiragana (Native Speaker Audio)

Direktori ini digunakan oleh modul audio Next.js (`useCharacterAudio` & `src/utils/audio.ts`) untuk memutar rekaman suara penutur asli Jepang (*Native Audio*).

## Struktur File Audio
Letakkan file audio berformat `.mp3` atau `.ogg` dengan nama sesuai Romaji karakter:

```
public/audio/hiragana/
├── a.mp3
├── i.mp3
├── u.mp3
├── e.mp3
├── o.mp3
├── ka.mp3
├── ki.mp3
├── ku.mp3
├── ke.mp3
├── ko.mp3
├── sa.mp3
├── shi.mp3
├── su.mp3
├── se.mp3
├── so.mp3
├── ta.mp3
├── chi.mp3
├── tsu.mp3
├── te.mp3
├── to.mp3
├── na.mp3
├── ni.mp3
├── nu.mp3
├── ne.mp3
├── no.mp3
├── ha.mp3
├── hi.mp3
├── fu.mp3
├── he.mp3
├── ho.mp3
├── ma.mp3
├── mi.mp3
├── mu.mp3
├── me.mp3
├── mo.mp3
├── ya.mp3
├── yu.mp3
├── yo.mp3
├── ra.mp3
├── ri.mp3
├── ru.mp3
├── re.mp3
├── ro.mp3
├── wa.mp3
├── wo.mp3
└── n.mp3
```

## Mekanisme Fallback
Jika file audio fisik belum dimasukkan atau gagal dimuat (404/network error), sistem secara otomatis beralih ke **Web Speech API** browser (`window.speechSynthesis`) dengan konfigurasi:
- Bahasa: `ja-JP`
- Artikulasi: `rate = 0.85`
- Nada: `pitch = 1.0`
- Pemilihan suara otomatis mendeteksi suara penutur asli Jepang (Microsoft Nanami, Google 日本語, Kyoko, Otoya, dll.).
