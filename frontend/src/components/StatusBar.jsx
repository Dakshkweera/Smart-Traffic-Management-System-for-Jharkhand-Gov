function Stat({ label, value, color, icon }) {
  return (
    <div
      style={{
        flex: 1,
        background: '#ffffff',
        padding: '14px',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
        borderTop: `3px solid ${color}`
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
          {label}
        </div>
        <div style={{ fontSize: '16px' }}>{icon}</div>
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
        {value}
      </div>
    </div>
  );
}

export default function StatusBar({ routes }) {
  const total = routes.length;

  const moderate = routes.filter(
    (r) => r.delay_percent >= 25 && r.delay_percent <= 60
  ).length;

  const heavy = routes.filter((r) => r.delay_percent > 60).length;

  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      <Stat label="Total Routes" value={total} color="#0ea5e9" icon="🗺️" />
      <Stat label="Moderate" value={moderate} color="#f59e0b" icon="🟡" />
      <Stat label="Heavy" value={heavy} color="#dc2626" icon="🔴" />
    </div>
  );
}
