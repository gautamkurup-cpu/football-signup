const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  const file = path.join(__dirname, "../../data/players.json");
  const data = fs.readFileSync(file, "utf8");
  return {
    statusCode: 200,
    body: data
  };
};
