import { getState, saveState } from "./_store.js";

export default async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body.name || "").trim();

    if (!name) {
      return Response.json({ error: "Name required" }, { status: 400 });
    }

    // Try up to 2 times to mitigate races
    let state;
    for (let attempt = 0; attempt < 2; attempt++) {
      state = await getState();

      // Prevent duplicates
      if (!Array.isArray(state.players)) {
        state.players = [];
      }
      if (!state.players.includes(name)) {
        state.players = [...state.players, name];
      }

      await saveState(state);

      // Re-read to confirm
      const confirm = await getState();
      if (Array.isArray(confirm.players) && confirm.players.includes(name)) {
        state = confirm;
        break;
      }
    }

    return Response.json(state);
  } catch (err) {
    return Response.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
};
