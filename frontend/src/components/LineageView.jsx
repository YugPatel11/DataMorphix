import React from 'react';
import { GitBranch } from 'lucide-react';

export default function LineageView({ dataset }) {
  const lineage = dataset?.lineage || [];

  if (lineage.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div className="empty-icon">🔗</div>
        <h3>No Lineage Data</h3>
        <p>Lineage information will appear here once the dataset has been processed.</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="card-title" style={{ marginBottom: 20 }}>
        <GitBranch size={18} className="icon" />
        Data Lineage Flow
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 24, marginTop: 0 }}>
        Tracks the complete transformation pipeline from upload to final analysis.
      </p>

      <div className="lineage-flow">
        {lineage.map((step, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === lineage.length - 1;

          return (
            <div className="lineage-step" key={step.id || idx}>
              <div className="lineage-connector">
                <div className={`lineage-dot ${isFirst ? 'first' : isLast ? 'last' : ''}`}></div>
                {!isLast && <div className="lineage-line"></div>}
              </div>
              <div className="lineage-content">
                <h4>{step.transformation_step}</h4>
                <p>{step.source_name} • {new Date(step.created_at).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
