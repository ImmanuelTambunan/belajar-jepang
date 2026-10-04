# Nihongo Sora (日本語の空) — Multi-App Platform Belajar Bahasa Jepang

Aplikasi web terintegrasi untuk belajar bahasa Jepang dengan arsitektur **Decoupled**:
- **Frontend SPA**: React 19 + TypeScript + Vite
- **Backend API**: Laravel 11 + PHP 8.3 FPM
- **Web Server**: Nginx (Reverse Proxy API)
- **Database**: MySQL 8.0
- **Containerization**: Docker Compose & WSL 2

---

## 🗺️ Pemetaan Port Host

| Service | Container Name | Port Host | Keterangan |
| :--- | :--- | :--- | :--- |
| **Frontend** | `nihongo_frontend` | `5173` | Vite Dev Server + HMR |
| **API Gateway / Nginx** | `nihongo_nginx` | `8000` | Nginx reverse proxy ke PHP-FPM |
| **Backend Core** | `nihongo_backend` | *(Internal 9000)* | PHP 8.3 FPM Laravel 11 |
| **Database MySQL** | `nihongo_mysql` | `3307` | MySQL 8.0 (Port 3307 agar tidak konflik) |

---

## 🚀 Langkah Pertama Menjalankan Proyek

### 1. Pastikan Docker Desktop Aktif
Pastikan Docker Desktop sudah terbuka dan terintegrasi dengan WSL 2.

### 2. Jalankan Seluruh Service dengan Docker Compose
Buka terminal PowerShell di direktori root proyek (`belajar-jepang`):

```powershell
docker compose up -d --build
```

### 3. Setup Backend Laravel (Hanya Pertama Kali)
Setelah container berjalan, lakukan setup dependensi, environment, dan database migrasi:

```powershell
# Jalankan migrasi database
docker compose exec app php artisan migrate

# Buat storage symlink
docker compose exec app php artisan storage:link
```

### 4. Akses Aplikasi di Browser
- **Frontend SPA**: [http://localhost:5173](http://localhost:5173)
- **Backend API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Database MySQL**: Host `127.0.0.1`, Port `3307`, User `jepang_user`, Database `belajar_jepang`

---

## 📂 Struktur Direktori

```text
belajar-jepang/
├── backend/                  # REST API Laravel 11 (PHP 8.3 FPM)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── routes/
│   │   ├── api.php           # Endpoint REST API (/api/...)
│   │   └── web.php
│   ├── Dockerfile            # PHP 8.3 FPM + ekstensi intl, pdo_mysql, gd, mbstring
│   ├── .dockerignore
│   └── .env
├── frontend/                 # Frontend SPA React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx           # Dashboard & UI interaktif
│   │   ├── App.css
│   │   └── main.tsx
│   ├── Dockerfile            # Node 20 LTS Dev Server
│   ├── .dockerignore
│   ├── .env                  # VITE_API_BASE_URL=http://localhost:8000/api
│   └── vite.config.ts        # Konfigurasi polling HMR Docker
├── docker/
│   ├── nginx/
│   │   └── default.conf      # Virtual host Nginx untuk Laravel
│   └── mysql/
│       └── my.cnf            # Konfigurasi utf8mb4 & timezone
├── docker-compose.yml        # Orkestrasi 4 container
└── README.md
```

---

## 🛠️ Perintah Berguna

```powershell
# Cek status container
docker compose ps

# Melihat logs
docker compose logs -f

# Masuk ke terminal container backend
docker compose exec app sh

# Masuk ke MySQL CLI
docker compose exec db_mysql mysql -u jepang_user -pjepang_password belajar_jepang

# Menghentikan service
docker compose down
```
