/**
 * Veri Temizleme Servisi
 * HTML tag temizliği, boşluk düzenleme, özel karakter temizleme,
 * reklam kaldırma ve metin normalizasyonu.
 */

const cheerio = require('cheerio');

// Reklam / alakasız bölüm kalıpları
const AD_PATTERNS = [
  /reklam/gi,
  /sponsor/gi,
  /abone ol/gi,
  /üye girişi/gi,
  /bülten/gi,
  /whatsapp/gi,
  /haber ihbar/gi,
  /instagram.*takip/gi,
  /twitter.*takip/gi,
  /facebook.*takip/gi,
  /haberin devamı için tıklayın/gi,
  /ilginizi çekebilir/gi,
  /benzer haberler/gi,
  /paylaş/gi,
  /yorum yap/gi,
  /dolar.*euro.*altın/gi,
  /seri ilan/gi,
  /resmi ilan/gi,
];

// Temizlenecek özel karakterler
const SPECIAL_CHARS = /[^\wÀ-ÿçğıöşüÇĞİÖŞÜ\s.,;:!?'"()\-–—\/\n]/g;

/**
 * HTML etiketlerini temizle
 */
function stripHTML(html) {
  if (!html) return '';
  const $ = cheerio.load(html);

  // Script ve style etiketlerini kaldır
  $('script, style, noscript, iframe, svg').remove();

  // Metin içeriğini al
  return $.text();
}

/**
 * Fazla boşlukları temizle
 */
function normalizeWhitespace(text) {
  if (!text) return '';
  return text
    .replace(/\t/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Gereksiz özel karakterleri temizle
 */
function removeSpecialChars(text) {
  if (!text) return '';
  return text.replace(SPECIAL_CHARS, ' ').replace(/ {2,}/g, ' ').trim();
}

/**
 * Reklam ve alakasız bölümleri kaldır
 */
function removeAds(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const cleanLines = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.length < 3) return false;
    for (const pattern of AD_PATTERNS) {
      if (pattern.test(trimmed) && trimmed.length < 100) {
        return false;
      }
    }
    return true;
  });
  return cleanLines.join('\n');
}

/**
 * Metin normalizasyonu
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/"|"/g, '"')
    .replace(/'|'/g, "'")
    .replace(/…/g, '...')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .trim();
}

/**
 * Tam temizleme pipeline'ı
 */
function cleanText(rawText) {
  if (!rawText) return '';

  let text = rawText;

  // 1. HTML tag temizliği
  text = stripHTML(text);

  // 2. Metin normalizasyonu
  text = normalizeText(text);

  // 3. Reklam kaldır
  text = removeAds(text);

  // 4. Özel karakter temizle
  text = removeSpecialChars(text);

  // 5. Boşluk düzenle
  text = normalizeWhitespace(text);

  return text;
}

/**
 * Başlık temizleme (daha hafif)
 */
function cleanTitle(rawTitle) {
  if (!rawTitle) return '';
  let title = stripHTML(rawTitle);
  title = normalizeText(title);
  title = normalizeWhitespace(title);
  return title;
}

module.exports = {
  cleanText,
  cleanTitle,
  stripHTML,
  normalizeWhitespace,
  removeSpecialChars,
  removeAds,
  normalizeText
};
