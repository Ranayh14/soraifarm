-- Database Setup untuk SorAiFarm
-- Jalankan script ini di phpMyAdmin atau MySQL Command Line

-- 1. Buat Database
CREATE DATABASE IF NOT EXISTS sorghum_db;
USE sorghum_db;

-- 2. Tabel Users (untuk Login & Register)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Education Modules (untuk modul edukasi)
CREATE TABLE IF NOT EXISTS education_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    image_url VARCHAR(500),
    duration VARCHAR(50),
    level VARCHAR(50),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Lands (untuk data lahan)
CREATE TABLE IF NOT EXISTS lands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    area DECIMAL(10, 2) NOT NULL,
    soil_type VARCHAR(100),
    variety VARCHAR(100),
    suitability_score INT,
    status VARCHAR(50),
    ph DECIMAL(4, 2),
    moisture DECIMAL(5, 2),
    recommendation_steps JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Recipes (untuk resep-resep)
CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    image_url VARCHAR(500),
    ingredients JSON,
    steps JSON,
    time VARCHAR(50),
    difficulty VARCHAR(50),
    servings VARCHAR(50),
    likes INT DEFAULT 0,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Market Data (untuk data pasar)
CREATE TABLE IF NOT EXISTS market_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    average_price DECIMAL(10, 2),
    sales_volume DECIMAL(10, 2),
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_month_location (month, year, location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Update Users table untuk menambahkan kolom profil
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS land_area DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

-- 8. Insert Sample Data untuk Education Modules
INSERT INTO education_modules (title, category, description, image_url, duration, level) VALUES
('Teknik Penanaman Sorghum yang Efektif', 'Cultivation', 'Pelajari cara menanam sorghum dengan teknik modern untuk hasil panen yang optimal. Mulai dari persiapan lahan hingga perawatan tanaman.', 'https://images.unsplash.com/photo-1625246333195-09d9b630f067?auto=format&fit=crop&w=800&q=80', '15 min', 'Beginner'),
('Pemilihan Varietas Sorghum Terbaik', 'Cultivation', 'Panduan lengkap memilih varietas sorghum yang sesuai dengan kondisi lahan dan iklim daerah Anda.', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80', '12 min', 'Intermediate'),
('Manajemen Air dan Irigasi', 'Cultivation', 'Teknik pengelolaan air yang efisien untuk tanaman sorghum, termasuk sistem irigasi modern dan tradisional.', 'https://images.unsplash.com/photo-1625246333195-09d9b630f067?auto=format&fit=crop&w=800&q=80', '20 min', 'Intermediate'),
('Pengendalian Hama dan Penyakit', 'Cultivation', 'Identifikasi dan penanganan hama serta penyakit yang umum menyerang tanaman sorghum.', 'https://images.unsplash.com/photo-1625246333195-09d9b630f067?auto=format&fit=crop&w=800&q=80', '18 min', 'Advanced'),
('Teknik Panen dan Pasca Panen', 'Post-Harvest', 'Cara memanen sorghum di waktu yang tepat dan teknik penyimpanan yang benar untuk menjaga kualitas hasil panen.', 'https://images.unsplash.com/photo-1625246333195-09d9b630f067?auto=format&fit=crop&w=800&q=80', '25 min', 'Beginner'),
('Pengolahan Sorghum menjadi Produk', 'Post-Harvest', 'Panduan mengolah hasil panen sorghum menjadi berbagai produk bernilai tinggi seperti tepung, beras, dan produk olahan lainnya.', 'https://images.unsplash.com/photo-1625246333195-09d9b630f067?auto=format&fit=crop&w=800&q=80', '30 min', 'Intermediate'),
('Penyimpanan dan Pengawetan', 'Post-Harvest', 'Teknik penyimpanan jangka panjang dan pengawetan sorghum agar tetap berkualitas tinggi.', 'https://images.unsplash.com/photo-1625246333195-09d9b630f067?auto=format&fit=crop&w=800&q=80', '15 min', 'Beginner'),
('Pemasaran Hasil Panen Sorghum', 'Post-Harvest', 'Strategi pemasaran dan akses pasar untuk menjual hasil panen sorghum dengan harga yang menguntungkan.', 'https://images.unsplash.com/photo-1625246333195-09d9b630f067?auto=format&fit=crop&w=800&q=80', '22 min', 'Intermediate');

-- 9. Insert Sample Market Data - FIXED: Tahun 2025 (Januari sampai Desember)
INSERT INTO market_data (month, year, average_price, sales_volume, location, product) VALUES
('Jan', 2025, 15000, 120, 'Bandung', 'Sorghum'),
('Feb', 2025, 15200, 122, 'Bandung', 'Sorghum'),
('Mar', 2025, 15500, 125, 'Bandung', 'Sorghum'),
('Apr', 2025, 15800, 124, 'Bandung', 'Sorghum'),
('Mei', 2025, 16000, 130, 'Bandung', 'Sorghum'),
('Jun', 2025, 16200, 135, 'Bandung', 'Sorghum'),
('Jul', 2025, 16500, 138, 'Bandung', 'Sorghum'),
('Agu', 2025, 16800, 140, 'Bandung', 'Sorghum'),
('Sep', 2025, 17000, 142, 'Bandung', 'Sorghum'),
('Okt', 2025, 17200, 145, 'Bandung', 'Sorghum'),
('Nov', 2025, 17500, 148, 'Bandung', 'Sorghum'),
('Des', 2025, 17800, 150, 'Bandung', 'Sorghum');

-- 10. Insert Sample Recipes (Enhanced with full data + views)
INSERT INTO recipes (user_id, title, description, category, image_url, ingredients, steps, time, difficulty, servings, views) VALUES
(NULL, 'Crispy Sorghum Cookies', 'Classic healthy cookies with a touch of sorghum flour, perfect for your afternoon tea. Easy and quick recipe.', 'Snack', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80', 
'[{"name": "200g Tepung Sorghum", "amount": ""}, {"name": "100g Mentega Tawar", "amount": ""}, {"name": "80g Gula Aren (halus)", "amount": ""}, {"name": "1 Butir Telur", "amount": ""}, {"name": "1/2 sdt Baking Powder", "amount": ""}, {"name": "Choco chips secukupnya", "amount": ""}]',
'["Campurkan mentega dan gula aren, kocok hingga lembut.", "Masukkan telur, kocok kembali hingga rata.", "Ayak tepung sorghum dan baking powder, masukkan ke adonan.", "Aduk rata dan tambahkan choco chips.", "Bentuk adonan di loyang, panggang suhu 170°C selama 20 menit."]',
'45 Menit', 'Mudah', '20 pcs', 1250),
(NULL, 'Spicy Sorghum Fried Rice', 'Innovative fried rice using sorghum grains as a substitute for rice, healthier and fiber-rich. Suitable for breakfast or dinner.', 'Food', 'https://images.unsplash.com/photo-1647093953000-9065ed6f85ef?auto=format&fit=crop&w=800&q=80',
'[{"name": "300g Beras Sorghum", "amount": "sudah direndam semalam"}, {"name": "2 butir telur", "amount": ""}, {"name": "100g ayam suwir", "amount": ""}, {"name": "3 siung bawang putih", "amount": "cincang"}, {"name": "2 cabai merah", "amount": "iris"}, {"name": "Kecap manis", "amount": "secukupnya"}, {"name": "Garam dan merica", "amount": "secukupnya"}]',
'["Rendam beras sorghum semalam, lalu rebus hingga matang.", "Tumis bawang putih dan cabai hingga harum.", "Masukkan telur, orak-arik, lalu tambahkan ayam suwir.", "Masukkan beras sorghum yang sudah matang, aduk rata.", "Tambahkan kecap manis, garam, dan merica. Aduk hingga merata.", "Sajikan panas dengan taburan bawang goreng."]',
'30 Menit', 'Mudah', '2 porsi', 980),
(NULL, 'Caramel Sorghum Pudding', 'Soft and sweet sorghum pudding, drizzled with melting caramel sauce. A perfect dessert for the family.', 'Snack', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
'[{"name": "150g Tepung Sorghum", "amount": ""}, {"name": "500ml Susu UHT", "amount": ""}, {"name": "100g Gula Pasir", "amount": ""}, {"name": "3 butir telur", "amount": ""}, {"name": "1 sdt Vanilla Essence", "amount": ""}, {"name": "100g Gula untuk karamel", "amount": ""}]',
'["Buat karamel: panaskan gula hingga meleleh dan berwarna cokelat, tuang ke cetakan.", "Campurkan tepung sorghum, susu, gula, telur, dan vanilla. Aduk hingga halus.", "Saring adonan agar tidak ada gumpalan.", "Tuang adonan ke atas karamel dalam cetakan.", "Kukus selama 30-40 menit hingga matang.", "Dinginkan, lalu balik cetakan untuk saji."]',
'60 Menit', 'Sedang', '4 porsi', 750),
(NULL, 'Sorghum Quinoa Salad', 'Healthy and nutritious salad combining sorghum and quinoa, perfect for a light meal or side dish.', 'Food', 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?auto=format&fit=crop&w=800&q=80',
'[{"name": "100g Beras Sorghum", "amount": "rebus hingga matang"}, {"name": "100g Quinoa", "amount": "rebus hingga matang"}, {"name": "1 buah timun", "amount": "potong dadu"}, {"name": "1 buah tomat", "amount": "potong dadu"}, {"name": "50g Keju Feta", "amount": "cincang"}, {"name": "2 sdm Minyak Zaitun", "amount": ""}, {"name": "1 sdm Lemon Juice", "amount": ""}, {"name": "Garam dan lada hitam", "amount": "secukupnya"}]',
'["Rebus beras sorghum dan quinoa secara terpisah hingga matang, dinginkan.", "Campurkan sorghum dan quinoa dalam mangkuk besar.", "Tambahkan timun, tomat, dan keju feta.", "Buat dressing: campur minyak zaitun, lemon juice, garam, dan lada.", "Tuang dressing ke salad, aduk hingga merata.", "Sajikan dingin sebagai hidangan utama atau pendamping."]',
'25 Menit', 'Mudah', '3-4 porsi', 650),
(NULL, 'Sorghum Smoothie Bowl', 'Refreshing and healthy smoothie bowl made with sorghum flour, topped with fresh fruits.', 'Drink', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80',
'[{"name": "2 pisang", "amount": "beku"}, {"name": "100ml Susu Almond", "amount": ""}, {"name": "2 sdm Tepung Sorghum", "amount": ""}, {"name": "1 sdm Madu", "amount": ""}, {"name": "Topping: stroberi, blueberry, granola", "amount": "secukupnya"}]',
'["Blender pisang beku, susu almond, tepung sorghum, dan madu hingga halus.", "Tuang ke dalam mangkuk.", "Hias dengan topping stroberi, blueberry, dan granola.", "Sajikan segera selagi dingin."]',
'10 Menit', 'Mudah', '1 porsi', 420);

-- Selesai! Database sudah siap digunakan.
