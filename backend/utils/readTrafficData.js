const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const DATA_FILE_PATH =
  process.env.DATA_FILE_PATH || path.join(__dirname, '../data/traffic-log.json');

function readTrafficData() {
  const absPath = path.isAbsolute(DATA_FILE_PATH)
    ? DATA_FILE_PATH
    : path.join(process.cwd(), DATA_FILE_PATH);

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

module.exports = { readTrafficData };
