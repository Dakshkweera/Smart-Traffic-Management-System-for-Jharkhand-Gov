const express = require('express');
const router = express.Router();

const {
  readTrafficData,
  writeTrafficData,
  readLocations,
  writeLocations,
  readTracked,
  writeTracked
} = require('../utils/readTrafficData');

/**
 * Helper: classify traffic condition by delay percent
 */
function classifyCondition(delayPercent) {
  if (delayPercent < 25) return '🟢';
  if (delayPercent <= 60) return '🟡';
  return '🔴';
}

/**
 * Helper: normalize a name for identity comparisons (case/whitespace-insensitive)
 * so "CM House, Ranchi" and "cm house, ranchi " are treated as the same route.
 */
function normalizeName(str) {
  return (str || '').trim().toLowerCase();
}

function routeKey(entry) {
  return `${normalizeName(entry.origin)}__${normalizeName(entry.destination)}`;
}

function locationKey(loc) {
  return `${normalizeName(loc.origin?.address)}__${normalizeName(loc.destination?.address)}`;
}

/**
 * Helper: normalize data (ensure traffic_condition is present)
 */
function normalizeEntry(entry) {
  const delay = Number(entry.delay_percent || entry.delayPercent || 0);

  return {
    ...entry,
    delay_percent: delay,
    traffic_condition: entry.traffic_condition || classifyCondition(delay)
  };
}

/**
 * Helper: reduce raw log entries down to the latest snapshot per route
 */
function getLatestByRoute(rawData) {
  const latestByRoute = {};

  rawData.forEach((entry) => {
    const key = routeKey(entry);
    const currentTime =
      new Date(entry.time || entry.timestamp || entry.date).getTime() || 0;

    const prev = latestByRoute[key];
    const prevTime =
      prev && (new Date(prev.time || prev.timestamp || prev.date).getTime() || 0);

    if (!prev || currentTime >= prevTime) {
      latestByRoute[key] = entry;
    }
  });

  return latestByRoute;
}

/**
 * GET /api/traffic/all
 * Returns all logged records
 */
router.get('/all', (req, res) => {
  try {
    const data = readTrafficData().map(normalizeEntry);
    res.json(data);
  } catch (err) {
    console.error('Error /all:', err);
    res.status(500).json({ error: 'Failed to read traffic data' });
  }
});

/**
 * GET /api/traffic/latest
 * Returns latest record per origin→destination
 */
router.get('/latest', (req, res) => {
  try {
    const latestByRoute = getLatestByRoute(readTrafficData());
    const data = Object.values(latestByRoute).map(normalizeEntry);
    res.json(data);
  } catch (err) {
    console.error('Error /latest:', err);
    res.status(500).json({ error: 'Failed to compute latest traffic' });
  }
});

/**
 * GET /api/traffic/top-congested
 * Returns top 5 congested routes based on latest snapshot per route
 */
router.get('/top-congested', (req, res) => {
  try {
    const latestByRoute = getLatestByRoute(readTrafficData());
    const latest = Object.values(latestByRoute).map(normalizeEntry);
    const sorted = latest.sort((a, b) => b.delay_percent - a.delay_percent);

    res.json(sorted.slice(0, 5));
  } catch (err) {
    console.error('Error /top-congested:', err);
    res.status(500).json({ error: 'Failed to compute top congested routes' });
  }
});

/**
 * GET /api/traffic/tracked
 * Returns the latest snapshot for only the routes tracked onto the home dashboard
 */
router.get('/tracked', (req, res) => {
  try {
    const latestByRoute = getLatestByRoute(readTrafficData());
    const tracked = readTracked();

    const data = tracked
      .map((t) => latestByRoute[routeKey(t)])
      .filter(Boolean)
      .map(normalizeEntry);

    res.json(data);
  } catch (err) {
    console.error('Error /tracked:', err);
    res.status(500).json({ error: 'Failed to load tracked routes' });
  }
});

/**
 * POST /api/traffic/tracked
 * Add an existing route to the home dashboard
 * Body: { origin, destination }
 */
