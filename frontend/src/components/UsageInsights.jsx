import React, { useEffect, useState } from 'react';
import { BarChart3, Fingerprint, Type, Info } from 'lucide-react';
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
        <span>Computing Profile Matrix…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Analysis Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div style={{
          width: 80, height: 80, borderRadius: 'var(--radius-xl)', 
          background: 'rgba(190, 242, 100, 0.1)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          border: '1px solid rgba(190, 242, 100, 0.15)'
        }}>
          <BarChart3 size={32} color="var(--accent)" />
        </div>
        <h3>No Usage Data</h3>
        <p>Upload a dataset to generate statistical profiling.</p>
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
      <div className="card-title" style={{ marginBottom: 24 }}>
        <BarChart3 size={18} className="icon" />
        Statistical Profiling Matrix
      </div>

      <div className="data-table-wrapper" style={{ borderRadius: 'var(--radius-2xl)', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>FIELD NAME</th>
              <th>TYPE</th>
              <th>NULL RATIO</th>
              <th>UNIQUE RATIO</th>
              <th>AI TAGS</th>
            </tr>
          </thead>
          <tbody>
            {insights.map((row, idx) => (
              <tr key={idx}>
                <td><span className="col-name">{row.column}</span></td>
                <td><span className="col-type">{row.data_type}</span></td>
                <td style={{ minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', width: 40 }}>{row.null_pct}%</span>
                    <div className="usage-bar-bg" style={{ flex: 1, height: 6 }}>
                      <div
                        className="usage-bar-fill"
                        style={{ width: `${Math.min(row.null_pct, 100)}%`, background: getBarColor(row.null_pct) }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td style={{ minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', width: 40 }}>{row.unique_pct}%</span>
                    <div className="usage-bar-bg" style={{ flex: 1, height: 6 }}>
                      <div
                        className="usage-bar-fill"
                        style={{ width: `${Math.min(row.unique_pct, 100)}%`, background: 'var(--accent-indigo)' }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {row.is_potential_id && <span className="badge-tag id"><Fingerprint size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> IDENTIFIER</span>}
                    {row.is_empty && <span className="badge-tag empty">EMPTY</span>}
                    {row.is_constant && <span className="badge-tag constant">CONSTANT</span>}
                    {!row.is_potential_id && !row.is_empty && !row.is_constant && (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem', fontWeight: 600 }}>NO TAGS</span>
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
