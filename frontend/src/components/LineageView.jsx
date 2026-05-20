import React from 'react';
import { GitBranch, Activity, Database, CheckCircle2 } from 'lucide-react';

export default function LineageView({ dataset }) {
  const lineage = dataset?.lineage || [];

  if (lineage.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div style={{
          width: 80, height: 80, borderRadius: 'var(--radius-xl)', 
          background: 'rgba(190, 242, 100, 0.1)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          border: '1px solid rgba(190, 242, 100, 0.15)'
        }}>
          <GitBranch size={32} color="var(--accent)" />
        </div>
        <h3>No Lineage Found</h3>
        <p>This dataset currently has no tracked transformations or lineage history.</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="card-title" style={{ marginBottom: 24 }}>
        <GitBranch size={18} className="icon" />
        Data Lineage Flow
      </div>
      
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
                <div style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  padding: '24px', 
                  borderRadius: 'var(--radius-2xl)',
                  boxShadow: 'var(--shadow-card)',
                  display: 'inline-block',
                  minWidth: '400px',
                  transition: 'var(--transition-slow)',
                  position: 'relative',
                  overflow: 'hidden'
                }} className="glow-hover">
                  
                  {isFirst && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--gradient-success)' }} />}
                  {isLast && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--gradient-hero)' }} />}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isFirst ? <Database size={16} color="var(--accent-green)" /> : isLast ? <CheckCircle2 size={16} color="var(--accent-indigo)" /> : <Activity size={16} color="var(--text-muted)" />}
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--text-muted)' }}>
                        {isFirst ? 'SOURCE INGESTION' : isLast ? 'FINAL STATE' : 'TRANSFORMATION'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontWeight: 600 }}>
                      {new Date(step.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    {step.transformation_step}
                  </h4>
                  
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
                    Source: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{step.source_name}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
