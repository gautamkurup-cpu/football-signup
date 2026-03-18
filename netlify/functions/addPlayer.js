import { getStore } from "@netlify/blobs";

const uuid = () => Math.random().toString(36).substring(2, 10);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const store = getStore("players");
  const players = await store.get("players.json", { type: "json" }) || [];

  const newPlayer = JSON.parse(event.body);
  newPlayer.id = uuid();

  players.push(newPlayer);

  await store.set("players.json", players);

  return {
    statusCode: 200,
    body: "OK"
  };
}
