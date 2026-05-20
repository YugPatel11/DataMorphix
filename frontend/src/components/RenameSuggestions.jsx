import React, { useEffect, useState } from 'react';
import { Wand2, ArrowRight, CheckCircle2 } from 'lucide-react';
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
        <span>Generating AI Naming Suggestions…</span>
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

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div style={{
          width: 80, height: 80, borderRadius: 'var(--radius-xl)', 
          background: 'rgba(190, 242, 100, 0.1)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          border: '1px solid rgba(190, 242, 100, 0.15)'
        }}>
          <Wand2 size={32} color="var(--accent)" />
        </div>
        <h3>No Suggestions</h3>
        <p>Your column names already follow optimal naming conventions.</p>
      </div>
    );
  }

  const changed = suggestions.filter((s) => s.column !== s.suggested_name);
  const unchanged = suggestions.filter((s) => s.column === s.suggested_name);

  return (
    <div className="animate-in">
      <div className="card-title" style={{ marginBottom: 24 }}>
        <Wand2 size={18} className="icon" />
        AI Standardization Suggestions
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>{changed.length}</span>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: 'var(--text-muted)' }}>To Improve</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'rgba(34, 197, 94, 0.08)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)' }}>{unchanged.length}</span>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: 'var(--text-muted)' }}>Optimal</span>
        </div>
      </div>

      <div className="data-table-wrapper" style={{ borderRadius: 'var(--radius-2xl)', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>SEQ</th>
              <th>ORIGINAL NAME</th>
              <th style={{ width: 40 }}></th>
              <th>SUGGESTED NAME</th>
              <th>REASON / TYPE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s, idx) => {
              const isChanged = s.column !== s.suggested_name;
              return (
                <tr key={idx}>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>{(idx + 1).toString().padStart(3, '0')}</td>
                  <td>
                    <span className={isChanged ? 'rename-old' : 'col-name'} style={!isChanged ? { fontWeight: 500 } : {}}>
                      {s.column}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isChanged && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                      <ArrowRight size={14} color="var(--accent-indigo)" />
                    </div>}
                  </td>
                  <td>
                    {isChanged ? (
                      <div className="rename-new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={12} color="var(--accent-green)" />
                        {s.suggested_name}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s.suggested_name}</span>
                    )}
                  </td>
                  <td><span className="col-type">{s.data_type}</span></td>
                  <td>
                    {isChanged ? (
                      <span className="severity-badge medium" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-indigo)' }}>
                        NEEDS UPDATE
                      </span>
                    ) : (
                      <span className="severity-badge low" style={{ background: 'transparent', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} /> OPTIMAL
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
