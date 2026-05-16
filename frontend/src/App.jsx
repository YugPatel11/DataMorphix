import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, MessageSquare, GitBranch,
  Link2, ShieldAlert, BarChart3, Wand2, Download, Search, RefreshCw
} from 'lucide-react';
import { fetchDatasets, uploadDataset, fetchDataset, reprocessDataset } from './api';

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
  { key: 'relationships', label: 'Relationships', icon: <Link2 size={14} /> },
  { key: 'governance', label: 'Governance', icon: <ShieldAlert size={14} /> },
  { key: 'usage', label: 'Usage Insights', icon: <BarChart3 size={14} /> },
  { key: 'rename', label: 'Rename', icon: <Wand2 size={14} /> },
  { key: 'export', label: 'Export', icon: <Download size={14} /> },
];

function DatasetDetail({ dataset, onReprocess, reprocessing }) {
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
    <>
      {/* Header */}
      <div className="main-header">
        <div>
          <h2>{dataset.name}</h2>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {dataset.row_count?.toLocaleString() || '—'} rows · {dataset.columns?.length || 0} columns · Score: {dataset.health_score ?? '—'}/100
          </div>
        </div>
        <button
          onClick={onReprocess}
          disabled={reprocessing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            transition: 'var(--transition)',
            fontFamily: 'var(--font-main)',
          }}
        >
          <RefreshCw size={13} className={reprocessing ? 'spinning' : ''} style={reprocessing ? { animation: 'spin 1s linear infinite' } : {}} />
          {reprocessing ? 'Reprocessing…' : 'Reprocess'}
        </button>
      </div>

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
    </>
  );
}

function WelcomeScreen() {
  return (
    <>
      <div className="main-header">
        <h2>Welcome to DataMorphix</h2>
      </div>
      <div className="main-body">
        <div className="empty-state" style={{ minHeight: 400 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <LayoutDashboard size={32} color="var(--accent-indigo)" />
          </div>
          <h3>Select a Dataset to Begin</h3>
          <p>Upload a CSV, Excel, or JSON file from the sidebar, then select it to explore its AI-generated metadata, lineage, governance insights, and more.</p>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

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
      alert('Upload failed. Make sure the file is a valid CSV, Excel, or JSON.');
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
      />

      <main className="main-content">
        <Routes>
          <Route
            path="/search"
            element={
              <>
                <div className="main-header">
                  <h2>
                    <Search size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                    Global Search
                  </h2>
                </div>
                <div className="main-body">
                  <SearchPage
                    onSelectDataset={handleSelectDataset}
                    datasets={datasets}
                  />
                </div>
              </>
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
                />
              ) : (
                <WelcomeScreen />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}
