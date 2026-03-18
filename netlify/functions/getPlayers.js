import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore("players");
  const data = await store.get("players.json", { type: "json" }) || [];

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
}
