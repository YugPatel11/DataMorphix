import React from 'react';
import { RELATIONSHIPS } from '../mockData';
import { cn } from '../lib/utils';
import { Link2, Fingerprint, GitCompare, ArrowRightLeft, Database } from 'lucide-react';

const RELATION_ICONS = {
  'FK': Fingerprint,
  'Similar Name': GitCompare,
  'Shared Values': Link2,
};

const RELATION_COLORS = {
  'FK': 'text-indigo-600 border-indigo-100 bg-indigo-50',
  'Similar Name': 'text-purple-600 border-purple-100 bg-purple-50',
  'Shared Values': 'text-emerald-600 border-emerald-100 bg-emerald-50',
};

export default function RelationshipsView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {RELATIONSHIPS.map((rel, i) => {
        const Icon = RELATION_ICONS[rel.type as keyof typeof RELATION_ICONS] || Link2;
        return (
          <div key={i} className="bg-white border border-app-border rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1.5 transition-all group cursor-pointer">
            <div className="px-8 py-5 bg-gray-50/50 border-b border-app-border flex items-center justify-between">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest",
                RELATION_COLORS[rel.type as keyof typeof RELATION_COLORS]
              )}>
                <Icon className="w-3.5 h-3.5" />
                {rel.type}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Match: 98%</span>
            </div>
            
            <div className="p-8 space-y-6 flex-1">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 block leading-none">Primary Source</span>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{rel.sourceDataset}</span>
                  <span className="text-gray-900 text-lg font-bold font-mono tracking-tighter leading-none group-hover:text-indigo-600 transition-colors uppercase">{rel.sourceColumn}</span>
                </div>
              </div>

              <div className="flex justify-center py-4 relative">
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-gray-100 -z-10" />
                <div className="bg-white border border-app-border p-2 rounded-xl shadow-lg shadow-black/5 group-hover:bg-app-accent group-hover:border-gray-900 group-hover:rotate-180 transition-all duration-500">
                  <ArrowRightLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 block leading-none">Discovery Target</span>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{rel.targetDataset}</span>
                  <span className="text-gray-900 text-lg font-bold font-mono tracking-tighter leading-none group-hover:text-indigo-600 transition-colors uppercase">{rel.targetColumn}</span>
                </div>
              </div>
            </div>

            <div className="px-8 py-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Relational Heuristic</span>
              </div>
              <button className="text-[10px] font-bold text-indigo-500 uppercase underline decoration-2 underline-offset-4 hover:text-black transition-colors">
                 Trace Key
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
