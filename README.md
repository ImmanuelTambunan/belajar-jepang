# Nihongo Sora (日本語の空)

<div align="center">

![Nihongo Sora Banner](https://img.shields.io/badge/🎌_Nihongo_Sora-日本語の空-0284c7?style=for-the-badge&labelColor=0f172a)
<br />
**Platform Pembelajaran Kaligrafi Digital & Penguasaan Aksara Kana (Hiragana & Katakana) Berbasis Full-Stack Modern**

*"Belajar bahasa Jepang dengan gembira — santai tapi serius, serius tapi santai."*

[![Next.js 16](https://img.shields.io/badge/Next.js_16-App_Router-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React_19-087ea4?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Golang](https://img.shields.io/badge/Golang-1.22+-00add8?style=flat-square&logo=go)](https://go.dev/)
[![Go Fiber v2](https://img.shields.io/badge/Go_Fiber-v2-00acb5?style=flat-square)](https://gofiber.io/)
[![GORM](https://img.shields.io/badge/GORM-ORM-e53935?style=flat-square)](https://gorm.io/)
[![MySQL 8](https://img.shields.io/badge/MySQL-Laragon_Native-4479a1?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![IndexedDB](https://img.shields.io/badge/IndexedDB-Audio_Storage-f59e0b?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![Status](https://img.shields.io/badge/Status-Fase_9_Complete_(214_Kana)-10b981?style=flat-square)](#-rekam-jejak-pengembangan-fase-1--9)

</div>

---

## 📖 Daftar Isi

1. [Gambaran Umum Proyek](#-gambaran-umum-proyek)
2. [Filosofi & Nilai Inti](#-filosofi--nilai-inti)
3. [Arsitektur Sistem & Tech Stack](#-arsitektur-sistem--tech-stack-decoupled-monorepo)
4. [Fitur-Fitur Utama](#-fitur-fitur-utama)
   - [214 Dataset Aksara Kana Lengkap](#1-214-dataset-aksara-kana-lengkap)
   - [Interactive Calligraphy Studio (Hitsujun Engine)](#2-interactive-calligraphy-studio-hitsujun-engine)
   - [Hybrid 3-Tier Audio Engine](#3-hybrid-3-tier-audio-engine)
   - [Gamifikasi & Spaced Repetition System (SRS)](#4-gamifikasi--spaced-repetition-system-srs)
   - [Bilingual Localization (ID / EN)](#5-bilingual-localization-id--en)
   - [Sinkronisasi Penuh & Hard Reset System](#6-sinkronisasi-penuh--hard-reset-system)
5. [Rekam Jejak Pengembangan (Fase 1 – 9)](#-rekam-jejak-pengembangan-fase-1--9)
6. [Struktur Direktori Monorepo](#-struktur-direktori-monorepo)
7. [Dokumentasi REST API (Backend Go Fiber)](#-dokumentasi-rest-api-backend-go-fiber)
8. [Panduan Instalasi & Menjalankan Proyek](#-panduan-instalasi--menjalankan-proyek)

---

## 🌟 Gambaran Umum Proyek

**Nihongo Sora (日本語の空)** adalah platform edukasi interaktif full-stack generasi baru yang dirancang khusus untuk membantu pembelajar menguasai aksara bahasa Jepang (**Hiragana** dan **Katakana**) secara mendalam, presisi, dan menyenangkan.

Berbeda dari media pembelajaran konvensional yang pasif, Nihongo Sora menghadirkan **Studio Kaligrafi Digital** (*Hitsujun Studio*) dengan kanvas HTML5 interaktif yang memandu urutan goresan kuas (*stroke order*), mengevaluasi akurasi geometris secara waktu nyata (*real-time*), serta menyediakan arena ujian adaptif dengan sistem pengulangan berkala (*Spaced Repetition System* / SRS).

Aplikasi dibangun di atas arsitektur **Decoupled Monorepo** performa tinggi:
- **Frontend SPA/MPA**: Dibangun menggunakan **Next.js 16 (App Router)**, **React 19**, **TypeScript**, dan **Tailwind CSS v4** dengan transisi tema adaptif (*Dark/Light Mode*).
- **Backend API**: Menggunakan **Golang Fiber v2** dan **GORM** yang langsung terhubung ke database **MySQL 8.0** lokal (Laragon) dengan latensi sub-milidetik dan automated seeder berkapasitas 214 karakter Kana.

---

## 🌸 Filosofi & Nilai Inti

> *"Belajar bahasa Jepang dengan gembira — santai tapi serius, serius tapi santai."*

- **Gembira & Ringan di Hati**: Belajar aksara asing tidak boleh terasa menakutkan atau membosankan. Tampilan antarmuka Nihongo Sora memadukan nuansa modern, elemen visual awan (*Sora* / 空), animasi mikro yang halus, serta efek audio yang memuaskan.
- **Presisi Kaligrafi Tradisional**: Meski berjiwa santai, validasi urutan goresan (*Hitsujun*) menerapkan standar ortografi resmi Jepang melalui integrasi kurva vektor **KanjiVG**, melatih memori otot (*muscle memory*) pengguna sejak goresan pertama.
- **Mandiri & Fleksibel**: Pengguna memiliki kendali penuh atas proses belajarnya—mulai dari kustomisasi audio pelafalan hingga opsi reset progres secara atomik.

---

## 🏗️ Arsitektur Sistem & Tech Stack (Decoupled Monorepo)

Nihongo Sora menerapkan arsitektur *monorepo terpisah* (*decoupled monorepo*) yang bersih. Frontend dan backend dapat dijalankan, diuji, dan dikembangkan secara independen tanpa saling mengunci dependensi runtime.

```
                           +----------------------------------------+
                           |        Browser / Client Device         |
                           +----------------------------------------+
                                       |                 |
                   Web Audio / IndexedDB                 HTTP / JSON REST API
                   (Local Voice Storage)                 (Port :8000)
                                       |                 |
                                       v                 v
+------------------------------------------+     +------------------------------------------+
|      frontend-next (Next.js 16 MPA)      |     |       backend-go (Golang Fiber v2)       |
|------------------------------------------|     |------------------------------------------|
| • React 19 + TypeScript + Turbopack     |     | • High-Performance Web Framework        |
| • Tailwind CSS v4 + next-themes          |     | • GORM Object Relational Mapping         |
| • HTML5 Canvas + KanjiVG SVG Engine      |     | • RESTful Routing & Middleware Logger   |
| • 3-Tier Audio Engine (IDB + Static + TTS|     | • AutoMigrate & Automated Seeder Engine  |
| • State Contexts (Gamify, Lang, Script)  |     +------------------------------------------+
+------------------------------------------+                          |
                                                               SQL Connections
                                                                      |
                                                                      v
                                                 +------------------------------------------+
                                                 |         MySQL 8.0 (Laragon Native)       |
                                                 |------------------------------------------|
                                                 | • characters (214 Kana Symbols)          |
                                                 | • character_readings (Romaji & Meaning)  |
                                                 | • character_strokes (KanjiVG SVG Paths)  |
                                                 | • user_character_progress (SRS State)    |
                                                 | • exam_results (Quiz Session History)    |
                                                 +------------------------------------------+
```

### 💻 Frontend: `frontend-next`
| Komponen / Library | Peran & Implementasi |
| :--- | :--- |
| **Next.js 16 (App Router)** | Rendering halaman modern berbasis App Router dengan performa kompilasi Turbopack. |
| **React 19 & TypeScript** | Library antarmuka komponen reaktif dengan pengetikan statis yang ketat (*type safety*). |
| **Tailwind CSS v4** | Framework utilitas CSS terkompilasi cepat dengan sistem palet warna modern. |
| **`next-themes`** | Manajemen tema adaptif (*Light Mode*, *Dark Mode*, *System Preference*) tanpa flicker (*hydration match*). |
| **HTML5 Canvas & SVG** | Kanvas interaktif berlapis (*interactive layered canvas*) dengan grid kaligrafi (*Genko Yoshi*). |
| **Browser IndexedDB** | Penyimpanan audio lokal berkapasitas besar untuk rekaman suara kustom (*Custom Audio Manager*). |
| **React Context API** | Manajemen status global terpisah: `GamificationContext`, `LanguageContext` (i18n), dan `ScriptContext`. |

### ⚙️ Backend: `backend-go`
| Komponen / Library | Peran & Implementasi |
| :--- | :--- |
| **Golang 1.22+** | Bahasa pemrograman bertipe statis dengan konkurensi tinggi dan penggunaan memori yang sangat hemat. |
| **Go Fiber v2** | Framework web berkecepatan tinggi berbasis fasthttp untuk melayani permintaan REST API secara sub-milidetik. |
| **GORM** | ORM deklaratif untuk pemetaan entitas basis data, query relasional, dan transaksi atomik. |
| **MySQL 8.0 (Laragon)** | Penyimpanan basis data relasional lokal yang stabil, mendukung UTF-8 Multibyte (`utf8mb4`). |
| **Automated Seeder** | Otomatisasi migrasi skema dan injeksi 214 dataset karakter beserta koordinat goresan SVG KanjiVG saat server pertama kali dijalankan. |

---

## ⚡ Fitur-Fitur Utama

### 1. 214 Dataset Aksara Kana Lengkap
Sistem menyimpan dan menyajikan dataset lengkap aksara bahasa Jepang baku yang terdiri atas **107 Hiragana** dan **107 Katakana** (Total: **214 Karakter**). Setiap karakter terpetakan ke dalam kategori fonetik:
- **Gojūon (五十音)**: 46 karakter dasar per aksara (A-I-U-E-O hingga Wa-Wo-N).
- **Dakuon (濁音)**: 20 karakter dengan tanda tenten (Ga, Za, Da, Ba, dsb.).
- **Handakuon (半濁音)**: 5 karakter dengan tanda maru (Pa, Pi, Pu, Pe, Po).
- **Yōon (拗音)**: 36 kombinasi fonem ganda dengan aksara kecil Ya, Yu, Yo (Kya, Sha, Cha, dsb.).

### 2. Interactive Calligraphy Studio (Hitsujun Engine)
Studio latihan kaligrafi digital pada rute `/practice` dilengkapi teknologi evaluasi goresan kuas waktu nyata:
- **Panduan Garis Kotak Kaligrafi (*Genko Yoshi*)**: Grid kuadran 4 kotak dengan garis putus-putus pembantu proporsi huruf.
- **Validasi Urutan Goresan (*Stroke Order / Hitsujun*)**: Memandu pengguna menorehkan kuas dari goresan ke-1 hingga akhir secara berurutan.
- **Deteksi Koordinat Waktu Nyata**: Mengevaluasi kurva pengguna terhadap *path* resmi KanjiVG menggunakan algoritma jarak Euclidean (*Euclidean Point-to-Path Distance*).
- **Skor Presisi & Grading Instan**: Menghitung persentase akurasi (0–100%) dan memberikan umpan balik visual (*Perfect*, *Great*, *Good*, *Need Practice*) beserta warna goresan yang interaktif.
- **Dukungan Multi-Input**: Berfungsi mulus untuk tetikus (*mouse*), layar sentuh (*touch screen* smartphone/tablet), maupun pena digital (*stylus / Apple Pencil*).

### 3. Hybrid 3-Tier Audio Engine
Fitur pelafalan suara (*pronunciation audio*) dirancang dengan sistem hirarki 3 lapis demi menjamin suara tetap terdengar dalam segala situasi:

```
[Play Audio Trigger]
         │
         ▼
┌──────────────────────────────────────────────┐
│ Prioritas 1: Custom User Audio (IndexedDB)   │ ──(Tersedia)──► [Putar Audio Kustom]
└──────────────────────────────────────────────┘
         │ (Tidak Ditemukan / Kosong)
         ▼
┌──────────────────────────────────────────────┐
│ Prioritas 2: File Statis Lokal (.mp3/.ogg)   │ ──(Tersedia)──► [Putar Native Audio]
└──────────────────────────────────────────────┘
         │ (Gagal Load / File Absen)
         ▼
┌──────────────────────────────────────────────┐
│ Prioritas 3: Web Speech API (speechSynthesis) │ ──────────────► [Sintesis Vokal ja-JP]
└──────────────────────────────────────────────┘
```

- **Audio Manager Modal**: Pengguna dapat mengunggah file rekaman suaranya sendiri atau suara *native speaker* kesukaannya ke browser IndexedDB.
- **Pengaturan Vokal Sintesis**: Kecepatan laju (*Speech Rate: 0.85*) dan nada (*Pitch: 1.0*) dioptimalkan khusus untuk kejelasan fonetik bahasa Jepang.

### 4. Gamifikasi & Spaced Repetition System (SRS)
- **Sistem Level & XP**: Pengguna memperoleh Experience Points (XP) dari setiap latihan goresan kuas, penyelesaian kuis, dan kelulusan ujian. Kenaikan level ditandai dengan modal selebrasi interaktif.
- **Daily Streak Tracker (🔥)**: Menghitung konsistensi belajar harian dan menampilkan api motivasi di bilah navigasi (*Navbar*).
- **Streak Mastery Popover**: Popover informatif di Navbar yang merangkum capaian hafalan Hiragana (X/107) dan Katakana (X/107) secara langsung.
- **Smart Adaptive Review (SRS)**: Sistem otomatis menandai karakter sebagai "Perlu Diulang" (*Needs Review*) jika skor akurasi goresan terakhir **< 70%** atau jika karakter tersebut **dijawab salah dalam sesi ujian**. Karakter ini otomatis diprioritaskan muncul di antrean latihan berikutnya.

### 5. Bilingual Localization (ID / EN)
- Pengalih bahasa instan (*Instant Language Switcher*) di pojok kanan atas memungkinkan pengguna beralih antara **Bahasa Indonesia** dan **English**.
- Seluruh instruksi antarmuka, keterangan tombol, pesan kesalahan, dan panduan belajar diterjemahkan secara rapi melalui `LanguageContext` tanpa mengubah simbol aksara asli dan bacaan romaji Jepang.

### 6. Sinkronisasi Penuh & Hard Reset System
- Rute `/settings` menyediakan fitur **Hard Reset** yang aman dan komprehensif.
- Menghapus riwayat sesi, penyimpanan kuas, serta cache LocalStorage/IndexedDB di peramban.
- Mengeksekusi query database atomik via endpoint `POST /api/progress/reset` untuk mengosongkan tabel `user_character_progress` dan `exam_results` secara instan dan aman.

---

## 📈 Rekam Jejak Pengembangan (Fase 1 – 9)

Proyek Nihongo Sora dikembangkan secara bertahap melalui sembilan fase iterasi terstruktur:

| Fase | Fokus Pengembangan | Rincian Deliverable & Pencapaian Teknis |
| :---: | :--- | :--- |
| **Fase 1** | Inisialisasi Arsitektur Monorepo & Backend Core | Inisialisasi arsitektur Decoupled Monorepo, pembuatan server Golang Fiber v2, konfigurasi koneksi GORM ke MySQL Laragon lokal, skema tabel dasar (`characters`, `character_readings`, `character_strokes`), dan automated seeder vokal dasar. |
| **Fase 2** | Interactive Stroke Tracing Studio | Implementasi engine kaligrafi HTML5 Canvas dan parsing kurva SVG KanjiVG, penomoran urutan goresan (*Hitsujun*), validasi titik koordinat (*Euclidean distance*), serta kalkulasi skor presisi goresan. |
| **Fase 3** | Arena Ujian Interaktif (`/exam`) | Pembangunan modul evaluasi kuis dengan pilihan ganda romaji-ke-kana dan kana-ke-romaji, timer dinamis per pertanyaan, kalkulasi skor persentase, dan pencatatan riwayat sesi ujian ke basis data MySQL. |
| **Fase 4** | Transformasi Multi-Page Architecture (MPA v2.0) | Restrukturisasi frontend ke Next.js 16 App Router dengan rute terpisah: `/` (Dashboard), `/learn` (Koleksi), `/practice` (Studio Tulis), `/exam` (Arena Ujian), `/analytics` (Statistik), dan `/settings` (Pengaturan). Integrasi Global Navigation Shell. |
| **Fase 5** | Dasbor Analitik & Statistik Belajar (`/analytics`) | Pembangunan visualisasi data belajar: matriks penguasaan karakter, grafik akurasi per baris huruf (*vowel, ka, sa, ta, ...*), rasio kelulusan ujian, penentuan grade kelulusan (S/A/B/C/D), serta metrik durasi belajar. |
| **Fase 6** | Sistem Tema Adaptif & Pembersihan Legacy | Implementasi sistem tema *Dark/Light Mode* menggunakan `next-themes` dan variabel CSS Tailwind, penghapusan dependensi legacy sisa eksperimen awal (PHP/Laravel & Docker container lama), serta standarisasi font kaligrafi Jepang. |
| **Fase 7** | Audio Manager, Gamifikasi & Adaptive SRS | Peluncuran sistem audio 3-tier mandiri dengan IndexedDB Custom Voice uploader, mekanisme Gamifikasi (XP, Level, Daily Streak), Spaced Repetition System (SRS) untuk karakter lemah (<70% / salah kuis), lokalisasi bilingual (ID/EN), dan fitur Reset Penuh (*Hard Reset*). |
| **Fase 8** | Ekspansi Dataset Hiragana Penuh (107 Karakter) | Penambahan dataset Hiragana dari 5 huruf vokal menjadi 107 karakter lengkap (*Gojūon*, *Dakuon*, *Handakuon*, dan *Yōon*), implementasi filter kategori dinamis, dan pembaruan seeder database backend. |
| **Fase 9** | Ekspansi Katakana Lengkap & Refaktor UI/UX Global | Penambahan 107 karakter Katakana lengkap (Total **214 Karakter Kana** di database), switch mode Hiragana/Katakana global, peremajaan UI/UX Navbar (Training Dropdown, Streak Mastery Popover, Icon-only Settings), serta penyederhanaan Footer yang bersih dan modern. |

---

## 📁 Struktur Direktori Monorepo

```text
belajar-jepang/
├── backend-go/                     # High-Performance REST API (Golang Fiber v2 + GORM)
│   ├── config/                     # Konfigurasi Koneksi Database MySQL & Helper ENV
│   │   ├── database.go
│   │   └── env.go
│   ├── controllers/                # Handler Bisnis REST API
│   │   ├── analytics_controller.go # Agregasi Analitik, Grade, & Akurasi per Baris
│   │   ├── character_controller.go # Pengambilan Karakter Hiragana & Katakana
│   │   ├── exam_controller.go      # Submit Hasil Ujian & Auto-SRS Flagging
│   │   └── progress_controller.go  # Update Progres Hafalan & Practice Queue
│   ├── data/                       # Dataset Vektor Mentah
│   │   ├── hiragana_107.json       # 107 Hiragana + Koordinat KanjiVG SVG
│   │   └── katakana_107.json       # 107 Katakana + Koordinat KanjiVG SVG
│   ├── database/                   # Migrasi GORM & Seeder Otomatis
│   │   ├── seeder.go               # Injeksi 214 Karakter ke MySQL
│   │   └── seeder_test.go
│   ├── models/                     # Deklarasi Struktur Tabel GORM
│   │   ├── character.go            # Character, Reading, & Stroke Structs
│   │   ├── exam.go                 # ExamResult Struct
│   │   └── progress.go             # UserCharacterProgress Struct
│   ├── routes/                     # Pendaftaran Endpoint REST API
│   │   └── routes.go
│   ├── .env.example                # Contoh Konfigurasi Server & Database
│   ├── go.mod / go.sum             # Manajemen Dependensi Go
│   └── main.go                     # Entry Point Backend Fiber
│
├── frontend-next/                  # Modern Web Application (Next.js 16 + React 19)
│   ├── src/
│   │   ├── app/                    # Multi-Page Architecture (App Router)
│   │   │   ├── analytics/page.tsx  # Dasbor Statistik & Analitik Belajar
│   │   │   ├── exam/page.tsx       # Arena Ujian & Kuis Evaluasi
│   │   │   ├── learn/page.tsx      # Katalog 214 Karakter Kana & Kartu Bacaan
│   │   │   ├── practice/page.tsx   # Studio Kaligrafi Digital & Tracing Canvas
│   │   │   ├── settings/page.tsx   # Pengaturan Preferensi, Audio, & Hard Reset
│   │   │   ├── layout.tsx          # Root Layout, ThemeProvider, & Global Contexts
│   │   │   ├── page.tsx            # Beranda / Dashboard Utama
│   │   │   └── globals.css         # Variabel Tema CSS & Aturan Tailwind v4
│   │   ├── components/             # Komponen Antarmuka Reusable
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx      # Navbar Utama (Dropdown, Popover, Switcher)
│   │   │   │   └── Footer.tsx      # Footer Bersih & Minimalis
│   │   │   ├── AudioManagerModal.tsx # Dialog Pengunggah Suara Kustom IndexedDB
│   │   │   ├── StrokeCanvas.tsx    # Kanvas Interaktif Goresan Kuas Kaligrafi
│   │   │   ├── ThemeToggle.tsx     # Tombol Pengalih Mode Terang/Gelap
│   │   │   ├── LanguageSwitcher.tsx # Pengalih Bahasa ID / EN
│   │   │   └── ...                 # Kartu Ujian, Modal Reset, Level-up Dialog
│   │   ├── context/                # Context API Global State
│   │   │   ├── GamificationContext.tsx # XP, Level, & Daily Streak Engine
│   │   │   ├── LanguageContext.tsx     # Lokalisasi Bilingual (ID/EN)
│   │   │   └── ScriptContext.tsx       # Switcher Aksara (Hiragana / Katakana)
│   │   ├── data/                   # Data Fallback Statis & Pemetaan Romaji
│   │   ├── locales/                # Kamus Terjemahan
│   │   │   ├── en.ts               # Kamus Bahasa Inggris
│   │   │   └── id.ts               # Kamus Bahasa Indonesia
│   │   ├── types/                  # Definisi TypeScript Interface & Tipe Data
│   │   └── utils/                  # Utilitas Logika Bisnis
│   │       ├── audio.ts            # Hybrid 3-Tier Audio Engine Player
│   │       ├── audioStorage.ts     # Wrapper IndexedDB untuk File Suara Kustom
│   │       ├── reset.ts            # Eksekusi Pembersihan State & DB Atomik
│   │       ├── srs.ts              # Logika Filter Karakter Spaced Repetition
│   │       └── strokeScorer.ts     # Algoritma Evaluasi Presisi Goresan Kuas
│   ├── public/                     # Aset Publik (Audio Statis, Gambar, Favicon)
│   ├── .env.local                  # Environment Frontend (NEXT_PUBLIC_API_URL)
│   ├── package.json                # Dependensi NPM & Skrip Build
│   └── tsconfig.json               # Konfigurasi Kompiler TypeScript
│
└── README.md                       # Dokumentasi Teknis Utama Proyek
```

---

## 📡 Dokumentasi REST API (Backend Go Fiber)

Backend berjalan secara baku pada `http://localhost:8000` dan mengekspos rute RESTful dengan format respons JSON standar:

### 1. Karakter Kana & Stroking Data
| Metode | Endpoint | Parameter Query | Deskripsi & Kegunaan |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/health` | `-` | Memeriksa status kesehatan server dan koneksi aktif ke database MySQL. |
| `GET` | `/api/characters` | `script`, `category`, `row`, `jlpt_level` | Mengambil seluruh karakter dengan opsi filter fleksibel (default: `script=hiragana`). |
| `GET` | `/api/characters/hiragana` | `row`, `category` | Mengambil seluruh 107 karakter Hiragana beserta relasi readings dan urutan stroke SVG. |
| `GET` | `/api/characters/katakana` | `row`, `category` | Mengambil seluruh 107 karakter Katakana beserta relasi readings dan urutan stroke SVG. |
| `GET` | `/api/characters/:id` | `-` | Mengambil detail spesifik satu karakter berdasarkan ID numerik atau simbol harfiah (misal: `あ` atau `ア`). |

### 2. Progres Belajar & Spaced Repetition (SRS)
| Metode | Endpoint | Format Payload / Query | Deskripsi & Kegunaan |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/progress/summary` | `?script=hiragana\|katakana\|all` | Mengambil ringkasan total karakter yang sudah hafal (*memorized*) vs sedang dipelajari (*learning*). |
| `POST` | `/api/progress/update` | JSON `{ character_id, status, accuracy_score }` | Memperbarui status hafalan, skor akurasi goresan terakhir, dan menambah jumlah review. |
| `GET` | `/api/progress/practice-queue` | `?script=&row=&mode=unmemorized&limit=15` | Mengambil antrean latihan prioritas adaptif berdasarkan riwayat kesalahan dan review terendah. |
| `POST` | `/api/progress/reset` | `-` | **Hard Reset**: Mengosongkan seluruh riwayat progres dan ujian pengguna dalam transaksi database atomik. |

### 3. Sesi Ujian & Analisis Performa
| Metode | Endpoint | Format Payload / Query | Deskripsi & Kegunaan |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/exam/submit` | JSON `{ script_type, total_questions, correct_answers, wrong_character_ids, duration_seconds }` | Menyimpan riwayat sesi ujian dan otomatis menurunkan karakter yang salah ke antrean prioritas latihan SRS. |
| `GET` | `/api/exam/history` | `?script=&limit=10` | Mengambil daftar riwayat ujian yang pernah diselesaikan pengguna. |
| `GET` | `/api/analytics/overview` | `?script=hiragana\|katakana\|all` | Menghitung metrik makro: tingkat kelulusan, persentase hafalan, rata-rata skor ujian, dan total latihan. |
| `GET` | `/api/analytics/accuracy-by-row` | `?script=hiragana\|katakana` | Mengelompokkan rata-rata akurasi goresan per baris konsonan (*vowel, ka, sa, ta, ...*) beserta status kemahiran. |
| `GET` | `/api/analytics/exam-history` | `?script=&limit=10` | Mengambil riwayat ujian yang telah diperkaya dengan kalkulasi Grade resmi (S, A, B, C, D). |
| `DELETE`| `/api/analytics/reset` | `-` | Endpoint alternatif untuk mereset seluruh tabel analitik dan progres. |

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 📋 Prasyarat Sistem
Pastikan perangkat Anda telah terpasang:
- **Node.js**: Versi `20.x` atau lebih baru
- **Golang**: Versi `1.22` atau lebih baru
- **MySQL**: Versi `8.0` (Sangat disarankan menggunakan **Laragon** di Windows untuk setup instan tanpa Docker)
- **Git**

---

### 1. Konfigurasi Database (MySQL / Laragon)
1. Buka Laragon dan pastikan service **MySQL** telah berstatus *Started* (Port baku: `3306`).
2. Masuk ke MySQL client / HeidiSQL dengan kredensial:
   - **Host**: `127.0.0.1`
   - **Port**: `3306`
   - **User**: `root`
   - **Password**: *(kosongkan atau sesuaikan dengan konfigurasi Laragon Anda)*
3. Buat database baru (opsional, karena seeder backend akan membuatnya otomatis jika belum ada):
   ```sql
   CREATE DATABASE IF NOT EXISTS belajar_jepang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

---

### 2. Konfigurasi & Menjalankan Backend (`backend-go`)

Buka terminal (PowerShell / Command Prompt) dan arahkan ke folder `backend-go`:

```powershell
# 1. Pindah ke direktori backend-go
cd backend-go

# 2. Salin environment configuration
copy .env.example .env
```

Sesuaikan isi file `.env` jika kredensial MySQL Anda berbeda:
```env
PORT=8000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=belajar_jepang
```

Unduh dependensi modul dan jalankan server Go:
```powershell
# 3. Rapikan dependensi modul Go
go mod tidy

# 4. Jalankan backend server
go run main.go
```

> [!NOTE]
> Saat pertama kali dijalankan, sistem secara otomatis mengeksekusi `AutoMigrate` dan memasukkan **214 karakter** (107 Hiragana & 107 Katakana beserta relasi reading dan stroke SVG) ke dalam database MySQL Anda.
> Backend siap melayani request di **`http://localhost:8000`**.

---

### 3. Konfigurasi & Menjalankan Frontend (`frontend-next`)

Buka jendela terminal baru dan arahkan ke folder `frontend-next`:

```powershell
# 1. Pindah ke direktori frontend-next
cd frontend-next

# 2. Pastikan file konfigurasi .env.local sudah tersedia
# Isi dari .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

# 3. Pasang seluruh dependensi NPM
npm install

# 4. Jalankan development server Next.js (Port 3000)
npm run dev
```

Buka peramban favorit Anda dan akses:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Pengujian Koneksi & Diagnostik Sistem

- **Health Check API**: Buka peramban di `http://localhost:8000/api/health` untuk memverifikasi status koneksi backend dan ping database MySQL.
- **Indikator Live di Navbar**: Di sudut kanan atas aplikasi web, terdapat pill badge `Fiber Live`. Jika berwarna hijau, frontend berhasil berkomunikasi langsung dengan backend Go. Jika backend dimatikan, aplikasi tetap dapat digunakan secara offline dengan data fallback statis.

---

## 📄 Lisensi & Kontribusi

Proyek ini dikembangkan untuk tujuan edukasi dan penguasaan bahasa Jepang berbasis teknologi web modern.

Dikembangkan dengan penuh dedikasi oleh **Institut Teknologi Del** © 2026 **Nihongo Sora Team**.  
*Ganbatte kudasai! (頑張ってください!)*
