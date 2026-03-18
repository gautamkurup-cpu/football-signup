const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "players-dev.json");

// Ensure file exists
function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  }
}

async function get(key, fallback) {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

async function set(key, value) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(value, null, 2));
  return value;
}

module.exports = {
  get,
  set
};
