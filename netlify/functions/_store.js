function getEnvKey(key) {
  return `PLAYER_DB_${key.toUpperCase()}`;
}

async function get(key, fallback) {
  const envKey = getEnvKey(key);
  const raw = process.env[envKey];
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function set(key, value) {
  const envKey = getEnvKey(key);
  process.env[envKey] = JSON.stringify(value);
  return value;
}

module.exports = {
  get,
  set
};
