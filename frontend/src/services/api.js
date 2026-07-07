/**
 * Backend API Client
 */

import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000
});

/**
 * Haberleri getir
 */
export async function fetchNews(filters = {}) {
  const params = {};

  if (filters.category) params.category = filters.category;
  if (filters.district) params.district = filters.district;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.hasLocation !== undefined) params.hasLocation = filters.hasLocation;

  const response = await api.get('/news', { params });
  return response.data;
}

/**
 * Scraping başlat
 */
export async function startScraping() {
  const response = await api.post('/news/scrape');
  return response.data;
}

/**
 * Scraping durumu
 */
export async function getScrapingStatus() {
  const response = await api.get('/news/scrape/status');
  return response.data;
}

/**
 * İstatistikler
 */
export async function fetchStats() {
  const response = await api.get('/news/stats');
  return response.data;
}

/**
 * İlçe listesi
 */
export async function fetchDistricts() {
  const response = await api.get('/news/districts');
  return response.data;
}

// Kategori bilgileri
export const CATEGORIES = {
  trafik_kazasi: { label: 'Trafik Kazası', color: '#f59e0b', icon: '🚗' },
  yangin: { label: 'Yangın', color: '#ef4444', icon: '🔥' },
  elektrik_kesintisi: { label: 'Elektrik Kesintisi', color: '#eab308', icon: '⚡' },
  hirsizlik: { label: 'Hırsızlık', color: '#8b5cf6', icon: '🔒' },
  kulturel_etkinlik: { label: 'Kültürel Etkinlik', color: '#3b82f6', icon: '🎭' },
  diger: { label: 'Diğer', color: '#9ca3af', icon: '📌' }
};

export default api;
