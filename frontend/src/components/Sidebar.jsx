import React, { useRef, useState } from 'react';
import { Upload, Search, LayoutDashboard, Database, Layers } from 'lucide-react';

export default function Sidebar({
  datasets,
  selectedDataset,
  onSelectDataset,
  onUpload,
  uploading,
  currentPage,
  onNavigate,
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
          <Database style={{ display: 'inline', width: 20, height: 20, verticalAlign: 'middle', marginRight: 6 }} />
          DataMorphix
        </h1>
        <p>AI Data Dictionary</p>
      </div>

      {/* Upload */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Upload Dataset</div>
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
          <div className="upload-icon"><Upload size={24} /></div>
          <div className="upload-text">
            <strong>Click to Upload</strong> or drag & drop<br />
            CSV, Excel, JSON
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
        <div className="sidebar-section-title">Navigation</div>
        <ul className="nav-links">
          <li
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <LayoutDashboard size={16} /> Dashboard
          </li>
          <li
            className={`nav-link ${currentPage === 'search' ? 'active' : ''}`}
            onClick={() => onNavigate('search')}
          >
            <Search size={16} /> Search Datasets
          </li>
        </ul>
      </div>

      {/* Dataset List */}
      <div className="sidebar-section" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="sidebar-section-title">
          Your Datasets ({datasets.length})
        </div>
        <ul className="dataset-list">
          {datasets.map((ds) => (
            <li
              key={ds.id}
              className={`dataset-item ${selectedDataset?.id === ds.id ? 'active' : ''}`}
              onClick={() => onSelectDataset(ds)}
            >
              <div className="ds-name">
                <Layers size={13} style={{ verticalAlign: 'middle', marginRight: 5, opacity: 0.5 }} />
                {ds.name}
              </div>
              <div className="ds-meta">
                <span className={`status-dot ${ds.status}`}></span>
                {ds.status}
                <span style={{ marginLeft: 'auto' }}>{ds.health_score != null ? `${ds.health_score}/100` : '—'}</span>
              </div>
            </li>
          ))}
          {datasets.length === 0 && (
            <li style={{ padding: '16px 12px', color: 'var(--text-dim)', fontSize: '0.78rem', textAlign: 'center' }}>
              No datasets yet.<br />Upload one to get started.
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}