router.post('/tracked', (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'origin and destination are required' });
    }

    const targetKey = routeKey({ origin, destination });
    const latestByRoute = getLatestByRoute(readTrafficData());

    if (!latestByRoute[targetKey]) {
      return res.status(404).json({ error: 'Route not found in the system' });
    }

    const tracked = readTracked();
    const alreadyTracked = tracked.some((t) => routeKey(t) === targetKey);

    if (!alreadyTracked) {
      tracked.push({ origin, destination });
      writeTracked(tracked);
    }

    res.status(201).json(normalizeEntry(latestByRoute[targetKey]));
  } catch (err) {
    console.error('Error POST /tracked:', err);
    res.status(500).json({ error: 'Failed to track route' });
  }
});

/**
 * DELETE /api/traffic/tracked
 * Remove a route from the home dashboard without deleting its underlying data
 * Body: { origin, destination }
 */
router.delete('/tracked', (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'origin and destination are required' });
    }

    const targetKey = routeKey({ origin, destination });
    const tracked = readTracked();
    const remaining = tracked.filter((t) => routeKey(t) !== targetKey);

    if (remaining.length === tracked.length) {
      return res.status(404).json({ error: 'Route is not currently tracked' });
    }

    writeTracked(remaining);
    res.json({ untracked: true });
  } catch (err) {
    console.error('Error DELETE /tracked:', err);
    res.status(500).json({ error: 'Failed to untrack route' });
  }
});

/**
 * Fetch real road-following geometry from the free OSRM public API.
 * Falls back to a straight line if the lookup fails.
 */
