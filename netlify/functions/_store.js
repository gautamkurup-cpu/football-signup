import { getStore } from "@netlify/blobs";

function store() {
  // This is your Player DB bucket — separate from signup
  return getStore("players-dev");
}

export async function getState() {
  const s = store();
  const state = await s.get("state", { type: "json" }).catch(() => null);

  if (state) return state;

  const initial = { players: [] };
  await s.set("state", JSON.stringify(initial), {
    metadata: { contentType: "application/json" }
  });

  return initial;
}

export async function saveState(state) {
  const s = store();
  await s.set("state", JSON.stringify(state), {
    metadata: { contentType: "application/json" }
  });
  return state;
}
