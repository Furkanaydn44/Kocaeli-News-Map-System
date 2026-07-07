require('dotenv').config();
const mongoose = require('mongoose');

async function resetDB() {
  try {
    console.log('🔄 MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🗑️ Veritabanı temizleniyor (News ve GeoCache)...');
    
    // Koleksiyonları temizle
    await mongoose.connection.db.dropDatabase();
    
    console.log('✅ Veritabanı başarıyla SIFIRLANDI!');
  } catch (error) {
    console.error('❌ Hata oluştu:', error.message);
  } finally {
    process.exit(0);
  }
}

resetDB();
