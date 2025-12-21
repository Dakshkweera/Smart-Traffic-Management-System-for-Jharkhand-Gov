import { MapContainer, TileLayer, Polyline } from 'react-leaflet';

const center = [23.3441, 85.3096];

function getRouteColor(condition) {
  if (condition === '🔴') return 'red';
  if (condition === '🟡') return 'orange';
  return 'green';
}

export default function MapView({ routes, selected, onSelect }) {
  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {routes.map((r, idx) => {
        const isSelected =
          selected &&
          selected.origin === r.origin &&
          selected.destination === r.destination;

        return (
          <Polyline
            key={idx}
            positions={r.path}
            pathOptions={{
              color: getRouteColor(r.traffic_condition),
              weight: isSelected ? 8 : 6,
              opacity: 0.9
            }}
            eventHandlers={{
              click: () => onSelect && onSelect(r)
            }}
          />
        );
      })}
    </MapContainer>
  );
}
