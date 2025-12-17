-- Update Script untuk Memastikan Kolom views Ada di Tabel recipes
-- Jalankan script ini jika kolom views belum ada atau perlu diupdate

USE sorghum_db;

-- 1. Tambahkan kolom views jika belum ada
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;

-- 2. Update semua resep yang views-nya NULL menjadi 0
UPDATE recipes 
SET views = 0 
WHERE views IS NULL;

-- 3. Pastikan kolom created_at ada untuk sorting latest submissions
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 4. Update created_at untuk resep yang belum punya timestamp
UPDATE recipes 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- 5. Verifikasi: Tampilkan semua resep dengan views
SELECT id, title, views, created_at 
FROM recipes 
ORDER BY views DESC;

