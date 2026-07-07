import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import MapView from './components/Map/MapView';
import { fetchNews, fetchStats, fetchDistricts, CATEGORIES } from './services/api';
import './App.css';



function App() {
  const [news, setNews] = useState([]);
  const [allNews, setAllNews] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    district: '',
    startDate: '',
    endDate: '',
    activeCategories: null
  });
  const [selectedNews, setSelectedNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [districts, setDistricts] = useState([]);

  // İlk yükleme
  useEffect(() => {
    loadData();
  }, []);

  // Filtre değiştiğinde
  useEffect(() => {
    applyFilters();
  }, [filters, allNews]);

  const loadData = async () => {
    setLoading(true);
    await fetchData();
    setTimeout(() => setLoading(false), 800);
  };

  const loadDataSilent = async () => {
    await fetchData();
  };

  const fetchData = async () => {
    try {
      const [newsData, statsData, districtsData] = await Promise.all([
        fetchNews({ hasLocation: 'true' }),
        fetchStats(),
        fetchDistricts()
      ]);

      if (newsData.success) {
        setAllNews(newsData.data);
        setNews(newsData.data);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
      if (districtsData.success) {
        setDistricts(districtsData.data);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      showToast('Veriler yüklenirken hata oluştu', 'error');
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allNews];

    // Kategori filtresi
    if (filters.activeCategories) {
      filtered = filtered.filter(n => filters.activeCategories.includes(n.category));
    } else if (filters.category) {
      filtered = filtered.filter(n => n.category === filters.category);
    }

    // İlçe filtresi
    if (filters.district) {
      filtered = filtered.filter(n =>
        n.district && n.district.toLowerCase().includes(filters.district.toLowerCase())
      );
    }

    // Tarih filtresi
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filtered = filtered.filter(n => new Date(n.publishDate) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(n => new Date(n.publishDate) <= end);
    }

    setNews(filtered);
  }, [filters, allNews]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleNewsClick = (item) => {
    setSelectedNews(item);
  };

  const handleMarkerClick = (item) => {
    setSelectedNews(item);
  };

  const handleScrapeComplete = () => {
    showToast('Haber çekme işlemi tamamlandı!', 'success');
    loadData();
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-logo">🗺️</div>
        <div className="loading-text">Kocaeli Haber Haritası Yükleniyor...</div>
        <div className="loading-bar">
          <div className="loading-bar-inner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        stats={stats}
        onScrapeComplete={handleScrapeComplete}
        onRefresh={loadDataSilent}
      />
      <div className="app-body">
        <Sidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          news={news}
          onNewsClick={handleNewsClick}
          stats={stats}
        />
        <MapView
          news={news}
          selectedNews={selectedNews}
          onMarkerClick={handleMarkerClick}
          filters={filters}
          onFilterChange={handleFilterChange}
          districts={districts}
          stats={stats}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && '✅'}
          {toast.type === 'error' && '❌'}
          {toast.type === 'info' && 'ℹ️'}
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
