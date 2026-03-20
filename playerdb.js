async function loadPlayers() {
  const res = await fetch("/.netlify/functions/getPlayers");
  const players = await res.json();

  const tbody = document.getElementById("playerTableBody");
  tbody.innerHTML = "";

  players.forEach(player => {
    const tr = document.createElement("tr");

    const a = player.attributes;
    const c = player.computed;

    tr.innerHTML = `
      <td>${player.name}</td>
      <td>${a.ballControl}</td>
      <td>${a.pace}</td>
      <td>${a.shooting}</td>
      <td>${a.passing}</td>
      <td>${a.defending}</td>
      <td>${a.workRate}</td>
      <td>${a.goalKeeping}</td>
      <td>${c.bestPosition}</td>
      <td>${c.overallRating}</td>
      <td><button class="edit-btn" onclick="editPlayer('${player.id}')">Edit</button></td>
    `;

    tbody.appendChild(tr);
  });
}

function editPlayer(id) {
  // We will build editplayer.html next
  window.location.href = `editplayer.html?id=${id}`;
}

loadPlayers();
