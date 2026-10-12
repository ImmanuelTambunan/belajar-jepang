# Laporan Evaluasi Teknis Fase 6: Restrukturisasi Arsitektur Multi-Page Application (MPA)
## Proyek Pembelajaran Bahasa Jepang: Nihongo Sora (日本語の空)

---

## 1. Identitas Fase dan Ringkasan Eksekutif

Laporan ini mendokumentasikan pelaksanaan **Fase 6** dari siklus pengembangan proyek **Nihongo Sora (日本語の空)**. Fase 6 berfokus pada **Evaluasi Menyeluruh Sistem dan Restrukturisasi Antarmuka** dari model monolitik satu halaman (Single-Page Application / SPA yang memusatkan seluruh fitur pada berkas root) menjadi arsitektur **Multi-Page Application (MPA)** yang modular, dinamis, terorganisir, dan berkinerja tinggi berbasis Next.js 16 App Router, TypeScript, Tailwind CSS v4, dan next-themes.

Restrukturisasi pada Fase 6 ini merupakan tindak lanjut evaluasi dari pencapaian fase-fase sebelumnya, dengan tujuan mengatasi masalah kepadatan DOM, meningkatkan kenyamanan fokus pengguna saat berlatih kaligrafi, menyederhanakan navigasi antarmuka, serta mengisolasi manajemen audio mandiri.

### Matriks Rekapitulasi Tahapan Proyek (Fase 1 hingga Fase 6)

| Fase | Fokus Pengembangan | Output Utama |
|---|---|---|
| Fase 1 | Inisialisasi Fondasi & Lingkungan Proyek | Konfigurasi dasar sistem decoupled, struktur awal repositori, dan skema koneksi database. |
| Fase 2 | Skema Karakter Vokal & REST API Awal | Tabel relasi karakter Hiragana, Seeder vokal dasar (A, I, U, E, O), dan kartu interaktif vokal. |
| Fase 3 | Integrasi Kanvas Kaligrafi KanjiVG | Komponen HTML5 StrokeCanvas, visualisasi vektor KanjiVG, dan algoritma Hausdorff distance. |
| Fase 4 | Integrasi 46 Hiragana Gojuon & Arena Ujian | Dataset 46 Hiragana lengkap, pengelompokan baris konsonan, dan modul kuis adaptif. |
| Fase 5 | Dasbor Analitik & Retensi Pembelajaran | Modul analitik, metrik retensi hafalan, akurasi per baris, dan riwayat ujian terakumulasi. |
| **Fase 6** | **Restrukturisasi MPA & Evaluasi Sistem** | **Pemisahan 6 rute mandiri, Global Shell Navbar/Footer, Studio Tracing fokus penuh, Audio Manager IndexedDB, dan eliminasi DOM bloat.** |

---

## 2. Evaluasi Arsitektur Awal (Kelemahan dan Bottleneck Sebelum Fase 6)

Berdasarkan tinjauan teknis terhadap implementasi sebelum Fase 6, diidentifikasi sejumlah kelemahan kritis yang mendasari perlunya restrukturisasi:

### 2.1. Beban Komputasi DOM dan Risiko Render Berantai (DOM Bloat)
Seluruh modul berada di dalam satu berkas komponen (`src/app/page.tsx`). Hal ini mengakibatkan:
- Grid 46 karakter Hiragana, kanvas tracing beresolusi tinggi, visualizer gelombang suara, dan kartu konfigurasi ujian dimuat bersamaan ke memori peramban.
- Setiap pembaruan state lokal (seperti penggantian huruf terpilih atau sapuan kuas kanvas) berpotensi memicu evaluasi render ulang (re-rendering) pada komponen yang tidak terkait.

### 2.2. Ketiadaan Mekanisme Deep Linking
Arsitektur satu halaman sebelumnya tidak memungkinkan pengguna mengakses langsung fitur spesifik via URL. Pengguna tidak dapat membagikan atau menandai (bookmark) tautan ke studio tracing karakter tertentu, halaman ujian, atau dasbor analitik.

