import React, { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { queryDataset } from '../api';

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
      const answer = await queryDataset(dataset.id, userQuery);
      setHistory((prev) => [...prev, { role: 'ai', text: answer }]);
    } catch (err) {
      setHistory((prev) => [...prev, { role: 'ai', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'What does this dataset contain?',
    'Show all date columns',
    'Which columns have missing values?',
    'What are the key identifiers?',
  ];

  return (
    <div className="query-container animate-in">
      <div className="card-title" style={{ marginBottom: 16 }}>
        <Sparkles size={18} className="icon" />
        Ask AI About Your Data
      </div>

      {/* Suggestions */}
      {history.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
                fontFamily: 'var(--font-main)',
              }}
              onMouseOver={(e) => { e.target.style.borderColor = 'var(--accent-indigo)'; e.target.style.color = 'var(--accent-indigo)'; }}
              onMouseOut={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Conversation History */}
      {history.length > 0 && (
        <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {history.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                animation: 'fadeSlideIn 0.3s ease-out',
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              }}>
                {msg.role === 'user' ? <User size={14} color="#3b82f6" /> : <Bot size={14} color="#6366f1" />}
              </div>
              <div style={{
                flex: 1,
                background: msg.role === 'user' ? 'transparent' : 'var(--bg-card)',
                border: msg.role === 'ai' ? '1px solid var(--border-color)' : 'none',
                borderRadius: 'var(--radius-lg)',
                padding: msg.role === 'ai' ? '12px 16px' : '4px 0',
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.15)' }}>
                <Bot size={14} color="#6366f1" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <span className="spinner"></span> Thinking…
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
          placeholder="Ask anything about your data… e.g. 'What does customer_id mean?'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="query-send-btn" disabled={loading || !query.trim()}>
          <Send size={16} /> Ask
        </button>
      </form>
    </div>
  );
}
