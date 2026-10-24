# Frontend Nihongo Sora (Next.js 16 + React 19 + Tailwind CSS v4)

<div align="center">

![Frontend Next.js](https://img.shields.io/badge/Frontend-Next.js_16_App_Router-black?style=for-the-badge&logo=next.js)
<br />
**Aplikasi Antarmuka Pengguna Multi-Page (MPA) untuk Pembelajaran Kaligrafi Aksara Kana & Kanji N5**

*Dilengkapi Studio Kaligrafi HTML5, Hybrid 3-Tier Audio Engine, Spaced Repetition System (SRS), Gamifikasi, dan Efek Atmosferik Sora & Sakura Rain 60 FPS.*

</div>

---

> 📘 **Dokumentasi Lengkap**: Spesifikasi teknis menyeluruh, arsitektur decoupled, dan kamus data tersedia di [**Master PRD (PRD.md)**](../PRD.md).

---

## 🛠️ Stack Teknologi
- **Framework**: **Next.js 16.4.0** (App Router dengan compiler **Turbopack**)
- **Core UI**: **React 19** + **TypeScript 5.x**
- **Styling**: **Tailwind CSS v4** + `@custom-variant dark`
- **Tema**: `next-themes` (Dark Mode, Light Mode, dan System Adaptif)
- **Audio Engine**: Hybrid 3-Tier (IndexedDB + Static Audio Asset + Web Speech API `ja-JP`)
- **Port Baku**: `3000`
- **Target Backend API**: `http://localhost:8000/api`

---

## 🗺️ Struktur Rute Multi-Page Architecture (MPA)
| Rute Halaman | Berkas Sumber | Deskripsi & Fungsionalitas |
| :--- | :--- | :--- |
| `/` | `src/app/page.tsx` | **Beranda / Dashboard**: Hero Section atmosferik, watermark kaligrafi kanji 「空」, kartu progres hafalan, ringkasan SRS huruf lemah, spotlight karakter harian, dan indikator backend live. |
| `/learn` | `src/app/learn/page.tsx` | **Katalog 317 Karakter**: Koleksi lengkap Hiragana (107), Katakana (107), dan Kanji JLPT N5 (103) dengan filter kategori, pencarian romaji/arti, dan audio speaker. |
| `/practice` | `src/app/practice/page.tsx` | **Hitsujun Studio**: Kanvas kaligrafi interaktif HTML5, kurva vektor KanjiVG, penomoran urutan goresan kuas, evaluasi akurasi Hausdorff, dan latar anime torii sakura. |
| `/exam` | `src/app/exam/page.tsx` | **Arena Ujian Kuis**: Kuis adaptif pilihan ganda Romaji $\leftrightarrow$ Kana, timer dinamis per pertanyaan, blind tracing canvas, dan kalkulasi skor kelulusan. |
| `/analytics` | `src/app/analytics/page.tsx` | **Dasbor Statistik**: Agregasi akurasi per baris konsonan (*vowel, ka, sa, ta, ...*), rasio kelulusan ujian, penentuan Grade resmi (S, A, B, C, D), dan durasi belajar. |
| `/settings` | `src/app/settings/page.tsx` | **Pengaturan Sistem**: Penggantian tema, bahasa dwibahasa (ID/EN), sakelar partikel Sakura Rain, preferensi laju vokal TTS, dialog uploader suara IndexedDB, dan Hard Reset. |

---

## 🌸 Fitur Utama Antarmuka
1. **Interactive Calligraphy Studio (`StrokeCanvas.tsx`)**:
   - Kanvas $320 	imes 320$ px bergaris bantu tradisional *Genko Yoshi*.
   - Animasi stroke bertahap dengan penomoran titik mula `#1`, `#2`, `#3`.
   - Evaluasi presisi goresan kuas Hausdorff waktu nyata ($0 - 100\%$).
   - Dukungan Pointer Events multi-modal (Mouse, Touch Screen, Apple Pencil / Stylus).
2. **Dynamic Atmospheric Aesthetic**:
   - `SoraBackground.tsx`: Latar dinamis route-aware (`animation.gif` di Beranda dan `animation1.gif` di Latihan) dilapisi paralaks awan SVG dan frosted glass WCAG accessible overlay.
   - `SakuraRain.tsx`: Sistem partikel 12 kelopak bunga sakura gugur 60 FPS CSS keyframe dengan floating toggle minimalis di pojok kiri bawah.
3. **Hybrid 3-Tier Audio Engine**:
   - Memutar suara dari IndexedDB (Kustom) $ightarrow$ Audio Statis $ightarrow$ Web Speech API (`ja-JP`).
   - Modal Audio Manager untuk merekam dan mengunggah suara kustom sendiri.
4. **Gamifikasi & Motivasi Harian**:
   - Akumulasi XP per goresan kuas dan kuis, Leveling formula konstan, Daily Streak tracker, dan modal kenaikan level.
5. **Bilingual Localization (ID / EN)**:
   - Pengalih bahasa instan di bilah navigasi tanpa re-render latency.

---

## 🚀 Panduan Menjalankan Frontend (PowerShell)
```powershell
# 1. Pindah ke direktori frontend-next
cd frontend-next

# 2. Pasang dependensi
npm install

# 3. Jalankan development server Next.js (Port 3000)
npm run dev

# 4. Validasi build produksi
npm run build
```
Buka aplikasi di peramban favorit Anda: **http://localhost:3000**
