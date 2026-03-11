import { getState, saveState } from "./_store.js";

export default async (req) => {
  const body = await req.json().catch(() => ({}));
  const secret = body.secret;
  const name = (body.name || "").trim();

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!name) {
    return Response.json({ error: "Name required" }, { status: 400 });
  }

  const state = await getState();
  state.players = (state.players || []).filter((p) => p !== name);

  await saveState(state);

  return Response.json(state);
};
