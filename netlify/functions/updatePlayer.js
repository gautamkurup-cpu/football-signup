const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  const file = path.join(process.cwd(), "data/players.json");
  const players = JSON.parse(fs.readFileSync(file, "utf8"));

  const updated = JSON.parse(event.body);

  const index = players.findIndex(p => p.id === updated.id);
  players[index] = updated;

  fs.writeFileSync(file, JSON.stringify(players, null, 2));

  return { statusCode: 200, body: "OK" };
};
