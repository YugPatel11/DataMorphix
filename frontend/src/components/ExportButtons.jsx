import React from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, FileDown, CheckCircle2 } from 'lucide-react';
import { exportDataset } from '../api';

export default function ExportButtons({ dataset }) {
  if (!dataset) return null;

  const formats = [
    { key: 'json', label: 'JSON Metadata', icon: <FileJson size={24} />, className: 'json' },
    { key: 'csv', label: 'CSV Dictionary', icon: <FileText size={24} />, className: 'csv' },
    { key: 'excel', label: 'Excel Report', icon: <FileSpreadsheet size={24} />, className: 'excel' },
    { key: 'pdf', label: 'PDF Summary', icon: <FileDown size={24} />, className: 'pdf' },
  ];

  return (
    <div className="animate-in">
      <div className="card-title" style={{ marginBottom: 24 }}>
        <Download size={18} className="icon" />
        Export Extracted Metadata
      </div>

      <div className="export-grid">
        {formats.map((f) => (
          <button
            key={f.key}
            className={`export-btn ${f.className} glow-hover`}
            onClick={() => exportDataset(dataset.id, f.key)}
            style={{ padding: '32px 24px', alignItems: 'center', textAlign: 'center' }}
          >
            <span className="export-icon" style={{ width: 64, height: 64, borderRadius: '2rem', marginBottom: 16 }}>{f.icon}</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{f.label}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 8 }}>Click to download</span>
          </button>
        ))}
      </div>

      <div style={{ 
        marginTop: 32, 
        padding: '24px', 
        background: 'var(--bg-input)', 
        border: '1px dashed var(--border-color)', 
        borderRadius: 'var(--radius-2xl)',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start'
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckCircle2 size={16} color="var(--accent-green)" />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>What's Included in the Export</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontWeight: 500 }}>
            All exports contain the complete data dictionary including original column names, AI-suggested names, inferred data types, sample values, null/unique distributions, and AI-generated descriptive metadata.
          </div>
        </div>
      </div>
    </div>
  );
}
