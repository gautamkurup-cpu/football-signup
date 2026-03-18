import { getStore } from "@netlify/blobs";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const store = getStore("players");
  const players = await store.get("players.json", { type: "json" }) || [];

  const updated = JSON.parse(event.body);
  const index = players.findIndex(p => p.id === updated.id);

  if (index !== -1) {
    players[index] = updated;
  }

  await store.set("players.json", players);

  return { statusCode: 200, body: "OK" };
}
