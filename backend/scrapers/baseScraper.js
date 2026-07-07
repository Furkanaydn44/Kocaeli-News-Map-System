/**
 * Base Scraper - Tüm scraperlar için temel sınıf
 * Ortak fonksiyonlar: sayfa çekme, HTML parse, tarih çıkarımı, rate limiting
 */

const axios = require('axios');
const cheerio = require('cheerio');

class BaseScraper {
  constructor(siteName, baseUrl) {
    this.siteName = siteName;
    this.baseUrl = baseUrl;
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
    };
    this.delay = 500; // İstekler arası bekleme (ms)
  }

  /**
   * Sayfayı çek
   */
  async fetchPage(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 15000,
        maxRedirects: 5,
      });
      return response.data;
    } catch (error) {
      console.error(`❌ [${this.siteName}] Sayfa çekilemedi: ${url} - ${error.message}`);
      return null;
    }
  }

  /**
   * HTML parse et
   */
  parseHTML(html) {
    return cheerio.load(html);
  }

  /**
   * Rate limiting - istekler arası bekleme
   */
  async wait() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  /**
   * Tarih string'ini Date objesine çevir
   */
  parseDate(dateStr) {
    if (!dateStr) return new Date();

    const cleaned = dateStr.trim();

    // Önce ISO 8601 tam format dene ("2026-03-29T14:30:00+03:00" veya "2026-03-29T14:30:00Z")
    if (cleaned.includes('T')) {
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) return d;
    }

    const lower = cleaned.toLowerCase();

    // Türkçe ay isimleri
    const trMonths = {
      'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
      'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11
    };

    // "29 mart 2026" veya "29 mart 2026 14:30" veya "29 Mart 2026, 14:30"
    const trMatch = lower.match(/(\d{1,2})\s+(\w+)\s+(\d{4})[\s,]*(?:(\d{1,2})[:.:](\d{2}))?/);
    if (trMatch) {
      const day = parseInt(trMatch[1]);
      const month = trMonths[trMatch[2]];
      const year = parseInt(trMatch[3]);
      const hour = trMatch[4] ? parseInt(trMatch[4]) : 0;
      const minute = trMatch[5] ? parseInt(trMatch[5]) : 0;

      if (month !== undefined) {
        return new Date(year, month, day, hour, minute);
      }
    }

    // "29.03.2026 14:30" veya "29/03/2026 14:30" veya "29.03.2026"
    const numMatch = cleaned.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})[\s,]*(?:(\d{1,2})[:.:](\d{2}))?/);
    if (numMatch) {
      const day = parseInt(numMatch[1]);
      const month = parseInt(numMatch[2]) - 1;
      const year = parseInt(numMatch[3]);
      const hour = numMatch[4] ? parseInt(numMatch[4]) : 0;
      const minute = numMatch[5] ? parseInt(numMatch[5]) : 0;
      return new Date(year, month, day, hour, minute);
    }

    // "2026-03-29" veya "2026-03-29 14:30"
    const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})[\s]*(?:(\d{1,2})[:.:](\d{2}))?/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1]);
      const month = parseInt(isoMatch[2]) - 1;
      const day = parseInt(isoMatch[3]);
      const hour = isoMatch[4] ? parseInt(isoMatch[4]) : 0;
      const minute = isoMatch[5] ? parseInt(isoMatch[5]) : 0;
      return new Date(year, month, day, hour, minute);
    }

    // "X saat önce" / "X dakika önce"
    const agoMatch = lower.match(/(\d+)\s*(saat|dakika|dk|sa)\s*önce/);
    if (agoMatch) {
      const amount = parseInt(agoMatch[1]);
      const unit = agoMatch[2];
      const now = new Date();
      if (unit === 'saat' || unit === 'sa') {
        now.setHours(now.getHours() - amount);
      } else {
        now.setMinutes(now.getMinutes() - amount);
      }
      return now;
    }

    // Son çare: JS native parse
    const fallback = new Date(cleaned);
    if (!isNaN(fallback.getTime())) return fallback;

    // Parse edilemezse şimdiki zamanı döndür
    return new Date();
  }

  /**
   * Son N gün içindeki haberleri filtrele
   */
  isWithinDays(date, days = 3) {
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return date >= cutoff;
  }

  /**
   * URL'yi tam URL'ye çevir
   */
  resolveUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('//')) return 'https:' + path;
    if (path.startsWith('/')) return this.baseUrl + path;
    return this.baseUrl + '/' + path;
  }

  /**
   * Alt sınıflarda override edilecek
   */
  async scrapeListPage(categoryUrl) {
    throw new Error('scrapeListPage() alt sınıfta implemente edilmelidir');
  }

  async scrapeArticle(articleUrl) {
    throw new Error('scrapeArticle() alt sınıfta implemente edilmelidir');
  }

  async scrapeAll() {
    throw new Error('scrapeAll() alt sınıfta implemente edilmelidir');
  }
}

module.exports = BaseScraper;
