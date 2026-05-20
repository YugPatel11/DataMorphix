import React, { useState } from 'react';
import { Send, Terminal, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function QueryPanel() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleRunQuery = () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setShowResult(false);
    setTimeout(() => {
      setIsLoading(false);
      setShowResult(true);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white border border-app-border rounded-[2.5rem] p-8 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-3">
          <div className="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,1)]" />
          AI Query Assistant
        </h3>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-app-accent flex items-center justify-center flex-shrink-0 shadow-lg shadow-app-accent/20">
              <Sparkles className="w-5 h-5 text-gray-900" />
            </div>
            <div className="bg-gray-50 border border-app-border rounded-3xl rounded-tl-none p-5 text-sm text-gray-600 font-medium leading-relaxed max-w-2xl shadow-sm">
              I've analyzed the <span className="text-gray-900 font-bold">customer_lifetime_value</span> dataset. 
              You can ask me to calculate churn ripples, segment high-value users, or detect seasonal drift. 
              What's on your mind?
            </div>
          </div>

          <div className="relative group">
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 'Show me the top 10 customers by revenue last quarter...'"
              className="w-full bg-white border border-app-border rounded-[2rem] p-6 pr-16 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-app-accent/10 focus:border-app-accent transition-all min-h-[120px] resize-none shadow-sm"
            />
            <button 
              disabled={isLoading || !query.trim()}
              onClick={handleRunQuery}
              className="absolute bottom-4 right-4 p-3 bg-gray-900 hover:bg-black text-app-accent rounded-2xl shadow-xl shadow-black/10 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white border border-app-border rounded-[2.5rem] p-8 space-y-6 animate-pulse shadow-sm">
          <div className="h-4 bg-gray-100 rounded-full w-1/4" />
          <div className="h-32 bg-gray-50 rounded-3xl w-full" />
        </div>
      )}

      {showResult && (
        <div className="space-y-8 animate-in zoom-in-95 fade-in duration-500">
          <div className="bg-gray-900 rounded-[2.5rem] p-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-app-accent" />
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest leading-none">Generated SQL Output</span>
              </div>
              <div className="flex gap-1.5 leading-none">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
              </div>
            </div>
            <pre className="p-8 text-sm font-mono overflow-x-auto industrial-scrollbar">
              <code className="text-gray-300">
                <span className="text-app-accent">SELECT</span> customer_id, <span className="text-indigo-400">SUM</span>(order_value) <span className="text-app-accent">AS</span> total_revenue{"\n"}
                <span className="text-app-accent">FROM</span> orders{"\n"}
                <span className="text-app-accent">WHERE</span> order_date &gt; <span className="text-emerald-400">'2023-10-01'</span>{"\n"}
                <span className="text-app-accent">GROUP BY</span> customer_id{"\n"}
                <span className="text-app-accent">ORDER BY</span> total_revenue <span className="text-app-accent">DESC</span>{"\n"}
                <span className="text-app-accent">LIMIT</span> <span className="text-amber-400">10</span>;
              </code>
            </pre>
          </div>

          <div className="bg-white border border-app-border rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <h4 className="text-lg font-bold text-gray-900">Interpretation Results</h4>
             </div>
             <p className="text-sm text-gray-500 leading-relaxed font-medium mb-8">
                Analysis complete. Found <span className="text-gray-900 font-bold">12,402</span> rows matching your criteria. 
                Average value per high-tier user is <span className="text-indigo-600 font-bold">$1.2k</span>, which represents a <span className="text-emerald-600 font-bold">+12%</span> lift 
                compared to last year's baseline.
             </p>
             <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-app-border">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Row Count</span>
                  <span className="text-xl font-bold text-gray-900">12,402</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-app-border">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Confidence</span>
                  <span className="text-xl font-bold text-indigo-600">99.8%</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-app-border">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Execution</span>
                  <span className="text-xl font-bold text-emerald-600">142ms</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
