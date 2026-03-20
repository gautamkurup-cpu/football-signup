import fetch from "node-fetch";
import { writeToGitHub } from "./githubWrite.js";

export async function handler(event) {
  const repo = "gautamkurup-cpu/football-signup";
  const filePath = "players.json";
  const branch = process.env.BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;

  const body = JSON.parse(event.body);

  const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}` }
  });

  if (!res.ok) {
    return { statusCode: 500, body: "File not found" };
  }

  const data = await res.json();
  const sha = data.sha;
  let players = JSON.parse(Buffer.from(data.content, "base64").toString("utf8"));

  const idx = players.findIndex(p => p.id === body.id);
  if (idx === -1) {
    return { statusCode: 404, body: "Player not found" };
  }

  // Update attributes
  const updated = players[idx];
  updated.name = body.name;
  updated.attributes = {
    ballControl: body.ballControl,
    pace: body.pace,
    shooting: body.shooting,
    passing: body.passing,
    defending: body.defending,
    workRate: body.workRate,
    goalKeeping: body.goalKeeping
  };

  // Recompute scores
  const a = updated.attributes;
  const forwardScore = a.ballControl + a.pace + a.shooting;
  const midScore = a.ballControl + a.passing + a.workRate;
  const defenderScore = a.defending + a.workRate + a.passing;
  const goalkeeperScore = a.goalKeeping + a.ballControl;

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

  updated.computed = {
    forwardScore,
    midScore,
    defenderScore,
    goalkeeperScore,
    bestPosition,
    overallRating
  };

  players[idx] = updated;

  await writeToGitHub(repo, filePath, token, JSON.stringify(players, null, 2), sha, branch);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
}
