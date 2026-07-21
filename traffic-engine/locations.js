import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Shared with the backend: adding/deleting a route from the dashboard
// updates this same file, so the live-fetch engine monitors exactly the
// routes visible on the dashboard, whether data is static or live.
const locations = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'locations.json'), 'utf-8')
);

export default locations;
