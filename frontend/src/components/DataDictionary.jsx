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
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="header-search" style={{ width: 320 }}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Filter columns…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {filtered.length} of {columns.length} columns
        </span>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}></th>
              <th>#</th>
              <th>Column Name</th>
              <th>Data Type</th>
              <th>Nulls</th>
              <th>Unique</th>
              <th>AI Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((col, idx) => (
              <React.Fragment key={col.id}>
                <tr 
                  onClick={() => setExpandedCol(expandedCol === col.id ? null : col.id)} 
                  style={{ cursor: 'pointer', background: expandedCol === col.id ? 'var(--bg-hover)' : '' }}
                >
                  <td style={{ color: 'var(--text-muted)' }}>
                    {expandedCol === col.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>{idx + 1}</td>
                  <td><span className="col-name">{col.name}</span></td>
                  <td><span className="col-type">{col.data_type}</span></td>
                  <td>
                    <span style={{ color: col.null_count > 0 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                      {col.null_count}
                    </span>
                  </td>
                  <td>{col.unique_count}</td>
                  <td className="col-desc">{col.ai_description || '—'}</td>
                </tr>
                {expandedCol === col.id && (
                  <tr style={{ background: 'var(--bg-card)' }}>
                    <td colSpan={7} style={{ padding: '20px 40px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: 40 }}>
                        {/* Sample Values */}
                        <div style={{ flex: 1 }}>
                           <strong style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                             <BarChart2 size={14} /> Column Insights
                           </strong>
                           
                           <div style={{ marginBottom: 16 }}>
                             <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>SAMPLE VALUES</span>
                             <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-primary)', background: 'var(--bg-input)', padding: '6px 10px', borderRadius: 6 }}>
                               {(col.sample_values || []).join(', ') || '—'}
                             </div>
                           </div>

                           {/* Numeric Stats */}
                           {col.advanced_stats?.mean !== undefined && (
                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                               <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 8 }}>
                                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Min</div>
                                 <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{col.advanced_stats.min?.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                               </div>
                               <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 8 }}>
                                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max</div>
                                 <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{col.advanced_stats.max?.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                               </div>
                               <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 8 }}>
                                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mean</div>
                                 <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{col.advanced_stats.mean?.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                               </div>
                               <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 8 }}>
                                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Median</div>
                                 <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{col.advanced_stats.median?.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                               </div>
                             </div>
                           )}
                        </div>

                        {/* Top Values / Distribution */}
                        {col.advanced_stats?.top_values && (
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Top Frequent Values</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {Object.entries(col.advanced_stats.top_values).map(([val, count]) => {
                                const percentage = Math.min((count / (dataset.row_count || 1)) * 100, 100);
                                return (
                                  <div key={val} style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                                    <div style={{ width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val || '(empty)'}</div>
                                    <div style={{ flex: 1, height: 6, background: 'var(--border-color)', borderRadius: 3, margin: '0 12px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', background: 'var(--accent-indigo)', width: `${percentage}%`, borderRadius: 3 }} />
                                    </div>
                                    <div style={{ width: 50, textAlign: 'right', color: 'var(--text-muted)' }}>{count.toLocaleString()}</div>
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
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                  No columns match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
