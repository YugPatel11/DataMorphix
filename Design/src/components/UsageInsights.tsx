import React from 'react';
import { USAGE_STATS } from '../mockData';
import { cn } from '../lib/utils';
import { Activity, Clock, Zap, TrendingUp } from 'lucide-react';

export default function UsageInsights() {
  const getProgressColor = (rate: number) => {
    if (rate < 10) return 'bg-emerald-500';
    if (rate <= 30) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-app-border rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="bg-gray-50/50 border-b border-app-border px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-bold text-gray-900 uppercase tracking-widest leading-none">Usage Telemetry</span>
            </div>
            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               Live Flow
            </div>
          </div>
          
          <div className="overflow-x-auto industrial-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/30">
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Column</th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Empty Radius</th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Heat Rate</th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Last Pulse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {USAGE_STATS.map((stat, i) => (
                  <tr key={i} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase font-mono tracking-tight">{stat.column}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1.5 w-32">
                        <div className="flex justify-between">
                          <span className="text-[10px] font-bold text-gray-400">{stat.emptyRate}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn("h-full transition-all rounded-full shadow-[0_0_8px_rgba(0,0,0,0.05)]", getProgressColor(stat.emptyRate))} style={{ width: `${stat.emptyRate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className="text-xs font-bold text-gray-900 font-mono italic bg-gray-50 px-2 py-1 rounded-lg border border-app-border">{stat.topValue}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-gray-400 font-bold text-[11px] uppercase tracking-widest">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono">{stat.lastAccessed}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-app-accent border border-app-accent/20 p-8 rounded-[2.5rem] shadow-xl shadow-app-accent/10 glow-hover relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-white/30 transition-all duration-700" />
            <div className="flex justify-between items-start mb-10 relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-900 leading-none">Hot Zones</span>
              <div className="w-10 h-10 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <div className="space-y-6 relative z-10">
              {[
                { label: 'Access Flow', value: '425 req/s' },
                { label: 'Read Delay', value: '12ms' },
                { label: 'Cache Sync', value: '99.2%' },
              ].map((m, i) => (
                <div key={i} className="flex justify-between items-end border-b border-gray-900/10 pb-3">
                  <span className="text-xs font-bold text-gray-900/60 uppercase tracking-widest leading-none">{m.label}</span>
                  <span className="text-2xl font-bold text-gray-900 tracking-tighter leading-none">{m.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 relative z-10">
              <button className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-2xl text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/20">
                Optimize Cluster Flow
              </button>
            </div>
          </div>
          
          <div className="bg-white border border-app-border p-8 rounded-[2.5rem] text-center shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 block mb-3">Efficiency Quotient</span>
            <div className="text-4xl font-bold text-indigo-600 tracking-tighter mb-3">0.042λ</div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">System Density Baseline</p>
          </div>
        </div>
      </div>
    </div>
  );
}
