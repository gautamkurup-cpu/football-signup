import { getState, saveState } from "./_store.js";
import { v4 as uuid } from "uuid";

export default async (req) => {
  const method = req.method;

  if (method === "GET") {
    const state = await getState();
    return Response.json(state.players || []);
  }

  const body = await req.json().catch(() => ({}));
  const secret = body.secret;

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const state = await getState();
  state.players = state.players || [];

  if (method === "POST") {
    const p = {
      id: uuid(),
      name: body.name,
      pace: body.pace,
      shooting: body.shooting,
      ballControl: body.ballControl,
      passing: body.passing,
      defending: body.defending,
      physical: body.physical,
      notes: body.notes || ""
    };

    state.players.push(p);
    await saveState(state);
    return Response.json(state.players);
  }

  if (method === "PUT") {
    const id = body.id;
    const idx = state.players.findIndex((x) => x.id === id);
    if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });

    state.players[idx] = {
      ...state.players[idx],
      name: body.name,
      pace: body.pace,
      shooting: body.shooting,
      ballControl: body.ballControl,
      passing: body.passing,
      defending: body.defending,
      physical: body.physical,
      notes: body.notes || ""
    };

    await saveState(state);
    return Response.json(state.players);
  }

  if (method === "DELETE") {
    const id = body.id;
    state.players = state.players.filter((x) => x.id !== id);
    await saveState(state);
    return Response.json(state.players);
  }

  return new Response("Method Not Allowed", { status: 405 });
};

