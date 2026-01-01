import { useEffect, useState } from 'react';
import MapView from '../components/MapView';
import TopCongested from '../components/TopCongested';
import RouteDetails from '../components/RouteDetails';
import StatusBar from '../components/StatusBar';
import Legend from '../components/Legend';

export default function Dashboard() {
  const [routes, setRoutes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ---------------------------------------------------------
    // CHANGE IS HERE: Dynamic URL selection
    // ---------------------------------------------------------
    // 1. Tries to read the Vercel environment variable first.
    // 2. If it doesn't exist (like on your laptop), defaults to localhost.
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    // Safety check: remove trailing slash if present to avoid errors like "com//api"
    const cleanUrl = API_URL.replace(/\/$/, '');

    fetch(`${cleanUrl}/api/traffic/latest`)
      .then((res) => res.json())
      .then((data) => {
        setRoutes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch traffic data:", err);
        setError('Failed to load traffic data');
        setLoading(false);
      });
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        background: '#f1f5f9',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: '16px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #cbd5e1'
        }}
      >
        <h2 style={{ margin: 0, fontSize: '20px' }}>
          AI Traffic Intelligence Dashboard
        </h2>
        <div style={{ fontSize: '13px', color: '#475569' }}>
          Ranchi City · Morning Peak Monitoring (Pilot)
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
            borderRight: '1px solid #cbd5e1'
          }}
        >
          {loading || error ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {loading ? 'Loading traffic data…' : error}
            </div>
          ) : (
            <MapView
              routes={routes}
              selected={selected}
              onSelect={setSelected}
            />
          )}
        </div>

        {/* RIGHT PANEL */}
        <div
          style={{
            flex: 3,
            padding: '16px',
            overflowY: 'auto',
            background: '#f8fafc'
          }}
        >
          <StatusBar routes={routes} />
          <TopCongested routes={routes} onSelect={setSelected} />
          <RouteDetails route={selected} />
          <Legend />
        </div>
      </div>
    </div>
  );
}