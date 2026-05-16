import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { getUsageInsights } from '../api';

export default function UsageInsights({ dataset }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!dataset) return;
    setLoading(true);
    setError(null);
    getUsageInsights(dataset.id)
      .then((data) => setInsights(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [dataset?.id]);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner lg"></div>
        <span>Computing usage insights…</span>
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

  if (!insights || insights.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div className="empty-icon">📊</div>
        <h3>No Usage Data</h3>
        <p>Upload a dataset to view column usage insights.</p>
      </div>
    );
  }

  const getBarColor = (pct) => {
    if (pct > 50) return 'var(--accent-red)';
    if (pct > 20) return 'var(--accent-amber)';
    return 'var(--accent-green)';
  };

  return (
    <div className="animate-in">
      <div className="card-title" style={{ marginBottom: 8 }}>
        <BarChart3 size={18} className="icon" />
        Column Usage Insights
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20, marginTop: 0 }}>
        Detailed statistics for every column in this dataset.
      </p>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Column</th>
              <th>Type</th>
              <th>Nulls</th>
              <th>Null %</th>
              <th>Unique</th>
              <th>Unique %</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {insights.map((row, idx) => (
              <tr key={idx}>
                <td><span className="col-name">{row.column}</span></td>
                <td><span className="col-type">{row.data_type}</span></td>
                <td>{row.null_count}</td>
                <td>
                  <span style={{ fontSize: '0.78rem' }}>{row.null_pct}%</span>
                  <div className="usage-bar-bg">
                    <div
                      className="usage-bar-fill"
                      style={{ width: `${Math.min(row.null_pct, 100)}%`, background: getBarColor(row.null_pct) }}
                    ></div>
                  </div>
                </td>
                <td>{row.unique_count}</td>
                <td>
                  <span style={{ fontSize: '0.78rem' }}>{row.unique_pct}%</span>
                  <div className="usage-bar-bg">
                    <div
                      className="usage-bar-fill"
                      style={{ width: `${Math.min(row.unique_pct, 100)}%`, background: 'var(--accent-indigo)' }}
                    ></div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {row.is_potential_id && <span className="badge-tag id">ID</span>}
                    {row.is_empty && <span className="badge-tag empty">Empty</span>}
                    {row.is_constant && <span className="badge-tag constant">Constant</span>}
                    {!row.is_potential_id && !row.is_empty && !row.is_constant && (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
