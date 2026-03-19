export default async () => {
  const repo = "gautamkurup-cpu/football-signup";
  const filePath = "players.json";
  const token = process.env.GITHUB_TOKEN;

  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 404) {
      // File doesn't exist yet → treat as empty list
      return new Response(JSON.stringify([]), { status: 200 });
    }

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: errText }), { status: 500 });
    }

    const data = await res.json();
    const content = atob(data.content);
    return new Response(content, { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
