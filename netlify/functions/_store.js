import { connectLambda, getStore } from "@netlify/blobs";

function store(event) {
  // Required in Lambda compatibility mode so Blobs works in production
  connectLambda(event); // [2](https://www.codestudy.net/blog/netlify-how-do-you-deploy-sites-that-are-nested-in-a-folder/)
  return getStore("football-signup");
}

export async function getState(event) {
  const s = store(event);

  // Correct way to fetch JSON from Blobs (getJSON is not available here)
  const state = await s.get("state", { type: "json" }).catch(() => null); // [1](https://github.com/opennextjs/opennextjs-netlify/issues/2703)

  if (state) return state;

  const initial = { players: [] };

  // Store JSON as a string (safe + portable)
  await s.set("state", JSON.stringify(initial), {
    metadata: { contentType: "application/json" }
  });

  return initial;
}

export async function saveState(event, state) {
  const s = store(event);

  await s.set("state", JSON.stringify(state), {
    metadata: { contentType: "application/json" }
  });

  return state;
}
