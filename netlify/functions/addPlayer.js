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
    name,
    ballControl,
    pace,
    shooting,
    passing,
    defending,
    workRate,
    goalKeeping
  } = body;

  // -----------------------------
  // 2. Build attributes object
  // -----------------------------
  const attributes = {
    ballControl,
    pace,
    shooting,
    passing,
    defending,
    workRate,
    goalKeeping
  };

  // -----------------------------
  // 3. Compute position scores
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
  // 5. Compute overall rating (1–10 scale)
  // -----------------------------
  const bestScore = scoreMap[bestPosition];
  const overallRating = Number(((bestScore / 30) * 10).toFixed(2));

  // -----------------------------
  // 6. Build final player object
  // -----------------------------
  const newPlayer = {
    id: crypto.randomUUID(),
    name,
    attributes,
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
  // 7. Fetch existing players
  // -----------------------------
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

  // -----------------------------
  // 8. Add new player
  // -----------------------------
  players.push(newPlayer);

  // -----------------------------
  // 9. Save back to GitHub
  // -----------------------------
  await writeToGitHub(repo, filePath, token, JSON.stringify(players, null, 2));

  return new Response(JSON.stringify({ success: true, player: newPlayer }), { status: 200 });
};
