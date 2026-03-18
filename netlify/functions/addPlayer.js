exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

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
