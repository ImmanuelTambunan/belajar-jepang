# Direktori Audio Pelafalan Karakter Hiragana (Native Speaker Audio)

Direktori ini digunakan oleh modul audio Next.js (`useCharacterAudio` & `src/utils/audio.ts`) untuk memutar rekaman suara penutur asli Jepang (*Native Audio*).

---

## 📁 Struktur File Audio (`public/audio/hiragana/`)

Letakkan file audio berformat `.mp3` atau `.ogg` di folder ini dengan nama file sesuai **Romaji huruf kecil**:

```
frontend-next/public/audio/hiragana/
├── .gitkeep
├── manifest.json
├── README.md
│
├── a.mp3        (あ)
├── i.mp3        (い)
├── u.mp3        (う)
├── e.mp3        (え)
├── o.mp3        (お)
│
├── ka.mp3       (か)
├── ki.mp3       (き)
├── ku.mp3       (く)
├── ke.mp3       (け)
├── ko.mp3       (こ)
│
├── sa.mp3       (さ)
├── shi.mp3      (し)
├── su.mp3       (す)
├── se.mp3       (せ)
├── so.mp3       (そ)
│
├── ta.mp3       (た)
├── chi.mp3      (ち)
├── tsu.mp3      (つ)
├── te.mp3       (て)
├── to.mp3       (と)
│
├── na.mp3       (な)
├── ni.mp3       (に)
├── nu.mp3       (ぬ)
├── ne.mp3       (ね)
├── no.mp3       (の)
│
├── ha.mp3       (は)
├── hi.mp3       (ひ)
├── fu.mp3       (ふ)
├── he.mp3       (へ)
├── ho.mp3       (ほ)
│
├── ma.mp3       (ま)
├── mi.mp3       (み)
├── mu.mp3       (む)
├── me.mp3       (め)
├── mo.mp3       (も)
│
├── ya.mp3       (や)
├── yu.mp3       (ゆ)
├── yo.mp3       (よ)
│
├── ra.mp3       (ら)
├── ri.mp3       (り)
├── ru.mp3       (る)
├── re.mp3       (れ)
├── ro.mp3       (ろ)
│
├── wa.mp3       (わ)
├── wo.mp3       (を)
└── n.mp3        (ん)
```

---

## 🎧 Spesifikasi File yang Direkomendasikan

- **Format**: `.mp3` (MPEG Layer-3) atau `.ogg` (Vorbis)
- **Sample Rate**: 44.1 kHz atau 48 kHz
- **Channel**: Mono atau Stereo
- **Bitrate**: 128 kbps ~ 192 kbps (cukup ringan untuk streaming web instan)
- **Durasi per file**: ~0.8 hingga 2.0 detik (pelafalan vokal/konsonan yang jelas)

---

## ⚙️ Mekanisme Lapisan Audio (Layered Playback)

1. **Prioritas Utama (Native Audio)**:
   Sistem akan mencoba memuat file audio lokal `/audio/hiragana/{romaji}.mp3`.
2. **Fallback Otomatis (Web Speech API)**:
   Jika file audio belum diletakkan di folder ini atau gagal dimuat (404/network error), sistem secara otomatis dan mulus beralih ke `window.speechSynthesis` dengan konfigurasi:
   - `lang`: `ja-JP`
   - `rate`: `0.85` (artikulasi artikulatif untuk pelajar)
   - `pitch`: `1.0`
   - Suara penutur asli Jepang bawaan sistem pengguna (Microsoft Nanami, Google 日本語, Kyoko, dsb.).

---

## 🔍 Cara Mengecek Kelengkapan File Audio

Jalankan perintah berikut di folder `frontend-next/`:
```bash
npm run check-audio
```
Skrip akan memindai folder ini dan menampilkan laporan berapa file `.mp3` yang sudah tersedia vs yang masih menggunakan fallback Web Speech API.
