import { useCallback, useEffect, useState } from 'react';
import MapView from '../components/MapView';
import TopCongested from '../components/TopCongested';
import RouteDetails from '../components/RouteDetails';
import StatusBar from '../components/StatusBar';
import Legend from '../components/Legend';
import RouteFinder from '../components/RouteFinder';
import AskAI from '../components/AskAI';

// ---------------------------------------------------------
// Dynamic URL selection: tries the Vercel env var first,
// falls back to localhost for local dev.
// ---------------------------------------------------------
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function Dashboard() {
  const [trackedRoutes, setTrackedRoutes] = useState([]);
  const [allRoutes, setAllRoutes] = useState([]);
  const [previewRoute, setPreviewRoute] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTracked = useCallback(() => {
    return fetch(`${API_URL}/api/traffic/tracked`)
      .then((res) => res.json())
      .then((data) => {
        setTrackedRoutes(data);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to fetch tracked routes:', err);
        setError('Failed to load traffic data');
        setLoading(false);
      });
  }, []);

  const fetchAll = useCallback(() => {
    return fetch(`${API_URL}/api/traffic/latest`)
      .then((res) => res.json())
      .then(setAllRoutes)
      .catch((err) => console.error('Failed to fetch full route list:', err));
  }, []);

  useEffect(() => {
    fetchTracked();
    fetchAll();
  }, [fetchTracked, fetchAll]);

  // After tracking a new route, drop the preview and go back to the home view
  function handleTracked() {
    setPreviewRoute(null);
    fetchTracked();
    fetchAll();
  }

  async function handleUntrack(route) {
    if (!window.confirm(`Remove "${route.origin} → ${route.destination}" from home?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/traffic/tracked`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: route.origin, destination: route.destination })
      });
      if (!res.ok) throw new Error('Failed to remove route');
      if (selected && selected.origin === route.origin && selected.destination === route.destination) {
        setSelected(null);
      }
      fetchTracked();
    } catch (err) {
      alert(err.message);
    }
  }

  const mapRoutes = previewRoute ? [previewRoute] : trackedRoutes;

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        background: '#eef2f6',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: '14px 28px',
          background: '#0f3d5c',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '28px', lineHeight: 1 }}>🚦</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '19px', fontWeight: 600, letterSpacing: '0.2px' }}>
              AI Traffic Intelligence Dashboard
            </h1>
            <div style={{ fontSize: '12.5px', color: '#cbd8e3', marginTop: '2px' }}>
              Government of Jharkhand · Ranchi City Pilot
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: '12px',
            background: 'rgba(255,255,255,0.12)',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.25)'
          }}
        >
          ● Live Monitoring
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}
      >
        {/* MAP SECTION */}
        <div
          style={{
            flex: 7,
            position: 'relative',
            background: '#e2e8f0'
          }}
        >
          {loading || error ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                fontSize: '14px'
              }}
            >
              {loading ? 'Loading traffic data…' : error}
            </div>
          ) : (
            <MapView
              routes={mapRoutes}
              selected={selected || previewRoute}
              onSelect={setSelected}
            />
          )}
        </div>

        {/* RIGHT PANEL */}
        <div
          style={{
            flex: 3,
            minWidth: '360px',
            maxWidth: '440px',
            padding: '20px',
            overflowY: 'auto',
            background: '#f8fafc',
            borderLeft: '1px solid #dbe2ea'
          }}
        >
          <StatusBar routes={trackedRoutes} />
          <RouteFinder
            allRoutes={allRoutes}
            apiUrl={API_URL}
            onPreview={setPreviewRoute}
            onTracked={handleTracked}
          />
          <TopCongested
            routes={trackedRoutes}
            onSelect={setSelected}
            selected={selected}
            onUntrack={handleUntrack}
          />
          <RouteDetails route={selected} />
          <AskAI apiUrl={API_URL} />
          <Legend />
        </div>
      </div>
    </div>
  );
}
