import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Database, Link2, Loader2 } from 'lucide-react';
import { getInternalRelations } from '../api';

function formatScore(score) {
  return `${Math.round((score || 0) * 100)}%`;
}

function RelationCard({ relation, datasetName }) {
  return (
    <div className="relationship-card internal-rel-card glow-hover">
      <div className="rel-card-body">
        <div className="rel-endpoint">
          <div className="rel-dataset">
            <Database size={12} color="var(--text-muted)" />
            {datasetName}
          </div>
          <div className="rel-column">{relation.left_column}</div>
        </div>

        <div className="rel-arrow">
          <ArrowRight size={16} color="var(--text-primary)" />
        </div>

        <div className="rel-endpoint right">
          <div className="rel-dataset">
            <Database size={12} color="var(--text-muted)" />
            {datasetName}
          </div>
          <div className="rel-column accent">{relation.right_column}</div>
        </div>

        <div className="rel-confidence">{formatScore(relation.score)}</div>
      </div>

      <div className="rel-details">
        <div className="rel-type">{relation.relationship_type}</div>
        <p>{relation.explanation}</p>
        <span>{relation.evidence}</span>
      </div>
    </div>
  );
}

export default function RelationshipsView({ dataset }) {
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) return;

      if (!dataset?.id) {
        setRelations([]);
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      setError('');

      getInternalRelations(dataset.id)
        .then((data) => {
          if (isMounted) {
            setRelations(data);
          }
        })
        .catch((err) => {
          if (isMounted) {
            const message = err.response?.data?.error || 'Unable to load column relationships.';
            setError(message);
            setRelations([]);
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    });

    return () => {
      isMounted = false;
    };
  }, [dataset?.id]);

  if (loading) {
    return (
      <div className="empty-state animate-in">
        <div className="relation-state-icon">
          <Loader2 size={32} color="var(--accent)" className="spin-icon" />
        </div>
        <h3>Finding Column Relationships</h3>
        <p>Checking patterns inside the selected table.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state animate-in">
        <div className="relation-state-icon error">
          <AlertCircle size={32} color="var(--accent-red)" />
        </div>
        <h3>Relationships Not Available</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (relations.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div className="relation-state-icon">
          <Link2 size={32} color="var(--accent)" />
        </div>
        <h3>No Column Relationships Detected</h3>
        <p>This table does not have strong column-to-column patterns yet.</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="card-title relationships-title">
        <span>
          <Link2 size={18} className="icon" />
          Relationships Inside This Table
        </span>
        <small>{relations.length} detected</small>
      </div>

      <div className="relationships-grid">
        {relations.map((relation) => (
          <RelationCard
            key={`${relation.left_column}-${relation.right_column}-${relation.relationship_type}`}
            relation={relation}
            datasetName={dataset.name}
          />
        ))}
      </div>
    </div>
  );
}
