const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Bağlandı: ${conn.connection.host}`);
    
    // Uygulama her başladığında veritabanını sıfırla
    await mongoose.connection.db.dropDatabase();
    console.log('🗑️  Veritabanı başarıyla sıfırlandı.');
  } catch (error) {
    console.error(`❌ MongoDB Bağlantı Hatası: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
