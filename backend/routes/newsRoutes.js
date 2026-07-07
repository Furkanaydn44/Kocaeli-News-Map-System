/**
 * API Routes - Haber endpoint'leri
 */

const express = require('express');
const router = express.Router();
const News = require('../models/News');
const { runFullScrape } = require('../services/scrapeService');

let isScraping = false;

/**
 * GET /api/news
 * Haberleri filtreli getir
 * Query params: category, district, startDate, endDate, hasLocation
 */
router.get('/', async (req, res) => {
  try {
    const { category, district, startDate, endDate, hasLocation } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (district) {
      filter.district = { $regex: district, $options: 'i' };
    }

    if (startDate || endDate) {
      filter.publishDate = {};
      if (startDate) filter.publishDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.publishDate.$lte = end;
      }
    }

    // Sadece konumlu haberleri göster (harita için)
    if (hasLocation === 'true') {
      filter.latitude = { $ne: null };
      filter.longitude = { $ne: null };
    }

    const news = await News.find(filter)
      .sort({ publishDate: -1 })
      .limit(500)
      .lean();

    res.json({
      success: true,
      count: news.length,
      data: news
    });
  } catch (error) {
    console.error('❌ News GET hatası:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/news/scrape
 * Scraping başlat
 */
router.post('/scrape', async (req, res) => {
  if (isScraping) {
    return res.status(409).json({
      success: false,
      error: 'Scraping zaten devam ediyor. Lütfen bekleyin.'
    });
  }

  isScraping = true;

  // Scraping'i arka planda başlat
  res.json({
    success: true,
    message: 'Scraping başlatıldı. Bu işlem birkaç dakika sürebilir.'
  });

  try {
    const stats = await runFullScrape();
    console.log('Scraping tamamlandı:', stats);
  } catch (error) {
    console.error('Scraping hatası:', error.message);
  } finally {
    isScraping = false;
  }
});

/**
 * GET /api/news/scrape/status
 * Scraping durumu
 */
router.get('/scrape/status', (req, res) => {
  res.json({
    success: true,
    isScraping
  });
});

/**
 * GET /api/news/stats
 * İstatistikler
 */
router.get('/stats', async (req, res) => {
  try {
    const totalNews = await News.countDocuments();
    const withLocation = await News.countDocuments({
      latitude: { $ne: null },
      longitude: { $ne: null }
    });

    // Kategori bazlı sayılar
    const categoryStats = await News.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // İlçe bazlı sayılar
    const districtStats = await News.aggregate([
      { $match: { district: { $ne: '' } } },
      { $group: { _id: '$district', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Kaynak bazlı sayılar
    const sourceStats = await News.aggregate([
      { $unwind: '$sources' },
      { $group: { _id: '$sources.siteName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalNews,
        withLocation,
        byCategory: categoryStats,
        byDistrict: districtStats,
        bySource: sourceStats
      }
    });
  } catch (error) {
    console.error('❌ Stats hatası:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/news/districts
 * Benzersiz ilçe listesi
 */
router.get('/districts', async (req, res) => {
  try {
    const districts = await News.distinct('district', { district: { $ne: '' } });
    res.json({
      success: true,
      data: districts.sort()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
