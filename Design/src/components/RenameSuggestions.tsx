import React, { useState } from 'react';
import { RENAME_SUGGESTIONS } from '../mockData';
import { Wand2, Info, Sparkles, Check, X, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function RenameSuggestions() {
  const [acceptedRows, setAcceptedRows] = useState<Record<number, boolean>>({});
  const [ignoredRows, setIgnoredRows] = useState<Record<number, boolean>>({});

  const handleAction = (index: number, type: 'accept' | 'ignore') => {
    if (type === 'accept') {
      setAcceptedRows(prev => ({ ...prev, [index]: true }));
      setIgnoredRows(prev => ({ ...prev, [index]: false }));
    } else {
      setIgnoredRows(prev => ({ ...prev, [index]: true }));
      setAcceptedRows(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white border border-app-border rounded-[2.5rem] p-10 mt-12 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-app-accent/5 rounded-full blur-3xl -mr-40 -mt-40" />
      
      <div className="flex items-center justify-between mb-10 relative z-10">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-3">
          <Wand2 className="w-6 h-6 text-indigo-500" />
          Semantic Naming Refactor
        </h3>
        <div className="flex items-center gap-4">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{Object.keys(acceptedRows).length} Mappings Accepted</span>
           <div className="h-4 w-[1px] bg-gray-200" />
           <button className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors">Apply All</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {RENAME_SUGGESTIONS.map((s, i) => {
          const isAccepted = acceptedRows[i];
          const isIgnored = ignoredRows[i];

          return (
            <div key={i} className={cn(
              "group bg-gray-50/50 border border-app-border p-8 rounded-[2rem] hover:bg-white hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1.5 transition-all cursor-pointer relative",
              isAccepted && "bg-emerald-50/30 border-emerald-200 ring-2 ring-emerald-500/20",
              isIgnored && "opacity-40 grayscale pointer-events-none"
            )}>
              <div className="flex items-center gap-2 mb-6">
                <div className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                  AI Suggestion
                </div>
                <div className="ml-auto flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{s.confidence}%</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Canonical Alias</span>
                  <span className="text-sm font-bold text-gray-400 font-mono line-through tracking-tighter decoration-rose-500/30">{s.currentName}</span>
                </div>
                
                <div className="w-10 h-10 rounded-2xl bg-app-accent flex items-center justify-center rotate-90 group-hover:rotate-0 transition-transform duration-500 shadow-xl shadow-app-accent/20">
                  <ArrowRight className="w-5 h-5 text-gray-900" />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Proposed Label</span>
                    {isAccepted ? (
                      <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in" />
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(i, 'ignore')} className="p-1 rounded-lg bg-white border border-app-border text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleAction(i, 'accept')} className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-black transition-all">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-xl font-bold font-mono tracking-tighter leading-none transition-colors uppercase",
                    isAccepted ? "text-emerald-700" : "text-gray-900 group-hover:text-indigo-600"
                  )}>
                    {s.suggestedName}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100 flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic">{s.reason}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
