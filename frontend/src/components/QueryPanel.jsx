import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, BarChart2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { queryDataset } from '../api';

const COLORS = ['#bef264', '#818cf8', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-xl)',
      padding: '12px 16px',
      fontSize: '0.82rem',
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-lg)',
      fontFamily: 'var(--font-main)'
    }}>
      <div style={{ marginBottom: 6, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700 }}>
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
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-input)' }} />
            <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]}>
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
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={3} dot={{ fill: '#bef264', stroke: '#18181b', strokeWidth: 2, r: 5 }} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#areaColor)" />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '0.75rem', fontWeight: 600 }} />
          </PieChart>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ 
      marginTop: 20, 
      padding: '24px', 
      background: 'var(--bg-primary)', 
      border: '1px solid var(--border-color)', 
      borderRadius: 'var(--radius-xl)',
      maxWidth: '100%',
      animation: 'fadeSlideIn 0.4s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={14} color="var(--accent-indigo)" /> {yLabel || 'Value'} by {xLabel || 'Category'} ({type} chart)
        </span>
      </div>
      <div style={{ width: '100%', height: 260 }}>
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
      setHistory((prev) => [...prev, { role: 'ai', text: 'Sorry, something went wrong processing your request. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Show a bar chart of top values',
    'Which columns have missing values?',
    'What does this dataset contain?',
    'Show a pie chart of data type distribution',
  ];

  return (
    <div className="query-container animate-in">
      <div className="card-title" style={{ marginBottom: 20 }}>
        <Sparkles size={18} className="icon" />
        Natural Language Interface
      </div>

      {/* Suggestions */}
      {history.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); }}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
                fontFamily: 'var(--font-main)',
                fontWeight: 600,
              }}
              onMouseOver={(e) => { e.target.style.borderColor = 'var(--accent-indigo)'; e.target.style.color = 'var(--text-primary)'; e.target.style.boxShadow = 'var(--shadow-card)'; }}
              onMouseOut={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; e.target.style.boxShadow = 'none'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Conversation History */}
      {history.length > 0 && (
        <div style={{ maxHeight: '55vh', overflowY: 'auto', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 20, paddingRight: 10 }}>
          {history.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                animation: 'fadeSlideIn 0.4s ease-out',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: msg.role === 'user' ? 'var(--text-primary)' : 'var(--accent)',
                boxShadow: msg.role === 'ai' ? '0 4px 12px rgba(190, 242, 100, 0.3)' : 'none'
              }}>
                {msg.role === 'user' ? <User size={18} color="var(--bg-card)" /> : <Bot size={18} color="#18181b" />}
              </div>
              <div style={{
                flex: 1,
                maxWidth: '85%',
                background: msg.role === 'user' ? 'var(--bg-input)' : 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                padding: '20px 24px',
                boxShadow: msg.role === 'ai' ? 'var(--shadow-card)' : 'none',
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
                  {msg.role === 'user' ? 'You' : 'DM_CORE Agent'}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  fontFamily: msg.role === 'ai' ? 'var(--font-main)' : 'var(--font-main)',
                  fontWeight: msg.role === 'user' ? 600 : 400
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
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)' }}>
                <Bot size={18} color="var(--text-muted)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                <span className="spinner"></span> Processing Query…
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
          placeholder="Ask anything about your data... e.g. 'Show bar chart of missing values'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="query-send-btn" disabled={loading || !query.trim()}>
          <Send size={18} /> Execute
        </button>
      </form>
    </div>
  );
}
