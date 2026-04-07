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

function setScopeInfo(text) {
  const info = el("adminScopeInfo");
  if (!info) return;
  info.textContent = text || "";
}

async function loadScopeInfo() {
  try {
    const res = await fetch(`/api/diagnostics?ts=${Date.now()}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const context = data.context || "unknown";
    const branch = data.branch || "unknown";
    const storeName = data.storeName || "unknown";
    setScopeInfo(`Scope: ${context}/${branch} | Store: ${storeName}`);
  } catch {
    setScopeInfo("Scope: unavailable");
  }
}

// ✅ Cache-busting version: always fetch fresh state
async function loadSharedState() {
  const res = await fetch(`/api/state?ts=${Date.now()}`, { cache: "no-store" });
  return await res.json();
}

function renderList(players) {
  const list = el("adminList");
  const count = el("countAdmin");
  const resetBtn = el("resetBtn");

  if (!list || !count) return;

  list.innerHTML = "";
  count.textContent = players.length;

  players.forEach((name) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    li.style.gap = "10px";

    const span = document.createElement("span");
    span.textContent = name;

    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.style.width = "auto";
    btn.style.padding = "8px 10px";
    btn.style.background = "#333";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.cursor = "pointer";

    btn.onclick = async () => {
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

    li.appendChild(span);
    li.appendChild(btn);
    list.appendChild(li);
  });

  if (resetBtn) resetBtn.disabled = players.length === 0;
}

async function refresh() {
  const state = await loadSharedState();
  renderList(state.players || []);
}

el("loginBtn").onclick = async () => {
  adminSecret = (el("adminPass").value || "").trim();
  if (!adminSecret) {
    setLoginMsg("Enter password", true);
    return;
  }

  el("loginBox").style.display = "none";
  el("adminPanel").style.display = "block";

  await loadScopeInfo();
  await refresh();
  setAdminMsg("Loaded shared list");
};

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
