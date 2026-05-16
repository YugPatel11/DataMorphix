import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function DataDictionary({ dataset }) {
  const [filter, setFilter] = useState('');
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
              <th>#</th>
              <th>Column Name</th>
              <th>Data Type</th>
              <th>Nulls</th>
              <th>Unique</th>
              <th>Sample Values</th>
              <th>AI Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((col, idx) => (
              <tr key={col.id}>
                <td style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>{idx + 1}</td>
                <td><span className="col-name">{col.name}</span></td>
                <td><span className="col-type">{col.data_type}</span></td>
                <td>
                  <span style={{ color: col.null_count > 0 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                    {col.null_count}
                  </span>
                </td>
                <td>{col.unique_count}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 160 }}>
                  {(col.sample_values || []).slice(0, 3).join(', ') || '—'}
                </td>
                <td className="col-desc">{col.ai_description || '—'}</td>
              </tr>
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
