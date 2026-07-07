/**
 * Kocaeli Haber Harita Sistemi - Backend Server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const newsRoutes = require('./routes/newsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/news', newsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Sunucu başlat
const startServer = async () => {
  try {
    // MongoDB bağlantısı
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api/news`);
      console.log(`📊 Stats: http://localhost:${PORT}/api/news/stats`);
      console.log(`🔄 Scrape: POST http://localhost:${PORT}/api/news/scrape\n`);
    });
  } catch (error) {
    console.error('❌ Sunucu başlatma hatası:', error.message);
    process.exit(1);
  }
};

startServer();
