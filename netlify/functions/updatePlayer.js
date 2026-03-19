import { writeToGitHub } from "./githubWrite.js";

export default async (request) => {
  const repo = "gautamkurup-cpu/football-signup";
  const filePath = "players.json";
  const token = process.env.GITHUB_TOKEN;

  const body = await request.json();
  const { id, updates } = body;

  const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!getRes.ok) {
    const errText = await getRes.text();
    return new Response(JSON.stringify({ error: errText }), { status: 500 });
  }

  const data = await getRes.json();
  const content = atob(data.content);
  let players = JSON.parse(content);

  players = players.map((p) => (p.id === id ? { ...p, ...updates } : p));

  await writeToGitHub(repo, filePath, token, JSON.stringify(players, null, 2));

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
