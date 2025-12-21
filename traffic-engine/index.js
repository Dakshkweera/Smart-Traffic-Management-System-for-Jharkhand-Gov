import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import locations from './locations.js';

dotenv.config();

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const OUTPUT_FILE =
  process.env.OUTPUT_FILE || path.join(process.cwd(), 'traffic-log.json');

if (!API_KEY) {
  console.error('❌ GOOGLE_MAPS_API_KEY missing in .env');
  process.exit(1);
}

function parseDuration(str) {
  if (!str) return 0;
  const match = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function classifyCondition(delayPercent) {
  if (delayPercent < 25) return '🟢';
  if (delayPercent <= 60) return '🟡';
  return '🔴';
}

function ensureOutputFile() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    fs.writeFileSync(OUTPUT_FILE, '[]', 'utf-8');
  }
}

function appendEntry(entry) {
  const raw = fs.readFileSync(OUTPUT_FILE, 'utf-8');
  const arr = raw.trim() ? JSON.parse(raw) : [];
  arr.push(entry);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(arr, null, 2));
}

async function run() {
  ensureOutputFile();

  for (const route of locations) {
    try {
      const body = {
        origin: {
          location: {
            latLng: {
              latitude: route.origin.lat,
              longitude: route.origin.lng
            }
          }
        },
        destination: {
          location: {
            latLng: {
              latitude: route.destination.lat,
              longitude: route.destination.lng
            }
          }
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
        departureTime: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };

      const res = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask':
            'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        console.error('Routes API error:', res.status, await res.text());
        continue;
      }

      const data = await res.json();
      if (!data.routes || !data.routes[0]) {
        console.error('No route returned for', route.origin.address);
        continue;
      }

      const routeData = data.routes[0];

      const durationSec = parseDuration(routeData.duration);
      const realtimeMin = durationSec / 60;

      const freeflowSec = route.freeflow_time * 60;
      const delayPercent =
        ((durationSec - freeflowSec) / freeflowSec) * 100;

      const distanceKm =
        routeData.distanceMeters != null
          ? routeData.distanceMeters / 1000
          : route.distance_km || 0;

      const trafficCondition = classifyCondition(delayPercent);

      const now = new Date();
      const entry = {
        time: now.toISOString(),
        date: now.toISOString().slice(0, 10),
        departure_time: now.toTimeString().slice(0, 5),
        origin: route.origin.address,
        destination: route.destination.address,
        realtime_min: Number(realtimeMin.toFixed(1)),
        freeflow_time: route.freeflow_time,
        traffic_delay_min: Number(
          (realtimeMin - route.freeflow_time).toFixed(1)
        ),
        delay_percent: Number(delayPercent.toFixed(1)),
        distance_km: Number(distanceKm.toFixed(1)),
        traffic_condition: trafficCondition,
        origin_lat: route.origin.lat,
        origin_lng: route.origin.lng,
        destination_lat: route.destination.lat,
        destination_lng: route.destination.lng,
        path: [
          [route.origin.lat, route.origin.lng],
          [route.destination.lat, route.destination.lng]
        ]
      };

      appendEntry(entry);
      console.log('Logged route:', entry.origin, '→', entry.destination);
    } catch (err) {
      console.error('Error computing route for', route.origin.address, err);
    }
  }
}

run();
