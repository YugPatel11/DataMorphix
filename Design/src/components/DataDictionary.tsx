import React from 'react';
import { COLUMNS } from '../mockData';
import { cn } from '../lib/utils';
import { ArrowUpDown, Info } from 'lucide-react';

const TYPE_COLORS = {
  string: 'text-indigo-600 border-indigo-100 bg-indigo-50',
  integer: 'text-purple-600 border-purple-100 bg-purple-50',
  float: 'text-blue-600 border-blue-100 bg-blue-50',
  boolean: 'text-emerald-600 border-emerald-100 bg-emerald-50',
  date: 'text-rose-600 border-rose-100 bg-rose-50',
};

export default function DataDictionary() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden border border-app-border rounded-[2.5rem] bg-white shadow-sm">
      <div className="overflow-x-auto industrial-scrollbar px-6">
        <table className="w-full text-left border-collapse my-4">
          <thead>
            <tr className="bg-gray-50/50 rounded-2xl">
              <th className="px-5 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap first:rounded-l-2xl last:rounded-r-2xl">
                <div className="flex items-center gap-2 cursor-pointer hover:text-gray-900 transition-colors">
                  Column Name <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="px-5 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                Type
              </th>
              <th className="px-5 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                Null %
              </th>
              <th className="px-5 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                Unique %
              </th>
              <th className="px-5 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                Samples
              </th>
              <th className="px-5 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                AI Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {COLUMNS.map((col, i) => (
              <tr key={i} className="hover:bg-gray-50/80 transition-colors group">
                <td className="px-5 py-6">
                  <span className="text-sm font-bold text-gray-900 group-hover:text-app-accent transition-colors">{col.name}</span>
                </td>
                <td className="px-5 py-6">
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border leading-none inline-block",
                    TYPE_COLORS[col.type]
                  )}>
                    {col.type}
                  </span>
                </td>
                <td className="px-5 py-6 text-sm font-mono font-bold">
                  <span className={cn(col.nullRate > 20 ? "text-rose-500" : "text-gray-400")}>
                    {col.nullRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-5 py-6 text-sm font-mono font-bold text-gray-400">
                  {col.uniqueRate.toFixed(1)}%
                </td>
                <td className="px-5 py-6">
                  <div className="flex gap-1.5">
                    {col.sampleValues.map((val, j) => (
                      <span key={j} className="text-[10px] font-mono font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md truncate max-w-[110px]">
                        {val}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-6 max-w-sm">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-app-accent mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      {col.description}
                    </p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
