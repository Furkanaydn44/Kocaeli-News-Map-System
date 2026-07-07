import { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { CATEGORIES } from '../../services/api';
import './MapView.css';

// Persona 5 custom pin imports
import crashPin from '../../assets/map/pins/crash_pin.png';
import firePin from '../../assets/map/pins/fire_pin.png';
import outagePin from '../../assets/map/pins/outage_pin.png';
import theftPin from '../../assets/map/pins/theft_pin.png';
import eventPin from '../../assets/map/pins/event_pin.png';
import otherPin from '../../assets/map/pins/other_pin.png';
import filterBackground from '../../assets/map/filter_bar/filter_background.png';
import textboxBg from '../../assets/map/textbox.png';
import zoomInImg from '../../assets/map/zoom/zoomin.png';
import zoomOutImg from '../../assets/map/zoom/zoomout.png';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const KOCAELI_CENTER = { lat: 40.7654, lng: 29.9408 };

// Pin mapping by category
const PIN_IMAGES = {
  trafik_kazasi: crashPin,
  yangin: firePin,
  elektrik_kesintisi: outagePin,
  hirsizlik: theftPin,
  kulturel_etkinlik: eventPin,
  diger: otherPin,
};

// Persona 5 dark map style — deep blacks, dark reds, muted tones
const DARK_MAP_STYLE = [
  // Base geometry — dark background
  { elementType: 'geometry', stylers: [{ color: '#0d0d1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d0d1a' }, { weight: 2.5 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a9e' }] },
  // POI — show labels but dim icons
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'on' }, { saturation: -80 }, { lightness: -40 }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7a7a90' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#12122a' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0f1a0f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4a7a4a' }],
  },
  // Administrative — visible labels
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#2a2a3e' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#4a2030' }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bb6070' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e0e0ee' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#a0a0b8' }],
  },
  // Roads — visible with labels
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0d0d1a' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a9e' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'on' }, { saturation: -80 }, { lightness: -30 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2a1015' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#3a1520' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#c07080' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#1e1e30' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a9e' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#151525' }],
  },
  // Transit
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#151525' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a6a7a' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#060610' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1a2a4a' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{ color: '#0f0f1e' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#0d0d1a' }],
  },
];

/* ── Legacy Marker component using google.maps.Marker ─ */
function LegacyMarker({ position, icon, onClick, badgeCount }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const marker = new google.maps.Marker({
      position,
      map,
      icon: {
        url: icon,
        scaledSize: new google.maps.Size(48, 48),
        anchor: new google.maps.Point(24, 48),
      },
      optimized: false,
    });

    if (onClick) {
      marker.addListener('click', onClick);
    }

    markerRef.current = marker;

    return () => {
      marker.setMap(null);
      markerRef.current = null;
    };
  }, [map, position, icon, onClick]);

  // Badge overlay for grouped markers
  useEffect(() => {
    if (!map || !markerRef.current || !badgeCount || badgeCount <= 1) return;

    const overlay = new google.maps.OverlayView();
    overlay.onAdd = function () {
      const div = document.createElement('div');
      div.className = 'persona5-pin-badge-overlay';
      div.textContent = badgeCount;
      this.div = div;
      this.getPanes().overlayMouseTarget.appendChild(div);
    };
    overlay.draw = function () {
      const projection = this.getProjection();
      if (!projection) return;
      const pos = projection.fromLatLngToDivPixel(
        new google.maps.LatLng(position.lat, position.lng)
      );
      if (pos && this.div) {
        this.div.style.left = (pos.x + 10) + 'px';
        this.div.style.top = (pos.y - 54) + 'px';
        this.div.style.position = 'absolute';
      }
    };
    overlay.onRemove = function () {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
    };
    overlay.setMap(map);

    return () => {
      overlay.setMap(null);
    };
  }, [map, position, badgeCount]);

  return null;
}

/* ── FlyTo helper ─────────────────────────────────── */
function FlyToNews({ selectedNews }) {
  const map = useMap();

  useEffect(() => {
    if (map && selectedNews && selectedNews.latitude && selectedNews.longitude) {
      map.panTo({ lat: selectedNews.latitude, lng: selectedNews.longitude });
      setTimeout(() => {
        if (map) map.setZoom(15);
      }, 300);
    }
  }, [selectedNews, map]);

  return null;
}

/* ── Custom Zoom Buttons ──────────────────────────── */
function CustomZoomControls() {
  const map = useMap();

  const handleZoomIn = () => {
    if (map) map.setZoom((map.getZoom() || 11) + 1);
  };

  const handleZoomOut = () => {
    if (map) map.setZoom((map.getZoom() || 11) - 1);
  };

  return (
    <div className="custom-zoom-controls">
      <button className="custom-zoom-btn zoom-in-btn" onClick={handleZoomIn}>
        <img src={zoomInImg} alt="Zoom In" />
      </button>
      <button className="custom-zoom-btn zoom-out-btn" onClick={handleZoomOut}>
        <img src={zoomOutImg} alt="Zoom Out" />
      </button>
    </div>
  );
}

