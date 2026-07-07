/**
 * Scrape Orchestrator Servisi
 * Tüm scraperları çalıştırır, verileri temizler, sınıflandırır,
 * konum çıkarır, benzerlik analizi yapar ve veritabanına kaydeder.
 */

const News = require('../models/News');

// Scrapers
const CagdasKocaeliScraper = require('../scrapers/cagdasKocaeli');
const OzgurKocaeliScraper = require('../scrapers/ozgurKocaeli');
const SesKocaeliScraper = require('../scrapers/sesKocaeli');
const YeniKocaeliScraper = require('../scrapers/yeniKocaeli');
const BizimYakaScraper = require('../scrapers/bizimYaka');

// Services
const { cleanText, cleanTitle } = require('./cleanerService');
const { classifyNews } = require('./classifierService');
const { extractLocation } = require('./locationService');
const { geocode } = require('./geocodingService');
const { generateContentHash, findSimilarNews, getExtractor } = require('./similarityService');

/**
 * Tüm scraperları çalıştır ve haberleri işle
 */
async function runFullScrape() {
  const startTime = Date.now();
  console.log('\n' + '='.repeat(60));
  console.log('🚀 SCRAPING BAŞLIYOR...');
  console.log('='.repeat(60));

  const scrapers = [
    new CagdasKocaeliScraper(),
    new OzgurKocaeliScraper(),
    new SesKocaeliScraper(),
    new YeniKocaeliScraper(),
    new BizimYakaScraper()
  ];

  let allRawArticles = [];
  let stats = {
    totalScraped: 0,
    classified: 0,
    withLocation: 0,
    geocoded: 0,
    duplicates: 0,
    saved: 0,
    merged: 0,
    errors: 0
  };

  // 0. EMBEDDİNG MODELİNİ ÖN YÜKLE
  console.log('🧠 Embedding modeli hazırlanıyor...');
  await getExtractor();

  // 1. TÜM SCRAPERLARDAN VERİ ÇEK (PARALEL)
  console.log('⚡ 5 scraper paralel olarak başlatılıyor...');
  const scrapeResults = await Promise.allSettled(
    scrapers.map(scraper => scraper.scrapeAll())
  );

  scrapeResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allRawArticles = allRawArticles.concat(result.value);
      stats.totalScraped += result.value.length;
    } else {
      console.error(`❌ Scraper hatası: ${scrapers[index].siteName} - ${result.reason?.message}`);
      stats.errors++;
    }
  });

  console.log(`\n📊 Toplam ${allRawArticles.length} ham haber çekildi`);

  // 2. VERİLERİ İŞLE
  // Mevcut haberleri al (benzerlik kontrolü için)
  const existingNews = await News.find({}).lean();

  for (const rawArticle of allRawArticles) {
    try {
      // a) Veri temizleme
      const title = cleanTitle(rawArticle.title);
      const content = cleanText(rawArticle.content);

      if (!title || !content || content.length < 30) continue;

      // b) Sınıflandırma
      const classification = classifyNews(title, content);
      if (!classification) {
        // Kategori belirlenemezse haberi atla
        continue;
      }
      stats.classified++;

      // c) Content hash oluştur
      const contentHash = generateContentHash(title, content);

      // d) Exact duplicate kontrolü (aynı hash)
      const existingExact = await News.findOne({ contentHash });
      if (existingExact) {
        // Kaynak ekle (eğer bu kaynak yoksa)
        const sourceExists = existingExact.sources.some(
          s => s.url === rawArticle.source.url
        );
        if (!sourceExists) {
          existingExact.sources.push(rawArticle.source);
          await News.findByIdAndUpdate(existingExact._id, {
            sources: existingExact.sources
          });
          stats.merged++;
          console.log(`🔄 Kaynak eklendi: ${title.substring(0, 50)}...`);
        } else {
          stats.duplicates++;
        }
        continue;
      }

      // e) Benzerlik analizi (Embedding tabanlı - Sentence-BERT)
      const similarResult = await findSimilarNews(title, content, existingNews);

      if (similarResult && similarResult.match) {
        // Benzer haber bulundu, kaynak ekle
        const sourceExists = similarResult.match.sources.some(
          s => s.url === rawArticle.source.url
        );
        if (!sourceExists) {
          await News.findByIdAndUpdate(similarResult.match._id, {
            $push: { sources: rawArticle.source }
          });
          stats.merged++;
          console.log(`🔗 Benzer haber birleştirildi (${Math.round(similarResult.similarity * 100)}%): ${title.substring(0, 50)}...`);
        } else {
          stats.duplicates++;
        }
        continue;
      }

      // Embedding'i al (findSimilarNews içinde üretildi)
      const embedding = similarResult ? similarResult.embedding : null;

      // f) Konum çıkarımı
      const locationInfo = extractLocation(title, content);
      if (!locationInfo) {
        stats.withLocation--; // Konum bulunamadı
      } else {
        stats.withLocation++;
      }

      // g) Geocoding
      let latitude = null;
      let longitude = null;

      if (locationInfo && locationInfo.locationText) {
        const geoResult = await geocode(locationInfo.locationText);
        if (geoResult) {
          latitude = geoResult.lat;
          longitude = geoResult.lng;
          stats.geocoded++;
        }
      }

      // h) Veritabanına kaydet (embedding dahil)
      const newsDoc = new News({
        title,
        content,
        category: classification.category,
        locationText: locationInfo ? locationInfo.locationText : '',
        latitude,
        longitude,
        district: locationInfo ? locationInfo.district : '',
        publishDate: rawArticle.publishDate,
        sources: [rawArticle.source],
        contentHash,
        embedding: embedding || []
      });

      await newsDoc.save();
      stats.saved++;

      // Mevcut haberlere ekle (sonraki benzerlik kontrolleri için)
      existingNews.push({
        _id: newsDoc._id,
        title,
        content,
        contentHash,
        embedding: embedding || [],
        sources: [rawArticle.source]
      });

      console.log(`✅ Kaydedildi: [${classification.label}] ${title.substring(0, 60)}...`);

    } catch (error) {
      if (error.code === 11000) {
        stats.duplicates++;
      } else {
        console.error(`❌ Haber işleme hatası: ${error.message}`);
        stats.errors++;
      }
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 SCRAPING SONUÇLARI');
  console.log('='.repeat(60));
  console.log(`⏱️  Süre: ${duration} saniye`);
  console.log(`📰 Toplam çekilen: ${stats.totalScraped}`);
  console.log(`🏷️  Sınıflandırılan: ${stats.classified}`);
  console.log(`📍 Konumlu: ${stats.withLocation}`);
  console.log(`🌍 Geocoded: ${stats.geocoded}`);
  console.log(`🔄 Birleştirilen: ${stats.merged}`);
  console.log(`🔁 Duplicates: ${stats.duplicates}`);
  console.log(`💾 Kaydedilen: ${stats.saved}`);
  console.log(`❌ Hatalar: ${stats.errors}`);
  console.log('='.repeat(60));

  return stats;
}

module.exports = { runFullScrape };
