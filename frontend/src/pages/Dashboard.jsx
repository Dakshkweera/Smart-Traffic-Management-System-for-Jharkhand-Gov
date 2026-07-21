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
            minWidth: '360px',
            maxWidth: '440px',
            padding: '20px',
            overflowY: 'auto',
            background: '#f8fafc',
            borderLeft: '1px solid #dbe2ea'
          }}
        >
          <StatusBar routes={routes} />
          <TopCongested routes={routes} onSelect={setSelected} selected={selected} />
          <RouteDetails route={selected} />
          <Legend />
        </div>
      </div>
    </div>
  );
}