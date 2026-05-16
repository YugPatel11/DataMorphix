import React from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, FileDown } from 'lucide-react';
import { exportDataset } from '../api';

export default function ExportButtons({ dataset }) {
  if (!dataset) return null;

  const formats = [
    { key: 'json', label: 'JSON', icon: <FileJson size={18} />, className: 'json' },
    { key: 'csv', label: 'CSV', icon: <FileText size={18} />, className: 'csv' },
    { key: 'excel', label: 'Excel', icon: <FileSpreadsheet size={18} />, className: 'excel' },
    { key: 'pdf', label: 'PDF', icon: <FileDown size={18} />, className: 'pdf' },
  ];

  return (
    <div className="animate-in">
      <div className="card-title" style={{ marginBottom: 8 }}>
        <Download size={18} className="icon" />
        Export Metadata
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20, marginTop: 0 }}>
        Download the data dictionary and metadata report for <strong style={{ color: 'var(--text-primary)' }}>{dataset.name}</strong> in your preferred format.
      </p>

      <div className="export-grid">
        {formats.map((f) => (
          <button
            key={f.key}
            className={`export-btn ${f.className}`}
            onClick={() => exportDataset(dataset.id, f.key)}
          >
            <span className="export-icon">{f.icon}</span>
            Download {f.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-secondary)' }}>What's included:</strong><br />
          Column names, data types, null/unique counts, AI-generated descriptions, rename suggestions, health score, and dataset summary.
        </div>
      </div>
    </div>
  );
}
