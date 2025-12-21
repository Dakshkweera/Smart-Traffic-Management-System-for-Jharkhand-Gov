function Stat({ label, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        background: '#ffffff',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #cbd5e1',
        borderLeft: `6px solid ${color}`
      }}
    >
      <div style={{ fontSize: '12px', color: '#475569' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 600 }}>{value}</div>
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
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
      <Stat label="Total Routes" value={total} color="#0ea5e9" />
      <Stat label="Moderate" value={moderate} color="#f59e0b" />
      <Stat label="Heavy" value={heavy} color="#dc2626" />
    </div>
  );
}
