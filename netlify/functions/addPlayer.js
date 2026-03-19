import { writeToGitHub } from "./githubWrite.js";

export default async (request) => {
  const repo = "gautamkurup-cpu/football-signup";
  const filePath = "players.json";
  const token = process.env.GITHUB_TOKEN;

  const body = await request.json();
  const newPlayer = body; // whatever your UI sends

  // Fetch existing players (or treat as empty if missing)
  const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  let players = [];

  if (getRes.status === 200) {
    const data = await getRes.json();
    const content = atob(data.content);
    players = JSON.parse(content);
  } else if (getRes.status !== 404) {
    const errText = await getRes.text();
    return new Response(JSON.stringify({ error: errText }), { status: 500 });
  }

  players.push(newPlayer);

  await writeToGitHub(repo, filePath, token, JSON.stringify(players, null, 2));

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
