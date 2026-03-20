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

  document.getElementById("name").value = player.name;
  document.getElementById("ballControl").value = a.ballControl;
  document.getElementById("pace").value = a.pace;
  document.getElementById("shooting").value = a.shooting;
  document.getElementById("passing").value = a.passing;
  document.getElementById("defending").value = a.defending;
  document.getElementById("workRate").value = a.workRate;
  document.getElementById("goalKeeping").value = a.goalKeeping;
}

// 3. Save updated player
document.getElementById("saveBtn").onclick = async function () {
  const payload = {
    id: playerId,
    name: document.getElementById("name").value.trim(),
    ballControl: Number(document.getElementById("ballControl").value),
    pace: Number(document.getElementById("pace").value),
    shooting: Number(document.getElementById("shooting").value),
    passing: Number(document.getElementById("passing").value),
    defending: Number(document.getElementById("defending").value),
    workRate: Number(document.getElementById("workRate").value),
    goalKeeping: Number(document.getElementById("goalKeeping").value)
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
