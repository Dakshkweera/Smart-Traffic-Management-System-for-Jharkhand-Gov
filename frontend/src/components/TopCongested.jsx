export default function TopCongested({ routes, onSelect }) {
  const top = [...routes]
    .sort((a, b) => b.delay_percent - a.delay_percent)
    .slice(0, 5);

  return (
    <>
      <h3>Top Congested Routes</h3>
      {top.map((r, i) => (
        <div
          key={i}
          onClick={() => onSelect(r)}
          style={{
            padding: '8px',
            marginBottom: '8px',
            background: '#ffffff',
            borderRadius: '6px',
            cursor: 'pointer',
            borderLeft: `6px solid ${
              r.traffic_condition === '🔴'
                ? '#dc2626'
                : r.traffic_condition === '🟡'
                ? '#f59e0b'
                : '#16a34a'
            }`,
            border: '1px solid #cbd5e1'
          }}
        >
          <strong>{r.origin}</strong>
          <div style={{ fontSize: '12px' }}>→ {r.destination}</div>
          <div style={{ fontSize: '12px' }}>
            Delay: {r.delay_percent}%
          </div>
        </div>
      ))}
    </>
  );
}
