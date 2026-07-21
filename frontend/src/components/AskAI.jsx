import { useState } from 'react';

function lineColor(line) {
  if (line.startsWith('🔴')) return '#dc2626';
  if (line.startsWith('🟡')) return '#f59e0b';
  if (line.startsWith('🟢')) return '#16a34a';
  return '#cbd5e1';
}

function isBestOptionLine(line) {
  return /^best option:/i.test(line.trim());
}

function AnswerBlock({ text }) {
  const lines = text.split('\n').filter((l) => l.trim());

  const isStructured =
    lines.length > 1 &&
    lines.every(
      (l) =>
        l.trim().startsWith('🔴') ||
        l.trim().startsWith('🟡') ||
        l.trim().startsWith('🟢') ||
        l.trim().startsWith('- ') ||
        isBestOptionLine(l)
    );

  if (!isStructured) {
    return (
      <div style={{ fontSize: '12.5px', color: '#334155', whiteSpace: 'pre-wrap' }}>{text}</div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const best = isBestOptionLine(trimmed);

        return (
          <div
            key={i}
            style={{
              fontSize: '12.5px',
              color: '#0f172a',
              padding: '5px 8px',
              borderLeft: `3px solid ${best ? '#16a34a' : lineColor(trimmed)}`,
              background: best ? '#f0fdf4' : '#f8fafc',
              fontWeight: best ? 700 : 400,
              borderRadius: '4px'
            }}
          >
            {trimmed}
          </div>
        );
      })}
    </div>
  );
}

export default function AskAI({ apiUrl }) {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]); // [{question, answer, error}]
  const [asking, setAsking] = useState(false);

  async function handleAsk(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q || asking) return;

    setAsking(true);
    setQuestion('');

    try {
      const res = await fetch(`${apiUrl}/api/traffic/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      const body = await res.json();

      if (!res.ok) {
        setHistory((h) => [...h, { question: q, error: body.error || 'Something went wrong' }]);
      } else {
        setHistory((h) => [...h, { question: q, answer: body.answer }]);
      }
    } catch {
      setHistory((h) => [...h, { question: q, error: 'Could not reach the AI service' }]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3
        style={{
          margin: '0 0 10px',
          fontSize: '13px',
          fontWeight: 700,
          color: '#334155',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        Ask AI
      </h3>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
        }}
      >
        {history.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '10px',
              maxHeight: '220px',
              overflowY: 'auto'
            }}
          >
            {history.map((h, i) => (
              <div key={i}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                  {h.question}
                </div>
                <div style={{ marginTop: '4px' }}>
                  {h.error ? (
                    <div style={{ fontSize: '12.5px', color: '#dc2626' }}>{h.error}</div>
                  ) : (
                    <AnswerBlock text={h.answer} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAsk} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="e.g. Which roads are heavily congested right now?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '12.5px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            disabled={asking}
            style={{
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              background: '#0f3d5c',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: asking ? 0.7 : 1
            }}
          >
            {asking ? '…' : 'Ask'}
          </button>
        </form>
      </div>
    </div>
  );
}
