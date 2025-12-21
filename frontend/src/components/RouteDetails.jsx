export default function RouteDetails({ route }) {
  if (!route) return null;

  return (
    <>
      <h3>Route Details</h3>
      <div
        style={{
          background: '#ffffff',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1'
        }}
      >
        <p>
          <strong>{route.origin}</strong>
        </p>
        <p>→ {route.destination}</p>
        <p>Delay: {route.delay_percent}%</p>
        <p>Distance: {route.distance_km} km</p>
        <p>Current Travel Time: {route.realtime_min} min</p>
      </div>
    </>
  );
}
