/**
 * Haber Türü Sınıflandırma Servisi
 * Gelişmiş anahtar kelime tabanlı otomatik sınıflandırma.
 * Negatif kelime desteği ile yanlış sınıflandırma önlenir.
 * 
 * Öncelik sırası: Trafik Kazası > Yangın > Hırsızlık > Elektrik Kesintisi > Kültürel Etkinlik > Diğer
 */

// Kategori anahtar kelimeleri (ağırlıklı) — GENİŞLETİLMİŞ
const CATEGORY_KEYWORDS = {
  trafik_kazasi: {
    strong: [
      'trafik kazası', 'trafik kazasi', 'zincirleme kaza', 'feci kaza',
      'ölümlü kaza', 'maddi hasarlı kaza', 'tır kazası', 'otobüs kazası',
      'motosiklet kazası', 'trafik kazasında', 'kazada hayatını kaybetti',
      'kaza sonucu', 'kaza meydana geldi', 'kazada öldü', 'kaza anı',
      'trafik faciası', 'kaza yapan', 'kazada can verdi', 'tır devrildi',
      'otobüs devrildi', 'araç takla attı', 'araç uçuruma yuvarlandı',
      'aracın çarptığı', 'kazada yaralanan', 'kaza yerinde',
      'otomobil çarpması', 'araç çarpışması', 'minibüs kazası'
    ],
    medium: [
      'kaza', 'çarpıştı', 'çarpışma', 'devrildi', 'takla attı', 'savruld',
      'kafa kafaya', 'yaralı', 'can verdi', 'hayatını kaybetti', 'feci şekilde',
      'hurdaya döndü', 'bariyerlere çarptı', 'refüje çıktı', 'şarampole yuvarlandı',
      'karşı şeride geçti', 'sürücü hayatını kaybetti', 'yaralı kurtarıldı',
      'ambulans sevk edildi', 'olay yerine sevk', 'trafik durma noktasına geldi',
      'araç hurdaya döndü', 'can pazarı', 'metrelerce sürüklendi'
    ],
    weak: [
      'araç', 'otomobil', 'sürücü', 'direksiyon', 'bariyerlere', 'TEM',
      'otoyol', 'E-80', 'D-100', 'karayolu', 'tır', 'kamyon', 'motosiklet',
      'bisiklet', 'yaya', 'otobüs', 'minibüs', 'trafik', 'kavşak',
      'köprüsü', 'viraj', 'geçidi', 'ambulans', 'kırmızı ışık', 'hız',
      'alkollü', 'ehliyetsiz', 'plaka', 'lastik patladı', 'fren'
    ],
    // Negatif kelimeler: bu kelimeler varsa bu kategori olmamalı
    negative: [
      'cinayet', 'öldürdü', 'bıçak', 'silah', 'ateş açtı', 'kurşun',
      'dövdü', 'kavga', 'gasp', 'hırsız'
    ]
  },
  yangin: {
    strong: [
      'yangın çıktı', 'yangında', 'alevlere teslim', 'kül oldu',
      'ev yandı', 'fabrika yandı', 'alev alev', 'yangın faciası',
      'orman yangını', 'yangın söndürme', 'yangın ihbarı',
      'yangında hayatını kaybetti', 'yangın büyümeden', 'alevler sardı',
      'alevler kontrol altına alındı', 'yangın paniği', 'çatı yangını',
      'araç yangını', 'oto yangın', 'yangın çıkış sebebi',
      'yangında mahsur', 'yangından kurtarıldı'
    ],
    medium: [
      'yangın', 'yangin', 'alevler', 'itfaiye', 'tutuştu', 'alev aldı',
      'dumandan etkilendi', 'yandı', 'söndürme', 'alevleri söndürdü',
      'dumandan zehirlendi', 'küle döndü', 'yanarak öldü',
      'itfaiye ekipleri', 'yangın tüpü', 'yangın merdiveni',
      'kundaklama', 'kundaklandı', 'kasıtlı yangın', 'soba',
      'yangın raporu', 'kısa devre'
    ],
    weak: [
      'duman', 'alevlerin', 'söndürüldü', 'kül', 'hasar', 'bacası',
      'koku', 'is', 'yanık', 'alev', 'inceleme', 'maddi hasar',
      'tüp', 'baca', 'kazan', 'doğalgaz', 'patlama'
    ],
    negative: []
  },
  hirsizlik: {
    strong: [
      'hırsızlık yapıldı', 'soygun gerçekleşti', 'çaldılar', 'gasp etti',
      'hırsızlık çetesi', 'hırsızlık olayı', 'evden hırsızlık',
      'oto hırsızlığı', 'iş yerinden hırsızlık', 'kapkaç olayı',
      'gasp olayı', 'silahlı soygun', 'kuyumcu soygunu',
      'banka soygunu', 'soygun girişimi', 'hırsızlık şüphelisi',
      'çaldığı araç', 'hırsızlık yaparken yakalandı',
      'gasp edip kaçtı', 'kapkaçcı yakalandı'
    ],
    medium: [
      'hırsız', 'hırsızlık', 'çalındı', 'çaldı', 'soygun', 'gasp',
      'kapkaç', 'soyuldu', 'çalıntı araç', 'evlere girdi',
      'dükkanı soydu', 'kasayı boşalttı', 'para çaldı', 'altın çaldı',
      'dolandırıcı', 'dolandırıcılık', 'sahte para', 'sahtecilik',
      'uyuşturucu', 'zehir taciri', 'narkotik', 'bonzai'
    ],
    weak: [
      'çalıntı', 'çete', 'suç örgütü', 'yakalandı', 'gözaltı', 'suçüstü',
      'tutuklama', 'hapis', 'ceza', 'mahkeme', 'savcılık', 'adliye',
      'operasyon', 'baskın', 'ihbar', 'el konuldu', 'müsadere',
      'çete lideri', 'suç şebekesi'
    ],
    negative: []
  },
  elektrik_kesintisi: {
    strong: [
      'elektrik kesintisi', 'elektrik kesilecek', 'elektriksiz kalacak',
      'enerji kesintisi', 'planlı kesinti', 'planlı elektrik kesintisi',
      'elektrik kesintisi uygulanacak', 'elektrikler kesilecek',
      'saatlerce elektriksiz', 'su kesintisi', 'su kesilecek',
      'doğalgaz kesintisi', 'internet kesintisi', 'planlı bakım',
      'bakım onarım çalışması', 'SEDAŞ duyurdu', 'SEDAŞ kesinti',
      'İSU duyurdu', 'İSU kesinti'
    ],
    medium: [
      'elektrik kesintisi', 'elektriksiz', 'karanlıkta kaldı', 'SEDAŞ',
      'enerji kesintisi', 'su kesintisi', 'İSU', 'altyapı çalışması',
      'yol çalışması', 'bakım onarım', 'trafo arızası', 'kablo arızası',
      'hat bakımı', 'pompa arızası', 'su şebekesi', 'kanalizasyon',
      'su baskını', 'taşkın', 'dere taştı', 'sel baskını'
    ],
    weak: [
      'trafo', 'elektrik', 'enerji', 'kesinti', 'karanlık',
      'şebeke', 'voltaj', 'ampül', 'jeneratör', 'abone',
      'fatura', 'sayaç', 'altyapı', 'onarım'
    ],
    negative: []
  },
  kulturel_etkinlik: {
    strong: [
      'kültürel etkinlik', 'festival başladı', 'konser verildi',
      'sergi açıldı', 'tiyatro oyunu', 'sahneye çıktı', 'konser düzenlendi',
      'sergi başladı', 'film festivali', 'müzik festivali', 'caz festivali',
      'uluslararası festival', 'sanat galerisi', 'müze açılışı',
      'kitap fuarı', 'edebiyat festivali', 'film gösterimi',
      'bale gösterisi', 'opera gösterisi', 'halk oyunları gösterisi',
      'gençlik festivali', 'çocuk festivali', 'sokak festivali'
    ],
    medium: [
      'konser', 'festival', 'sergi', 'tiyatro', 'orkestra', 'gösteri',
      'sahne', 'resital', 'söyleşi', 'dans gösterisi', 'müzik',
      'sinema', 'film', 'bale', 'opera', 'koro', 'sanatçı',
      'şarkıcı', 'yazar', 'okuma', 'performans', 'stand-up',
      'atölye çalışması', 'workshop', 'kurs', 'seminer',
      'tören', 'mezuniyet', 'diploma', 'ödül', 'kutlama',
      'bayram etkinliği', 'yılbaşı etkinliği', 'ramazan etkinliği',
      'spor müsabakası', 'maç', 'turnuva', 'yarışma', 'maraton',
      'bisiklet turu', 'koşu', 'yüzme'
    ],
    weak: [
      'kültür', 'sanat', 'etkinlik', 'kutlama', 'şenlik', 'anma',
      'ödül töreni', 'panel', 'atölye', 'gala', 'lansman', 'açılış',
      'davet', 'buluşma', 'toplantı', 'ziyaret', 'gezi'
    ],
    negative: []
  }
};

