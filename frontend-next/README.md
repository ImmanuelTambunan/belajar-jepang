# Frontend Nihongo Sora (Next.js 16 + Tailwind CSS)

Frontend aplikasi belajar bahasa Jepang (Hiragana Tracing) menggunakan Next.js App Router, TypeScript, dan Tailwind CSS.

## 🛠️ Stack Teknologi
- **Framework**: Next.js 16 (App Router)
- **Library UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Port**: `3000`
- **Backend API**: `http://localhost:8000/api`

## ✨ Fitur Utama
1. **Interactive Stroke Canvas (`StrokeCanvas.tsx`)**:
   - Kanvas latihan kaligrafi Jepang dengan garis bantu kotak kaligrafi (原稿用紙 - Genko Yoshi).
   - Animasi goresan bertahap resmi KanjiVG dengan pengaturan urutan goresan dinamis.
   - Penomoran goresan (#1, #2, #3) di titik awal setiap goresan.
   - Kanvas kuas mandiri (Pointer Events mendukung Mouse, Touch Screen, dan Stylus Pen).
   - Pengaturan palet warna tinta dan ketebalan kuas kaligrafi.
   - Tombol sembunyikan/tampilkan panduan untuk menguji ingatan goresan.
2. **Pilihan Huruf Vokal Hiragana (`あ`, `い`, `う`, `え`, `お`)**:
   - Tab navigasi responsif dengan romaji dan jumlah goresan.
3. **Uji Koneksi REST API Terintegrasi**:
   - Tombol ping ke backend Golang di `http://localhost:8000/api/health` dengan indikator latensi.

## 🚀 Cara Menjalankan (PowerShell)
```powershell
# 1. Pindah ke direktori frontend-next
cd c:\Users\ASUS\Documents\GitHub\belajar-jepang\frontend-next

# 2. Jalankan development server
npm run dev
```

Buka peramban di [http://localhost:3000](http://localhost:3000).
