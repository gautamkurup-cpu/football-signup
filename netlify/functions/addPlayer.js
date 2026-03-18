const fs = require("fs");
const path = require("path");

const uuid = () => Math.random().toString(36).substring(2, 10);

exports.handler = async (event) => {
  const file = path.join(process.cwd(), "data/players.json");
  const players = JSON.parse(fs.readFileSync(file, "utf8"));

  const newPlayer = JSON.parse(event.body);
  newPlayer.id = uuid();

  players.push(newPlayer);

  fs.writeFileSync(file, JSON.stringify(players, null, 2));

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: "OK"
  };
};
