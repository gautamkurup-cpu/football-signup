export async function writeToGitHub(repo, filePath, token, newContent) {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  // Check if file exists to get its SHA (needed for updates)
  const getRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  let sha = null;

  if (getRes.status === 200) {
    const existing = await getRes.json();
    sha = existing.sha;
  } else if (getRes.status !== 404) {
    const errText = await getRes.text();
    throw new Error(`Error checking file: ${errText}`);
  }

  const encoded = btoa(newContent);

  const body = {
    message: "Update players.json",
    content: encoded,
    sha: sha || undefined
  };

  const putRes = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`Error writing file: ${err}`);
  }

  return true;
}
