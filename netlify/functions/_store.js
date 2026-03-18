const { kv } = require("@netlify/edge-functions");

async function get(key, fallback) {
  const value = await kv.get(key);
  return value ? JSON.parse(value) : fallback;
}

async function set(key, value) {
  await kv.set(key, JSON.stringify(value));
  return value;
}

module.exports = {
  get,
  set
};
