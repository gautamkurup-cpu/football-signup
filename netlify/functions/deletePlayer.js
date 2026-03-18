const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  const file = path.join(process.cwd(), "data/players.json");
  const players = JSON.parse(fs.readFileSync(file, "utf8"));

  const id = event.queryStringParameters.id;

  const filtered = players.filter(p => p.id !== id);

  fs.writeFileSync(file, JSON.stringify(filtered, null, 2));

  return { statusCode: 200, body: "OK" };
};
