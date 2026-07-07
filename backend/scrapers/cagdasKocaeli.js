/**
 * Çağdaş Kocaeli Scraper
 * https://www.cagdaskocaeli.com.tr/
 * Kategori sayfaları: /asayis, /gundem, /kultur-sanat
 */

const BaseScraper = require('./baseScraper');

class CagdasKocaeliScraper extends BaseScraper {
  constructor() {
    super('Çağdaş Kocaeli', 'https://www.cagdaskocaeli.com.tr');
    this.categoryUrls = [
      '/asayis',
      '/gundem',
      '/kultur-sanat',
      '/kocaeli-gundem-haberleri',
      '/kocaeli-asayis-haberleri'
    ];
  }

  async scrapeListPage(categoryPath) {
    const url = this.resolveUrl(categoryPath);
    console.log(`📰 [${this.siteName}] Liste sayfası tarıyor: ${url}`);

    const html = await this.fetchPage(url);
    if (!html) return [];

    const $ = this.parseHTML(html);
    const articles = [];

    // Haber linklerini topla
    $('a[href*="/haber/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/haber/')) {
        const fullUrl = this.resolveUrl(href);
        if (!articles.includes(fullUrl)) {
          articles.push(fullUrl);
        }
      }
    });

    // Foto haber linklerini de topla
    $('a[href*="/foto/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/foto/')) {
        const fullUrl = this.resolveUrl(href);
        if (!articles.includes(fullUrl)) {
          articles.push(fullUrl);
        }
      }
    });

    console.log(`   → ${articles.length} haber linki bulundu`);
    return [...new Set(articles)]; // Tekrar edenleri kaldır
  }

  async scrapeArticle(articleUrl) {
    await this.wait();

    const html = await this.fetchPage(articleUrl);
    if (!html) return null;

    const $ = this.parseHTML(html);

    try {
      // Başlık
      const title = $('h1').first().text().trim() ||
                     $('meta[property="og:title"]').attr('content') || '';

      if (!title) return null;

      // İçerik
      let content = '';
      // article body veya haber içerik alanı
      const contentSelectors = [
        '.news-content',
        '.article-content',
        '.content-text',
        '.news-detail-content',
        'article .content',
        '[itemprop="articleBody"]',
        '.detail-content'
      ];

      for (const selector of contentSelectors) {
        const el = $(selector);
        if (el.length > 0) {
          content = el.text().trim();
          break;
        }
      }

      // Fallback: tüm p etiketlerini al (article veya main içinde)
      if (!content) {
        const paragraphs = [];
        $('article p, .detail p, main p').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 20) {
            paragraphs.push(text);
          }
        });
        content = paragraphs.join('\n');
      }

      if (!content || content.length < 30) return null;

      // Tarih
      let publishDate = null;
      const dateSelectors = [
        'time[datetime]',
        '.news-date',
        '.article-date',
        '.detail-date',
        '.date',
        '[itemprop="datePublished"]'
      ];

      for (const selector of dateSelectors) {
        const el = $(selector);
        if (el.length > 0) {
          const datetime = el.attr('datetime') || el.attr('content') || el.text();
          publishDate = this.parseDate(datetime);
          break;
        }
      }

      // meta tag'den tarih
      if (!publishDate) {
        const metaDate = $('meta[property="article:published_time"]').attr('content') ||
                         $('meta[name="publish-date"]').attr('content');
        if (metaDate) {
          publishDate = new Date(metaDate);
        }
      }

      if (!publishDate) publishDate = new Date();

      // Son 3 gün kontrolü
      if (!this.isWithinDays(publishDate, 3)) {
        return null;
      }

      return {
        title,
        content,
        publishDate,
        source: {
          siteName: this.siteName,
          url: articleUrl
        }
      };
    } catch (error) {
      console.error(`❌ [${this.siteName}] Haber parse hatası: ${articleUrl} - ${error.message}`);
      return null;
    }
  }

  async scrapeAll() {
    console.log(`\n🔄 [${this.siteName}] Scraping başlıyor...`);
    const allArticles = [];
    const seenUrls = new Set();

    for (const categoryPath of this.categoryUrls) {
      try {
        const articleUrls = await this.scrapeListPage(categoryPath);
        await this.wait();

        for (const url of articleUrls) {
          if (seenUrls.has(url)) continue;
          seenUrls.add(url);

          const article = await this.scrapeArticle(url);
          if (article) {
            allArticles.push(article);
          }

          // Her 10 haberde progress log
          if (allArticles.length % 10 === 0 && allArticles.length > 0) {
            console.log(`   📊 ${allArticles.length} haber çekildi...`);
          }
        }
      } catch (error) {
        console.error(`❌ [${this.siteName}] Kategori hatası: ${categoryPath} - ${error.message}`);
      }
    }

    console.log(`✅ [${this.siteName}] Toplam ${allArticles.length} haber çekildi`);
    return allArticles;
  }
}

module.exports = CagdasKocaeliScraper;
