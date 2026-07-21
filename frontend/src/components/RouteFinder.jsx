import { useMemo, useState } from 'react';

const norm = (s) => (s || '').trim().toLowerCase();

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '13px',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  boxSizing: 'border-box'
};

function AutocompleteField({ placeholder, value, onChange, options }) {
  const [open, setOpen] = useState(false);

  const suggestions =
    value.trim().length > 0
      ? options.filter((o) => norm(o).startsWith(norm(value))).slice(0, 6)
      : [];

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        style={inputStyle}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 20,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            marginTop: '2px',
            boxShadow: '0 4px 10px rgba(15,23,42,0.12)',
            maxHeight: '160px',
            overflowY: 'auto'
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={i}
              // onMouseDown fires before the input's onBlur, so the click registers
              onMouseDown={() => {
                onChange(s);
                setOpen(false);
              }}
              style={{
                padding: '7px 10px',
                fontSize: '12.5px',
                cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RouteFinder({ allRoutes, apiUrl, onPreview, onTracked }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searched, setSearched] = useState(false);
  const [match, setMatch] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [trackedMsg, setTrackedMsg] = useState(null);
  const [validationMsg, setValidationMsg] = useState(null);

  // "From" suggests every known place name (origin or destination)
  const originNames = useMemo(() => {
    const names = new Set();
    allRoutes.forEach((r) => {
      if (r.origin) names.add(r.origin);
      if (r.destination) names.add(r.destination);
    });
    return Array.from(names).sort();
  }, [allRoutes]);

  // "To" suggestions are restricted to destinations that actually have a
  // registered route from whatever's currently typed in "From" — so you
  // can never pick a From/To pair that doesn't exist in the system.
  const destinationNames = useMemo(() => {
    const names = new Set();
    allRoutes.forEach((r) => {
      if (!from.trim() || norm(r.origin).includes(norm(from))) {
        if (r.destination) names.add(r.destination);
      }
    });
    return Array.from(names).sort();
  }, [allRoutes, from]);

  const noRoutesFromHere = from.trim().length > 0 && destinationNames.length === 0;

  function handleSearch(e) {
    e.preventDefault();
    setTrackedMsg(null);

    if (!from.trim() || !to.trim()) {
      setValidationMsg('Please fill in both From and To.');
      setMatch(null);
      setSearched(false);
      onPreview(null);
      return;
    }

    setValidationMsg(null);
    const found = allRoutes.find(
      (r) => norm(r.origin).includes(norm(from)) && norm(r.destination).includes(norm(to))
    );

    setMatch(found || null);
    setSearched(true);
    onPreview(found || null);
  }

  function handleClear() {
    setFrom('');
    setTo('');
    setSearched(false);
    setMatch(null);
    setTrackedMsg(null);
    setValidationMsg(null);
    onPreview(null);
  }

  async function handleTrack() {
    if (!match) return;
    setTracking(true);
    setTrackedMsg(null);

    try {
      const res = await fetch(`${apiUrl}/api/traffic/tracked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: match.origin, destination: match.destination })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to add to home');
      }

      setTrackedMsg('✓ Added to home dashboard');
      onTracked();
    } catch (err) {
      setTrackedMsg(err.message);
    } finally {
      setTracking(false);
    }
  }

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
        Find a Route
      </h3>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
        }}
      >
        <form onSubmit={handleSearch}>
          <div style={{ marginBottom: '8px' }}>
            <AutocompleteField
              placeholder="From…"
              value={from}
              onChange={(v) => {
                setFrom(v);
                setTo('');
              }}
              options={originNames}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <AutocompleteField
              placeholder="To…"
              value={to}
              onChange={setTo}
              options={destinationNames}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                background: '#0f3d5c',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Find Route
            </button>
            {searched && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {noRoutesFromHere && (
          <div
            style={{
              marginTop: '10px',
              fontSize: '12px',
              color: '#92400e',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              padding: '8px 10px'
            }}
          >
            No monitored routes start from "{from}" yet.
          </div>
        )}

        {validationMsg && (
          <div
            style={{
              marginTop: '10px',
              fontSize: '12px',
              color: '#dc2626'
            }}
          >
            {validationMsg}
          </div>
        )}

        {searched && !match && (
          <div
            style={{
              marginTop: '12px',
              fontSize: '12.5px',
              color: '#92400e',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              padding: '10px'
            }}
          >
            No monitored route found from "{from}" to "{to}". This system currently only
            knows about pre-loaded routes.
          </div>
        )}

        {match && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
              {match.origin}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
              → {match.destination}
            </div>
            <div style={{ fontSize: '12px', color: '#334155', marginBottom: '10px' }}>
              Delay: <strong>{match.delay_percent}%</strong> · {match.distance_km} km ·{' '}
              {match.realtime_min} min
            </div>
            <button
              onClick={handleTrack}
              disabled={tracking}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                opacity: tracking ? 0.7 : 1
              }}
            >
              {tracking ? 'Adding…' : '+ Track this route'}
            </button>
            {trackedMsg && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#334155' }}>
                {trackedMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
