export async function handler() {
  const repo = "gautamkurup-cpu/football-signup";
  const filePath = "players.json";
  const branch = process.env.BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;

  const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `token ${token}` }
    });

    if (!res.ok) {
      return { statusCode: 200, body: "[]" };
    }

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf8");

    return {
      statusCode: 200,
      body: content
    };
  } catch (err) {
    return { statusCode: 200, body: "[]" };
  }
}
