const store = require("./_store");

exports.handler = async (event) => {
  const method = event.httpMethod;

  // GET — return all players
  if (method === "GET") {
    const players = await store.get("players-dev", []);
    return {
      statusCode: 200,
      body: JSON.stringify(players)
    };
  }

  // Parse body for POST/PUT/DELETE
  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // Admin secret check
  if (body.secret !== process.env.ADMIN_SECRET) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  // Load existing players
  let players = await store.get("players-dev", []);

  // POST — create new player
  if (method === "POST") {
    const newPlayer = {
      id: Date.now().toString(),
      name: body.name,
      pace: body.pace,
      shooting: body.shooting,
      ballControl: body.ballControl,
      passing: body.passing,
      defending: body.defending,
      physical: body.physical,
      goalkeeping: body.goalkeeping
    };

    players.push(newPlayer);
    await store.set("players-dev", players);

    return {
      statusCode: 200,
      body: JSON.stringify(newPlayer)
    };
  }

  // PUT — update existing player
  if (method === "PUT") {
    const idx = players.findIndex((p) => p.id === body.id);
    if (idx === -1) {
      return { statusCode: 404, body: "Player not found" };
    }

    players[idx] = {
      ...players[idx],
      name: body.name,
      pace: body.pace,
      shooting: body.shooting,
      ballControl: body.ballControl,
      passing: body.passing,
      defending: body.defending,
      physical: body.physical,
      goalkeeping: body.goalkeeping
    };

    await store.set("players-dev", players);

    return {
      statusCode: 200,
      body: JSON.stringify(players[idx])
    };
  }

  // DELETE — remove player
  if (method === "DELETE") {
    players = players.filter((p) => p.id !== body.id);
    await store.set("players-dev", players);

    return {
      statusCode: 200,
      body: "Deleted"
    };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
