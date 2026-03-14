let adminSecret = "";
let editingId = null;

const el = (id) => document.getElementById(id);

function setLoginMsg(t, err = false) {
  const m = el("loginMsg");
  m.textContent = t;
  m.style.color = err ? "#b00020" : "#1a7f37";
}

function setAdminMsg(t, err = false) {
  const m = el("adminMsg");
  m.textContent = t;
  m.style.color = err ? "#b00020" : "#1b6cff";
}

async function loadPlayers() {
  const res = await fetch(`/api/players-v1?ts=${Date.now()}`, { cache: "no-store" });
  return await res.json();
}

function renderPlayers(players) {
  const tbody = el("playersTable");
  tbody.innerHTML = "";

  players.sort((a, b) => a.name.localeCompare(b.name));

  players.forEach((p) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.pace}</td>
      <td>${p.shooting}</td>
      <td>${p.ballControl}</td>
      <td>${p.passing}</td>
      <td>${p.defending}</td>
      <td>${p.physical}</td>
      <td>${p.notes || ""}</td>
      <td><button data-edit="${p.id}">Edit</button></td>
      <td><button data-del="${p.id}">Delete</button></td>
    `;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.onclick = () => startEdit(btn.dataset.edit)
  );

  tbody.querySelectorAll("[data-del]").forEach((btn) =>
    btn.onclick = () => deletePlayer(btn.dataset.del)
  );
}

async function refresh() {
  const players = await loadPlayers();
  renderPlayers(players);
}

function getFormData() {
  return {
    name: el("pName").value.trim(),
    pace: Number(el("pPace").value),
    shooting: Number(el("pShooting").value),
    ballControl: Number(el("pBallControl").value),
    passing: Number(el("pPassing").value),
    defending: Number(el("pDefending").value),
    physical: Number(el("pPhysical").value),
    notes: el("pNotes").value.trim()
  };
}

function validatePlayer(p) {
  if (!p.name) return "Name required";

  const nums = ["pace", "shooting", "ballControl", "passing", "defending", "physical"];
  for (const k of nums) {
    if (isNaN(p[k]) || p[k] < 1 || p[k] > 10) return `${k} must be 1–10`;
  }

  return null;
}

async function savePlayer() {
  const data = getFormData();
  const err = validatePlayer(data);
  if (err) {
    setAdminMsg(err, true);
    return;
  }

  const method = editingId ? "PUT" : "POST";
  const body = { secret: adminSecret, ...data };
  if (editingId) body.id = editingId;

  const res = await fetch("/api/players-v1", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (res.status === 401) {
    setAdminMsg("Unauthorized", true);
    return;
  }

  editingId = null;
  el("cancelEditBtn").style.display = "none";
  clearForm();
  await refresh();
  setAdminMsg("Saved");
}

function clearForm() {
  el("pName").value = "";
  el("pPace").value = "";
  el("pShooting").value = "";
  el("pBallControl").value = "";
  el("pPassing").value = "";
  el("pDefending").value = "";
  el("pPhysical").value = "";
  el("pNotes").value = "";
}

async function startEdit(id) {
  const players = await loadPlayers();
  const p = players.find((x) => x.id === id);
  if (!p) return;

  editingId = id;

  el("pName").value = p.name;
  el("pPace").value = p.pace;
  el("pShooting").value = p.shooting;
  el("pBallControl").value = p.ballControl;
  el("pPassing").value = p.passing;
  el("pDefending").value = p.defending;
  el("pPhysical").value = p.physical;
  el("pNotes").value = p.notes || "";

  el("cancelEditBtn").style.display = "block";
}

async function deletePlayer(id) {
  if (!confirm("Delete this player?")) return;

  const res = await fetch("/api/players-v1", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: adminSecret, id })
  });

  if (res.status === 401) {
    setAdminMsg("Unauthorized", true);
    return;
  }

  await refresh();
  setAdminMsg("Deleted");
}

el("loginBtn").onclick = async () => {
  adminSecret = el("adminPass").value.trim();
  if (!adminSecret) {
    setLoginMsg("Enter password", true);
    return;
  }

  el("loginBox").style.display = "none";
  el("adminPanel").style.display = "block";

  await refresh();
  setAdminMsg("Loaded");
};

el("savePlayerBtn").onclick = savePlayer;
el("cancelEditBtn").onclick = () => {
  editingId = null;
  clearForm();
  el("cancelEditBtn").style.display = "none";
};

