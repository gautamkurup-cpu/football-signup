const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  const file = path.join(process.cwd(), "data/players.json");
  const data = fs.readFileSync(file, "utf8");

  return {
    statusCode: 200,
    body: data
  };
};
