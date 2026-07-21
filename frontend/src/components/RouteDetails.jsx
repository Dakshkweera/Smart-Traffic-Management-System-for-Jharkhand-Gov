function Row({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '7px 0',
        borderBottom: '1px solid #f1f5f9',
        fontSize: '13px'
      }}
    >
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>
    </div>
  );
}

export default function RouteDetails({ route }) {
  if (!route) return null;

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
        Route Details
      </h3>
      <div
        style={{
          background: '#ffffff',
          padding: '14px 16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
          {route.origin}
        </div>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
          → {route.destination}
        </div>
        <Row label="Delay" value={`${route.delay_percent}%`} />
        <Row label="Distance" value={`${route.distance_km} km`} />
        <Row label="Current Travel Time" value={`${route.realtime_min} min`} />
      </div>
    </div>
  );
}
