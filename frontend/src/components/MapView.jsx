import { Fragment, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  Tooltip,
  useMap
} from 'react-leaflet';

const center = [23.3441, 85.3096];

function getRouteColor(condition) {
  if (condition === '🔴') return '#dc2626';
  if (condition === '🟡') return '#f59e0b';
  return '#16a34a';
}

// Case/whitespace-insensitive so a route typed or stored in a different
// case (e.g. "cm house" vs "CM House") still matches as the same route.
function sameRoute(a, b) {
  if (!a || !b) return false;
  const norm = (s) => (s || '').trim().toLowerCase();
  return norm(a.origin) === norm(b.origin) && norm(a.destination) === norm(b.destination);
}

// Classic Google-Maps-style teardrop pin for the destination
function pinIcon(color, size = 30) {
  const height = size * 1.4;
  return L.divIcon({
    className: 'route-pin-icon',
    html: `
      <svg width="${size}" height="${height}" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg" style="display:block; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.35));">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="14" cy="14" r="5.5" fill="#ffffff"/>
      </svg>`,
    iconSize: [size, height],
    iconAnchor: [size / 2, height]
  });
}

function FitToRoutes({ routes }) {
  const map = useMap();

  useEffect(() => {
    if (!routes.length) return;
    const points = routes.flatMap((r) => r.path);
    if (points.length) {
      map.fitBounds(points, { padding: [40, 40] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes.length]);

  return null;
}

export default function MapView({ routes, selected, onSelect }) {
  const mapRef = useRef(null);

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%', background: '#e8edf2' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
        subdomains="abcd"
        maxZoom={19}
      />

      <FitToRoutes routes={routes} />

      {routes.map((r, idx) => {
        const isSelected = sameRoute(selected, r);

        const color = getRouteColor(r.traffic_condition);
        const origin = r.path[0];
        const destination = r.path[r.path.length - 1];

        return (
          <Fragment key={idx}>
            {/* Casing: soft dark outline underneath for a road-like, layered look */}
            <Polyline
              positions={r.path}
              pathOptions={{
                color: '#1e293b',
                weight: isSelected ? 11 : 9,
                opacity: 0.18,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              interactive={false}
            />

            {/* Main route line */}
            <Polyline
              positions={r.path}
              pathOptions={{
                color,
                weight: isSelected ? 6 : 4.5,
                opacity: isSelected ? 1 : 0.85,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              eventHandlers={{
                click: () => onSelect && onSelect(r)
              }}
            >
              <Tooltip sticky opacity={0.95}>
                <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                  <strong>{r.origin}</strong>
                  <br />→ {r.destination}
                  <br />
                  Delay: {r.delay_percent}%
                </div>
              </Tooltip>
            </Polyline>

            {/* Origin: Google-Maps-style start circle */}
            <CircleMarker
              center={origin}
              radius={isSelected ? 8 : 6.5}
              pathOptions={{
                color: '#ffffff',
                weight: 3,
                fillColor: color,
                fillOpacity: 1
              }}
              interactive={false}
            />

            {/* Destination: Google-Maps-style teardrop pin */}
            <Marker
              position={destination}
              icon={pinIcon(color, isSelected ? 34 : 28)}
              interactive={false}
            />
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
