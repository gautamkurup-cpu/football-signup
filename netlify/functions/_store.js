const { getStore } = require("@netlify/blobs");

function store() {
  return getStore("football-signup");
}

async function getState() {
  const s = store();
  const state = await s.get("state", { type: "json" }).catch(() => null);

  if (state) return state;

  const initial = { players: [] };
  await s.set("state", JSON.stringify(initial), {
    metadata: { contentType: "application/json" }
  });

  return initial;
}

async function saveState(state) {
  const s = store();
  await s.set("state", JSON.stringify(state), {
    metadata: { contentType: "application/json" }
  });
  return state;
}

module.exports = {
  getState,
  saveState
};
