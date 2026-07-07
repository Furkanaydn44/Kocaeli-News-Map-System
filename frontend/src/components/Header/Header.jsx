import { useState } from 'react';
import { startScraping, fetchDistricts, CATEGORIES } from '../../services/api';
import './Header.css';

export default function Header({ stats, onScrapeComplete, filters, onFilterChange, districts, onRefresh }) {
  const [isScraping, setIsScraping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleScrape = async () => {
    if (isScraping) return;
    setIsScraping(true);
    try {
      await startScraping();
      const pollInterval = setInterval(async () => {
        try {
          let isDone = false;
          try {
            const res = await fetch('/api/news/scrape/status');
            const data = await res.json();
            isDone = !data.isScraping;
          } catch {
            // Keep polling
          }

          // Scraping devam ederken verileri sessizce yenile (harita kaybolmasın)
          if (onRefresh) onRefresh();

          if (isDone) {
            clearInterval(pollInterval);
            setIsScraping(false);
            if (onScrapeComplete) onScrapeComplete();
          }
        } catch (err) {
          // Keep polling
        }
      }, 5000);
    } catch (error) {
      console.error('Scraping hatası:', error);
      setIsScraping(false);
    }
  };

  return (
    <header className="header" id="main-header">
      <div className="header-left">
        <h1 className="header-title"> </h1>

        {/* Stats */}
        <div className="header-stats">
          <div className="header-stat">
            <span className="header-stat-label">TOPLAM HABER</span>
            <span className="header-stat-value primary">{stats?.totalNews || 0}</span>
          </div>
          <div className="header-stat-divider" />
          <div className="header-stat">
            <span className="header-stat-label">HARİTADA</span>
            <span className="header-stat-value tertiary">{stats?.withLocation || 0}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="header-search-container">
        <span className="header-search-icon">🔍</span>
        <input
          type="text"
          className="header-search"
          placeholder="İlçe, sokak veya haber ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="header-right">
        <button
          id="scrape-button"
          className="header-scrape-btn"
          onClick={handleScrape}
          disabled={isScraping}
        >
          {isScraping ? (
            <>
              <div className="spinner" />
              Çekiliyor...
            </>
          ) : (
            'Haberleri Çek'
          )}
        </button>
      </div>
    </header>
  );
}
