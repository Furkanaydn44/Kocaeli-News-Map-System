/**
 * Geocoding Servisi
 * Konum metinlerini koordinata dönüştürür.
 * 
 * Strateji:
 *  1. Önce Google Maps Geocoding API denenir
 *  2. Google API aktif değilse veya başarısızsa, OpenStreetMap Nominatim'e fallback yapılır
 *  3. Cache-first strateji uygulanır (aynı konum için tekrar API çağrısı yapılmaz)
 */

const axios = require('axios');
const GeoCache = require('../models/GeoCache');

// API endpoints
const GOOGLE_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Kocaeli bounding box
const KOCAELI_BOUNDS = {
  southwest: { lat: 40.5, lng: 29.2 },
  northeast: { lat: 41.0, lng: 30.3 }
};

// Nominatim rate limiting: son istek zamanı
let lastNominatimRequest = 0;

/**
 * Google Maps Geocoding API ile dene
 */
async function tryGoogleGeocode(locationText) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.get(GOOGLE_GEOCODING_URL, {
      params: {
        address: locationText,
        key: apiKey,
        region: 'tr',
        bounds: `${KOCAELI_BOUNDS.southwest.lat},${KOCAELI_BOUNDS.southwest.lng}|${KOCAELI_BOUNDS.northeast.lat},${KOCAELI_BOUNDS.northeast.lng}`
      },
      timeout: 10000
    });

    if (response.data && response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address
      };
    }

    // API aktif değil veya kota doldu - sessizce null dön
    if (response.data?.status === 'REQUEST_DENIED' || response.data?.status === 'OVER_QUERY_LIMIT') {
      return null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * OpenStreetMap Nominatim ile dene (fallback)
 */
async function tryNominatimGeocode(locationText) {
  try {
    // Rate limiting: Nominatim saniyede max 1 istek
    const now = Date.now();
    const elapsed = now - lastNominatimRequest;
    if (elapsed < 1100) {
      await new Promise(resolve => setTimeout(resolve, 1100 - elapsed));
    }
    lastNominatimRequest = Date.now();

    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: locationText,
        format: 'json',
        limit: 1,
        countrycodes: 'tr',
        viewbox: `${KOCAELI_BOUNDS.southwest.lng},${KOCAELI_BOUNDS.southwest.lat},${KOCAELI_BOUNDS.northeast.lng},${KOCAELI_BOUNDS.northeast.lat}`,
        bounded: 1
      },
      timeout: 10000,
      headers: { 'User-Agent': 'KocaeliNewsMap/1.0' }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formattedAddress: result.display_name
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Konum metnini koordinata dönüştür (cache + Google + Nominatim fallback)
 */
async function geocode(locationText) {
  if (!locationText || locationText.trim().length === 0) {
    return null;
  }

  try {
    // 1. Cache kontrol
    const cached = await GeoCache.findOne({ locationText: locationText.trim() });
    if (cached) {
      console.log(`📍 Cache hit: ${locationText}`);
      return {
        lat: cached.latitude,
        lng: cached.longitude,
        formattedAddress: cached.formattedAddress
      };
    }

    console.log(`🌍 Geocoding çağrısı: ${locationText}`);

    // 2. Önce Google Maps dene
    let result = await tryGoogleGeocode(locationText);
    
    // 3. Google başarısızsa Nominatim'e fallback
    if (!result) {
      result = await tryNominatimGeocode(locationText);
    }

    if (result) {
      // Cache'e kaydet
      await GeoCache.findOneAndUpdate(
        { locationText: locationText.trim() },
        {
          locationText: locationText.trim(),
          latitude: result.lat,
          longitude: result.lng,
          formattedAddress: result.formattedAddress
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Geocoded: ${locationText} → ${result.formattedAddress.substring(0, 50)}... (${result.lat}, ${result.lng})`);
      return result;
    }

    console.warn(`⚠️ Geocoding sonuç bulunamadı: ${locationText}`);
    return null;

  } catch (error) {
    console.error(`❌ Geocoding hatası: ${locationText}`, error.message);
    return null;
  }
}

/**
 * Birden fazla konumu toplu geocode et
 */
async function batchGeocode(locations) {
  const results = [];
  for (const loc of locations) {
    const result = await geocode(loc);
    results.push({ location: loc, result });
  }
  return results;
}

module.exports = {
  geocode,
  batchGeocode
};
