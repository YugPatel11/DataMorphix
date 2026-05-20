import React, { useState } from 'react';
import { GOVERNANCE_ISSUES } from '../mockData';
import { cn } from '../lib/utils';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

const SEVERITY_CONFIG = {
  Critical: { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
  Warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
  Info: { icon: Info, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
};

export default function GovernancePanel() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const stats = {
    Critical: GOVERNANCE_ISSUES.filter(i => i.severity === 'Critical').length,
    Warning: GOVERNANCE_ISSUES.filter(i => i.severity === 'Warning').length,
    Info: GOVERNANCE_ISSUES.filter(i => i.severity === 'Info').length,
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(stats).map(([label, count]) => {
          const config = SEVERITY_CONFIG[label as keyof typeof SEVERITY_CONFIG];
          return (
            <div key={label} className="bg-white border border-app-border p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between glow-hover">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl", config.bg, config.color)}>
                  <config.icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-1.5">{label}</span>
                  <div className="text-3xl font-bold text-gray-900 tracking-tighter">{count}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-app-border rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="bg-gray-50/50 border-b border-app-border px-8 py-5 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
             <ShieldCheck className="w-5 h-5 text-indigo-500" />
             Issue Registry
          </span>
          <span className="text-[10px] font-mono font-bold text-gray-400 tracking-widest uppercase">Governance V2.4</span>
        </div>
        
        <div className="divide-y divide-gray-50">
          {GOVERNANCE_ISSUES.map((issue, i) => {
            const isExpanded = expandedIndex === i;
            const config = SEVERITY_CONFIG[issue.severity];
            const Icon = config.icon;

            return (
              <div key={i} className="group">
                <div 
                  onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  className="px-8 py-6 flex items-center gap-8 cursor-pointer hover:bg-gray-50/50 transition-all"
                >
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest min-w-[120px] justify-center leading-none",
                    config.color, config.bg, config.border
                  )}>
                    <Icon className="w-3.5 h-3.5" />
                    {issue.severity}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase font-mono tracking-tight">{issue.column}</span>
                      <span className="text-sm text-gray-500 font-medium line-clamp-1">{issue.issue}</span>
                    </div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Impact Radius</span>
                    <span className="text-sm font-bold text-gray-900 font-mono tracking-tight">{issue.affectedRows.toLocaleString()} rows</span>
                  </div>

                  <div className={cn("p-2 rounded-full transition-all", isExpanded ? "bg-gray-100 rotate-180" : "bg-transparent")}>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-8 pb-8 pt-2 bg-gray-50/50 animate-in slide-in-from-top-2 duration-300">
                    <div className="p-8 bg-white rounded-[2rem] border border-app-border flex flex-col md:flex-row gap-8 shadow-sm">
                      <div className="flex-1 space-y-6">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Root Cause & Mitigation</span>
                          <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            Anomaly detected in upstream ingestion layer <span className="font-bold text-gray-900">(Pipeline #402)</span>. 
                            The current distribution indicates high entropy in categorical dimensions. 
                            Recommend enforcing uniqueness constraints at the SQL transformation level.
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <button className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-black/10">
                            Apply Fix API
                          </button>
                          <button className="bg-white border border-app-border text-gray-400 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition-all">
                            Ignore Audit
                          </button>
                        </div>
                      </div>
                      <div className="w-full md:w-64 p-6 bg-app-accent/5 rounded-3xl border border-app-accent/10 space-y-4">
                        <span className="text-[10px] font-bold text-app-accent uppercase tracking-widest block">Governance AI Telemetry</span>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Confidence</span>
                            <span className="text-sm font-bold text-emerald-600">99.8%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Auto Health</span>
                            <span className="text-sm font-bold text-indigo-600">Optimized</span>
                          </div>
                          <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 w-3/4 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
