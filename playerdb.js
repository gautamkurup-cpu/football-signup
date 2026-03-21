/* -----------------------------------------
   Position Icons
----------------------------------------- */
const positionIcons = {
  "FWD": "⚽",
  "MID": "🎯",
  "DEF": "🛡️",
  "GK": "🧤"
};

/* -----------------------------------------
   Load Players into Table
----------------------------------------- */
async function loadPlayers() {
  const res = await fetch("/.netlify/functions/getPlayers");
  const players = await res.json();

  const tbody = document.getElementById("playerTableBody");
  tbody.innerHTML = "";

  players.forEach((player, index) => {
    const tr = document.createElement("tr");

    const a = player.attributes;
    const c = player.computed;

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${player.name}</td>
      <td>${a.forward}</td>
      <td>${a.mid}</td>
      <td>${a.defence}</td>
      <td>${a.gk}</td>
      <td>${positionIcons[c.bestPosition] || ""} ${c.bestPosition}</td>
      <td>
        <button class="edit-btn" onclick="editPlayer('${player.id}')">Edit</button>
      </td>
      <td>
        <button class="delete-btn" onclick="deletePlayer('${player.id}')">Delete</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* -----------------------------------------
   Edit Player
----------------------------------------- */
function editPlayer(id) {
  window.location.href = `editplayer.html?id=${id}`;
}

/* -----------------------------------------
   Delete Player
----------------------------------------- */
async function deletePlayer(id) {
  if (!confirm("Delete this player?")) return;

  await fetch("/.netlify/functions/deletePlayer", {
    method: "POST",
    body: JSON.stringify({ id })
  });

  loadPlayers(); // refresh table
}

/* -----------------------------------------
   Search Filter
----------------------------------------- */
document.getElementById("searchInput").addEventListener("input", function () {
  const term = this.value.toLowerCase();
  const rows = document.querySelectorAll("#playerTableBody tr");

  rows.forEach(row => {
    const name = row.children[1].textContent.toLowerCase(); // name column
    row.style.display = name.includes(term) ? "" : "none";
  });
});

/* -----------------------------------------
   Sortable Columns with Toggle
----------------------------------------- */
let currentSortCol = null;
let currentSortDir = "asc";

document.querySelectorAll("#playerTable thead th").forEach((header, index) => {
  header.addEventListener("click", () => sortTable(index, header));
});

function sortTable(colIndex, header) {
  const tbody = document.getElementById("playerTableBody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  // Determine sort direction
  if (currentSortCol === colIndex) {
    currentSortDir = currentSortDir === "asc" ? "desc" : "asc";
  } else {
    currentSortCol = colIndex;
    currentSortDir = "asc";
  }

  // Remove previous sort classes
  document.querySelectorAll("th").forEach(th => {
    th.classList.remove("sorted-asc", "sorted-desc");
  });

  // Add new sort class
  header.classList.add(currentSortDir === "asc" ? "sorted-asc" : "sorted-desc");

  const sorted = rows.sort((a, b) => {
    const A = a.children[colIndex].textContent.trim();
    const B = b.children[colIndex].textContent.trim();

    const numA = parseFloat(A);
    const numB = parseFloat(B);

    let comparison;

    if (!isNaN(numA) && !isNaN(numB)) {
      comparison = numA - numB;
    } else {
      comparison = A.localeCompare(B);
    }

    return currentSortDir === "asc" ? comparison : -comparison;
  });

  tbody.innerHTML = "";
  sorted.forEach(r => tbody.appendChild(r));
}

/* -----------------------------------------
   Initial Load
----------------------------------------- */
loadPlayers();
