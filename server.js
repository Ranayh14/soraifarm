import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001; // Kita pakai port 3001 agar tidak bentrok dengan React (3000)

// Middleware
app.use(cors()); // Izinkan frontend mengakses backend
app.use(express.json()); // Parsing body request ke JSON

// FIXED: Setup multer untuk file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Serve static files dari public/uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Konfigurasi Database XAMPP Default
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // Default user XAMPP
  password: '',      // Default password XAMPP (kosong)
  database: 'sorghum_db'
});

// Cek Koneksi DB
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database (XAMPP)');
});

// --- API ENDPOINTS ---

// FIXED: Email validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 1. REGISTER USER
app.post('/api/register', (req, res) => {
  const { email, password, full_name } = req.body;
  
  // Validasi sederhana
  if (!email || !password || !full_name) {
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
  }

  // FIXED: Validasi email ketat
  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Format email tidak valid' });
  }

  // Reject dummy emails
  const dummyEmails = ['test@test', 'a@a', 'email@email', '123@123', 'asd@asd'];
  if (dummyEmails.some(dummy => email.toLowerCase().includes(dummy))) {
    return res.status(400).json({ success: false, message: 'Email tidak valid. Gunakan email yang benar.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
  }

  const sql = 'INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)';
  db.query(sql, [email, password, full_name], (err, result) => {
    if (err) {
      console.error(err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
      }
      return res.status(500).json({ success: false, message: 'Gagal mendaftar' });
    }
    
    // Auto login simulation response
    res.json({ 
        success: true, 
        user: { id: result.insertId, email, full_name },
        message: 'Registrasi berhasil' 
    });
  });
});

// 2. LOGIN USER
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    
    if (results.length > 0) {
      const user = results[0];
      // Hapus password dari object response agar aman
      delete user.password;
      res.json({ success: true, user, message: 'Login berhasil' });
    } else {
      res.status(401).json({ success: false, message: 'Email atau password salah' });
    }
  });
});

// 3. GET EDUCATION MODULES
app.get('/api/education', (req, res) => {
  const sql = 'SELECT * FROM education_modules';
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Gagal mengambil data' });
    }
    res.json(results);
  });
});

