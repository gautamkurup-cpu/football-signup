import { writeToGitHub } from "./githubWrite.js";

export async function handler(event) {
  const repo = "gautamkurup-cpu/football-signup";
  const filePath = "players.json";
  const branch = process.env.PLAYER_DB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;

  const { id } = JSON.parse(event.body);

  // Load existing players
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}` }
  });

  let players = [];
  let sha = null;

  if (res.ok) {
    const data = await res.json();
    sha = data.sha;
    players = JSON.parse(Buffer.from(data.content, "base64").toString("utf8"));
  }

  // Remove the player
  const updated = players.filter(p => p.id !== id);

  await writeToGitHub(
    repo,
    filePath,
    token,
    JSON.stringify(updated, null, 2),
    sha,
    branch
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
}
