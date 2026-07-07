require('dotenv').config();
const mongoose = require('mongoose');
const News = require('./models/News');
const fs = require('fs');

async function analyze() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const yanginNews = await News.find({ category: 'yangin' });
  let output = `\n🔥 Toplam Yangın Haberi: ${yanginNews.length}\n`;
  
  let withLat = 0;
  let withoutLoc = 0;
  let withLocButNoLat = 0;

  for (const n of yanginNews) {
    if (n.latitude && n.longitude) {
      withLat++;
      output += `[VAR] ${n.locationText} (${n.latitude}, ${n.longitude}) - ${n.title}\n`;
    } else if (n.locationText) {
      withLocButNoLat++;
      output += `[KONUM VAR / COORD YOK] "${n.locationText}" - ${n.title}\n`;
    } else {
      withoutLoc++;
      output += `[KONUM YOK] ${n.title}\n`;
    }
  }

  output += `\nÖzet:\n`;
  output += `- Haritada Gösterilen (Koordinatı olan): ${withLat}\n`;
  output += `- Metinden Konum Çıkarılan AMA Koordinat Bulunamayan: ${withLocButNoLat}\n`;
  output += `- Metinden Konum Çıkarılamayan: ${withoutLoc}\n`;
  
  fs.writeFileSync('analyze.txt', output);
  process.exit(0);
}

analyze();
