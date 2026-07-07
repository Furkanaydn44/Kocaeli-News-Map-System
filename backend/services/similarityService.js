/**
 * Metin Benzerliği Analizi Servisi
 * Embedding tabanlı benzerlik ölçümü (Sentence-BERT).
 * @xenova/transformers kullanılarak Xenova/all-MiniLM-L6-v2 modeli ile
 * cümle embedding'leri üretilir ve cosine similarity hesaplanır.
 * Benzerlik oranı %90 ve üzeri ise haberler aynı kabul edilir.
 */

const crypto = require('crypto');

// Model singleton — ilk kullanımda yüklenir
let extractor = null;

const SIMILARITY_THRESHOLD = 0.90; // %90 eşik

/**
 * Embedding pipeline'ını yükle (singleton pattern)
 * İlk çağrıda model indirilir/yüklenir, sonraki çağrılarda cache'den gelir.
 */
async function getExtractor() {
  if (!extractor) {
    console.log('🧠 Embedding modeli yükleniyor (Xenova/all-MiniLM-L6-v2)...');
    const { pipeline } = await import('@xenova/transformers');
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Embedding modeli başarıyla yüklendi!');
  }
  return extractor;
}

/**
 * Content hash oluştur (hızlı exact-duplicate kontrolü)
 */
function generateContentHash(title, content) {
  const text = `${title}${content}`.toLowerCase().replace(/\s+/g, ' ').trim();
  return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Metin için embedding vektörü üret
 * @param {string} text - Embedding üretilecek metin
 * @returns {Promise<number[]>} 384 boyutlu embedding vektörü
 */
async function generateEmbedding(text) {
  if (!text) return null;

  const pipe = await getExtractor();

  // Metni kısalt (model max 256 token alır, ~1000 karakter yeterli)
  const truncated = text.substring(0, 1000);

  const output = await pipe(truncated, { pooling: 'mean', normalize: true });

  // Float32Array'den normal Array'e çevir (MongoDB'ye kayıt için)
  return Array.from(output[0].data);
}

/**
 * İki embedding vektörü arasındaki cosine similarity'yi hesapla
 * Vektörler normalize edildiği için dot product = cosine similarity
 * @param {number[]} vecA - Birinci embedding vektörü
 * @param {number[]} vecB - İkinci embedding vektörü
 * @returns {number} Benzerlik oranı (0-1 arası)
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

/**
 * Yeni haberi mevcut haberlerle karşılaştır (embedding tabanlı).
 * Benzer haber bulunursa, mevcut haberin bilgisini döndür.
 * @param {string} newTitle - Yeni haber başlığı
 * @param {string} newContent - Yeni haber içeriği
 * @param {Array} existingNewsList - Mevcut haberler listesi (embedding alanı ile)
 * @returns {Promise<{match: object, similarity: number, type: string, embedding: number[]}|null>}
 */
async function findSimilarNews(newTitle, newContent, existingNewsList) {
  const newText = `${newTitle} ${newContent}`;

  // Yeni haber için embedding üret
  const newEmbedding = await generateEmbedding(newText);
  if (!newEmbedding) return null;

  for (const existing of existingNewsList) {
    // Önce hash kontrolü (exact match)
    const newHash = generateContentHash(newTitle, newContent);
    if (existing.contentHash === newHash) {
      return { match: existing, similarity: 1.0, type: 'exact', embedding: newEmbedding };
    }

    // Embedding benzerlik kontrolü
    if (existing.embedding && existing.embedding.length > 0) {
      const similarity = cosineSimilarity(newEmbedding, existing.embedding);

      if (similarity >= SIMILARITY_THRESHOLD) {
        return { match: existing, similarity, type: 'similar', embedding: newEmbedding };
      }
    }
  }

  return { match: null, similarity: 0, type: 'new', embedding: newEmbedding };
}

module.exports = {
  generateContentHash,
  generateEmbedding,
  cosineSimilarity,
  findSimilarNews,
  getExtractor,
  SIMILARITY_THRESHOLD
};
