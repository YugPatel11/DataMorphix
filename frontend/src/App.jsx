import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, MessageSquare, GitBranch,
  Link2, ShieldAlert, BarChart3, Wand2, Download, Search, RefreshCw, Trash2,
  Activity, Sun, Moon, Bell, Settings
} from 'lucide-react';
import { fetchDatasets, uploadDataset, fetchDataset, reprocessDataset, deleteDataset } from './api';

// Components
import Sidebar from './components/Sidebar';
import DashboardCharts from './components/DashboardCharts';
import DataDictionary from './components/DataDictionary';
import QueryPanel from './components/QueryPanel';
import LineageView from './components/LineageView';
import RelationshipsView from './components/RelationshipsView';
import GovernancePanel from './components/GovernancePanel';
import UsageInsights from './components/UsageInsights';
import RenameSuggestions from './components/RenameSuggestions';
import ExportButtons from './components/ExportButtons';
import SearchPage from './components/SearchPage';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
  { key: 'dictionary', label: 'Dictionary', icon: <BookOpen size={14} /> },
  { key: 'query', label: 'AI Query', icon: <MessageSquare size={14} /> },
  { key: 'lineage', label: 'Lineage', icon: <GitBranch size={14} /> },
  { key: 'relationships', label: 'Relations', icon: <Link2 size={14} /> },
  { key: 'governance', label: 'Governance', icon: <ShieldAlert size={14} /> },
  { key: 'usage', label: 'Usage', icon: <BarChart3 size={14} /> },
  { key: 'rename', label: 'Rename', icon: <Wand2 size={14} /> },
  { key: 'export', label: 'Export', icon: <Download size={14} /> },
];