async function fetchRoutePath(originLat, originLng, destLat, destLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const json = await res.json();

    if (json.code === 'Ok' && json.routes?.[0]) {
      return json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch (err) {
    console.error('OSRM lookup failed, falling back to straight line:', err.message);
  }

  return [
    [originLat, originLng],
    [destLat, destLng]
  ];
}

/**
 * POST /api/traffic
 * Add a new route
 */
router.post('/', async (req, res) => {
  try {
    const {
      origin,
      destination,
      origin_lat,
      origin_lng,
      destination_lat,
      destination_lng,
      distance_km,
      freeflow_time,
      realtime_min
    } = req.body;

    if (
      !origin ||
      !destination ||
      [origin_lat, origin_lng, destination_lat, destination_lng, distance_km, freeflow_time, realtime_min].some(
        (v) => v === undefined || v === null || v === ''
      )
    ) {
      return res.status(400).json({ error: 'Missing required route fields' });
    }

    const oLat = Number(origin_lat);
    const oLng = Number(origin_lng);
    const dLat = Number(destination_lat);
    const dLng = Number(destination_lng);
    const dist = Number(distance_km);
    const freeflow = Number(freeflow_time);
    const realtime = Number(realtime_min);

    const delayPercent = Number((((realtime - freeflow) / freeflow) * 100).toFixed(1));

    const path = await fetchRoutePath(oLat, oLng, dLat, dLng);

    const now = new Date();
    const entry = {
      time: now.toISOString(),
      date: now.toISOString().slice(0, 10),
      departure_time: now.toTimeString().slice(0, 5),
      origin,
      destination,
      realtime_min: Number(realtime.toFixed(1)),
      freeflow_time: freeflow,
      traffic_delay_min: Number((realtime - freeflow).toFixed(1)),
      delay_percent: delayPercent,
      distance_km: Number(dist.toFixed(1)),
      traffic_condition: classifyCondition(delayPercent),
      origin_lat: oLat,
      origin_lng: oLng,
      destination_lat: dLat,
      destination_lng: dLng,
      path
    };

    const data = readTrafficData();
    data.push(entry);
    writeTrafficData(data);

    // Keep the "routes to monitor" list (shared with the live-fetch
    // engine) in sync, so this route keeps refreshing the same way
    // whether the data source is static or live Google Maps.
    const targetKey = routeKey({ origin, destination });
    const locations = readLocations();
    const alreadyMonitored = locations.some((loc) => locationKey(loc) === targetKey);
    if (!alreadyMonitored) {
      locations.push({
        origin: { address: origin, lat: oLat, lng: oLng },
        destination: { address: destination, lat: dLat, lng: dLng },
        freeflow_time: freeflow,
        distance_km: dist
      });
      writeLocations(locations);
    }

    res.status(201).json(entry);
  } catch (err) {
    console.error('Error POST /:', err);
    res.status(500).json({ error: 'Failed to add route' });
  }
});

/**
 * DELETE /api/traffic
 * Remove all records for a given origin -> destination pair
 * Body: { origin, destination }
 */
router.delete('/', (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'origin and destination are required' });
    }

    const targetKey = `${normalizeName(origin)}__${normalizeName(destination)}`;
    const data = readTrafficData();
    const remaining = data.filter((entry) => routeKey(entry) !== targetKey);

    if (remaining.length === data.length) {
      return res.status(404).json({ error: 'Route not found' });
    }

    writeTrafficData(remaining);

    // Also stop the live-fetch engine from monitoring (and re-adding) this route
    const locations = readLocations();
    const remainingLocations = locations.filter((loc) => locationKey(loc) !== targetKey);
    if (remainingLocations.length !== locations.length) {
      writeLocations(remainingLocations);
    }

    res.json({ removed: data.length - remaining.length });
  } catch (err) {
    console.error('Error DELETE /:', err);
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

/**
 * POST /api/traffic/ask
 * Natural-language Q&A over the current traffic snapshot, via Groq.
 * Body: { question }
 */
router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return res.status(503).json({ error: 'GROQ_API_KEY is not configured on the server yet' });
    }

    const latestByRoute = getLatestByRoute(readTrafficData());
    const snapshot = Object.values(latestByRoute)
      .map(normalizeEntry)
      .map(
        (r) =>
          `${r.origin} -> ${r.destination}: delay ${r.delay_percent}% (${r.traffic_condition}), ` +
          `${r.distance_km} km, current travel time ${r.realtime_min} min, free-flow ${r.freeflow_time} min`
      )
      .join('\n');

    const systemPrompt =
      'You are a traffic control-room assistant for Ranchi, Jharkhand. ' +
      'You will be given the current snapshot of monitored routes below. ' +
      'Answer the operator\'s question using ONLY this data - never guess or invent numbers, ' +
      'and if the question is about a route not listed, say it is not currently monitored.\n\n' +
      'Severity levels: 🟢 Normal = delay under 25%. 🟡 Moderate = 25-60%. 🔴 Heavy = over 60%. ' +
      'Only include routes matching the severity the operator actually asked about ' +
      '(e.g. "heavily congested" means 🔴 only, not 🟡 - do not lump severities together unless asked for all of them).\n\n' +
      'How to format the answer:\n' +
      '- If the operator asked about ONE specific, already-known route, answer in a normal, direct sentence ' +
      '(e.g. "Harmu Chowk to CM House currently has a 55.5% delay - moderate congestion.").\n' +
      '- If the operator asked for a LIST of routes (e.g. "which roads are congested"), use one route per line: ' +
      '🔴 Origin → Destination — 68% delay\n' +
      '- If the operator asked to COMPARE options or find the BEST/fastest way to reach somewhere, ' +
      'use a short bulleted list, one option per line starting with "- ", each showing the route and its delay, ' +
      'then end with one short "Best option: ..." line naming the clear winner. Never merge multiple options into one paragraph.\n' +
      '- For anything else (e.g. "traffic status around X", "how\'s it looking near Y"), write a short natural-language ' +
      'summary in plain sentences describing the routes touching that area - do NOT copy the raw snapshot rows verbatim ' +
      '(never output distance/travel-time/free-flow numbers exactly as given below; paraphrase them into a sentence instead).\n' +
      'In all cases: no restating the full data dump, no filler commentary - just the direct answer. ' +
      'If nothing matches, say so in one short sentence.\n\n' +
      `Current route snapshot:\n${snapshot || '(no routes currently monitored)'}`;

    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ]
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error('Groq API error:', groqRes.status, errBody);
      return res.status(502).json({ error: 'AI service request failed' });
    }

    const groqJson = await groqRes.json();
    const answer = groqJson.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return res.status(502).json({ error: 'AI service returned an empty response' });
    }

    res.json({ answer });
  } catch (err) {
    console.error('Error POST /ask:', err);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

module.exports = router;
