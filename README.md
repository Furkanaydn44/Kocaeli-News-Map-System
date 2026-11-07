# 🗺️ Kocaeli Haber Harita Sistemi

Kocaeli'deki yerel haber sitelerini otomatik olarak tarayan, haberlerin geçtiği konumları tespit eden ve bu haberleri interaktif bir harita üzerinde görselleştiren full-stack bir web uygulaması.

## Proje Katılımcıları
<a href="https://github.com/numankhy28">
  <img src="https://avatars.githubusercontent.com/u/219421415?v=4" width="128" height="128" alt="numankhy28 GitHub Profile" />
</a>
<a href="https://github.com/Furkanaydn44">
  <img src="https://avatars.githubusercontent.com/u/174454978?v=4" width="128" height="128" alt="Furkanaydn44 GitHub Profile" />
</a>

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

---

> **Not:** `.env` dosyaları repoya dahil değildir. Kurulum için `.env.example` dosyalarını kullanın.

---

<br>

# 🗺️ Kocaeli News Map System

A full-stack web application that automatically scrapes local news websites in Kocaeli, detects the locations mentioned in the news articles, and visualizes them on an interactive map.

## 📋 Features

- 🔍 **Automated Web Scraping** — Fetches news from 5 different Kocaeli news sources
- 📍 **Location Detection** — Automatically extracts locations from news article text
- 🗺️ **Interactive Map** — Displays news pins on Google Maps
- 🤖 **NLP / Classification** — Categorizes news by type (fire, accident, etc.)
- 🔁 **Similarity Analysis** — Detects duplicate or similar news articles

## 🛠️ Tech Stack

| Layer      | Technology                               |
|------------|------------------------------------------|
| Frontend   | React 19, Vite, Google Maps API          |
| Backend    | Node.js, Express.js                      |
| Database   | MongoDB Atlas (Mongoose)                 |
| Scraping   | Cheerio, Axios                           |
| NLP        | @xenova/transformers                     |

## 📁 Project Structure

```
230202101_230202071/
├── backend/
│   ├── config/         # Database connection
│   ├── models/         # MongoDB models (News, GeoCache)
│   ├── routes/         # API routes
│   ├── scrapers/       # Scrapers for each news website
│   ├── services/       # Business logic services
│   └── server.js       # Entry point
└── frontend/
    ├── src/
    │   ├── components/ # Header, Map, Sidebar components
    │   ├── services/   # API client
    │   └── App.jsx
    └── index.html
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account
- Google Maps API key

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in the .env file with your credentials
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Add your Google Maps API key to the .env file
npm run dev
```

## ⚙️ Environment Variables

### backend/.env

| Variable              | Description                              |
|-----------------------|------------------------------------------|
| `MONGODB_URI`         | MongoDB Atlas connection string          |
| `GOOGLE_MAPS_API_KEY` | Google Maps Geocoding API key            |
| `PORT`                | Server port (default: 5000)              |

### frontend/.env

| Variable                   | Description                      |
|----------------------------|----------------------------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key   |

## 📡 API Endpoints

| Method | Endpoint            | Description                        |
|--------|---------------------|------------------------------------|
| GET    | `/api/health`       | Server health check                |
| GET    | `/api/news`         | List all news articles             |
| GET    | `/api/news/stats`   | Get statistics                     |
| POST   | `/api/news/scrape`  | Trigger a new scraping operation   |

## 🌐 Supported News Sources

- Yeni Kocaeli
- Çağdaş Kocaeli
- Ses Kocaeli
- Özgür Kocaeli
- Bizim Yaka
  
---

> **Note:** `.env` files are not included in the repository. Use the `.env.example` files as a template for setup.
