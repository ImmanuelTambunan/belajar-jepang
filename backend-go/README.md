# Backend Nihongo Sora (Golang Fiber + GORM)

Backend REST API untuk aplikasi belajar bahasa Jepang (Hiragana Tracing) menggunakan Golang framework Fiber dan GORM, terhubung secara native ke MySQL Laragon tanpa Docker.

## 🛠️ Stack Teknologi
- **Bahasa**: Golang 1.27+
- **Framework Web**: [Fiber v2](https://github.com/gofiber/fiber/v2)
- **ORM**: [GORM](https://gorm.io)
- **Database**: MySQL 8.0 (Laragon Lokal di `127.0.0.1:3306`)
- **Port Server**: `8000`

## 🗄️ Konfigurasi Database (Laragon)
- **Host**: `127.0.0.1`
- **Port**: `3306`
- **User**: `root`
- **Password**: `root`
- **Database**: `belajar_jepang`

> **Note**: Sistem secara otomatis mengeksekusi `CREATE DATABASE IF NOT EXISTS belajar_jepang` dan menjalankan `AutoMigrate` serta seeder huruf vokal (`あ`, `い`, `う`, `え`, `お`) jika tabel masih kosong.

## 🚀 Cara Menjalankan (PowerShell)
```powershell
# 1. Pindah ke direktori backend-go
cd c:\Users\ASUS\Documents\GitHub\belajar-jepang\backend-go

# 2. Unduh dependensi (jika belum)
go mod tidy

# 3. Jalankan server
go run main.go
```

## 📡 Daftar Endpoint API
- `GET /api/health` — Status koneksi server & database ping
- `GET /api/characters/hiragana` — Mendapatkan relasi karakter Hiragana vokal beserta readings & strokes
- `GET /api/characters` — Mendapatkan semua karakter (dengan filter query `type` & `jlpt_level`)
- `GET /api/characters/:id` — Detail satu karakter berdasarkan ID atau simbol karakter
