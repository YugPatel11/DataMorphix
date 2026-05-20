import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { getGovernance } from '../api';

export default function GovernancePanel({ dataset }) {
  const [issues, setIssues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!dataset) return;
    setLoading(true);
    setError(null);
    getGovernance(dataset.id)
      .then((data) => setIssues(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [dataset?.id]);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner lg"></div>
        <span>Running Governance Checks…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Analysis Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!issues || issues.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div style={{
          width: 80, height: 80, borderRadius: 'var(--radius-xl)', 
          background: 'rgba(34, 197, 94, 0.1)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          border: '1px solid rgba(34, 197, 94, 0.2)'
        }}>
          <ShieldAlert size={32} color="var(--accent-green)" />
        </div>
        <h3>No Governance Violations</h3>
        <p>This dataset passed all automated security, privacy, and quality checks.</p>
      </div>
    );
  }

  // Group by severity
  const highIssues = issues.filter((i) => i.severity === 'high');
  const mediumIssues = issues.filter((i) => i.severity === 'medium');
  const lowIssues = issues.filter((i) => i.severity === 'low');

  const formatType = (type) => type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const getIcon = (severity) => {
    if (severity === 'high') return <AlertOctagon size={20} color="var(--accent-red)" />;
    if (severity === 'medium') return <AlertTriangle size={20} color="var(--accent-amber)" />;
    return <Info size={20} color="var(--accent-blue)" />;
  };

  return (
    <div className="animate-in">
      <div className="card-title" style={{ marginBottom: 24 }}>
        <ShieldAlert size={18} className="icon" />
        Governance & Compliance Report
      </div>
      
      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
        <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '20px', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--accent-red)', marginBottom: 4 }}>Critical Issues</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{highIssues.length}</div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertOctagon size={24} color="var(--accent-red)" />
          </div>
        </div>
        <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '20px', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--accent-amber)', marginBottom: 4 }}>Warnings</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{mediumIssues.length}</div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} color="var(--accent-amber)" />
          </div>
        </div>
        <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid rgba(129, 140, 248, 0.2)', padding: '20px', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: 4 }}>Low Priority</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{lowIssues.length}</div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(129, 140, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Info size={24} color="var(--accent-blue)" />
          </div>
        </div>
      </div>

      <div className="governance-list">
        {issues.map((issue, idx) => (
          <div className="governance-issue" key={idx} style={{ padding: '24px', alignItems: 'center' }}>
            <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '50%' }}>
              {getIcon(issue.severity)}
            </div>
            <div className="issue-content">
              <div className="issue-type" style={{ fontSize: '1rem', fontWeight: 800 }}>{formatType(issue.issue_type)}</div>
              <div className="issue-message" style={{ fontSize: '0.85rem', marginBottom: 8 }}>{issue.message}</div>
              <div className="issue-column" style={{ display: 'inline-block', background: 'var(--bg-input)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                Field: {issue.column_name}
              </div>
            </div>
            <span className={`severity-badge ${issue.severity}`} style={{ padding: '6px 16px' }}>{issue.severity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
