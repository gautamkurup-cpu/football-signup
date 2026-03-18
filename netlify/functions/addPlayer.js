const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

exports.handler = async (event) => {
  const file = path.join(process.cwd(), "data/players.json");
  const players = JSON.parse(fs.readFileSync(file, "utf8"));

  const newPlayer = JSON.parse(event.body);
  newPlayer.id = uuid();

  players.push(newPlayer);

  fs.writeFileSync(file, JSON.stringify(players, null, 2));

  return { statusCode: 200, body: "OK" };
};
