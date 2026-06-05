import React, { useRef, useState } from 'react';
import { Upload, Search, LayoutDashboard, Database, Layers, Sun, Moon, Zap, User } from 'lucide-react';

export default function Sidebar({
  datasets,
  selectedDataset,
  onSelectDataset,
  onUpload,
  uploading,
  currentPage,
  onNavigate,
  theme,
  toggleTheme,
}) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <h1>
          <div className="brand-icon-wrap">
            <Zap size={18} color="var(--bg-sidebar)" />
          </div>
          DM_CORE
        </h1>
        <p>AI Data Dictionary</p>
      </div>

      {/* Upload Zone */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">New Source</div>
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.json"
            onChange={handleFileSelect}
          />
          <Upload size={24} className="upload-icon mx-auto" />
          <div className="upload-text mt-2">
            <strong>Drop File Here</strong><br />
            or click to browse<br />
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>CSV, Excel, JSON (Max 50MB)</span>
          </div>
        </div>
        {uploading && (
          <button className="upload-btn" disabled>
            <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, marginRight: 6, verticalAlign: 'middle' }}></span>
            Processing…
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Explore</div>
        <ul className="nav-links">
          <li
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <LayoutDashboard size={16} /> Overview
          </li>
          <li
            className={`nav-link ${currentPage === 'search' ? 'active' : ''}`}
            onClick={() => onNavigate('search')}
          >
            <Search size={16} /> Search Network
          </li>
        </ul>
      </div>

      {/* Dataset List */}
      <div className="sidebar-section" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="sidebar-section-title">
          Data Sources ({datasets.length})
        </div>
        <ul className="dataset-list">
          {datasets.map((ds) => (
            <li
              key={ds.id}
              className={`dataset-item ${selectedDataset?.id === ds.id ? 'active' : ''}`}
              onClick={() => onSelectDataset(ds)}
            >
              <div className="ds-name">
                <Database size={12} style={{ verticalAlign: 'middle', marginRight: 6, opacity: 0.6 }} />
                {ds.name}
              </div>
              <div className="ds-meta">
                <span className={`status-dot ${ds.status}`}></span>
                <span style={{ textTransform: 'capitalize' }}>{ds.status}</span>
                <span style={{ marginLeft: 'auto' }}>
                  {ds.health_score != null ? `${ds.health_score}%` : '—'}
                </span>
              </div>
            </li>
          ))}
          {datasets.length === 0 && (
            <li style={{ padding: '20px 12px', color: 'var(--text-dim)', fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.6 }}>
              No sources connected.<br />Upload a file above.
            </li>
          )}
        </ul>
      </div>
      
      {/* Profile / Theme */}
      <div className="sidebar-section" style={{ borderTop: '1px solid var(--sidebar-border)', marginTop: 'auto', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--sidebar-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="var(--sidebar-text)" />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sidebar-text-active)' }}>Admin User</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--sidebar-text)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Workspace Owner</div>
        </div>
      </div>
    </aside>
  );
}