/* ── Info Window (Persona 5 textbox popup) ────────── */
function PersonaInfoWindow({ items, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const item = items[currentIndex];
  if (!item) return null;

  const cat = CATEGORIES[item.category];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="persona-info-overlay" onClick={onClose}>
      <div
        className="persona-info-window"
        style={{ backgroundImage: `url(${textboxBg})` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="persona-info-close" onClick={onClose}>×</button>

        <div className="info-window">
          {items.length > 1 && (
            <div className="info-window-multi-notice">
              Bu konumda {items.length} farklı haber var.
            </div>
          )}
          <div className="info-window-header">
            <div
              className="info-window-category"
              style={{
                backgroundColor: `var(--cat-${item.category.split('_')[0]})`,
                color: '#fff',
              }}
            >
              {cat?.label}
            </div>
            <h3 className="info-window-title">{item.title}</h3>
          </div>
          <div className="info-window-body">
            <div className="info-window-meta">
              <div className="info-window-meta-item">
                {formatDate(item.publishDate)}
              </div>
              {item.locationText && (
                <div className="info-window-meta-item">
                  {item.locationText}
                </div>
              )}
              <div className="info-window-sources">
                {item.sources?.map((src, i) => (
                  <span key={i} className="info-window-source-tag">
                    {src.siteName}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div
            className="info-window-footer"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
              {item.sources?.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="info-window-btn"
                >
                  Habere Git
                </a>
              ))}
            </div>

            {items.length > 1 && (
              <div className="info-window-pagination">
                <button onClick={handlePrev}>&lt;</button>
                <span>
                  {currentIndex + 1} / {items.length}
                </span>
                <button onClick={handleNext}>&gt;</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main MapView component ───────────────────────── */
export default function MapView({
  news,
  selectedNews,
  onMarkerClick,
  filters,
  onFilterChange,
  districts,
  stats,
}) {
  const [activeGroup, setActiveGroup] = useState(null);

  const mappableNews = news.filter((n) => n.latitude && n.longitude);

  // Group news by location
  const groupedNews = {};
  mappableNews.forEach((item) => {
    const key = `${item.latitude},${item.longitude}`;
    if (!groupedNews[key]) {
      groupedNews[key] = [];
    }
    groupedNews[key].push(item);
  });

  const newsGroups = Object.values(groupedNews);

  const handleMarkerClick = useCallback(
    (group) => {
      setActiveGroup(group);
      if (onMarkerClick && group[0]) {
        onMarkerClick(group[0]);
      }
    },
    [onMarkerClick]
  );

  const handleCloseInfo = useCallback(() => {
    setActiveGroup(null);
  }, []);

  return (
    <div className="map-container" id="map-container">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={KOCAELI_CENTER}
          defaultZoom={11}
          minZoom={9}
          maxZoom={18}
          disableDefaultUI={true}
          gestureHandling="greedy"
          styles={DARK_MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <FlyToNews selectedNews={selectedNews} />
          <CustomZoomControls />

          {newsGroups.map((group, index) => {
            const item = group[0];
            const pinImg = PIN_IMAGES[item.category] || PIN_IMAGES.diger;

            return (
              <LegacyMarker
                key={`${item.latitude}-${item.longitude}-${index}`}
                position={{ lat: item.latitude, lng: item.longitude }}
                icon={pinImg}
                onClick={() => handleMarkerClick(group)}
                badgeCount={group.length}
              />
            );
          })}
        </Map>
      </APIProvider>

      {/* Persona 5 Info Window (custom overlay) */}
      {activeGroup && (
        <PersonaInfoWindow items={activeGroup} onClose={handleCloseInfo} />
      )}

      {/* Floating Bottom Bar */}
      <div
        className="map-bottom-bar"
        style={{ backgroundImage: `url(${filterBackground})` }}
      >
        <div className="map-bottom-section">
          <label className="map-bottom-label">İLÇE SEÇİMİ</label>
          <div className="map-bottom-value">
            <select
              className="map-bottom-select"
              value={filters?.district || ''}
              onChange={(e) =>
                onFilterChange({ ...filters, district: e.target.value })
              }
            >
              <option value="">Tüm İlçeler</option>
              {districts?.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="map-bottom-divider"></div>

        <div className="map-bottom-section">
          <label className="map-bottom-label">TARİH ARALIĞI</label>
          <div className="map-bottom-date-group">
            <input
              type="date"
              className="map-bottom-date"
              value={filters?.startDate || ''}
              onChange={(e) =>
                onFilterChange({ ...filters, startDate: e.target.value })
              }
            />
            <span className="map-bottom-date-separator">/</span>
            <input
              type="date"
              className="map-bottom-date"
              value={filters?.endDate || ''}
              onChange={(e) =>
                onFilterChange({ ...filters, endDate: e.target.value })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
