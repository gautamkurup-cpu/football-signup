import { getStore } from "@netlify/blobs";

function store() {
  return getStore("football-signup");
}

export async function getState() {
  const s = store();
  const state = await s.getJSON("state").catch(() => null);

  if (state) return state;

  const initial = { players: [] };
  await s.setJSON("state", initial);
  return initial;
}

export async function saveState(state) {
  const s = store();
  await s.setJSON("state", state);
  return state;
}
