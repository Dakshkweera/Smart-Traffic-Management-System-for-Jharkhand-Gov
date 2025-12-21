const express = require('express');
const router = express.Router();

const { readTrafficData } = require('../utils/readTrafficData');

/**
 * Helper: classify traffic condition by delay percent
 */
function classifyCondition(delayPercent) {
  if (delayPercent < 25) return '🟢';
  if (delayPercent <= 60) return '🟡';
  return '🔴';
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
    const rawData = readTrafficData();
    const latestByRoute = {};

    rawData.forEach((entry) => {
      const key = `${entry.origin}__${entry.destination}`;

      const currentTime =
        new Date(entry.time || entry.timestamp || entry.date).getTime() || 0;

      const prev = latestByRoute[key];
      const prevTime =
        prev &&
        (new Date(prev.time || prev.timestamp || prev.date).getTime() || 0);

      if (!prev || currentTime >= prevTime) {
        latestByRoute[key] = entry;
      }
    });

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
    const rawData = readTrafficData();
    const latestByRoute = {};

    rawData.forEach((entry) => {
      const key = `${entry.origin}__${entry.destination}`;
      const currentTime =
        new Date(entry.time || entry.timestamp || entry.date).getTime() || 0;

      const prev = latestByRoute[key];
      const prevTime =
        prev &&
        (new Date(prev.time || prev.timestamp || prev.date).getTime() || 0);

      if (!prev || currentTime >= prevTime) {
        latestByRoute[key] = entry;
      }
    });

    const latest = Object.values(latestByRoute).map(normalizeEntry);

    const sorted = latest.sort(
      (a, b) => b.delay_percent - a.delay_percent
    );

    res.json(sorted.slice(0, 5));
  } catch (err) {
    console.error('Error /top-congested:', err);
    res.status(500).json({ error: 'Failed to compute top congested routes' });
  }
});

module.exports = router;
