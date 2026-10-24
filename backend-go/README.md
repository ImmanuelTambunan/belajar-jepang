# Backend Nihongo Sora (Golang Fiber v2 + GORM)

<div align="center">

![Backend Golang](https://img.shields.io/badge/Backend-Golang_Fiber_v2-00acb5?style=for-the-badge&logo=go)
<br />
**REST API Berkinerja Tinggi untuk Platform Pembelajaran Aksara Kana (214 Karakter) & Kanji JLPT N5 (103 Karakter)**

*Terhubung secara native ke MySQL 8.0 (Laragon Lokal) dengan latensi sub-milidetik dan automated seeder 317 karakter.*

</div>

---

> 📘 **Dokumentasi Lengkap**: Spesifikasi teknis menyeluruh, arsitektur decoupled, dan kamus data tersedia di [**Master PRD (PRD.md)**](../PRD.md).

---

## 🛠️ Stack Teknologi
- **Bahasa**: Golang 1.22+
- **Framework Web**: [Fiber v2](https://github.com/gofiber/fiber/v2) (Berbasis `fasthttp`)
- **ORM**: [GORM](https://gorm.io) dengan MySQL Driver
- **Database**: MySQL 8.0 (Laragon Lokal di `127.0.0.1:3306`)
- **Port Baku**: `8000`

---

## 💾 Struktur Model Data (GORM)
1. **`models.Character`**: Menyimpan 214 karakter Kana (107 Hiragana + 107 Katakana) beserta atribut jenis huruf, kategori (*gojuon, dakuon, handakuon, yoon*), dan baris konsonan (*vowel, ka, sa, ...*).
2. **`models.CharacterReading`**: Menyimpan relasi bacaan romaji dan arti kata.
3. **`models.CharacterStroke`**: Menyimpan urutan goresan resmi KanjiVG dan path kurva SVG.
4. **`models.Kanji`**: Menyimpan 103 karakter Kanji JLPT N5 lengkap dengan On'yomi, Kun'yomi, arti (ID/EN), kategori, kurva SVG, dan contoh kosakata jukugo.
5. **`models.UserCharacterProgress`**: Mencatat status hafalan (*learning* / *memorized*), skor akurasi goresan terakhir, dan frekuensi review (SRS).
6. **`models.ExamResult`**: Mencatat riwayat sesi ujian kuis, rasio jawaban benar, durasi, dan daftar ID karakter yang salah dijawab.

---

## 🔌 Daftar Endpoint REST API

### 1. Karakter Kana & Kanji N5
| Metode | Endpoint | Parameter Query | Deskripsi & Kegunaan |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/health` | `-` | Status kesehatan server dan ping database MySQL. |
| `GET` | `/api/characters` | `script`, `category`, `row`, `jlpt_level` | Mengambil seluruh karakter Kana dengan filter opsional. |
| `GET` | `/api/characters/hiragana` | `row`, `category` | Mengambil seluruh 107 karakter Hiragana + readings + strokes. |
| `GET` | `/api/characters/katakana` | `row`, `category` | Mengambil seluruh 107 karakter Katakana + readings + strokes. |
| `GET` | `/api/characters/:id` | `-` | Detail satu karakter Kana berdasarkan ID atau simbol. |
| `GET` | `/api/kanjis` | `category`, `jlpt_level` | Mengambil seluruh 103 karakter Kanji JLPT N5. |
| `GET` | `/api/kanjis/:id` | `-` | Detail spesifik satu karakter Kanji beserta contoh jukugo. |

### 2. Progres Belajar & Spaced Repetition (SRS)
| Metode | Endpoint | Format Payload / Query | Deskripsi |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/progress/summary` | `?script=hiragana\|katakana\|all` | Ringkasan total karakter hafal vs dipelajari. |
| `POST` | `/api/progress/update` | JSON `{ character_id, status, accuracy_score }` | Memperbarui status hafalan dan skor akurasi. |
| `GET` | `/api/progress/practice-queue` | `?script=&row=&mode=unmemorized&limit=15` | Antrean latihan prioritas adaptif SRS. |
| `POST` | `/api/progress/reset` | `-` | **Hard Reset**: Mengosongkan data progres dan ujian secara atomik. |

### 3. Sesi Ujian & Analitik
| Metode | Endpoint | Format Payload / Query | Deskripsi |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/exam/submit` | JSON `{ script_type, total_questions, correct_answers, wrong_character_ids, duration_seconds }` | Submit hasil kuis dan auto-flagging SRS. |
| `GET` | `/api/exam/history` | `?script=&limit=10` | Riwayat sesi ujian pengguna. |
| `GET` | `/api/analytics/overview` | `?script=all` | Rasio kelulusan, rata-rata skor, dan penguasaan kurikulum. |
| `GET` | `/api/analytics/accuracy-by-row` | `?script=hiragana\|katakana` | Akurasi goresan per baris konsonan (*vowel, ka, sa, ...*). |
| `GET` | `/api/analytics/exam-history` | `?limit=10` | Riwayat ujian dengan kalkulasi Grade (S, A, B, C, D). |

---

## 🚀 Panduan Menjalankan Backend (PowerShell)
```powershell
# 1. Pindah ke direktori backend-go
cd backend-go

# 2. Salin environment configuration
copy .env.example .env

# 3. Rapikan dependensi modul Go
go mod tidy

# 4. Jalankan server (Otomatis AutoMigrate & Seeder 317 Karakter)
go run main.go
```
