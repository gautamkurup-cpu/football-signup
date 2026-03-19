import { getStore } from "@netlify/blobs";

export default async () => {
  const store = getStore("signups");
  const data = await store.get("players", { type: "json" });

  return new Response(JSON.stringify(data || []), { status: 200 });
};
