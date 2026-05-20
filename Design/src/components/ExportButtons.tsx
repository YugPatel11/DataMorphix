import React, { useState } from 'react';
import { FileJson, FileSpreadsheet, FileCode, FileText, Check, Settings, Loader2, Download } from 'lucide-react';
import { cn } from '../lib/utils';

const EXPORT_FORMATS = [
  { id: 'json', label: 'Schema Manifest', sub: 'JSON Structure', icon: FileCode, size: '2.4 MB', color: 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-500/10' },
  { id: 'csv', label: 'Raw Tabular Data', sub: 'CSV Snapshot', icon: FileSpreadsheet, size: '42.1 MB', color: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-500/10' },
  { id: 'pdf', label: 'Compliance Audit', sub: 'PDF Report', icon: FileText, size: '1.8 MB', color: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-500/10' },
  { id: 'xlsx', label: 'Legacy Workbook', sub: 'Excel Binary', icon: FileJson, size: '38.5 MB', color: 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-500/10' },
];

export default function ExportButtons() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleExport = (id: string) => {
    setIsExporting(id);
    setTimeout(() => {
      setIsExporting(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-6xl">
      <div>
        <div className="flex items-center gap-4 mb-2">
           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
           <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Dataset Extraction Node</h2>
        </div>
        <h3 className="text-4xl font-bold text-gray-900 tracking-tighter mb-12">Export Repository</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format.id}
              onClick={() => handleExport(format.id)}
              disabled={!!isExporting}
              className={cn(
                "p-10 rounded-[2.5rem] border text-left transition-all group relative overflow-hidden flex flex-col items-start gap-8",
                format.color,
                isExporting === format.id ? "scale-95 opacity-80" : "hover:scale-[1.03] hover:shadow-2xl shadow-lg border-white"
              )}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/50 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:bg-white/80 transition-all">
                <format.icon className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-900/60 mb-1">{format.sub}</div>
                <div className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">{format.label}</div>
              </div>
              <div className="mt-auto w-full flex items-center justify-between">
                 <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{format.size}</span>
                 <Download className="w-5 h-5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all" />
              </div>

              {isExporting === format.id && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-md">
                   <Loader2 className="w-10 h-10 animate-spin text-gray-900" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white border border-app-border rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gray-50 rounded-full blur-3xl -mr-40 -mt-40" />
          
          <div className="flex items-center gap-3 mb-10 relative z-10">
            <Settings className="w-6 h-6 text-indigo-500" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Advanced Parameters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            <div className="space-y-6">
              {[
                { label: "Include system metadata", active: true },
                { label: "Flatten nested structures", active: false },
              ].map((p, i) => (
                <label key={i} className="flex items-center gap-4 cursor-pointer group">
                  <div className={cn(
                    "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                    p.active ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-200 group-hover:border-indigo-400"
                  )}>
                    {p.active && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={cn("text-xs font-bold transition-colors", p.active ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600")}>
                    {p.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="space-y-6">
              {[
                { label: "Anonymize PII columns", active: true },
                { label: "Audit-ready logging", active: false },
              ].map((p, i) => (
                <label key={i} className="flex items-center gap-4 cursor-pointer group">
                  <div className={cn(
                    "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                    p.active ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-200 group-hover:border-indigo-400"
                  )}>
                    {p.active && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={cn("text-xs font-bold transition-colors", p.active ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600")}>
                    {p.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Verification Hash</div>
              <div className="text-[10px] font-bold text-gray-400 font-mono break-all leading-tight">
                SHA256: 0x8F2B...C6D7E8F9A0B1C2D3E4F5
              </div>
              <button className="mt-4 text-left text-[10px] font-bold text-indigo-500 uppercase underline decoration-2 underline-offset-4">
                Recalculate Checksum
              </button>
            </div>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-12 right-12 animate-in slide-in-from-right-12 fade-in duration-700 z-50">
          <div className="bg-gray-900 text-white rounded-[2rem] p-6 pr-10 flex items-center gap-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-app-accent flex items-center justify-center shadow-lg shadow-app-accent/20">
              <Check className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight uppercase">Ready for Transfer</div>
              <div className="text-[10px] font-bold text-app-accent uppercase tracking-[0.1em]">Archive constructed in 1.2s</div>
            </div>
            <button onClick={() => setShowToast(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
               <Loader2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
