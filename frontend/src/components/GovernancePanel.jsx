import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';
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
        <span>Running governance checks…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Error Loading Governance</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!issues || issues.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div className="empty-icon">✅</div>
        <h3>No Issues Found</h3>
        <p>Your dataset passed all governance checks. Great data quality!</p>
      </div>
    );
  }

  // Group by severity
  const highIssues = issues.filter((i) => i.severity === 'high');
  const mediumIssues = issues.filter((i) => i.severity === 'medium');
  const lowIssues = issues.filter((i) => i.severity === 'low');

  const formatType = (type) => type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const getIcon = (severity) => {
    if (severity === 'high') return <AlertTriangle size={15} color="var(--accent-red)" />;
    if (severity === 'medium') return <AlertTriangle size={15} color="var(--accent-amber)" />;
    return <Info size={15} color="var(--accent-blue)" />;
  };

  return (
    <div className="animate-in">
      <div className="card-title" style={{ marginBottom: 8 }}>
        <ShieldAlert size={18} className="icon" />
        Governance & Quality Issues
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16, marginTop: 0 }}>
        {issues.length} issue{issues.length !== 1 ? 's' : ''} detected —{' '}
        <span style={{ color: 'var(--accent-red)' }}>{highIssues.length} high</span>,{' '}
        <span style={{ color: 'var(--accent-amber)' }}>{mediumIssues.length} medium</span>,{' '}
        <span style={{ color: 'var(--accent-blue)' }}>{lowIssues.length} low</span>
      </p>

      <div className="governance-list">
        {issues.map((issue, idx) => (
          <div className="governance-issue" key={idx}>
            {getIcon(issue.severity)}
            <div className="issue-content">
              <div className="issue-type">{formatType(issue.issue_type)}</div>
              <div className="issue-column">Column: {issue.column_name}</div>
              <div className="issue-message">{issue.message}</div>
            </div>
            <span className={`severity-badge ${issue.severity}`}>{issue.severity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
