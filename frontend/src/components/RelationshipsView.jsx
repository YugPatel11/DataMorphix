import React from 'react';
import { ArrowRight, Link2, Database } from 'lucide-react';

export default function RelationshipsView({ dataset }) {
  const relations = dataset?.outgoing_relations || [];

  if (relations.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div style={{
          width: 80, height: 80, borderRadius: 'var(--radius-xl)', 
          background: 'rgba(190, 242, 100, 0.1)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          border: '1px solid rgba(190, 242, 100, 0.15)'
        }}>
          <Link2 size={32} color="var(--accent)" />
        </div>
        <h3>No Relationships Detected</h3>
        <p>We couldn't automatically map this dataset to others in your workspace. Upload more data to build the graph.</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="card-title" style={{ marginBottom: 24 }}>
        <Link2 size={18} className="icon" />
        Cross-Dataset Foreign Keys
      </div>

      <div className="relationships-grid">
        {relations.map((rel, idx) => (
          <div className="relationship-card glow-hover" key={idx} style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: 'var(--gradient-primary)' }} />
            
            {/* Source */}
            <div className="rel-endpoint" style={{ flex: 1 }}>
              <div className="rel-dataset" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Database size={12} color="var(--text-muted)" />
                {rel.source_dataset_name || dataset.name}
              </div>
              <div className="rel-column" style={{ fontSize: '1.1rem' }}>{rel.source_column}</div>
            </div>

            {/* Arrow */}
            <div className="rel-arrow" style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '50%' }}>
              <ArrowRight size={16} color="var(--text-primary)" />
            </div>

            {/* Target */}
            <div className="rel-endpoint" style={{ flex: 1, textAlign: 'right' }}>
              <div className="rel-dataset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 8 }}>
                <Database size={12} color="var(--text-muted)" />
                {rel.target_dataset_name}
              </div>
              <div className="rel-column" style={{ fontSize: '1.1rem', color: 'var(--accent-indigo)' }}>{rel.target_column}</div>
            </div>

            {/* Confidence */}
            <div className="rel-confidence" style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent-green)', border: 'none', padding: '4px 10px' }}>
              {(rel.confidence_score * 100).toFixed(0)}% MATCH
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
