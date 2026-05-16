import React, { useState, useEffect, useCallback } from 'react';
import { Search, Database } from 'lucide-react';
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
        <h2>Search Across All Datasets</h2>
        <p>Find columns, descriptions, and data types by keyword across every uploaded dataset.</p>
      </div>

      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search for columns… e.g. salary, customer, email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="search-btn" onClick={handleSearch} disabled={loading || !query.trim()}>
          <Search size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Search
        </button>
      </div>

      {loading && (
        <div className="loading-center">
          <div className="spinner lg"></div>
          <span>Searching…</span>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try a different keyword or upload more datasets.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Found <strong style={{ color: 'var(--text-primary)' }}>{results.length}</strong> matching column{results.length !== 1 ? 's' : ''}
          </div>
          <div className="search-results">
            {results.map((r, idx) => (
              <div
                className="search-result-item"
                key={idx}
                onClick={() => handleResultClick(r)}
              >
                <div className="sr-top">
                  <span className="sr-col">{r.column_name}</span>
                  <span className="col-type">{r.data_type}</span>
                  <span className="sr-dataset">
                    <Database size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                    {r.dataset_name}
                  </span>
                </div>
                {r.ai_description && (
                  <div className="sr-desc">{r.ai_description}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
