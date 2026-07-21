function Chip({ dot, label }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: '#334155'
      }}
    >
      <span
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: dot,
          display: 'inline-block'
        }}
      />
      {label}
    </div>
  );
}

export default function Legend() {
  return (
    <div
      style={{
        background: '#ffffff',
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
      }}
    >
      <div
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#334155',
          marginBottom: '8px'
        }}
      >
        Traffic Status
      </div>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <Chip dot="#16a34a" label="Normal (<25%)" />
        <Chip dot="#f59e0b" label="Moderate (25–60%)" />
        <Chip dot="#dc2626" label="Heavy (>60%)" />
      </div>
    </div>
  );
}
