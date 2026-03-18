import { getStore } from "@netlify/blobs";

export async function handler(event) {
  const id = event.queryStringParameters.id;

  const store = getStore("players");
  const players = await store.get("players.json", { type: "json" }) || [];

  const filtered = players.filter(p => p.id !== id);

  await store.set("players.json", filtered);

  return { statusCode: 200, body: "OK" };
}
