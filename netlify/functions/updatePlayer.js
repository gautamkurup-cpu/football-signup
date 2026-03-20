import { writeToGitHub } from "./githubWrite.js";

export default async (request) => {
  const repo = "gautamkurup-cpu/football-signup";
  const filePath = "players.json";
  const token = process.env.GITHUB_TOKEN;

  // -----------------------------
  // 1. Parse incoming request body
  // -----------------------------
  const body = await request.json();

  const {
    id,
    name,
    ballControl,
    pace,
    shooting,
    passing,
    defending,
    workRate,
    goalKeeping
  } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing player ID" }), { status: 400 });
  }

  // -----------------------------
  // 2. Build updated attributes
  // -----------------------------
  const updatedAttributes = {
    ballControl,
    pace,
    shooting,
    passing,
    defending,
    workRate,
    goalKeeping
  };

  // -----------------------------
  // 3. Recompute position scores
  // -----------------------------
  const forwardScore = shooting + pace + ballControl;
  const midScore = passing + workRate + ballControl;
  const defenderScore = defending + workRate + ballControl;
  const goalkeeperScore = (goalKeeping * 2) + passing;

  // -----------------------------
  // 4. Determine best position
  // -----------------------------
  const scoreMap = {
    FWD: forwardScore,
    MID: midScore,
    DEF: defenderScore,
    GK: goalkeeperScore
  };

  const bestPosition = Object.keys(scoreMap).reduce((a, b) =>
    scoreMap[a] > scoreMap[b] ? a : b
  );

  // -----------------------------
  // 5. Compute overall rating (1–10)
  // -----------------------------
  const bestScore = scoreMap[bestPosition];
  const overallRating = Number(((bestScore / 30) * 10).toFixed(2));

  // -----------------------------
  // 6. Fetch existing players
  // -----------------------------
  const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (getRes.status !== 200) {
    const errText = await getRes.text();
    return new Response(JSON.stringify({ error: errText }), { status: 500 });
  }

  const data = await getRes.json();
  const content = atob(data.content);
  let players = JSON.parse(content);

  // -----------------------------
  // 7. Find and update the player
  // -----------------------------
  const index = players.findIndex((p) => p.id === id);

  if (index === -1) {
    return new Response(JSON.stringify({ error: "Player not found" }), { status: 404 });
  }

  players[index] = {
    ...players[index],
    name,
    attributes: updatedAttributes,
    computed: {
      forwardScore,
      midScore,
      defenderScore,
      goalkeeperScore,
      bestPosition,
      overallRating
    }
  };

  // -----------------------------
  // 8. Save updated list to GitHub
  // -----------------------------
  await writeToGitHub(repo, filePath, token, JSON.stringify(players, null, 2));

  return new Response(JSON.stringify({ success: true, player: players[index] }), { status: 200 });
};
