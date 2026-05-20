import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Columns3, Rows3, ShieldAlert, Sparkles } from 'lucide-react';

const CHART_COLORS = ['#bef264', '#818cf8', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

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
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function DashboardCharts({ dataset }) {
  if (!dataset) return null;

  const columns = dataset.columns || [];
  const governanceIssues = dataset.governance_issues || [];

  // Stat data
  const healthScore = dataset.health_score ?? 0;
  const rowCount = dataset.row_count ?? 0;
  const colCount = columns.length;
  const issueCount = governanceIssues.length;

  // Health class
  const healthClass = healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : healthScore >= 40 ? 'fair' : 'poor';

  // Null chart data
  const nullData = columns
    .filter(c => c.null_count > 0)
    .map((col) => ({
      name: col.name.length > 12 ? col.name.slice(0, 12) + '…' : col.name,
      nulls: col.null_count,
    }));

  // Type distribution data
  const typeCounts = {};
  columns.forEach((col) => {
    const t = col.data_type;
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="animate-in">
      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card green glow-hover">
          <div className="stat-label">Health Score</div>
          <div className="stat-value">{healthScore}<span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 4 }}>/100</span></div>
          <div className="health-gauge">
            <div className={`health-gauge-fill ${healthClass}`} style={{ width: `${healthScore}%` }}></div>
          </div>
        </div>
        <div className="stat-card blue glow-hover">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{rowCount.toLocaleString()}</div>
          <div className="stat-sub"><Rows3 size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Indexed Rows</div>
        </div>
        <div className="stat-card purple glow-hover">
          <div className="stat-label">Total Fields</div>
          <div className="stat-value">{colCount}</div>
          <div className="stat-sub"><Columns3 size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Columns</div>
        </div>
        <div className="stat-card amber glow-hover">
          <div className="stat-label">Governance Alerts</div>
          <div className="stat-value">{issueCount}</div>
          <div className="stat-sub"><ShieldAlert size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Issues Detected</div>
        </div>
      </div>

      {/* AI Summary */}
      {dataset.summary && (
        <div className="summary-card glow-hover">
          <div className="summary-label"><Sparkles size={14} /> AI Context Analysis</div>
          <p className="summary-text">{dataset.summary}</p>
        </div>
      )}

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h4>Data Type Distribution</h4>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={5}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: 'var(--text-muted)' }}
                  stroke="none"
                >
                  {typeData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>No type data available.</p>
            </div>
          )}
        </div>

        <div className="chart-card">
          <h4>Missing Values (Nulls)</h4>
          {nullData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={nullData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={0} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-input)' }} />
                <Bar dataKey="nulls" fill="var(--accent-red)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>No missing values found! Great data quality.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
