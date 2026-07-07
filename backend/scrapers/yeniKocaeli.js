/**
 * Yeni Kocaeli Scraper
 * https://www.yenikocaeli.com/
 * Not: Site erişilemez olabilir, hata durumunda boş dizi döndürür.
 */

const BaseScraper = require('./baseScraper');

class YeniKocaeliScraper extends BaseScraper {
  constructor() {
    super('Yeni Kocaeli', 'https://www.yenikocaeli.com');
    this.categoryUrls = [
      '/kategori/asayis',
      '/kategori/gundem',
      '/kategori/yasam',
      '/kategori/kultur-sanat'
    ];
  }

  async scrapeListPage(categoryPath) {
    const url = this.resolveUrl(categoryPath);
    console.log(`📰 [${this.siteName}] Liste sayfası tarıyor: ${url}`);

    const html = await this.fetchPage(url);
    if (!html) return [];

    const $ = this.parseHTML(html);
    const articles = [];

    // Genel haber link kalıpları
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('/haber/') || href.includes('/haberi/'))) {
        const fullUrl = this.resolveUrl(href);
        if (!articles.includes(fullUrl)) {
          articles.push(fullUrl);
        }
      }
    });

    console.log(`   → ${articles.length} haber linki bulundu`);
    return [...new Set(articles)];
  }

  async scrapeArticle(articleUrl) {
    await this.wait();

    const html = await this.fetchPage(articleUrl);
    if (!html) return null;

    const $ = this.parseHTML(html);

    try {
      const title = $('h1').first().text().trim() ||
                     $('meta[property="og:title"]').attr('content') || '';

      if (!title) return null;

      let content = '';
      const contentSelectors = [
        '.news-content', '.article-content', '.content-text',
        '.news-detail-content', 'article .content',
        '[itemprop="articleBody"]', '.detail-content',
        '.entry-content', '.post-content'
      ];

      for (const selector of contentSelectors) {
        const el = $(selector);
        if (el.length > 0) {
          content = el.text().trim();
          break;
        }
      }

      if (!content) {
        const paragraphs = [];
        $('article p, .detail p, main p, .post p').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 20) paragraphs.push(text);
        });
        content = paragraphs.join('\n');
      }

      if (!content || content.length < 30) return null;

      let publishDate = null;
      const dateSelectors = [
        'time[datetime]', '.news-date', '.article-date',
        '.detail-date', '.date', '[itemprop="datePublished"]',
        '.entry-date', '.post-date'
      ];

      for (const selector of dateSelectors) {
        const el = $(selector);
        if (el.length > 0) {
          const datetime = el.attr('datetime') || el.attr('content') || el.text();
          publishDate = this.parseDate(datetime);
          break;
        }
      }

      if (!publishDate) {
        const metaDate = $('meta[property="article:published_time"]').attr('content');
        if (metaDate) publishDate = new Date(metaDate);
      }

      if (!publishDate) publishDate = new Date();
      if (!this.isWithinDays(publishDate, 3)) return null;

      return {
        title,
        content,
        publishDate,
        source: { siteName: this.siteName, url: articleUrl }
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
          if (article) allArticles.push(article);
        }
      } catch (error) {
        console.error(`❌ [${this.siteName}] Kategori hatası: ${categoryPath} - ${error.message}`);
      }
    }

    console.log(`✅ [${this.siteName}] Toplam ${allArticles.length} haber çekildi`);
    return allArticles;
  }
}

module.exports = YeniKocaeliScraper;
