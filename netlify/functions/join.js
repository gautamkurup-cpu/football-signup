import { getState, saveState } from "./_store.js";

export default async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body.name || "").trim();

    if (!name) {
      return Response.json({ error: "Name required" }, { status: 400 });
    }

    // Read state + version
    let { state, version } = await getState();

    // Prevent duplicates
    if (!state.players.includes(name)) {
      state.players.push(name);
    }

    // Try atomic write
    const result = await saveState(state, version).catch(() => null);

    if (!result) {
      // Write failed due to race — retry once
      let retry = await getState();

      if (!retry.state.players.includes(name)) {
        retry.state.players.push(name);
      }

      await saveState(retry.state, retry.version);

      return Response.json(retry.state);
    }

    return Response.json(state);

  } catch (err) {
    return Response.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
};
