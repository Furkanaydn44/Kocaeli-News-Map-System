/**
 * Konum Bilgisi Çıkarım Servisi
 * Haber metninden ilçe, mahalle, sokak, cadde ve önemli yer bilgisi çıkarır.
 */

// Kocaeli İlçeleri
const DISTRICTS = [
  'İzmit', 'Gebze', 'Darıca', 'Gölcük', 'Körfez', 'Derince',
  'Çayırova', 'Dilovası', 'Başiskele', 'Kartepe', 'Karamürsel', 'Kandıra'
];

// İlçe isimlerinin alternatif yazılışları (case-insensitive matching için)
const DISTRICT_ALIASES = {
  'izmit': 'İzmit',
  'İzmit': 'İzmit',
  'gebze': 'Gebze',
  'darıca': 'Darıca',
  'darica': 'Darıca',
  'gölcük': 'Gölcük',
  'golcuk': 'Gölcük',
  'körfez': 'Körfez',
  'korfez': 'Körfez',
  'derince': 'Derince',
  'çayırova': 'Çayırova',
  'cayirova': 'Çayırova',
  'dilovası': 'Dilovası',
  'dilovasi': 'Dilovası',
  'başiskele': 'Başiskele',
  'basiskele': 'Başiskele',
  'kartepe': 'Kartepe',
  'karamürsel': 'Karamürsel',
  'karamursel': 'Karamürsel',
  'kandıra': 'Kandıra',
  'kandira': 'Kandıra',
  'kocaeli': 'Kocaeli'
};

// Bilinen önemli yerler (landmark'lar)
const LANDMARKS = {
  '41 Burda AVM': { district: 'İzmit', hint: '41 Burda AVM, İzmit' },
  'Symbol AVM': { district: 'İzmit', hint: 'Symbol AVM, İzmit' },
  'Gebze Center AVM': { district: 'Gebze', hint: 'Gebze Center AVM, Gebze' },
  'Tersane İstanbul': { district: 'İzmit', hint: 'Tersane, İzmit' },
  'Seka Park': { district: 'İzmit', hint: 'Seka Park, İzmit' },
  'Kent Meydanı': { district: 'İzmit', hint: 'Kent Meydanı, İzmit' },
  'Sabancı Kültür Merkezi': { district: 'İzmit', hint: 'Sabancı Kültür Merkezi, İzmit' },
  'Yuvacık': { district: 'İzmit', hint: 'Yuvacık, İzmit' },
  'Ford Otosan': { district: 'Gölcük', hint: 'Ford Otosan, Gölcük' },
  'Donanma': { district: 'Gölcük', hint: 'Donanma, Gölcük' },
  'TÜBİTAK': { district: 'Gebze', hint: 'TÜBİTAK, Gebze' },
  'OSB': { district: 'Gebze', hint: 'Organize Sanayi Bölgesi, Gebze' },
  'Kocaeli Üniversitesi': { district: 'İzmit', hint: 'Kocaeli Üniversitesi, İzmit' }
};

/**
 * Metinden ilçe bilgisi çıkar
 */
function extractDistrict(text) {
  if (!text) return null;

  const lowerText = text.toLowerCase();

  // Kocaeli ilçelerini kontrol et
  for (const district of DISTRICTS) {
    // Case-insensitive exact word match
    const regex = new RegExp(`\\b${district.toLowerCase().replace(/ı/g, '[ıi]').replace(/ö/g, '[öo]').replace(/ü/g, '[üu]').replace(/ç/g, '[çc]').replace(/ğ/g, '[ğg]').replace(/ş/g, '[şs]')}\\b`, 'i');
    if (regex.test(text)) {
      return district;
    }
  }

  // Alias kontrolü
  for (const [alias, district] of Object.entries(DISTRICT_ALIASES)) {
    if (lowerText.includes(alias.toLowerCase())) {
      return district;
    }
  }

  return null;
}

/**
 * Metinden mahalle bilgisi çıkar
 */
