import { getState, saveState } from "./_store.js";

export default async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body.name || "").trim();

    if (!name) {
      return Response.json(
        { error: "Name required" },
        { status: 400 }
      );
    }

    const state = await getState();

    state.players.push(name);
    await saveState(state);

    return Response.json(state);
  } catch (err) {
    return Response.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
};
