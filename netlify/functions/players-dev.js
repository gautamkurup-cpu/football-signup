import { getState, saveState } from "./_store.js";
import { v4 as uuid } from "uuid";

export default async (req) => {
  const method = req.method;

  // Use a separate key for dev players
  const state = await getState();
  state.players_dev = state.players_dev || [];

  if (method === "GET") {
    return Response.json(state.players_dev);
  }

  const body = await req.json().catch(() => ({}));
  const secret = body.secret;

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

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

    state.players_dev.push(p);
    await saveState(state);
    return Response.json(state.players_dev);
  }

  if (method === "PUT") {
    const id = body.id;
    const idx = state.players_dev.findIndex((x) => x.id === id);
    if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });

    state.players_dev[idx] = {
      ...state.players_dev[idx],
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
    return Response.json(state.players_dev);
  }

  if (method === "DELETE") {
    const id = body.id;
    state.players_dev = state.players_dev.filter((x) => x.id !== id);
    await saveState(state);
    return Response.json(state.players_dev);
  }

  return new Response("Method Not Allowed", { status: 405 });
};
