import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Columns, AlertCircle, Copy, Zap } from 'lucide-react';
import { COLUMNS } from '../mockData';
import { cn } from '../lib/utils';

import { motion } from 'motion/react';

const STATS = [
  { label: 'Total Columns', value: '24', icon: Columns, color: 'text-app-accent bg-app-accent/10 border-app-accent/20' },
  { label: 'Null Rate %', value: '4.2', icon: AlertCircle, color: 'text-rose-500 bg-rose-50 border-rose-100' },
  { label: 'Duplicate Rows', value: '1,240', icon: Copy, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { label: 'Quality Score', value: '92/100', icon: Zap, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
];

const barData = COLUMNS.map(col => ({
  name: col.name,
  nullRate: col.nullRate
}));

const typeDistribution = [
  { name: 'String', value: 12, color: '#bef264' },
  { name: 'Integer', value: 5, color: '#ddd6fe' },
  { name: 'Float', value: 3, color: '#bae6fd' },
  { name: 'Boolean', value: 2, color: '#fecaca' },
  { name: 'Date', value: 2, color: '#a7f3d0' },
];

export default function DashboardCharts() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-3xl font-bold tracking-tight text-app-text-main">Good Evening Team!</h2>
        <p className="text-sm text-app-text-muted font-medium italic">Have an in-depth look at all the metrics within your dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.7, ease: 'easeOut' }}
            className="bg-app-card border border-app-border p-6 rounded-[2rem] glow-hover shadow-sm transition-[background-color,border-color,box-shadow] duration-700 ease-in-out"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">{stat.label}</span>
              <div className={cn("p-2 rounded-xl border transition-colors duration-700", stat.color, stat.color.includes('rose') && 'dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20')}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-app-text-main tracking-tight">{stat.value}</div>
            <div className="mt-4 w-full h-1.5 bg-app-bg overflow-hidden rounded-full transition-colors duration-700">
              <div className="h-full bg-app-accent w-3/4 shadow-[0_0_8px_rgba(190,242,100,0.5)]" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-app-card border border-app-border p-8 rounded-[2.5rem] shadow-sm transition-[background-color,border-color,box-shadow] duration-700 ease-in-out">
          <h3 className="text-sm font-bold uppercase tracking-widest text-app-text-muted mb-8 flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,1)]" />
            Null Rate % per Column
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="currentColor" 
                  fontSize={10} 
                  fontWeight={700}
                  tickLine={false} 
                  axisLine={false}
                  className="text-app-text-muted"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  stroke="currentColor" 
                  fontSize={10} 
                  fontWeight={700}
                  tickLine={false} 
                  axisLine={false}
                  className="text-app-text-muted"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  cursor={{ fill: 'currentColor', opacity: 0.05 }}
                  contentStyle={{ 
                    backgroundColor: 'var(--color-app-card)', 
                    border: '1px solid var(--color-app-border)', 
                    borderRadius: '16px', 
                    fontSize: '12px', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    color: 'var(--color-app-text-main)',
                    transition: 'background-color 0.7s ease-in-out, border-color 0.7s ease-in-out'
                  }}
                  itemStyle={{ color: 'var(--color-app-text-main)' }}
                />
                <Bar dataKey="nullRate" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-app-card border border-app-border p-8 rounded-[2.5rem] shadow-sm transition-[background-color,border-color,box-shadow] duration-700 ease-in-out">
          <h3 className="text-sm font-bold uppercase tracking-widest text-app-text-muted mb-8 flex items-center gap-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,1)]" />
            Category Segmentation
          </h3>
          <div className="h-[320px] w-full flex items-center">
            <div className="w-3/5 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-app-card)', 
                    border: '1px solid var(--color-app-border)', 
                      borderRadius: '16px', 
                      fontSize: '12px', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      color: 'var(--color-app-text-main)',
                      transition: 'background-color 0.7s ease-in-out, border-color 0.7s ease-in-out'
                    }}
                    itemStyle={{ color: 'var(--color-app-text-main)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-2/5 space-y-4">
              {typeDistribution.map((type, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-all duration-700">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                  <span className="text-xs text-app-text-muted font-bold group-hover:text-app-text-main transition-colors duration-700">{type.name}</span>
                  <span className="text-xs text-app-text-main ml-auto font-mono font-bold">{type.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