// 4. GET USER PROFILE (with stats)
app.get('/api/user/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      u.id, u.email, u.full_name, u.location, u.land_area, u.avatar_url,
      COALESCE(SUM(l.area), 0) as total_land_area,
      COUNT(DISTINCT l.id) as land_count,
      COUNT(DISTINCT r.id) as recipe_count
    FROM users u
    LEFT JOIN lands l ON u.id = l.user_id
    LEFT JOIN recipes r ON u.id = r.user_id
    WHERE u.id = ?
    GROUP BY u.id, u.email, u.full_name, u.location, u.land_area, u.avatar_url
  `;
  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Gagal mengambil data' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    const user = results[0];
    // Convert total_land_area from m² to hectares (divide by 10000)
    user.total_land_area_ha = (user.total_land_area / 10000).toFixed(2);
    res.json({ success: true, user });
  });
});

// 5. UPDATE USER PROFILE
app.put('/api/user/:id', (req, res) => {
  const { id } = req.params;
  const { full_name, location, land_area, avatar_url } = req.body;
  const sql = 'UPDATE users SET full_name = ?, location = ?, land_area = ?, avatar_url = ? WHERE id = ?';
  db.query(sql, [full_name, location, land_area, avatar_url, id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Gagal update profil' });
    }
    res.json({ success: true, message: 'Profil berhasil diupdate' });
  });
});

// 5b. UPLOAD PROFILE PICTURE - FIXED: Error handling yang proper
app.post('/api/upload/profile', (req, res) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Ukuran file terlalu besar. Maksimal 5MB.' });
        }
        return res.status(400).json({ success: false, message: 'Error upload: ' + err.message });
      }
      return res.status(400).json({ success: false, message: err.message || 'Gagal mengupload file' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diupload' });
    }
    
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl, filename: req.file.filename });
  });
});

// 5c. UPLOAD RECIPE IMAGE - FIXED: Error handling yang proper
app.post('/api/upload/recipe', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Ukuran file terlalu besar. Maksimal 5MB.' });
        }
        return res.status(400).json({ success: false, message: 'Error upload: ' + err.message });
      }
      return res.status(400).json({ success: false, message: err.message || 'Gagal mengupload file' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diupload' });
    }
    
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl, filename: req.file.filename });
  });
});

// 6. GET LANDS (by user_id)
app.get('/api/lands/:userId', (req, res) => {
  const { userId } = req.params;
  const sql = 'SELECT * FROM lands WHERE user_id = ? ORDER BY created_at DESC';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Gagal mengambil data lahan' });
    }
    // Parse JSON fields
    const lands = results.map(land => ({
      ...land,
      recommendation_steps: land.recommendation_steps ? JSON.parse(land.recommendation_steps) : []
    }));
    res.json(lands);
  });
});

// 7. CREATE LAND
app.post('/api/lands', (req, res) => {
  const { user_id, name, area, soil_type, variety, suitability_score, status, ph, moisture, recommendation_steps } = req.body;
  const sql = 'INSERT INTO lands (user_id, name, area, soil_type, variety, suitability_score, status, ph, moisture, recommendation_steps) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const stepsJson = recommendation_steps ? JSON.stringify(recommendation_steps) : null;
  db.query(sql, [user_id, name, area, soil_type, variety, suitability_score, status, ph, moisture, stepsJson], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan lahan' });
    }
    res.json({ success: true, land: { id: result.insertId, ...req.body } });
  });
});

// 8. UPDATE LAND
app.put('/api/lands/:id', (req, res) => {
  const { id } = req.params;
  const { name, area, soil_type, variety, suitability_score, status, ph, moisture, recommendation_steps } = req.body;
  const sql = 'UPDATE lands SET name = ?, area = ?, soil_type = ?, variety = ?, suitability_score = ?, status = ?, ph = ?, moisture = ?, recommendation_steps = ? WHERE id = ?';
  const stepsJson = recommendation_steps ? JSON.stringify(recommendation_steps) : null;
  db.query(sql, [name, area, soil_type, variety, suitability_score, status, ph, moisture, stepsJson, id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Gagal update lahan' });
    }
    res.json({ success: true, message: 'Lahan berhasil diupdate' });
  });
});

// 9. DELETE LAND
app.delete('/api/lands/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM lands WHERE id = ?';
  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Gagal menghapus lahan' });
    }
    res.json({ success: true, message: 'Lahan berhasil dihapus' });
  });
});

// 10. GET RECIPES
app.get('/api/recipes', (req, res) => {
  const { category, popular } = req.query;
  let sql = 'SELECT r.*, u.full_name as author, u.avatar_url as author_avatar FROM recipes r LEFT JOIN users u ON r.user_id = u.id';
  const params = [];
  
  if (category && category !== 'All') {
    sql += ' WHERE r.category = ?';
    params.push(category);
  }
  
  // FIXED: Sort by views jika popular=true, else by created_at
  if (popular === 'true') {
    sql += category && category !== 'All' ? ' ORDER BY r.views DESC, r.created_at DESC' : ' ORDER BY r.views DESC, r.created_at DESC';
  } else {
    sql += ' ORDER BY r.created_at DESC';
  }
  
  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Gagal mengambil data resep' });
    }
    // Parse JSON fields
    const recipes = results.map(recipe => ({
      ...recipe,
      ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
      steps: recipe.steps ? JSON.parse(recipe.steps) : []
    }));
    res.json(recipes);
  });
});

// 11. GET RECIPE BY ID - FIXED: Tidak increment views langsung, views akan increment setelah 3 menit
app.get('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT r.*, u.full_name as author, u.avatar_url as author_avatar FROM recipes r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Gagal mengambil data resep' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }
    const recipe = results[0];
    
    // FIXED: Views tidak di-increment langsung, akan di-increment setelah user stay 3 menit
    // Increment views sekarang dilakukan melalui endpoint PUT /api/recipes/:id/increment-views
    
    res.json({
      success: true,
      recipe: {
        ...recipe,
        views: recipe.views || 0, // Return actual views from database
        ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
        steps: recipe.steps ? JSON.parse(recipe.steps) : []
      }
    });
  });
});

// 11b. CREATE RECIPE
app.post('/api/recipes', (req, res) => {
  const { user_id, title, description, category, image_url, ingredients, steps, time, difficulty, servings } = req.body;
  const sql = 'INSERT INTO recipes (user_id, title, description, category, image_url, ingredients, steps, time, difficulty, servings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const ingredientsJson = ingredients ? JSON.stringify(ingredients) : '[]';
  const stepsJson = steps ? JSON.stringify(steps) : '[]';
  db.query(sql, [user_id, title, description, category, image_url, ingredientsJson, stepsJson, time, difficulty, servings], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan resep' });
    }
    res.json({ success: true, recipe: { id: result.insertId, ...req.body } });
  });
});

// 11c. INCREMENT VIEWS (untuk tracking setelah 3 menit)
app.put('/api/recipes/:id/increment-views', (req, res) => {
  const { id } = req.params;
  db.query('UPDATE recipes SET views = COALESCE(views, 0) + 1 WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Failed to increment views:', err);
      return res.status(500).json({ success: false, message: 'Gagal increment views' });
    }
    // Get updated views count
    db.query('SELECT views FROM recipes WHERE id = ?', [id], (selectErr, results) => {
      if (selectErr) {
        return res.status(500).json({ success: false, message: 'Gagal mengambil views' });
      }
      res.json({ 
        success: true, 
        views: results[0]?.views || 0 
      });
    });
  });
});

// Helper: Generate daily market data (real-time, terupdate setiap hari)
const generateDailyMarketData = (location, product, days = 30) => {
  const basePrice = product === 'Sorghum Flour' ? 18000 : product === 'Sorghum Beras' ? 20000 : 15000;
  const locationMultiplier = location === 'Jakarta' ? 1.2 : location === 'Surabaya' ? 1.1 : location === 'Yogyakarta' ? 0.95 : 1.0;
  
  const currentDate = new Date();
  // FIXED: Set ke tengah hari untuk avoid timezone issues
  currentDate.setHours(12, 0, 0, 0);
  const generatedData = [];
  
  // FIXED: Generate data harian untuk N hari terakhir (termasuk hari ini)
  // Pastikan setiap hari memiliki tanggal yang berbeda
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    date.setHours(12, 0, 0, 0); // Set ke tengah hari untuk avoid timezone issues
    
    const dayOfMonth = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    // FIXED: Format tanggal YYYY-MM-DD dengan benar SEBELUM perhitungan lain
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
    
    // FIXED: Gunakan seed berdasarkan tanggal untuk konsistensi (deterministic)
    const seed = (year * 10000 + (month + 1) * 100 + dayOfMonth) % 100;
    
    // Base price dengan variasi harian (fluktuasi kecil setiap hari)
    const baseMultiplier = 0.95 + (month * 0.002); // Slight monthly trend
    const dailyVariation = (dayOfMonth / 30) * 0.01; // Small daily variation
    const deterministicVariation = ((seed / 100) - 0.5) * 0.02; // Deterministic based on date
    const priceMultiplier = baseMultiplier * (1 + dailyVariation + deterministicVariation);
    
    const averagePrice = Math.round(basePrice * locationMultiplier * priceMultiplier);
    
    // Volume dengan variasi harian
    const volumeBase = 4.0 + (month * 0.1); // Base volume per hari (ton)
    const volumeVariation = (dayOfMonth / 30) * 0.2;
    const deterministicVolume = ((seed / 100) - 0.5) * 0.3; // Deterministic
    const salesVolume = Math.round((volumeBase + volumeVariation + deterministicVolume) * 10) / 10;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    generatedData.push({
      date: dateStr, // YYYY-MM-DD format - PASTIKAN INI UNIK UNTUK SETIAP HARI
      day: dayOfMonth,
      month: monthNames[month],
      year: year,
      average_price: averagePrice,
      sales_volume: salesVolume,
      location,
      product
    });
  }
  
  // FIXED: Debug log untuk verifikasi tanggal berbeda
  if (generatedData.length > 0) {
    console.log(`[${location}][${product}] Generated ${generatedData.length} days:`, 
      generatedData.map(d => d.date).join(', '));
  }
  
  return generatedData;
};

// 12. GET MARKET DATA - FIXED: Data harian real-time (update setiap hari)
app.get('/api/market', (req, res) => {
  const { location = 'Bandung', product = 'Sorghum', days = 30 } = req.query;
  
  // FIXED: Selalu generate data harian real-time (tidak pakai cache)
  // Data terupdate setiap hari sampai hari ini
  const dailyData = generateDailyMarketData(location, product, parseInt(days) || 30);
  
  res.json(dailyData);
});

// 13. CALCULATE HARVEST
app.post('/api/harvest/calculate', (req, res) => {
  const { landSize, plantingDistance, productivity } = req.body;
  
  // Calculate number of plants
  const plantArea = plantingDistance * plantingDistance; // m² per plant
  const numberOfPlants = Math.floor(landSize / plantArea);
  
  // Calculate total yield
  const totalYieldKg = numberOfPlants * productivity;
  const totalYieldTon = totalYieldKg / 1000;
  
  // Market price (default from market data or use 4500)
  const marketPrice = 4500; // Rp per kg
  const grossRevenue = totalYieldKg * marketPrice;
  
  res.json({
    success: true,
    result: {
      totalYield: parseFloat(totalYieldTon.toFixed(2)),
      totalYieldKg: parseFloat(totalYieldKg.toFixed(2)),
      numberOfPlants,
      marketPrice,
      grossRevenue: Math.round(grossRevenue),
      marginError: 0.5
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