// Ağırlık puanları
const WEIGHTS = { strong: 10, medium: 5, weak: 2, negative: -15 };

// Öncelik sırası
const PRIORITY_ORDER = [
  'trafik_kazasi',
  'yangin',
  'hirsizlik',
  'elektrik_kesintisi',
  'kulturel_etkinlik'
];

// Kategori Türkçe isimleri
const CATEGORY_LABELS = {
  trafik_kazasi: 'Trafik Kazası',
  yangin: 'Yangın',
  elektrik_kesintisi: 'Elektrik Kesintisi',
  hirsizlik: 'Hırsızlık',
  kulturel_etkinlik: 'Kültürel Etkinlik',
  diger: 'Diğer'
};

/**
 * Haberi sınıflandır
 * @param {string} title - Haber başlığı
 * @param {string} content - Haber içeriği
 * @returns {{ category: string, confidence: number, scores: object }}
 */
function classifyNews(title, content) {
  const titleLower = title.toLowerCase();
  const fullText = `${title} ${title} ${content}`.toLowerCase();

  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;

    // Strong keywords (başlıkta olursa ekstra puan)
    for (const kw of keywords.strong) {
      const kwLower = kw.toLowerCase();
      if (titleLower.includes(kwLower)) {
        score += WEIGHTS.strong * 2; // Başlıkta = double puan
      }
      if (fullText.includes(kwLower)) {
        score += WEIGHTS.strong;
      }
    }

    // Medium keywords
    for (const kw of keywords.medium) {
      const kwLower = kw.toLowerCase();
      if (titleLower.includes(kwLower)) {
        score += WEIGHTS.medium * 2;
      }
      if (fullText.includes(kwLower)) {
        score += WEIGHTS.medium;
      }
    }

    // Weak keywords
    for (const kw of keywords.weak) {
      const kwLower = kw.toLowerCase();
      if (fullText.includes(kwLower)) {
        score += WEIGHTS.weak;
      }
    }

    // Negative keywords — yanlış sınıflandırmayı önle
    if (keywords.negative) {
      for (const kw of keywords.negative) {
        const kwLower = kw.toLowerCase();
        if (titleLower.includes(kwLower)) {
          score += WEIGHTS.negative * 2; // Başlıkta negatif = çift ceza
        }
        if (fullText.includes(kwLower)) {
          score += WEIGHTS.negative;
        }
      }
    }

    // Negatif skoru sıfırla (0'ın altına düşmesin)
    scores[category] = Math.max(0, score);
  }

  // En yüksek puanlı kategoriyi bul
  let maxScore = 0;
  let bestCategory = null;

  // Öncelik sırasına göre kontrol et
  for (const category of PRIORITY_ORDER) {
    if (scores[category] > maxScore) {
      maxScore = scores[category];
      bestCategory = category;
    }
  }

  // Minimum eşik değeri: en az 10 puan olmalı (1 strong veya 2 medium keyword)
  // Altında kalırsa "Diğer" kategorisine at
  if (maxScore < 10) {
    return {
      category: 'diger',
      label: 'Diğer',
      confidence: 0,
      scores
    };
  }

  // Güven oranı hesapla
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0;

  return {
    category: bestCategory,
    label: CATEGORY_LABELS[bestCategory],
    confidence: Math.round(confidence * 100),
    scores
  };
}

module.exports = {
  classifyNews,
  CATEGORY_KEYWORDS,
  CATEGORY_LABELS,
  PRIORITY_ORDER
};
