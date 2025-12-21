export default function Legend() {
  return (
    <div
      style={{
        background: '#ffffff',
        padding: '8px',
        borderRadius: '6px',
        fontSize: '12px',
        marginTop: '12px',
        border: '1px solid #cbd5e1'
      }}
    >
      <strong>Traffic Status</strong>
      <div>🟢 Normal (&lt;25%)</div>
      <div>🟡 Moderate (25–60%)</div>
      <div>🔴 Heavy (&gt;60%)</div>
    </div>
  );
}
