# 📚 Panduan Setup dan Menjalankan Project SorAiFarm

## 🎯 Deskripsi Project

SorAiFarm adalah aplikasi web untuk manajemen pertanian sorghum yang dibangun dengan:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: MySQL (XAMPP)

---

## 📋 Prasyarat

Sebelum memulai, pastikan Anda sudah menginstall:

1. **Node.js** (versi 16 atau lebih baru)
   - Download: https://nodejs.org/
   - Verifikasi: Buka terminal/cmd, ketik `node -v` dan `npm -v`

2. **XAMPP** (untuk MySQL)
   - Download: https://www.apachefriends.org/
   - Pastikan MySQL service berjalan di XAMPP Control Panel

3. **Code Editor** (opsional, tapi disarankan)
   - Visual Studio Code: https://code.visualstudio.com/

---

## 🗄️ Langkah 1: Setup Database MySQL

### 1.1. Jalankan XAMPP
1. Buka **XAMPP Control Panel**
2. Klik **Start** pada **Apache** (opsional, jika diperlukan)
3. Klik **Start** pada **MySQL** (WAJIB!)

### 1.2. Buat Database
Ada 2 cara untuk membuat database:

#### **Cara A: Menggunakan phpMyAdmin (Paling Mudah)**
1. Buka browser, kunjungi: `http://localhost/phpmyadmin`
2. Klik tab **SQL** di bagian atas
3. Buka file `database_mysql.sql` di project Anda
4. Copy semua isi file tersebut
5. Paste ke textarea SQL di phpMyAdmin
6. Klik **Go** atau **Kirim**
7. Pastikan database `sorghum_db` sudah terbuat dengan 2 tabel: `users` dan `education_modules`

#### **Cara B: Menggunakan MySQL Command Line**
1. Buka Command Prompt atau Terminal
2. Masuk ke direktori MySQL XAMPP:
   ```bash
   cd C:\xampp\mysql\bin
   ```
3. Login ke MySQL:
   ```bash
   mysql.exe -u root -p
   ```
   (Tekan Enter jika password kosong)
4. Jalankan script SQL:
   ```sql
   source D:\xampp\htdocs\Magang\soraifarm\database_mysql.sql
   ```
   (Sesuaikan path dengan lokasi file Anda)

### 1.3. Verifikasi Database
- Di phpMyAdmin, pastikan database `sorghum_db` ada
- Pastikan ada 2 tabel: `users` dan `education_modules`
- Tabel `education_modules` seharusnya sudah berisi 8 data sample

---

## 📦 Langkah 2: Install Dependencies

### 2.1. Install Dependencies Frontend & Backend
Buka terminal/cmd di folder project, lalu jalankan:

```bash
npm install
```

Ini akan menginstall semua package yang diperlukan:
- React, Vite, TypeScript (untuk frontend)
- Express, MySQL2, CORS (untuk backend)

**Catatan**: Jika ada error, coba:
```bash
npm install --legacy-peer-deps
```

---

## 🚀 Langkah 3: Menjalankan Project

Project ini memerlukan **2 terminal terpisah** karena ada 2 server yang harus berjalan:

### Terminal 1: Backend Server (Node.js + Express)
```bash
npm run server
```

Atau:
```bash
node server.js
```

**Output yang diharapkan:**
```
Connected to MySQL database (XAMPP)
Server running on http://localhost:3001
```

✅ Jika muncul pesan di atas, backend sudah siap!

### Terminal 2: Frontend Server (React + Vite)
```bash
npm run dev
```

**Output yang diharapkan:**
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

✅ Jika muncul URL di atas, frontend sudah siap!

---

## 🌐 Langkah 4: Akses Aplikasi

1. Buka browser (Chrome, Firefox, Edge, dll)
2. Kunjungi: **http://localhost:3000**
3. Anda akan melihat halaman splash SorAiFarm
4. Setelah itu, akan muncul halaman Login/Register

---

## ✅ Verifikasi Setup

