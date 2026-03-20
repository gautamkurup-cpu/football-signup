export default async () => {
  const repo = "gautamkurup-cpu/football-signup";
  const filePath = "players.json";
  const token = process.env.GITHUB_TOKEN;

  // -----------------------------
  // 1. Fetch players.json from GitHub
  // -----------------------------
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  // -----------------------------
  // 2. If file doesn't exist, return empty list
  // -----------------------------
  if (res.status === 404) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  // -----------------------------
  // 3. Handle unexpected errors
  // -----------------------------
  if (res.status !== 200) {
    const errText = await res.text();
    return new Response(JSON.stringify({ error: errText }), { status: 500 });
  }

  // -----------------------------
  // 4. Decode and parse JSON
  // -----------------------------
  const data = await res.json();
  const content = atob(data.content);
  const players = JSON.parse(content);

  // -----------------------------
  // 5. Return full player list
  // -----------------------------
  return new Response(JSON.stringify(players), { status: 200 });
};
