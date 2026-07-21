export default function TopCongested({ routes, onSelect, selected }) {
  const top = [...routes]
    .sort((a, b) => b.delay_percent - a.delay_percent)
    .slice(0, 5);

  const accentColor = (condition) =>
    condition === '🔴' ? '#dc2626' : condition === '🟡' ? '#f59e0b' : '#16a34a';

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
        Top Congested Routes
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {top.map((r, i) => {
          const isSelected =
            selected &&
            selected.origin === r.origin &&
            selected.destination === r.destination;

          return (
            <div
              key={i}
              onClick={() => onSelect(r)}
              style={{
                padding: '10px 12px',
                background: isSelected ? '#eff6ff' : '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer',
                borderLeft: `5px solid ${accentColor(r.traffic_condition)}`,
                boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                border: isSelected
                  ? '1px solid #93c5fd'
                  : '1px solid #e2e8f0',
                borderLeftWidth: '5px',
                borderLeftColor: accentColor(r.traffic_condition),
                transition: 'background 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                  {r.origin}
                </strong>
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: accentColor(r.traffic_condition)
                  }}
                >
                  {r.delay_percent}%
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                → {r.destination}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
