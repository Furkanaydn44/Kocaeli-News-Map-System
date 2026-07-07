import { useState, useEffect } from 'react';
import { CATEGORIES, fetchDistricts } from '../../services/api';
import './Sidebar.css';

import crashPin from '../../assets/map/pins/crash_pin.png';
import firePin from '../../assets/map/pins/fire_pin.png';
import outagePin from '../../assets/map/pins/outage_pin.png';
import theftPin from '../../assets/map/pins/theft_pin.png';
import eventPin from '../../assets/map/pins/event_pin.png';
import otherPin from '../../assets/map/pins/other_pin.png';

const PIN_ICONS = {
  trafik_kazasi: crashPin,
  yangin: firePin,
  elektrik_kesintisi: outagePin,
  hirsizlik: theftPin,
  kulturel_etkinlik: eventPin,
  diger: otherPin,
};
export default function Sidebar({ filters, onFilterChange, news, onNewsClick, stats }) {
  const [districts, setDistricts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    Object.keys(CATEGORIES).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  useEffect(() => {
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    try {
      const data = await fetchDistricts();
      if (data.success) setDistricts(data.data);
    } catch (error) {
      console.error('İlçe yükleme hatası:', error);
    }
  };

  const toggleCategory = (category) => {
    const updated = { ...selectedCategories, [category]: !selectedCategories[category] };
    setSelectedCategories(updated);

    const activeCategories = Object.entries(updated)
      .filter(([, checked]) => checked)
      .map(([key]) => key);

    onFilterChange({ ...filters, activeCategories });
  };

  const getCategoryCount = (category) => {
    if (!stats?.byCategory) return 0;
    const found = stats.byCategory.find(c => c._id === category);
    return found ? found.count : 0;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const categoryColorClass = {
    trafik_kazasi: 'cat-trafik',
    yangin: 'cat-yangin',
    elektrik_kesintisi: 'cat-elektrik',
    hirsizlik: 'cat-hirsizlik',
    kulturel_etkinlik: 'cat-kultur',
    diger: 'cat-diger'
  };

  return (
    <aside className="sidebar" id="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <h2 className="sidebar-brand-title">Kocaeli Haber</h2>
        <p className="sidebar-brand-sub"> </p>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <a href="#" className="sidebar-nav-item active">
          Canlı Hafta
        </a>
      </nav>

      {/* Categories */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">KATEGORİLER</div>
        <div className="category-list" id="category-filters">
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <label
              key={key}
              className={`category-item ${selectedCategories[key] ? 'active' : ''}`}
              id={`filter-${key}`}
            >
              <div className="category-item-left">
                <input
                  type="checkbox"
                  className={`category-checkbox ${categoryColorClass[key] || ''}`}
                  checked={selectedCategories[key]}
                  onChange={() => toggleCategory(key)}
                />
                <span className="category-label">{cat.label}</span>
              </div>
              <span className={`category-count ${categoryColorClass[key] || ''}`}>
                {getCategoryCount(key)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div className="sidebar-section sidebar-events">
        <div className="sidebar-section-label">SON HABERLER</div>
        <div className="sidebar-events-list">
          {news.slice(0, 8).map((item, index) => {
            const cat = CATEGORIES[item.category];
            return (
              <div
                key={item._id || index}
                className="sidebar-event-item"
                onClick={() => onNewsClick(item)}
              >
                <div className="sidebar-event-icon" style={{ background: 'transparent' }}>
                  <img src={PIN_ICONS[item.category] || otherPin} alt="pin" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div className="sidebar-event-content">
                  <p className="sidebar-event-title">{item.title}</p>
                  <span className="sidebar-event-meta">
                    {formatDate(item.publishDate)}{item.district ? ` • ${item.district}` : ''}
                  </span>
                </div>
              </div>
            );
          })}
          {news.length === 0 && (
            <div className="sidebar-empty">
              <span>📭</span>
              <p>Haber bulunamadı</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="sidebar-bottom">
        <button
          id="reset-filters"
          className="sidebar-reset-btn"
          onClick={() => {
            setSelectedCategories(
              Object.keys(CATEGORIES).reduce((acc, key) => ({ ...acc, [key]: true }), {})
            );
            onFilterChange({ ...filters, category: '', district: '', startDate: '', endDate: '', activeCategories: null });
          }}
        >
          Filtreleri Temizle
        </button>
      </div>
    </aside>
  );
}
