import { getState, saveState } from "./_store.js";

const MAX_PLAYERS = 14;
const MAX_RETRIES = 4;

function uniqueNames(list) {
  return [...new Set((Array.isArray(list) ? list : []).map((n) => String(n).trim()).filter(Boolean))];
}

export default async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body.name || "").trim();

    if (!name) {
      return Response.json({ error: "Name required" }, { status: 400 });
    }

    // Merge-safe retries to reduce lost updates under concurrent joins.
    let state;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      state = await getState();
      const currentPlayers = uniqueNames(state.players);

      if (currentPlayers.includes(name)) {
        return Response.json({ ...state, players: currentPlayers });
      }

      if (currentPlayers.length >= MAX_PLAYERS) {
        return Response.json(
          { error: `Game is full (${MAX_PLAYERS}/${MAX_PLAYERS})`, players: currentPlayers },
          { status: 409 }
        );
      }

      const desiredPlayers = [...currentPlayers, name];
      await saveState({ ...state, players: desiredPlayers });

      // Re-read and merge to avoid clobbering concurrent writes.
      const confirm = await getState();
      const mergedPlayers = uniqueNames([...(confirm.players || []), ...desiredPlayers]).slice(0, MAX_PLAYERS);

      if (!uniqueNames(confirm.players).includes(name) || mergedPlayers.length !== uniqueNames(confirm.players).length) {
        await saveState({ ...confirm, players: mergedPlayers });
      }

      const finalState = await getState();
      const finalPlayers = uniqueNames(finalState.players);
      if (finalPlayers.includes(name)) {
        state = { ...finalState, players: finalPlayers };
        break;
      }
    }

    const resolvedPlayers = uniqueNames(state?.players);
    if (!state || !resolvedPlayers.includes(name)) {
      return Response.json({ error: "Could not process join. Try again." }, { status: 500 });
    }

    return Response.json({ ...state, players: resolvedPlayers });
  } catch (err) {
    return Response.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
};
