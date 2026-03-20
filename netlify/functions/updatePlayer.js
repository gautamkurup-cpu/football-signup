import { writeToGitHub } from "./githubWrite.js";

export async function handler(event) {
  const repo = "gautamkurup-cpu/football-signup";
  const filePath = "players.json";
  const branch = process.env.PLAYER_DB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;

  const body = JSON.parse(event.body);

  // Load existing players
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}` }
  });

  if (!res.ok) {
    return { statusCode: 500, body: "File not found" };
  }

  const data = await res.json();
  const sha = data.sha;

  let players = [];
  try {
    players = JSON.parse(Buffer.from(data.content, "base64").toString("utf8"));
  } catch {
    players = [];
  }

  // Find player
  const idx = players.findIndex(p => p.id === body.id);
  if (idx === -1) {
    return { statusCode: 404, body: "Player not found" };
  }

  // Update player fields
  const updated = players[idx];
  updated.name = body.name;

  // New 4-rating model
  updated.attributes = {
    forward: Number(body.forward),
    mid: Number(body.mid),
    defence: Number(body.defence),
    gk: Number(body.gk)
  };

  const a = updated.attributes;

  // Compute best position (highest rating)
  const scores = {
    FWD: a.forward,
    MID: a.mid,
    DEF: a.defence,
    GK: a.gk
  };

  const bestPosition = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0][0];

  updated.computed = {
    bestPosition
  };

  players[idx] = updated;

  // Write back to GitHub
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
