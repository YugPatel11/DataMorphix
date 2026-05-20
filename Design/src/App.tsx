import React, { useState, useEffect } from 'react';
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
import { DATASETS } from './mockData';
import { Database, Bell, Settings, HelpCircle, Activity, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedDatasetId, setSelectedDatasetId] = useState('1');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const selectedDataset = DATASETS.find(d => d.id === selectedDatasetId) || DATASETS[0];

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardCharts />;
      case 'dictionary': return <DataDictionary />;
      case 'query': return <QueryPanel />;
      case 'lineage': return <LineageView />;
      case 'relationships': return <RelationshipsView />;
      case 'governance': return <GovernancePanel />;
      case 'usage': return <UsageInsights />;
      case 'renames': return <RenameSuggestions />;
      case 'export': return <ExportButtons />;
      case 'search': return <SearchPage />;
      default: return <DashboardCharts />;
    }
  };

  const getHeaderTitle = () => {
    const item = {
      dashboard: 'System Overview',
      dictionary: 'Schema Definition',
      query: 'Predictive Query Engine',
      lineage: 'Data Provenance Layer',
      relationships: 'Semantic Mappings',
      governance: 'Governance & Compliance',
      usage: 'Operational Telemetry',
      renames: 'Nomenclature Alignment',
      export: 'Dataset Extraction',
      search: 'Universal Explorer'
    }[activeView];
    return item || 'Data Intelligence';
  };

  return (
    <div className="flex h-screen bg-app-bg text-app-text-main font-sans selection:bg-app-accent selection:text-app-text-main transition-[background-color,color,border-color,box-shadow] duration-700 ease-in-out">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        selectedDataset={selectedDatasetId}
        setSelectedDataset={setSelectedDatasetId}
      />

      <main className="flex-1 ml-[240px] flex flex-col h-screen overflow-hidden p-3">
        <div className="bg-app-card rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-sm border border-app-border transition-[background-color,color,border-color,box-shadow] duration-700 ease-in-out">
          {/* Header */}
          <header className="h-[88px] px-10 flex items-center justify-between flex-shrink-0 bg-app-card/50 backdrop-blur-md z-30 border-b border-app-border">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-app-text-main">{getHeaderTitle()}</h1>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
                  <span className="text-[10px] font-mono text-app-text-muted uppercase tracking-widest italic font-medium">
                    Active Dataset: <span className="text-app-text-main">{selectedDataset.name}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full group hover:bg-emerald-500/20 transition-all cursor-pointer">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">System Healthy</span>
              </div>
              
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 text-app-text-muted hover:text-app-text-main transition-all bg-app-bg rounded-full border border-app-border group"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button className="p-2.5 text-app-text-muted hover:text-app-text-main transition-colors relative bg-app-bg border border-app-border rounded-full">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-app-card" />
              </button>
              <button className="p-2.5 text-app-text-muted hover:text-app-text-main transition-colors bg-app-bg border border-app-border rounded-full">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto industrial-scrollbar px-10 pb-10 mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="min-h-full"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="h-10 px-10 flex items-center justify-between flex-shrink-0 bg-app-bg/30 text-[10px] font-mono uppercase tracking-widest text-app-text-muted border-t border-app-border">
             <div className="flex items-center gap-4">
              <span className="font-bold text-app-text-muted">© DATAMORPHIX CORE</span>
              <span className="text-app-border">|</span>
              <span>NODE_ID: 0XF2A19</span>
            </div>
            <div className="flex items-center gap-4 font-bold">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> 
                STABLE_V4
              </span>
              <span className="text-app-text-muted">AWS_US_EAST</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
