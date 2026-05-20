import React from 'react';
import { Database, ArrowRight, RefreshCw, Layers, Share2, Box } from 'lucide-react';
import { DATASETS } from '../mockData';
import { cn } from '../lib/utils';

const LINEAGE_NODES = [
  { ...DATASETS[0], type: 'Source', color: 'bg-indigo-500', accent: 'bg-indigo-50 text-indigo-600' },
  { ...DATASETS[1], type: 'Schema Transform', color: 'bg-app-accent', accent: 'bg-app-accent/10 text-gray-900' },
  { ...DATASETS[2], type: 'Production Gold', color: 'bg-purple-500', accent: 'bg-purple-50 text-purple-600' },
];

export default function LineageView() {
  return (
    <div className="p-10 min-h-full flex flex-col justify-center items-center overflow-x-auto industrial-scrollbar bg-white border border-app-border rounded-[2.5rem] shadow-sm animate-in fade-in zoom-in-95 duration-700 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <div className="absolute top-10 left-10 text-left z-10">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">Data Genealogy</h3>
        <p className="text-xs text-gray-400 font-medium font-mono uppercase tracking-widest">Shard: 0x921A . US-EAST</p>
      </div>

      <div className="absolute top-10 right-10 flex gap-4 z-10">
        <button className="p-3 bg-gray-50 border border-app-border rounded-2xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-900">
          <RefreshCw className="w-5 h-5" />
        </button>
        <button className="p-3 bg-gray-900 text-app-accent rounded-2xl hover:bg-black transition-all shadow-xl shadow-black/10">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-16 relative z-20">
        {LINEAGE_NODES.map((node, i) => (
          <React.Fragment key={node.id}>
            <div className="group relative">
              <div className="absolute -inset-4 bg-app-accent/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative w-[320px] bg-white border border-app-border rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-2 transition-all duration-500">
                <div className={`h-1.5 w-3/4 mx-auto ${node.color} rounded-b-full shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border", node.accent)}>
                      {node.type}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                       <RefreshCw className="w-3.5 h-3.5 text-gray-300 animate-spin-slow" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-app-accent/5", node.accent)}>
                      <Database className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-gray-900 tracking-tight leading-none mb-1">{node.name}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Pool Identifier: {node.id}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Dataset Rows</span>
                      <span className="text-lg font-bold text-gray-900 font-mono tracking-tighter leading-none">{(node.rows / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Dimension Count</span>
                      <span className="text-lg font-bold text-gray-900 font-mono tracking-tighter leading-none">{node.cols}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Parquet_V4</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase underline decoration-2 underline-offset-4 cursor-pointer hover:text-indigo-600 transition-colors">
                      Inspect Root
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {i < LINEAGE_NODES.length - 1 && (
              <div className="flex flex-col items-center gap-2">
                 <div className="w-12 h-12 rounded-full bg-white border border-app-border items-center justify-center flex shadow-xl shadow-black/5 z-10 hover:scale-110 transition-transform group cursor-pointer">
                    <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-app-accent animate-pulse" />
                 </div>
                 <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest absolute mt-16">Active Tunnel</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="absolute bottom-10 py-4 px-10 border border-app-border bg-gray-50/50 backdrop-blur-md rounded-full max-w-2xl text-center z-20">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] leading-relaxed">
          <span className="text-gray-900">Flow Integrity Check:</span> Visualizing automated lineage from ingestion points to production nodes. All shards balanced.
        </p>
      </div>
    </div>
  );
}
