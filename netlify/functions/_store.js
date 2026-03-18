const { getStore } = require("@netlify/blobs");

function store() {
  return getStore("football-signup");
}

async function get(key, fallback) {
  const s = store();
  const value = await s.get(key, { type: "json" }).catch(() => null);
  return value ?? fallback;
}

async function set(key, value) {
  const s = store();
  await s.set(key, JSON.stringify(value), {
    metadata: { contentType: "application/json" }
  });
  return value;
}

module.exports = {
  get,
  set
};
