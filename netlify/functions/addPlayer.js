import { writeToGitHub } from "./githubWrite.js";

export async function handler(event) {
  const repo = "gautamkurup-cpu/football-signup";
  const filePath = "players.json";
  const branch = process.env.PLAYER_DB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;

  const body = JSON.parse(event.body);

  // Build new player object
  const newPlayer = {
    id: crypto.randomUUID(),
    name: body.name,
    attributes: {
      ballControl: body.ballControl,
      pace: body.pace,
      shooting: body.shooting,
      passing: body.passing,
      defending: body.defending,
      workRate: body.workRate,
      goalKeeping: body.goalKeeping
    }
  };

  // Compute scores
  const a = newPlayer.attributes;
  const forwardScore = a.ballControl + a.pace + a.shooting;
  const midScore = a.ballControl + a.passing + a.workRate;
  const defenderScore = a.defending + a.workRate + a.ballControl;
  const goalkeeperScore = (a.goalKeeping*2) + a.passing;

  const bestPosition = (() => {
    const scores = {
      FWD: forwardScore,
      MID: midScore,
      DEF: defenderScore,
      GK: goalkeeperScore
    };
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  })();

  const overallRating = Number(
    ((forwardScore + midScore + defenderScore + goalkeeperScore) / 4).toFixed(2)
  );

  newPlayer.computed = {
    forwardScore,
    midScore,
    defenderScore,
    goalkeeperScore,
    bestPosition,
    overallRating
  };

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

  players.push(newPlayer);

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
