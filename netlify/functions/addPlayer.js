import { writeToGitHub } from "./githubWrite.js";

export async function handler(event) {
  const repo = "gautamkurup-cpu/football-signup";
  const filePath = "players.json";
  const branch = process.env.PLAYER_DB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;

  const body = JSON.parse(event.body);

  // Build new player object with new 4-rating model
  const newPlayer = {
    id: crypto.randomUUID(),
    name: body.name,
    attributes: {
      forward: Number(body.forward),
      mid: Number(body.mid),
      defence: Number(body.defence),
      gk: Number(body.gk)
    }
  };

  const a = newPlayer.attributes;

  // Compute best position (highest of the 4 ratings)
  const scores = {
    FWD: a.forward,
    MID: a.mid,
    DEF: a.defence,
    GK: a.gk
  };

  const bestPosition = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0][0];

  newPlayer.computed = {
    bestPosition
  };

  // Load existing players (if file exists)
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}` }
  });

  let players = [];
  let sha = null;

  if (res.ok) {
    const data = await res.json();
    sha = data.sha;

    try {
      players = JSON.parse(Buffer.from(data.content, "base64").toString("utf8"));
    } catch {
      players = [];
    }
  }

  // Add new player
  players.push(newPlayer);

  // Write updated file back to GitHub
  await writeToGitHub(
    repo,
    filePath,
    token,
    JSON.stringify(players, null, 2),
    sha,
    branch
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
}
