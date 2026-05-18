import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, BarChart2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { queryDataset } from '../api';

const COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: '0.78rem',
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#6366f1', fontSize: '0.74rem', marginTop: 2 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

function DynamicChart({ type, data, xLabel, yLabel }) {
  if (!data || data.length === 0) return null;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#areaColor)" />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '0.7rem' }} />
          </PieChart>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ 
      marginTop: 16, 
      padding: '16px 20px', 
      background: 'var(--bg-inset)', 
      border: '1px solid var(--border-color)', 
      borderRadius: 12,
      maxWidth: '100%',
      animation: 'fadeSlideIn 0.4s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart2 size={13} color="var(--accent-indigo)" /> {yLabel || 'Value'} by {xLabel || 'Category'} ({type} chart)
        </span>
      </div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function QueryPanel({ dataset }) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!query.trim() || !dataset || loading) return;

    const userQuery = query.trim();
    setQuery('');
    setHistory((prev) => [...prev, { role: 'user', text: userQuery }]);
    setLoading(true);

    try {
      const result = await queryDataset(dataset.id, userQuery);
      setHistory((prev) => [...prev, { 
        role: 'ai', 
        text: result.answer,
        chart: result.chart_type ? {
          type: result.chart_type,
          data: result.chart_data,
          xLabel: result.x_label,
          yLabel: result.y_label
        } : null
      }]);
    } catch (err) {
      setHistory((prev) => [...prev, { role: 'ai', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Show a bar chart of customers count by city',
    'Which columns have missing values?',
    'What does this dataset contain?',
    'Show a pie chart of null values remaining in columns',
  ];

  return (
    <div className="query-container animate-in">
      <div className="card-title" style={{ marginBottom: 16 }}>
        <Sparkles size={18} className="icon" />
        Ask AI About Your Data
      </div>

      {/* Suggestions */}
      {history.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
                fontFamily: 'var(--font-main)',
              }}
              onMouseOver={(e) => { e.target.style.borderColor = 'var(--accent-indigo)'; e.target.style.color = 'var(--accent-indigo)'; }}
              onMouseOut={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Conversation History */}
      {history.length > 0 && (
        <div style={{ maxHeight: 480, overflowY: 'auto', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {history.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                animation: 'fadeSlideIn 0.3s ease-out',
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              }}>
                {msg.role === 'user' ? <User size={14} color="#3b82f6" /> : <Bot size={14} color="#6366f1" />}
              </div>
              <div style={{
                flex: 1,
                background: msg.role === 'user' ? 'transparent' : 'var(--bg-card)',
                border: msg.role === 'ai' ? '1px solid var(--border-color)' : 'none',
                borderRadius: 'var(--radius-lg)',
                padding: msg.role === 'ai' ? '12px 16px' : '4px 0',
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
                {msg.chart && (
                  <DynamicChart 
                    type={msg.chart.type}
                    data={msg.chart.data}
                    xLabel={msg.chart.xLabel}
                    yLabel={msg.chart.yLabel}
                  />
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.15)' }}>
                <Bot size={14} color="#6366f1" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <span className="spinner"></span> Thinking…
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="query-input-row">
        <input
          type="text"
          className="query-input"
          placeholder="Ask anything about your data or ask to draw a graph… e.g. 'Show bar chart of count by city'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="query-send-btn" disabled={loading || !query.trim()}>
          <Send size={16} /> Ask
        </button>
      </form>
    </div>
  );
}
