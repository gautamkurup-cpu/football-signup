import fetch from "node-fetch";

export async function writeToGitHub(repo, path, token, content, sha, branch) {
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  const body = {
    message: `Update ${path}`,
    content: Buffer.from(content).toString("base64"),
    sha: sha || undefined,
    branch: branch
  };

  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}
