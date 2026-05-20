import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, BarChart2 } from 'lucide-react';

export default function DataDictionary({ dataset }) {
  const [filter, setFilter] = useState('');
  const [expandedCol, setExpandedCol] = useState(null);
  const columns = dataset?.columns || [];

  const filtered = columns.filter(
    (col) =>
      col.name.toLowerCase().includes(filter.toLowerCase()) ||
      col.data_type.toLowerCase().includes(filter.toLowerCase()) ||
      (col.ai_description || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="animate-in">
      {/* Search filter */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="header-search" style={{ width: 340 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Filter dictionary by keyword…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
          {filtered.length} / {columns.length} Fields
        </span>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40, padding: '16px' }}></th>
              <th style={{ width: 50 }}>SEQ</th>
              <th>FIELD NAME</th>
              <th>DATA TYPE</th>
              <th>NULLS</th>
              <th>UNIQUE</th>
              <th>AI DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((col, idx) => (
              <React.Fragment key={col.id}>
                <tr 
                  onClick={() => setExpandedCol(expandedCol === col.id ? null : col.id)} 
                  style={{ cursor: 'pointer', background: expandedCol === col.id ? 'var(--bg-card-hover)' : '' }}
                >
                  <td style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '14px' }}>
                    {expandedCol === col.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>{(idx + 1).toString().padStart(3, '0')}</td>
                  <td><span className="col-name">{col.name}</span></td>
                  <td><span className="col-type">{col.data_type}</span></td>
                  <td>
                    <span style={{ 
                      color: col.null_count > 0 ? 'var(--accent-amber)' : 'var(--accent-green)',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {col.null_count.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{col.unique_count.toLocaleString()}</td>
                  <td className="col-desc">{col.ai_description || '—'}</td>
                </tr>
                {expandedCol === col.id && (
                  <tr style={{ background: 'var(--bg-input)' }}>
                    <td colSpan={7} style={{ padding: '24px 40px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: 48 }}>
                        {/* Sample Values */}
                        <div style={{ flex: 1 }}>
                           <strong style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                             <BarChart2 size={14} color="var(--accent-indigo)" /> Field Statistics
                           </strong>
                           
                           <div style={{ marginBottom: 20 }}>
                             <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>SAMPLE VALUES</span>
                             <div style={{ 
                               fontSize: '0.82rem', 
                               fontFamily: 'var(--font-mono)', 
                               color: 'var(--text-primary)', 
                               background: 'var(--bg-card)', 
                               border: '1px solid var(--border-color)',
                               padding: '12px 16px', 
                               borderRadius: 'var(--radius-lg)' 
                             }}>
                               {(col.sample_values || []).join(', ') || '—'}
                             </div>
                           </div>

                           {/* Numeric Stats */}
                           {col.advanced_stats?.mean !== undefined && (
                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                               <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                                 <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: 4 }}>Minimum</div>
                                 <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{col.advanced_stats.min?.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                               </div>
                               <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                                 <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: 4 }}>Maximum</div>
                                 <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{col.advanced_stats.max?.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                               </div>
                               <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                                 <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: 4 }}>Mean</div>
                                 <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{col.advanced_stats.mean?.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                               </div>
                               <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                                 <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: 4 }}>Median</div>
                                 <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{col.advanced_stats.median?.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                               </div>
                             </div>
                           )}
                        </div>

                        {/* Top Values / Distribution */}
                        {col.advanced_stats?.top_values && (
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>TOP FREQUENT VALUES</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)' }}>
                              {Object.entries(col.advanced_stats.top_values).map(([val, count]) => {
                                const percentage = Math.min((count / (dataset.row_count || 1)) * 100, 100);
                                return (
                                  <div key={val} style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                                    <div style={{ width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontWeight: 600 }} title={val}>{val || '(empty)'}</div>
                                    <div style={{ flex: 1, height: 8, background: 'var(--bg-input)', borderRadius: 4, margin: '0 16px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', background: 'var(--accent-indigo)', width: `${percentage}%`, borderRadius: 4 }} />
                                    </div>
                                    <div style={{ width: 60, textAlign: 'right', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{count.toLocaleString()}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  No fields match your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
