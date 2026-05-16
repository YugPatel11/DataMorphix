import React, { useEffect, useState } from 'react';
import { Wand2, ArrowRight } from 'lucide-react';
import { getRenameSuggestions } from '../api';

export default function RenameSuggestions({ dataset }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!dataset) return;
    setLoading(true);
    setError(null);
    getRenameSuggestions(dataset.id)
      .then((data) => setSuggestions(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [dataset?.id]);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner lg"></div>
        <span>Loading rename suggestions…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div className="empty-icon">✨</div>
        <h3>No Suggestions</h3>
        <p>No rename suggestions available for this dataset.</p>
      </div>
    );
  }

  const changed = suggestions.filter((s) => s.column !== s.suggested_name);
  const unchanged = suggestions.filter((s) => s.column === s.suggested_name);

  return (
    <div className="animate-in">
      <div className="card-title" style={{ marginBottom: 8 }}>
        <Wand2 size={18} className="icon" />
        AI Column Rename Suggestions
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20, marginTop: 0 }}>
        {changed.length} column{changed.length !== 1 ? 's' : ''} can be improved,{' '}
        {unchanged.length} already follow best practices.
      </p>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Current Name</th>
              <th></th>
              <th>Suggested Name</th>
              <th>Data Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s, idx) => {
              const isChanged = s.column !== s.suggested_name;
              return (
                <tr key={idx}>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>{idx + 1}</td>
                  <td>
                    <span className={isChanged ? 'rename-old' : 'col-name'}>{s.column}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isChanged && <ArrowRight size={14} color="var(--accent-indigo)" />}
                  </td>
                  <td>
                    <span className={isChanged ? 'rename-new' : ''} style={!isChanged ? { color: 'var(--text-muted)' } : {}}>
                      {s.suggested_name}
                    </span>
                  </td>
                  <td><span className="col-type">{s.data_type}</span></td>
                  <td>
                    {isChanged ? (
                      <span className="severity-badge medium" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-indigo)' }}>
                        Rename
                      </span>
                    ) : (
                      <span className="severity-badge low" style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'var(--accent-green)' }}>
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
