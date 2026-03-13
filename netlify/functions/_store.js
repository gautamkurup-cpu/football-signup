import { getStore } from "@netlify/blobs";

function store() {
  return getStore("football-signup");
}

// Return BOTH state + version metadata
export async function getState() {
  const s = store();

  // getWithMetadata gives us version for atomic writes
  const result = await s.getWithMetadata("state", { type: "json" }).catch(() => null);

  if (result?.value) {
    return {
      state: result.value,
      version: result.metadata?.version
    };
  }

  // Initialise if missing
  const initial = { players: [] };
  const metadata = await s.set("state", JSON.stringify(initial), {
    metadata: { contentType: "application/json" }
  });

  return { state: initial, version: metadata.version };
}

// Atomic write using ifMatch
export async function saveState(state, version) {
  const s = store();

  return await s.set("state", JSON.stringify(state), {
    metadata: { contentType: "application/json" },
    ifMatch: version // <--- atomic compare-and-set
  });
}