### Checklist:
- [ ] XAMPP MySQL berjalan (hijau di Control Panel)
- [ ] Database `sorghum_db` sudah dibuat
- [ ] Tabel `users` dan `education_modules` sudah ada
- [ ] Backend server berjalan di `http://localhost:3001`
- [ ] Frontend server berjalan di `http://localhost:3000`
- [ ] Bisa akses aplikasi di browser

### Test Fitur:
1. **Register**: Buat akun baru dengan email dan password
2. **Login**: Masuk dengan akun yang sudah dibuat
3. **Education**: Klik menu "Edukasi" untuk melihat modul edukasi dari database

---

## 🔧 Troubleshooting (Masalah Umum)

### ❌ Error: "Cannot connect to MySQL database"
**Solusi:**
- Pastikan XAMPP MySQL sudah **Start** (hijau)
- Cek konfigurasi di `server.js`:
  - `host: 'localhost'`
  - `user: 'root'`
  - `password: ''` (kosong untuk XAMPP default)
  - `database: 'sorghum_db'` (harus sudah dibuat)

### ❌ Error: "Database 'sorghum_db' doesn't exist"
**Solusi:**
- Jalankan script SQL `database_mysql.sql` di phpMyAdmin
- Atau buat database manual di phpMyAdmin

### ❌ Error: "Port 3000 already in use"
**Solusi:**
- Tutup aplikasi lain yang menggunakan port 3000
- Atau ubah port di `vite.config.ts`:
  ```typescript
  server: {
    port: 3002, // Ubah ke port lain
  }
  ```

### ❌ Error: "Port 3001 already in use"
**Solusi:**
- Tutup aplikasi lain yang menggunakan port 3001
- Atau ubah port di `server.js`:
  ```javascript
  const PORT = 3002; // Ubah ke port lain
  ```
- Jangan lupa update URL di `AuthView.tsx` dan `EducationView.tsx`

### ❌ Error: "Module not found" atau "Cannot find module"
**Solusi:**
- Hapus folder `node_modules` dan file `package-lock.json`
- Jalankan lagi: `npm install`

### ❌ Frontend tidak bisa connect ke backend
**Solusi:**
- Pastikan backend server sudah berjalan di terminal terpisah
- Cek URL di `AuthView.tsx` dan `EducationView.tsx` harus: `http://localhost:3001`
- Pastikan CORS sudah diaktifkan di `server.js` (sudah ada `app.use(cors())`)

---

## 📝 Struktur Project

```
soraifarm/
├── components/          # Komponen React (UI)
│   ├── AuthView.tsx    # Halaman Login/Register
│   ├── EducationView.tsx
│   └── ...
├── lib/                # Library/Utility
│   └── supabase.ts
├── services/           # Service/API calls
│   ├── geminiService.ts
│   └── weatherService.ts
├── App.tsx             # Main App Component
├── server.js           # Backend Server (Express + MySQL)
├── database_mysql.sql  # Script SQL untuk setup database
├── package.json        # Dependencies
└── vite.config.ts      # Konfigurasi Vite
```

---

## 🎓 Penjelasan Teknologi

### Frontend (React + TypeScript + Vite)
- **React**: Library untuk membuat UI
- **TypeScript**: JavaScript dengan type safety
- **Vite**: Build tool yang cepat untuk development

### Backend (Node.js + Express)
- **Express**: Framework web untuk Node.js
- **MySQL2**: Driver untuk koneksi ke MySQL
- **CORS**: Middleware untuk izinkan frontend akses backend

### Database (MySQL)
- **XAMPP**: Package yang berisi MySQL, Apache, PHP
- **phpMyAdmin**: Tool untuk manage database via web

---

## 📞 Bantuan Tambahan

Jika masih ada masalah:
1. Pastikan semua langkah di atas sudah dilakukan
2. Cek console browser (F12) untuk error di frontend
3. Cek terminal backend untuk error di server
4. Pastikan versi Node.js sudah 16 atau lebih baru

---

## 🎉 Selamat!

Jika semua sudah berjalan, Anda siap untuk development! 

**Tips:**
- Jangan tutup kedua terminal (backend & frontend) saat development
- Simpan perubahan file, Vite akan auto-reload
- Untuk stop server, tekan `Ctrl + C` di terminal

---

**Dibuat dengan ❤️ untuk SorAiFarm**


