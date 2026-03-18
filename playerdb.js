async function loadPlayers() {
  const res = await fetch("/.netlify/functions/getPlayers");
  const players = await res.json();

  const body = document.getElementById("playerBody");
  body.innerHTML = "";

  players.forEach(p => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${p.name}</td>
      <td>${p.ballControl}</td>
      <td>${p.shooting}</td>
      <td>${p.passing}</td>
      <td>${p.defending}</td>
      <td>${p.physicality}</td>
      <td>${p.workRate}</td>
      <td>${p.goalkeeping}</td>
      <td><button onclick="editPlayer('${p.id}')">Edit</button></td>
      <td><button onclick="deletePlayer('${p.id}')">Delete</button></td>
    `;

    body.appendChild(row);
  });
}

document.getElementById("addBtn").onclick = async () => {
  const player = {
    name: document.getElementById("name").value,
    ballControl: Number(document.getElementById("ballControl").value),
    shooting: Number(document.getElementById("shooting").value),
    passing: Number(document.getElementById("passing").value),
    defending: Number(document.getElementById("defending").value),
    physicality: Number(document.getElementById("physicality").value),
    workRate: Number(document.getElementById("workRate").value),
    goalkeeping: Number(document.getElementById("goalkeeping").value)
  };

  await fetch("/.netlify/functions/addPlayer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(player)
  });

  loadPlayers();
};

async function deletePlayer(id) {
  await fetch("/.netlify/functions/deletePlayer?id=" + id);
  loadPlayers();
}

loadPlayers();
