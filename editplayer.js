// 1. Get player ID from URL
const urlParams = new URLSearchParams(window.location.search);
const playerId = urlParams.get("id");

if (!playerId) {
  document.getElementById("editMsg").textContent = "No player ID provided.";
}

// 2. Load player data and pre-fill form
async function loadPlayer() {
  const res = await fetch("/.netlify/functions/getPlayers");
  const players = await res.json();

  const player = players.find(p => p.id === playerId);

  if (!player) {
    document.getElementById("editMsg").textContent = "Player not found.";
    return;
  }

  const a = player.attributes;

  // Fill new fields
  document.getElementById("name").value = player.name;
  document.getElementById("forward").value = a.forward;
  document.getElementById("mid").value = a.mid;
  document.getElementById("defence").value = a.defence;
  document.getElementById("gk").value = a.gk;
}

// 3. Save updated player
document.getElementById("saveBtn").onclick = async function () {
  const payload = {
    id: playerId,
    name: document.getElementById("name").value.trim(),
    forward: Number(document.getElementById("forward").value),
    mid: Number(document.getElementById("mid").value),
    defence: Number(document.getElementById("defence").value),
    gk: Number(document.getElementById("gk").value)
  };

  const msg = document.getElementById("editMsg");

  const res = await fetch("/.netlify/functions/updatePlayer", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.success) {
    msg.textContent = "Player updated!";
    setTimeout(() => {
      window.location.href = "playerdb.html";
    }, 800);
  } else {
    msg.textContent = "Error updating player.";
  }
};

loadPlayer();
