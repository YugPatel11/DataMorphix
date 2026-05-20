import React, { useState, useEffect } from 'react';
import { Search, Database, Columns, ShieldAlert, ArrowRight, Command } from 'lucide-react';
import { cn } from '../lib/utils';

const MOCK_RESULTS = [
  { type: 'Datasets', name: 'users_raw', detail: 'Primary ingestion source', path: '/' },
  { type: 'Columns', name: 'age', detail: 'integer • users_raw', path: '/dictionary' },
  { type: 'Columns', name: 'signup_date', detail: 'date • users_raw', path: '/dictionary' },
  { type: 'Issues', name: 'Duplicate keys', detail: 'Critical • user_id', path: '/governance' },
  { type: 'Datasets', name: 'orders_processed', detail: 'Transformed analytical feed', path: '/' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(MOCK_RESULTS);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      const filtered = MOCK_RESULTS.filter(r => 
        r.name.toLowerCase().includes(query.toLowerCase()) || 
        r.type.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const highlightMatch = (text: string, q: string) => {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === q.toLowerCase() 
        ? <span key={i} className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 font-bold px-0.5 rounded transition-colors">{part}</span> 
        : part
    );
  };

  return (
    <div className="max-w-4xl mx-auto pt-16 animate-in fade-in zoom-in-95 duration-700">
      <div className="relative mb-16 px-4">
        <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
          <Search className="w-8 h-8 text-indigo-500" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Global system oracle search..."
          className="w-full bg-app-card border-2 border-app-border rounded-[2.5rem] py-8 pl-20 pr-10 text-2xl font-bold text-app-text-main placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-[12px] focus:ring-indigo-50 dark:focus:ring-indigo-500/10 transition-all shadow-2xl shadow-black/5"
        />
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 px-3 py-1.5 bg-app-bg border border-app-border rounded-xl transition-colors">
           <Command className="w-3.5 h-3.5 text-app-text-muted" />
           <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest kbd">K</span>
        </div>
      </div>

      {query && results.length > 0 && (
        <div className="space-y-10 px-4">
          {['Datasets', 'Columns', 'Issues'].map(type => {
            const typeResults = results.filter(r => r.type === type);
            if (typeResults.length === 0) return null;

            return (
              <div key={type} className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="flex items-center gap-2 mb-6 px-4">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  <span className="text-[11px] font-bold text-app-text-muted uppercase tracking-[0.2em]">{type}</span>
                </div>
                <div className="bg-app-card border border-app-border rounded-[2rem] overflow-hidden shadow-sm transition-all">
                  {typeResults.map((result, i) => (
                    <div key={i} className="group p-6 flex items-center justify-between hover:bg-app-bg/50 transition-all cursor-pointer border-b last:border-b-0 border-app-border">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-app-bg border border-app-border flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-100 dark:group-hover:bg-indigo-500/10 dark:group-hover:border-indigo-500/20 transition-all">
                          {type === 'Datasets' && <Database className="w-7 h-7 text-indigo-500" />}
                          {type === 'Columns' && <Columns className="w-7 h-7 text-emerald-500" />}
                          {type === 'Issues' && <ShieldAlert className="w-7 h-7 text-rose-500" />}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-app-text-main group-hover:text-indigo-500 transition-colors uppercase font-mono tracking-tight leading-none mb-1">
                            {highlightMatch(result.name, query)}
                          </div>
                          <div className="text-[11px] font-bold text-app-text-muted uppercase tracking-widest">
                            {result.detail}
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-app-bg flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all">
                        <ArrowRight className="w-5 h-5 text-indigo-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="text-center py-32 space-y-6">
          <div className="w-24 h-24 bg-app-bg rounded-[2.5rem] flex items-center justify-center mx-auto border border-app-border ring-8 ring-indigo-500/5 transition-all">
            <Search className="w-12 h-12 text-app-text-muted opacity-20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-app-text-muted uppercase tracking-[0.2em]">Oracle match failure</h3>
            <p className="text-xs text-app-text-muted font-medium italic">Refine your semantic parameters and retry ingestion scan.</p>
          </div>
        </div>
      )}

      {!query && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          <div className="p-10 bg-app-card border border-app-border rounded-[2.5rem] shadow-sm relative overflow-hidden group transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all" />
            <h4 className="text-[11px] font-bold text-app-text-muted uppercase tracking-[0.2em] mb-8 relative z-10">Search Discovery</h4>
            <ul className="space-y-6 relative z-10">
              {[
                { label: "Locate PII headers via semantic tagging", icon: "pii" },
                { label: "Navigate to upstream ingestion nodes", icon: "feed" },
                { label: "Filter results by schema column context", icon: "col:" },
              ].map((tip, i) => (
                <li key={i} className="text-[13px] text-app-text-muted font-medium flex items-start gap-4 group/item cursor-default transition-colors hover:text-app-text-main">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0 group-hover/item:scale-150 transition-transform" />
                  {tip.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-10 bg-app-bg/50 border border-app-border border-dashed rounded-[2.5rem] shadow-sm transition-all duration-300">
            <h4 className="text-[11px] font-bold text-app-text-muted uppercase tracking-[0.2em] mb-8">Recent Queries</h4>
            <div className="flex flex-wrap gap-3">
              {['user_id', 'users_raw', 'latency critical', 'shards'].map(s => (
                <button key={s} onClick={() => setQuery(s)} className="px-5 py-2.5 bg-app-card border border-app-border rounded-2xl text-[11px] font-bold text-app-text-muted hover:text-indigo-500 hover:border-indigo-500/30 hover:shadow-xl transition-all uppercase tracking-widest">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
