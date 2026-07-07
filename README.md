# 🗺️ Kocaeli Haber Harita Sistemi

Kocaeli'deki yerel haber sitelerini otomatik olarak tarayan, haberlerin geçtiği konumları tespit eden ve bu haberleri interaktif bir harita üzerinde görselleştiren full-stack bir web uygulaması.

## 📋 Özellikler

- 🔍 **Otomatik Web Scraping** — 5 farklı Kocaeli haber kaynağından haber çekme
- 📍 **Konum Tespiti** — Haber metinlerinden otomatik lokasyon çıkarma
- 🗺️ **İnteraktif Harita** — Google Maps üzerinde haber pinleri
- 🤖 **NLP / Sınıflandırma** — Haberleri kategorilere ayırma (yangın, kaza, vb.)
- 🔁 **Benzerlik Analizi** — Tekrarlanan haberleri tespit etme

## 🛠️ Teknoloji Stack

| Katman    | Teknoloji                                |
|-----------|------------------------------------------|
| Frontend  | React 19, Vite, Google Maps API          |
| Backend   | Node.js, Express.js                      |
| Veritabanı| MongoDB Atlas (Mongoose)                 |
| Scraping  | Cheerio, Axios                           |
| NLP       | @xenova/transformers                     |

## 📁 Proje Yapısı

```
230202101_230202071/
├── backend/
│   ├── config/         # Veritabanı bağlantısı
│   ├── models/         # MongoDB modelleri (News, GeoCache)
│   ├── routes/         # API rotaları
│   ├── scrapers/       # Haber siteleri için scraper'lar
│   ├── services/       # İş mantığı servisleri
│   └── server.js       # Giriş noktası
└── frontend/
    ├── src/
    │   ├── components/ # Header, Map, Sidebar bileşenleri
    │   ├── services/   # API istemcisi
    │   └── App.jsx
    └── index.html
```

## 🚀 Kurulum

### Gereksinimler

- Node.js >= 18
- MongoDB Atlas hesabı
- Google Maps API anahtarı

### Backend

```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını kendi bilgilerinizle doldurun
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# .env dosyasına Google Maps API anahtarınızı girin
npm run dev
```

## ⚙️ Ortam Değişkenleri

### backend/.env

| Değişken           | Açıklama                        |
|--------------------|---------------------------------|
| `MONGODB_URI`      | MongoDB Atlas bağlantı adresi   |
| `GOOGLE_MAPS_API_KEY` | Google Maps Geocoding API anahtarı |
| `PORT`             | Sunucu portu (varsayılan: 5000) |

### frontend/.env

| Değişken                   | Açıklama                     |
|----------------------------|------------------------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API   |

## 📡 API Endpoints

| Method | Endpoint            | Açıklama                      |
|--------|---------------------|-------------------------------|
| GET    | `/api/health`       | Sunucu sağlık kontrolü        |
| GET    | `/api/news`         | Tüm haberleri listele         |
| GET    | `/api/news/stats`   | İstatistikleri getir          |
| POST   | `/api/news/scrape`  | Yeni haber çekme işlemi başlat|

## 🌐 Desteklenen Haber Kaynakları

- Yeni Kocaeli
- Çağdaş Kocaeli
- Ses Kocaeli
- Özgür Kocaeli
- Bizim Yaka

## 👥 Geliştirici

- **230202101** & **230202071**

---

> **Not:** `.env` dosyaları repoya dahil değildir. Kurulum için `.env.example` dosyalarını kullanın.
