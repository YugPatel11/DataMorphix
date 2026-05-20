import React, { useState, useCallback } from 'react';
import { Search, Database, ArrowRight, Zap } from 'lucide-react';
import { searchDatasets } from '../api';

export default function SearchPage({ onSelectDataset, datasets }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchDatasets(q);
      setResults(data);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleResultClick = (result) => {
    const ds = datasets.find((d) => d.id === result.dataset_id);
    if (ds && onSelectDataset) {
      onSelectDataset(ds);
    }
  };

  return (
    <div className="search-page animate-in">
      <div className="search-hero">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-card)' }}>
            <Zap size={28} color="var(--accent-indigo)" />
          </div>
        </div>
        <h2>Universal Explorer</h2>
        <p>Search across all connected databases, files, and schemas.</p>
      </div>

      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="e.g., 'email', 'revenue', 'customer_id'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button className="search-btn" onClick={handleSearch} disabled={loading || !query.trim()}>
          <Search size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          SEARCH NETWORK
        </button>
      </div>

      {loading && (
        <div className="loading-center">
          <div className="spinner lg"></div>
          <span>Querying Indices…</span>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Zero Matches</h3>
          <p>No attributes matching "{query}" were found across your data sources.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
            {results.length} RESULT{results.length !== 1 ? 'S' : ''} FOUND
          </div>
          <div className="search-results">
            {results.map((r, idx) => (
              <div
                className="search-result-item glow-hover"
                key={idx}
                onClick={() => handleResultClick(r)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ flex: 1 }}>
                  <div className="sr-top">
                    <span className="sr-col">{r.column_name}</span>
                    <span className="col-type">{r.data_type}</span>
                    <span className="sr-dataset" style={{ background: 'var(--bg-input)' }}>
                      <Database size={10} style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--text-muted)' }} />
                      {r.dataset_name}
                    </span>
                  </div>
                  {r.ai_description && (
                    <div className="sr-desc" style={{ fontFamily: 'var(--font-main)' }}>{r.ai_description}</div>
                  )}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <ArrowRight size={18} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
