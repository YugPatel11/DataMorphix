import React from 'react';
import { ArrowRight, Link2 } from 'lucide-react';

export default function RelationshipsView({ dataset }) {
  const relations = dataset?.outgoing_relations || [];

  if (relations.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div className="empty-icon">🔗</div>
        <h3>No Relationships Found</h3>
        <p>Upload more datasets to discover cross-dataset column relationships. Relationships are detected by matching column names and data types.</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="card-title" style={{ marginBottom: 8 }}>
        <Link2 size={18} className="icon" />
        Cross-Dataset Relationships
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20, marginTop: 0 }}>
        Columns that appear in multiple datasets with matching types.
      </p>

      <div className="relationships-grid">
        {relations.map((rel, idx) => (
          <div className="relationship-card" key={idx}>
            {/* Source */}
            <div className="rel-endpoint">
              <div className="rel-dataset">{rel.source_dataset_name || dataset.name}</div>
              <div className="rel-column">{rel.source_column}</div>
            </div>

            {/* Arrow */}
            <div className="rel-arrow">
              <ArrowRight size={18} />
            </div>

            {/* Target */}
            <div className="rel-endpoint">
              <div className="rel-dataset">{rel.target_dataset_name}</div>
              <div className="rel-column">{rel.target_column}</div>
            </div>

            {/* Confidence */}
            <div className="rel-confidence">
              {(rel.confidence_score * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
