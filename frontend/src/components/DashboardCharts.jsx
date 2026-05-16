import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, Columns3, Rows3, ShieldAlert, Sparkles } from 'lucide-react';

const CHART_COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: '0.78rem',
      color: '#f1f5f9',
    }}>
      <div style={{ marginBottom: 2, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
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
  const nullData = columns.map((col) => ({
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
        <div className="stat-card blue">
          <div className="stat-label">Health Score</div>
          <div className="stat-value">{healthScore}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>/100</span></div>
          <div className="health-gauge">
            <div className={`health-gauge-fill ${healthClass}`} style={{ width: `${healthScore}%` }}></div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Total Rows</div>
          <div className="stat-value">{rowCount.toLocaleString()}</div>
          <div className="stat-sub"><Rows3 size={12} style={{ verticalAlign: 'middle' }} /> records</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Total Columns</div>
          <div className="stat-value">{colCount}</div>
          <div className="stat-sub"><Columns3 size={12} style={{ verticalAlign: 'middle' }} /> fields</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Issues Found</div>
          <div className="stat-value">{issueCount}</div>
          <div className="stat-sub"><ShieldAlert size={12} style={{ verticalAlign: 'middle' }} /> governance alerts</div>
        </div>
      </div>

      {/* AI Summary */}
      {dataset.summary && (
        <div className="summary-card">
          <div className="summary-label"><Sparkles size={14} /> AI-Generated Summary</div>
          <p className="summary-text">{dataset.summary}</p>
        </div>
      )}

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h4>Missing Values by Column</h4>
          {nullData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={nullData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="nulls" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 30 }}>
              <p>No column data</p>
            </div>
          )}
        </div>

        <div className="chart-card">
          <h4>Data Type Distribution</h4>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: '#475569' }}
                >
                  {typeData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 30 }}>
              <p>No type data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