function DatasetDetail({ dataset, onReprocess, reprocessing, onDelete, theme, toggleTheme }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Reset tab when dataset changes
  useEffect(() => {
    setActiveTab('dashboard');
  }, [dataset?.id]);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardCharts dataset={dataset} />;
      case 'dictionary': return <DataDictionary dataset={dataset} />;
      case 'query': return <QueryPanel dataset={dataset} />;
      case 'lineage': return <LineageView dataset={dataset} />;
      case 'relationships': return <RelationshipsView dataset={dataset} />;
      case 'governance': return <GovernancePanel dataset={dataset} />;
      case 'usage': return <UsageInsights dataset={dataset} />;
      case 'rename': return <RenameSuggestions dataset={dataset} />;
      case 'export': return <ExportButtons dataset={dataset} />;
      default: return <DashboardCharts dataset={dataset} />;
    }
  };

  return (
    <div className="main-content-inner">
      {/* Header */}
      <header className="main-header">
        <div>
          <h2>{dataset.name}</h2>
          <div className="header-subtitle">
            <div className="pulse-dot" />
            <span>
              Active Dataset · {dataset.row_count?.toLocaleString() || '—'} rows · {dataset.columns?.length || 0} cols · Score: {dataset.health_score ?? '—'}/100
            </span>
          </div>
        </div>
        <div className="header-actions">
          <div className="status-pill">
            <Activity size={13} />
            System Healthy
          </div>
          <button
            className="icon-btn"
            onClick={onReprocess}
            disabled={reprocessing}
            title={reprocessing ? 'Reprocessing…' : 'Reprocess'}
          >
            <RefreshCw size={16} style={reprocessing ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
          <button
            className="icon-btn"
            onClick={onDelete}
            title="Delete Dataset"
            style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)' }}
          >
            <Trash2 size={16} />
          </button>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="icon-btn" style={{ position: 'relative' }}>
            <Bell size={16} />
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 8, height: 8, background: 'var(--accent-red)',
              borderRadius: '50%', border: '2px solid var(--bg-card)'
            }} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="main-body">
        {renderTab()}
      </div>

      {/* Footer */}
      <div className="app-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 800 }}>© DATAMORPHIX CORE</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>NODE_ID: 0XF2A19</span>
        </div>
        <div className="footer-status">
          <div className="status-dot-sm" />
          <span>STABLE_V4</span>
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ theme, toggleTheme }) {
  return (
    <div className="main-content-inner">
      <header className="main-header">
        <div>
          <h2>Welcome to DataMorphix</h2>
          <div className="header-subtitle">
            <div className="pulse-dot" />
            <span>AI-Powered Intelligent Data Dictionary</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="status-pill">
            <Activity size={13} />
            System Healthy
          </div>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>
      <div className="main-body">
        <div className="empty-state" style={{ minHeight: 400 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '2rem',
            background: 'rgba(190, 242, 100, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            border: '1px solid rgba(190, 242, 100, 0.15)',
          }}>
            <LayoutDashboard size={32} color="var(--accent)" />
          </div>
          <h3>Select a Dataset to Begin</h3>
          <p>Upload a CSV, Excel, or JSON file from the sidebar, then select it to explore its AI-generated metadata, lineage, governance insights, and more.</p>
        </div>
      </div>
      <div className="app-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 800 }}>© DATAMORPHIX CORE</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>NODE_ID: 0XF2A19</span>
        </div>
        <div className="footer-status">
          <div className="status-dot-sm" />
          <span>STABLE_V4</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync page from URL
  useEffect(() => {
    if (location.pathname === '/search') {
      setCurrentPage('search');
    } else {
      setCurrentPage('dashboard');
    }
  }, [location.pathname]);

  // Fetch datasets on mount
  const loadDatasets = useCallback(async () => {
    try {
      const data = await fetchDatasets();
      setDatasets(data);
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  // Upload handler
  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const newDs = await uploadDataset(file);
      await loadDatasets();
      // Select the newly uploaded dataset and go to dashboard
      const refreshed = await fetchDataset(newDs.id);
      setSelectedDataset(refreshed);
      setCurrentPage('dashboard');
      navigate('/');
    } catch (err) {
      console.error('Upload failed:', err);
      const message = err.response?.data?.error || err.message || 'Unknown error';
      alert(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  // Select dataset
  const handleSelectDataset = async (ds) => {
    try {
      const full = await fetchDataset(ds.id);
      setSelectedDataset(full);
      setCurrentPage('dashboard');
      navigate('/');
    } catch (err) {
      setSelectedDataset(ds);
    }
  };

  // Reprocess
  const handleReprocess = async () => {
    if (!selectedDataset) return;
    setReprocessing(true);
    try {
      const updated = await reprocessDataset(selectedDataset.id);
      setSelectedDataset(updated);
      await loadDatasets();
    } catch (err) {
      console.error('Reprocess failed:', err);
    } finally {
      setReprocessing(false);
    }
  };

  // Delete
  const handleDeleteDataset = async () => {
    if (!selectedDataset) return;
    if (!window.confirm(`Are you sure you want to delete the dataset "${selectedDataset.name}"? This will permanently remove all of its AI-generated metadata, relationships, lineage, and governance reports. This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteDataset(selectedDataset.id);
      setSelectedDataset(null);
      await loadDatasets();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete dataset. Please try again.');
    }
  };

  // Navigate
  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (page === 'search') {
      navigate('/search');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        datasets={datasets}
        selectedDataset={selectedDataset}
        onSelectDataset={handleSelectDataset}
        onUpload={handleUpload}
        uploading={uploading}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="main-content">
        <Routes>
          <Route
            path="/search"
            element={
              <div className="main-content-inner">
                <header className="main-header">
                  <div>
                    <h2>
                      <Search size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                      Universal Explorer
                    </h2>
                    <div className="header-subtitle">
                      <div className="pulse-dot" />
                      <span>Search across all datasets</span>
                    </div>
                  </div>
                  <div className="header-actions">
                    <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
                      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                  </div>
                </header>
                <div className="main-body">
                  <SearchPage
                    onSelectDataset={handleSelectDataset}
                    datasets={datasets}
                  />
                </div>
                <div className="app-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 800 }}>© DATAMORPHIX CORE</span>
                  </div>
                  <div className="footer-status">
                    <div className="status-dot-sm" />
                    <span>STABLE_V4</span>
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="*"
            element={
              selectedDataset ? (
                <DatasetDetail
                  dataset={selectedDataset}
                  onReprocess={handleReprocess}
                  reprocessing={reprocessing}
                  onDelete={handleDeleteDataset}
                  theme={theme}
                  toggleTheme={toggleTheme}
                />
              ) : (
                <WelcomeScreen theme={theme} toggleTheme={toggleTheme} />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}