### 2.3. Degradasi Pengalaman Pengguna (UX) pada Aktivitas Menulis
Latihan menulis karakter memerlukan konsentrasi tinggi. Keberadaan tabel karakter besar, tombol audio, dan elemen analitik yang bertumpuk pada viewport yang sama menimbulkan distraksi kognitif bagi pembelajar.

---

## 3. Desain Arsitektur Baru Fase 6: Multi-Page Application (MPA)

Untuk menjawab kelemahan di atas, Fase 6 menetapkan pemisahan tugas secara tegas (Separation of Concerns) dengan mendistribusikan fungsionalitas ke dalam 6 rute Next.js App Router khusus.

### 3.1. Struktur Direktori dan Hierarki Berkas

```
frontend-next/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Global Shell (RootLayout, ThemeProvider, Navbar, Footer)
│   │   ├── globals.css               # Styling inti Tailwind v4, animasi fade-in transisi rute
│   │   ├── page.tsx                  # Rute 1: Beranda (Landing page, metrik harian, navigasi cepat)
│   │   ├── learn/
│   │   │   └── page.tsx              # Rute 2: Koleksi Huruf (Grid 46 Gojuon, filter, Hitsujun modal)
│   │   ├── practice/
│   │   │   └── page.tsx              # Rute 3: Studio Tracing (Kanvas penuh, drawer pemilih, evaluasi)
│   │   ├── exam/
│   │   │   └── page.tsx              # Rute 4: Arena Ujian (3 mode kuis, countdown timer, submit skor)
│   │   ├── analytics/
│   │   │   └── page.tsx              # Rute 5: Dasbor Analitik (Grafik tren, retensi baris, riwayat ujian)
│   │   └── settings/
│   │       └── page.tsx              # Rute 6: Pengaturan & Audio (IndexedDB manager, Web Speech tuning)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx            # Navigasi global terpadu, deteksi backend, badge hafalan
│   │   │   └── Footer.tsx            # Catatan kaki global arsitektur terpadu
│   │   ├── StrokeCanvas.tsx          # Kanvas interaktif kaligrafi, koordinat KanjiVG, Hausdorff scoring
│   │   ├── AudioSpeakerButton.tsx    # Tombol modular pemutar audio dengan animasi equalizer
│   │   ├── ThemeToggle.tsx           # Tombol pengalih tema bebas hydration mismatch
│   │   ├── ExamQuestionCard.tsx      # Komponen pertanyaan ujian adaptif
│   │   └── ...
│   ├── hooks/
│   │   └── useCharacterAudio.ts      # Hook stateful pengelolaan alur audio berlapis
│   ├── utils/
│   │   ├── audio.ts                  # Engine audio berlapis, fallback Web Speech, penyimpanan preferensi
│   │   ├── audioStorage.ts           # Mesin CRUD IndexedDB (NihongoSoraAudioDB)
│   │   ├── strokeScorer.ts           # Algoritma Hausdorff distance scoring dan evaluasi stroke
│   │   └── examGenerator.ts          # Generator soal ujian acak
│   └── types/
│       ├── character.ts              # Interface karakter, stroke path, dan respons API
│       ├── progress.ts               # Interface status progres spaced repetition
│       ├── exam.ts                   # Interface konfigurasi dan hasil ujian
│       └── accuracy.ts               # Interface titik koordinat dan evaluasi akurasi
```

---

## 4. Evaluasi dan Spesifikasi Teknis Setiap Modul Fase 6

