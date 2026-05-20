import React from 'react';
import { 
  Layers, LayoutDashboard, BookOpen, Code2, 
  GitFork, Share2, ShieldCheck, 
  Type, Download, Search, Upload, Plus
} from 'lucide-react';
import { DATASETS } from '../mockData';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  selectedDataset: string;
  setSelectedDataset: (id: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'dictionary', label: 'Data Dictionary', icon: BookOpen },
  { id: 'query', label: 'Query', icon: Code2 },
  { id: 'lineage', label: 'Lineage', icon: GitFork },
  { id: 'relationships', label: 'Relationships', icon: Share2 },
  { id: 'governance', label: 'Governance', icon: ShieldCheck },
  { id: 'renames', label: 'Renames', icon: Type },
  { id: 'export', label: 'Export', icon: Download },
  { id: 'search', label: 'Search', icon: Search },
];

export default function Sidebar({ activeView, setActiveView, selectedDataset, setSelectedDataset }: SidebarProps) {
  return (
    <aside className="w-[240px] h-screen bg-app-sidebar flex flex-col fixed left-0 top-0 overflow-y-auto industrial-scrollbar z-40 border-r border-app-border transition-[background-color,border-color] duration-700 ease-in-out">
      <div className="p-8 pb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-app-accent flex items-center justify-center shadow-lg shadow-app-accent/20">
          <Layers className="text-gray-900 w-6 h-6" />
        </div>
        <span className="font-bold text-2xl tracking-tighter text-app-text-main">DataMorphix</span>
      </div>

      <div className="flex-1 overflow-y-auto industrial-scrollbar px-4">

        <div className="mb-8">
          <div className="text-[11px] font-bold uppercase tracking-widest text-app-text-muted mb-4 px-4">Workspace</div>
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-700 group relative",
                  activeView === item.id 
                    ? "bg-app-accent text-gray-900 shadow-xl shadow-app-accent/10" 
                    : "text-app-text-muted hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors duration-700",
                  activeView === item.id ? "text-gray-900" : "text-app-text-muted group-hover:text-white"
                )} />
                <span className="text-sm font-bold">{item.label}</span>
                {activeView === item.id && (
                  <>
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-900/20" />
                    <div className="absolute left-0 w-1 h-6 bg-gray-900 rounded-r-full" />
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mb-8 p-4 bg-app-bg/50 rounded-[2rem] border border-app-border transition-all duration-700">
          <div className="text-[11px] font-bold uppercase tracking-widest text-app-text-muted mb-4 px-2 flex items-center justify-between">
            <span>Library</span>
            <button className="hover:text-app-text-main transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {DATASETS.map((ds) => (
              <button
                key={ds.id}
                onClick={() => setSelectedDataset(ds.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl transition-all duration-700",
                  selectedDataset === ds.id 
                    ? "bg-app-accent shadow-sm text-gray-900" 
                    : "text-app-text-muted hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold truncate">{ds.name}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors duration-700",
                    selectedDataset === ds.id ? "bg-gray-900/10 text-gray-900" : "bg-app-bg dark:bg-white/10 text-app-text-muted group-hover:text-white"
                  )}>{ds.cols}</span>
                </div>
              </button>
            ))}
          </div>
        </div>


        <div className="px-2 py-6">
          <div className="bg-app-card rounded-3xl p-5 border border-app-border flex flex-col items-center gap-4 group cursor-pointer hover:border-app-accent transition-all duration-700">
            <div className="w-12 h-12 rounded-full bg-app-accent/10 flex items-center justify-center group-hover:bg-app-accent transition-all duration-700">
              <Upload className="w-6 h-6 text-app-accent group-hover:text-gray-900 transition-colors duration-700" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-app-text-main block">Ingest New Pool</span>
              <span className="text-[10px] text-app-text-muted font-medium font-mono uppercase tracking-tighter">XLSX • CSV • PRQ</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-app-border mt-auto transition-[border-color] duration-700">
        <div className="flex items-center gap-4 p-3 bg-app-card rounded-2xl border border-app-border shadow-sm transition-[background-color,border-color] duration-700">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-app-accent to-app-secondary p-0.5 transition-all duration-700">
            <div className="w-full h-full rounded-full bg-app-sidebar flex items-center justify-center overflow-hidden transition-all duration-700">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-8 h-8" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-app-text-main">Dr. Aris</span>
            <span className="text-[10px] text-app-text-muted font-bold uppercase tracking-widest">Architect</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
