const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const DATA_FILE_PATH =
  process.env.DATA_FILE_PATH || path.join(__dirname, '../data/traffic-log.json');

function resolveDataPath() {
  return path.isAbsolute(DATA_FILE_PATH)
    ? DATA_FILE_PATH
    : path.join(process.cwd(), DATA_FILE_PATH);
}

function readTrafficData() {
  const absPath = resolveDataPath();

  const raw = fs.readFileSync(absPath, 'utf-8');

  // if file is an array JSON
  if (raw.trim().startsWith('[')) {
    return JSON.parse(raw);
  }

  // if file is newline-delimited JSON (NDJSON)
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => JSON.parse(line));
}

function writeTrafficData(data) {
  const absPath = resolveDataPath();
  fs.writeFileSync(absPath, JSON.stringify(data, null, 2), 'utf-8');
}

// ---------------------------------------------------------------
// Shared "which routes to monitor" list, also read by the live
// traffic-engine (traffic-engine/locations.js). Keeping Add/Delete
// in sync with this file means the dashboard behaves identically
// whether traffic-log.json is static or being refreshed live from
// the Google Maps Routes API.
// ---------------------------------------------------------------
const LOCATIONS_FILE_PATH =
  process.env.LOCATIONS_FILE_PATH ||
  path.join(__dirname, '../../traffic-engine/locations.json');

function resolveLocationsPath() {
  return path.isAbsolute(LOCATIONS_FILE_PATH)
    ? LOCATIONS_FILE_PATH
    : path.join(process.cwd(), LOCATIONS_FILE_PATH);
}

function readLocations() {
  const absPath = resolveLocationsPath();
  if (!fs.existsSync(absPath)) return [];
  return JSON.parse(fs.readFileSync(absPath, 'utf-8'));
}

function writeLocations(locations) {
  const absPath = resolveLocationsPath();
  fs.writeFileSync(absPath, JSON.stringify(locations, null, 2), 'utf-8');
}

// ---------------------------------------------------------------
// Which routes are "tracked" onto the home dashboard. Separate from
// the full pre-fed dataset: a route can exist in the system (findable
// via search) without being tracked/shown on the home view.
// ---------------------------------------------------------------
const TRACKED_FILE_PATH =
  process.env.TRACKED_FILE_PATH || path.join(__dirname, '../data/tracked-routes.json');

function resolveTrackedPath() {
  return path.isAbsolute(TRACKED_FILE_PATH)
    ? TRACKED_FILE_PATH
    : path.join(process.cwd(), TRACKED_FILE_PATH);
}

function readTracked() {
  const absPath = resolveTrackedPath();
  if (!fs.existsSync(absPath)) return [];
  return JSON.parse(fs.readFileSync(absPath, 'utf-8'));
}

function writeTracked(tracked) {
  const absPath = resolveTrackedPath();
  fs.writeFileSync(absPath, JSON.stringify(tracked, null, 2), 'utf-8');
}

module.exports = {
  readTrafficData,
  writeTrafficData,
  readLocations,
  writeLocations,
  readTracked,
  writeTracked
};