### 4.1. Global Shell dan Navigasi Terpadu (`src/app/layout.tsx` & `src/components/layout/Navbar.tsx`)
- **RootLayout Persisten**: Membungkus seluruh aplikasi dengan `ThemeProvider` dari pustaka `next-themes` (atribut class, default dark mode). Di dalamnya diterapkan struktur pembungkus flexbox vertikal (`min-h-screen flex flex-col`) sehingga `Navbar` dan `Footer` konsisten di setiap rute tanpa layout shift.
- **Transisi Antarhalaman**: Menambahkan kelas CSS `.animate-fade-in` pada pembungkus konten utama di [globals.css](file:///c:/Users/ASUS/Documents/GitHub/belajar-jepang/frontend-next/src/app/globals.css) dengan kurva bezier halus (`cubic-bezier(0.16, 1, 0.3, 1)`) untuk menghadirkan perpindahan halaman yang mulus.
- **Navbar Global**:
  - **Identitas Merek**: Logo "Nihongo Sora" dengan kanji "日本語の空".
  - **Indikator Live Backend**: Polling berkala setiap 30 detik ke endpoint `http://localhost:8000/api/health` menggunakan `AbortController` dengan batas waktu 2.5 detik. Menampilkan status "Fiber Live" (hijau) jika aktif atau "Mode Offline" (amber) jika server belum berjalan.
  - **Badge Penguasaan Karakter**: Menghitung secara dinamis karakter berstatus "memorized" dari LocalStorage dan menyajikannya dalam format "X/46 Hafal".
  - **Highlight Rute Aktif**: Menggunakan hook `usePathname()` dari Next.js untuk memberikan styling aktif pada tautan halaman yang sedang dikunjungi.
  - **Responsivitas**: Menyediakan bilah menu horizontal untuk layar desktop dan drawer geser vertikal untuk layar perangkat bergerak (mobile).

### 4.2. Rute Beranda dan Dashboard Utama (`src/app/page.tsx`)
- **Pembersihan Elemen**: Menghilangkan seluruh kanvas tracing dan tabel 46 karakter dari halaman depan, menggantinya dengan antarmuka ringkas yang informatif.
- **Hero Section**: Dilengkapi tipografi kaligrafi kanji airmarked, penjelasan arsitektur decoupled (Golang Fiber + Next.js 16), dan tiga tombol aksi cepat (CTA):
  - "Lanjutkan Studio Tracing" (menuju `/practice`)
  - "Mulai Ujian Cepat" (menuju `/exam`)
  - "Koleksi 46 Huruf" (menuju `/learn`)
- **Kartu Ringkasan Progres Harian**: Empat indikator kinerja belajar:
  - Jumlah huruf terkuasai beserta bilah kemajuan persentase (Progress Bar).
  - Jumlah karakter dalam antrean pengulangan.
  - Rata-rata persentase skor akurasi goresan kuas kaligrafi.
  - Nilai dan jumlah sesi ujian yang telah diselesaikan.
- **Karakter Rekomendasi Harian**: Kartu spotlight karakter acak yang memfasilitasi pengenalan instan beserta tombol pemutar audio pelafalan.
- **Status Arsitektur Backend**: Kartu diagnostik koneksi yang dilengkapi tombol "Ping API" untuk menampilkan latensi jaringan secara instan.

### 4.3. Rute Koleksi Karakter Interaktif (`src/app/learn/page.tsx`)
- **Penyajian 46 Hiragana Gojuon**: Menampilkan seluruh karakter vokal dan konsonan dasar secara komprehensif.
- **Fitur Filter Baris**: Tab penyaring baris konsonan: Semua, A (Vokal), Ka, Sa, Ta, Na, Ha, Ma, Ya, Ra, dan Wa/N.
- **Pencarian Real-Time**: Input pencarian responsif yang memfilter berdasarkan simbol Hiragana maupun bacaan Romaji (misalnya: "ka", "shi", "tsu").
- **Filter Status Belajar**: Opsi penyaringan instan antara "Semua", "Sudah Hafal", dan "Belum Hafal".
- **Modal Detail Karakter & Hitsujun**:
  - Pratinjau visual SVG KanjiVG beresolusi tinggi dengan pembedaan warna per urutan goresan.
  - Pemutar animasi urutan goresan resmi (Hitsujun) bertahap dengan kontrol Play dan Stop.
  - Tombol pemutar audio pelafalan dengan indikator sumber suara aktif.
  - Navigasi cepat ke huruf sebelumnya dan berikutnya langsung di dalam modal.
  - Tombol aksi rujukan: "Latihan Tracing Huruf Ini di Studio" yang merutekan langsung ke `/practice?char=<simbol>`.

### 4.4. Rute Studio Tracing Mandiri (`src/app/practice/page.tsx`)
- **Tata Letak Bebas Distraksi**: Menghilangkan seluruh header ganda lama dan memfokuskan antarmuka pada area penulisan kanvas.
- **Drawer Pemilih Huruf Samping**: Sidebar vertikal yang dapat disembunyikan/ditampilkan (collapsible) berisi grid 46 karakter lengkap dengan indikator centang hafalan dan skor akurasi terakhir.
- **Kanvas Presisi Tengah (`StrokeCanvas.tsx`)**:
  - Menggunakan kanvas HTML5 Canvas yang diselaraskan dengan path koordinat vektor KanjiVG.
  - Opsi palet tinta: Biru Sora, Sumi Hitam, Merah Kuas, Bambu Hijau, dan Oranye Mikan.
  - Pengaturan ketebalan kuas (Tipis, Sedang, Tebal), fungsi Undo langkah terakhir, dan Reset coretan.
  - Algoritma evaluasi akurasi instan berbasis jarak Hausdorff yang menampilkan kartu skor dan visual overlay garis ideal.
- **Dukungan Deep Linking & URL Parameters**: Menerima parameter query `?char=...` atau `?id=...` via `useSearchParams()` yang dibungkus dalam boundary `<Suspense>`.
- **Alur Repetisi Spaced Repetition**: Tombol tindakan "Sudah Hafal", "Ulangi Nanti", dan "Lanjut" yang memajukan antrean karakter secara mulus.

### 4.5. Rute Arena Ujian Adaptif (`src/app/exam/page.tsx`)
- **Struktur Alur Ujian Tiga Tahap**:
  1. **Konfigurasi Parameter**: Pemilihan mode soal (Pilihan Ganda Romaji ke Kana, Kuis Mendengar Audio, atau Blind Tracing tanpa garis panduan), penentuan jumlah soal (5 hingga 46 soal), dan batas waktu per soal.
  2. **Eksekusi Pertanyaan**: Penyajian kartu soal interaktif (`ExamQuestionCard`) yang dilengkapi bilah kemajuan dinamis dan timer hitung mundur. Soal yang kehabisan waktu otomatis dievaluasi sebagai jawaban salah.
  3. **Hasil & Rekapitulasi**: Penghitungan skor persentase, penentuan grade evaluasi, daftar huruf yang salah, serta pengiriman hasil ke database backend melalui `POST /api/exam/submit` dengan pencadangan di LocalStorage.

### 4.6. Rute Dasbor Analitik (`src/app/analytics/page.tsx`)
- Menyederhanakan header lokal redundan agar selaras dengan Global Shell MPA.
- Menyajikan visualisasi grafik tren nilai ujian secara kronologis, metrik retensi hafalan global, rata-rata skor akurasi per baris konsonan, dan log riwayat sesi ujian komprehensif.

### 4.7. Rute Pusat Preferensi dan Audio Manager (`src/app/settings/page.tsx`)
- **Modul 1: Audio Manager (IndexedDB)**:
  - Menyediakan wadah unggah berkas rekaman suara kustom berekstensi `.mp3`, `.ogg`, atau `.wav` untuk masing-masing 46 karakter Hiragana.
  - Seluruh berkas disimpan langsung dalam basis data IndexedDB browser (`NihongoSoraAudioDB`) pada object store `custom_audio` sebagai Blob, sehingga audio kustom tersedia secara persisten dan offline tanpa konsumsi ruang penyimpanan server.
  - Fasilitas pratinjau audio, penghapusan rekaman per karakter, dan pembersihan massal database audio.
- **Modul 2: Web Speech API Tuning**:
  - Slider kecepatan bicara (*Speech Rate*) dari 0.5x hingga 1.5x (default: 0.85x untuk artikulasi belajar optimal).
  - Slider nada suara (*Speech Pitch*) dari 0.8 hingga 1.4 (default: 1.0).
  - Pemilihan profil suara bahasa Jepang (`ja-JP`) dari daftar suara yang dideteksi peramban.
  - Fasilitas uji suara langsung menggunakan sampel kalimat percakapan.
- **Modul 3: Preferensi Studio Latihan**:
  - Toggle autoplay suara otomatis saat berganti karakter di Studio Tracing.
  - Fitur reset data progres belajar lokal dengan tombol konfirmasi keamanan ganda.
- **Modul 4: Diagnostik Koneksi Backend**:
  - Visualisasi alamat endpoint backend Golang (`http://localhost:8000/api`) dan tombol pengujian latensi ping langsung.

---

## 5. Arsitektur Mesin Audio Berlapis (Layered Audio Engine)

Aplikasi pada Fase 6 menerapkan mekanisme pemutaran audio pelafalan dengan hierarki prioritas 3 lapis guna menjamin ketersediaan suara dalam setiap skenario penggunaan:

```
[Permintaan Pemutaran Audio Karakter]
                 |
                 v
   +----------------------------+
   | Layer 1: IndexedDB Kustom  | ---> [Ditemukan] ---> Putar Audio Kustom Pengguna
   +----------------------------+
                 | (Tidak ada)
                 v
   +----------------------------+
   | Layer 2: Berkas Statis MP3 | ---> [Ditemukan] ---> Putar Berkas /audio/hiragana/{romaji}.mp3
   +----------------------------+
                 | (Gagal / Tidak ada)
                 v
   +----------------------------+
   | Layer 3: Web Speech API    | ---> [Eksekusi] ---> window.speechSynthesis (ja-JP, rate, pitch)
   +----------------------------+
```

---

## 6. Integrasi Arsitektur Decoupled (Golang Fiber & MySQL)

Frontend Next.js 16 beroperasi secara independen dari backend Golang Fiber (port 8000) dan database MySQL Laragon (port 3306). Komunikasi data berlangsung melalui protokol HTTP REST API dengan konfigurasi CORS yang telah diizinkan untuk `http://localhost:3000`.

### Matriks Endpoint REST API Backend:

| Metode | Endpoint | Modul Terkait | Fungsi Utama |
|---|---|---|---|
| GET | `/api/health` | Navbar & Diagnostik | Memeriksa ketersediaan server Golang dan koneksi MySQL |
| GET | `/api/characters/hiragana` | Learn & Practice | Mengambil dataset 46 karakter Hiragana beserta KanjiVG strokes |
| GET | `/api/characters` | Exam & Master Pool | Mengambil seluruh kumpulan karakter |
| GET | `/api/characters/:id` | Detail Karakter | Mengambil informasi spesifik satu karakter |
| GET | `/api/progress/summary` | Beranda & Navbar | Mengambil metrik ringkasan jumlah hafalan |
| POST | `/api/progress/update` | Practice Studio | Menyimpan pembaruan status hafalan atau skor akurasi |
| GET | `/api/progress/practice-queue`| Practice Studio | Mengambil antrean spaced repetition yang perlu dilatih |
| POST | `/api/exam/submit` | Arena Ujian | Menyimpan rekapitulasi sesi ujian dan daftar jawaban salah |
| GET | `/api/exam/history` | Dasbor Analitik | Mengambil riwayat ujian lampau |
| GET | `/api/analytics/overview` | Dasbor Analitik | Mengambil agregat statistik pembelajaran |
| GET | `/api/analytics/accuracy-by-row`| Dasbor Analitik | Mengambil persentase akurasi berdasarkan baris konsonan |

---

## 7. Evaluasi Kualitas Perangkat Lunak dan Hasil Pengujian

### 7.1. Evaluasi Kompilasi Produksi (`npm run build`)
Pengujian build produksi Next.js 16 menggunakan Turbopack menghasilkan status sukses tanpa kesalahan kompilasi (exit code 0):

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /analytics
├ ○ /exam
├ ○ /learn
├ ○ /practice
└ ○ /settings

○  (Static)  prerendered as static content
```
Seluruh rute aplikasi berhasil diprerender sebagai halaman statis yang siap dihidrasi di sisi peramban.

### 7.2. Evaluasi Validasi Linter (`npm run lint`)
Validasi ESLint dijalankan terhadap aturan ketat Next.js 16 dan React 19 dengan hasil **0 error**:
- Penyesuaian aturan immutability hook: variabel dan fungsi penanganan dideklarasikan sebelum dipanggil dalam `useEffect`.
- Komponen penolong sub-render `SoundWaveBars` dipindahkan ke luar badan fungsi `AudioSpeakerButton` untuk mencegah pembuatan ulang komponen saat re-rendering.
- Penggantian tipe implisit `any` menjadi pemeriksaan tipe defensif `unknown` pada pembacaan LocalStorage dan penanganan error.

### 7.3. Evaluasi Integritas Jalur Rute (HTTP Status Verification)
Seluruh 6 rute utama diuji melalui permintaan HTTP pada server lokal port 3000 dengan hasil status code seragam:
- `http://localhost:3000/` : HTTP 200 OK
- `http://localhost:3000/learn` : HTTP 200 OK
- `http://localhost:3000/practice` : HTTP 200 OK
- `http://localhost:3000/exam` : HTTP 200 OK
- `http://localhost:3000/analytics` : HTTP 200 OK
- `http://localhost:3000/settings` : HTTP 200 OK

---

## 8. Matriks Perbandingan Kinerja: Sebelum vs Sesudah Fase 6

| Parameter Evaluasi | Sebelum Fase 6 (Model SPA Monolitik) | Sesudah Fase 6 (Model MPA Modular) |
|---|---|---|
| Struktur Halaman | Seluruh fitur menumpuk di `src/app/page.tsx` | Terdistribusi ke dalam 6 rute mandiri yang spesifik |
| Jejak DOM Awal (DOM Footprint) | Sangat besar (tabel 46 huruf, kanvas, audio, ujian termuat sekaligus) | Sangat ringan (halaman beranda hanya memuat ringkasan dan CTA) |
| Konsentrasi Latihan Tracing | Terdistraksi oleh tabel dan kontrol lain di viewport yang sama | Studio fokus penuh dengan drawer pemilih karakter yang dapat disembunyikan |
| Akses Langsung (Deep Linking) | Tidak mendukung deep linking ke mode atau huruf tertentu | Mendukung URL langsung (`/practice?char=あ`, `/exam`, `/settings`) |
| Manajemen Navigasi | Tab manual lokal di dalam halaman beranda | Global Navbar persisten dengan indikator rute aktif dan badge hafalan |
| Deteksi Backend | Pengecekan manual di bagian bawah beranda | Indikator live dot di Navbar dengan pemantauan berkala otomatis |
| Kustomisasi Suara | Terbatas pada modal pop-up lokal | Halaman preferensi terdedikasi dengan IndexedDB dan Web Speech sliders |
| Skalabilitas Pengembangan | Sulit dirawat karena satu berkas melebihi 500 baris kode padat | Sangat mudah dirawat dan dikembangkan secara modular per fitur |

---

## 9. Panduan Operasional Sistem

Untuk menjalankan seluruh lingkungan sistem secara terpadu:

### 9.1. Menjalankan Backend Golang Fiber
Buka terminal PowerShell pada direktori backend:
```powershell
cd c:\Users\ASUS\Documents\GitHub\belajar-jepang\backend-go
go run main.go
```
Backend akan aktif di `http://localhost:8000`.

### 9.2. Menjalankan Frontend Next.js 16
Buka terminal PowerShell pada direktori frontend:
```powershell
cd c:\Users\ASUS\Documents\GitHub\belajar-jepang\frontend-next
npm run dev
```
Frontend akan aktif di `http://localhost:3000`.

---

## 10. Kesimpulan Evaluasi Fase 6

Pelaksanaan **Fase 6: Restrukturisasi Arsitektur Multi-Page Application (MPA) dan Evaluasi Komprehensif Sistem** telah diselesaikan dengan hasil yang memenuhi seluruh tolok ukur teknis:

1. Beban rendering monolitik berhasil dieliminasi dengan membagi sistem ke dalam 6 rute halaman modular.
2. Pengalaman pengguna pada Studio Tracing meningkat secara signifikan berkat antarmuka fokus penuh yang bebas distraksi.
3. Ketersediaan audio dijamin melalui arsitektur pemutaran 3 lapis dengan manajemen penyimpanan suara lokal berbasis IndexedDB.
4. Kode sumber memenuhi standar kualitas tinggi dengan kelulusan build produksi Next.js 16 dan validasi ESLint tanpa error.
