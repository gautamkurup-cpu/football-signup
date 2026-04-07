import { getStore } from "@netlify/blobs";

const STORE_NAME = process.env.SIGNUP_STORE_NAME || "football-signup";

function store() {
  return getStore(STORE_NAME);
}

export function getStoreDiagnostics() {
  return {
    storeName: STORE_NAME,
    context: process.env.CONTEXT || "unknown",
    branch: process.env.BRANCH || "unknown",
    deployUrl: process.env.DEPLOY_URL || "",
    siteUrl: process.env.URL || ""
  };
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
