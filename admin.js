const MAX_PLAYERS = 14;

let adminSecret = "";

const el = (id) => document.getElementById(id);

function setLoginMsg(text, isError = false) {
  const m = el("loginMsg");
  if (!m) return;
  m.textContent = text || "";
  m.style.color = isError ? "#b00020" : "#1a7f37";
}

function setAdminMsg(text, isError = false) {
  const m = el("adminMsg");
  if (!m) return;
  m.textContent = text || "";
  m.style.color = isError ? "#b00020" : "#1b6cff";
}

// Always fetch fresh state
async function loadSharedState() {
  const res = await fetch(`/api/state?ts=${Date.now()}`, { cache: "no-store" });
  return await res.json();
}

/*  
  ⭐ UPDATED renderList()
  - Now writes into #playersList (not #adminList)
  - Updates #playerCount (not #countAdmin)
  - Uses .player-row layout from new admin.html
*/
function renderList(players) {
  const list = el("playersList");
  const count = el("playerCount");
  const resetBtn = el("resetBtn");

  if (!list || !count) return;

  list.innerHTML = "";
  count.textContent = players.length;

  players.forEach((name) => {
    const row = document.createElement("div");
    row.className = "player-row";

    row.innerHTML = `
      <span>${name}</span>
      <button class="remove-btn" data-name="${name}">Remove</button>
    `;

    list.appendChild(row);
  });

  // Attach remove handlers
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.onclick = async () => {
      const name = btn.dataset.name;
      if (!confirm(`Remove ${name}?`)) return;

      const resp = await fetch("/api/adminRemove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: adminSecret, name })
      });

      if (resp.status === 401) {
        setAdminMsg("Unauthorized (wrong password or ADMIN_SECRET not set)", true);
        return;
      }

      const data = await resp.json().catch(() => ({}));
      renderList(data.players || []);
      setAdminMsg(`${name} removed`);
    };
  });

  if (resetBtn) resetBtn.disabled = players.length === 0;
}

async function refresh() {
  const state = await loadSharedState();
  renderList(state.players || []);
}

/*  
  ⭐ LOGIN BUTTON
  - Works exactly the same
  - Shows adminPanel (unchanged)
*/
el("loginBtn").onclick = async () => {
  adminSecret = (el("adminPass").value || "").trim();
  if (!adminSecret) {
    setLoginMsg("Enter password", true);
    return;
  }

  el("loginBox").style.display = "none";
  el("adminPanel").style.display = "block";

  await refresh();
  setAdminMsg("Loaded shared list");
};

/*  
  ⭐ RESET BUTTON
  - Now attached to #resetBtn in new layout
*/
el("resetBtn").onclick = async () => {
  if (!confirm("Reset list for everyone?")) return;

  const resp = await fetch("/api/adminReset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: adminSecret })
  });

  if (resp.status === 401) {
    setAdminMsg("Unauthorized (wrong password or ADMIN_SECRET not set)", true);
    return;
  }

  const data = await resp.json().catch(() => ({}));
  renderList(data.players || []);
  setAdminMsg("List reset");
};
// ------------------------------------------------------------
// TEAM GENERATOR HOOKS (Phase 1 UI only — no logic yet)
// ------------------------------------------------------------

if (el("tgLoadSignup")) {
  el("tgLoadSignup").onclick = () => {
    el("tgSignupList").textContent = "Loading signup list...";
  };
}

if (el("tgMatchBtn")) {
  el("tgMatchBtn").onclick = () => {
    el("tgMatchResults").textContent = "Matching players...";
  };
}

if (el("tgAddExtraBtn")) {
  el("tgAddExtraBtn").onclick = () => {
    el("tgExtraPlayers").textContent = "Extra player selection coming...";
  };
}

if (el("tgGenerateBtn")) {
  el("tgGenerateBtn").onclick = () => {
    el("tgTeamsOutput").textContent = "Generating teams...";
  };
}

if (el("tgPublishBtn")) {
  el("tgPublishBtn").onclick = () => {
    el("tgPublishStatus").textContent = "Publishing teams...";
  };
}