function extractNeighborhood(text) {
  if (!text) return null;

  // Sadece büyük harfle başlayan 1, 2 veya 3 kelimelik mahalle isimlerini yakala
  // Örn: "Yeniyalı Mahallesi", "Nene Hatun Mahallesi"
  const pattern = /(?:[A-ZÇĞİIÖŞÜ][a-zçğıiöşüA-ZÇĞİIÖŞÜ]+(?:[\s]+[A-ZÇĞİIÖŞÜ][a-zçğıiöşüA-ZÇĞİIÖŞÜ]+){0,2})[\s]+(?:Mahallesi|Mah\.)/g;
  const match = pattern.exec(text);
  if (match) {
    return match[0].trim().replace('Mah.', 'Mahallesi');
  }

  return null;
}

/**
 * Metinden sokak/cadde bilgisi çıkar
 */
function extractStreet(text) {
  if (!text) return null;

  // Sadece büyük harfle başlayan 1, 2 veya 3 kelimelik cadde/sokak isimlerini yakala
  const pattern = /(?:[A-ZÇĞİIÖŞÜ][a-zçğıiöşüA-ZÇĞİIÖŞÜ]+(?:[\s]+[A-ZÇĞİIÖŞÜ][a-zçğıiöşüA-ZÇĞİIÖŞÜ]+){0,2})[\s]+(?:Sokak|Sokağı|Sok\.|Caddesi|Cad\.|Bulvarı|Bul\.)/g;
  const match = pattern.exec(text);
  if (match) {
    return match[0].trim();
  }

  return null;
}

/**
 * Bilinen landmark'ları kontrol et
 */
function extractLandmark(text) {
  if (!text) return null;

  for (const [name, info] of Object.entries(LANDMARKS)) {
    if (text.includes(name)) {
      return {
        name,
        district: info.district,
        hint: info.hint
      };
    }
  }

  return null;
}

/**
 * Yol bilgisi çıkar (TEM, E-80, D-100 vb.)
 */
function extractRoad(text) {
  if (!text) return null;

  const patterns = [
    /\bTEM\s*[Oo]toyol/i,
    /\bTEM\b/i,
    /\bE[-\s]?80\b/i,
    /\bD[-\s]?100\b/i,
    /\bO[-\s]?4\b/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      return match[0].trim();
    }
  }

  return null;
}

/**
 * Tüm konum bilgilerini çıkar ve en spesifik olanı döndür
 */
function extractLocation(title, content) {
  const fullText = `${title} ${content}`;

  const district = extractDistrict(fullText);
  const neighborhood = extractNeighborhood(fullText);
  const street = extractStreet(fullText);
  const landmark = extractLandmark(fullText);
  const road = extractRoad(fullText);

  // En spesifik konum bilgisini oluştur
  const parts = [];

  if (street) parts.push(street);
  if (neighborhood) parts.push(neighborhood);
  if (landmark) {
    parts.push(landmark.name);
  }
  if (road) parts.push(road);

  const resolvedDistrict = district || (landmark ? landmark.district : null);

  if (resolvedDistrict && resolvedDistrict !== 'Kocaeli') {
    parts.push(resolvedDistrict);
  }
  parts.push('Kocaeli');

  const locationText = parts.join(', ');

  // Konum bulunamadıysa null döndür
  if (!resolvedDistrict && !neighborhood && !street && !landmark && !road) {
    // Sadece Kocaeli metni varsa da en azından ilçeyi tespit etmeye çalış
    if (fullText.toLowerCase().includes('kocaeli')) {
      return {
        locationText: 'Kocaeli',
        district: 'Kocaeli',
        parts: { district: null, neighborhood, street, landmark: landmark?.name, road }
      };
    }
    return null;
  }

  return {
    locationText,
    district: resolvedDistrict || '',
    parts: {
      district: resolvedDistrict,
      neighborhood,
      street,
      landmark: landmark?.name || null,
      road
    }
  };
}

module.exports = {
  extractLocation,
  extractDistrict,
  extractNeighborhood,
  extractStreet,
  extractLandmark,
  DISTRICTS,
  LANDMARKS
};
