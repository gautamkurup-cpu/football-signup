// =============================
// Football Signup — MAIN.JS (FINAL VERSION)
// =============================

// ---------- Config ----------
const MAX_PLAYERS = 14;
const POLL_INTERVAL_MS = 2000;
const POLL_PAUSE_AFTER_JOIN_MS = 6000;

// Location (display + Google Maps)
const LOCATION_NAME = "The Totteridge Academy";
const LOCATION_ADDRESS = "Barnet Ln, London N20 8AZ";
const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(`${LOCATION_NAME}, ${LOCATION_ADDRESS}`);

// Totteridge Academy coordinates (weather)
const LAT = 51.639470288472275;
const LON = -0.1997028625644069;

// ---------- State ----------
let players = [];
let pollingPausedUntil = 0;
let isSyncing = false;
let pendingJoinName = null; // protects your optimistic join

// ---------- DOM helpers ----------
const el = (id) => document.getElementById(id);

function setMsg(text, isError = false) {
  const m = el("msg");
  if (!m) return;
  m.textContent = text || "";
  m.style.color = isError ? "#b00020" : "#1a7f37";
}

function ensureSyncIndicator() {
  let s = el("syncIndicator");
  if (s) return s;

  const joinBtn = el("joinBtn");
  if (joinBtn && joinBtn.parentElement) {
    s = document.createElement("span");
    s.id = "syncIndicator";
    s.textContent = "Syncing…";
    s.style.display = "none";
    s.style.marginLeft = "10px";
    s.style.color = "#666";
    s.style.fontSize = "14px";
    s.style.verticalAlign = "middle";
    joinBtn.insertAdjacentElement("afterend", s);
    return s;
  }

  const card = document.querySelector(".card");
  if (card) {
    s = document.createElement("div");
    s.id = "syncIndicator";
    s.textContent = "Syncing…";
    s.style.display = "none";
    s.style.color = "#666";
    s.style.fontSize = "14px";
    s.style.marginTop = "8px";
    card.appendChild(s);
    return s;
  }

  return null;
}

function setSyncing(on) {
  isSyncing = on;
  const s = ensureSyncIndicator();
  if (s) s.style.display = on ? "inline" : "none";
}

// ---------- Date: next Sunday ----------
function ordinal(n) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function nextSunday(from = new Date()) {
  const d = new Date(from);
  const add = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + add);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatSundayDate(d) {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${days[d.getDay()]} ${ordinal(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function renderNextGameDate() {
  const d = nextSunday();
  const dateEl = el("gameDate");
  if (dateEl) dateEl.textContent = formatSundayDate(d);
  return d;
}

// ---------- Location render ----------
function renderLocation() {
  const locationText = el("locationText");

  const html = `
    ${LOCATION_NAME}, ${LOCATION_ADDRESS}
    <a href="${GOOGLE_MAPS_URL}" target="_blank" rel="noopener noreferrer"
       style="
         margin-left:10px;
         color:#1a73e8;
         text-decoration:none;
         font-size:14px;
         font-weight:500;
       ">
       📍 Open in Google Maps
    </a>
  `;

  if (locationText) {
    locationText.innerHTML = html;
    return;
  }

  const lines = document.querySelectorAll("p.line");
  for (const p of lines) {
    const strong = p.querySelector("strong");
    if (strong && strong.textContent.trim().toLowerCase().startsWith("location")) {
      p.innerHTML = `<strong>Location:</strong> ${html}`;
      return;
    }
  }
}

// ---------- Render players ----------
function renderPlayers(list) {
  const listEl = el("playersList");
  const countEl = el("count");
  if (!listEl || !countEl) return;

  listEl.innerHTML = "";

  for (let i = 0; i < MAX_PLAYERS; i++) {
    const li = document.createElement("li");
    if (list[i]) {
      li.textContent = list[i];
    } else {
      li.textContent = "—";
      li.className = "emptySlot";
    }
    listEl.appendChild(li);
  }

  countEl.textContent = list.length;

  const joinBtn = el("joinBtn");
  const nameInput = el("nameInput");
  const full = list.length >= MAX_PLAYERS;

  if (joinBtn) joinBtn.disabled = full;

  if (nameInput && document.activeElement !== nameInput) {
    nameInput.disabled = full;
  }

  if (full) {
    setMsg(`Game is full – ${MAX_PLAYERS}/${MAX_PLAYERS} ✅`, false);
  }
}

// ---------- Array diff helper ----------
function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// ---------- Shared backend calls ----------
async function loadPlayersFromServer(showIndicator = false) {
  try {
    if (showIndicator) setSyncing(true);

    const res = await fetch(`/api/state?ts=${Date.now()}`, { cache: "no-store" });
    const data = await res.json();

    const newPlayers = Array.isArray(data.players) ? data.players : [];

    // --- Prevent flicker: ignore stale server updates that remove our optimistic join ---
    if (pendingJoinName && !newPlayers.includes(pendingJoinName)) {
      return;
    }

    // --- Smart full-list protection ---
    if (players.length >= MAX_PLAYERS && newPlayers.length >= MAX_PLAYERS) {
      return;
    }

    if (!arraysEqual(players, newPlayers)) {
      players = newPlayers;

      // If server confirms our join, clear the pending flag
      if (pendingJoinName && newPlayers.includes(pendingJoinName)) {
        pendingJoinName = null;
      }

      renderPlayers(players);
    }

  } catch {
  } finally {
    if (showIndicator) setSyncing(false);
  }
}

async function joinPlayerOnServer(name) {
  const res = await fetch("/api/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  if (res.status === 409) {
    const data = await res.json().catch(() => ({}));
    setMsg(data.error || "Game is full", true);
    return null;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    setMsg(data.error || "Could not join. Try again.", true);
    return null;
  }

  return data;
}

// ---------- Weather ----------
function weatherEmojiFromCode(code) {
  return code === 0 ? "☀️" :
    (code === 1 ? "🌤️" :
    (code === 2 ? "⛅" :
    (code === 3 ? "☁️" :
    (code === 45 || code === 48 ? "🌫️" :
    ([51,53,55].includes(code) ? "🌦️" :
    ([61,63,65].includes(code) ? "🌧️" :
    ([71,73,75].includes(code) ? "❄️" :
    ([80,81,82].includes(code) ? "🌧️" :
    ([95,96,99].includes(code) ? "⛈️" : "🌡️")))))))));
}

function weatherDescFromCode(code) {
  if (code === 0) return "Clear";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if ([51,53,55].includes(code)) return "Drizzle";
  if ([61,63,65].includes(code)) return "Rain";
  if ([71,73,75].includes(code)) return "Snow";
  if ([80,81,82].includes(code)) return "Showers";
  if ([95,96,99].includes(code)) return "Thunder";
  return "Mixed";
}

async function loadWeatherAt3pm(gameDate) {
  const weatherEl = el("weatherText");
  if (!weatherEl) return;

  const yyyy = gameDate.getFullYear();
  const mm = String(gameDate.getMonth() + 1).padStart(2, "0");
  const dd = String(gameDate.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&hourly=temperature_2m,weather_code&timezone=Europe/London` +
    `&start_date=${dateStr}&end_date=${dateStr}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const times = data?.hourly?.time || [];
    const temps = data?.hourly?.temperature_2m || [];
    const codes = data?.hourly?.weather_code || [];

    let idx = times.findIndex(t => t.endsWith("T15:00"));
    if (idx === -1) idx = 0;

    const temp = temps[idx];
    const code = codes[idx];

    const icon = weatherEmojiFromCode(code);
    const desc = weatherDescFromCode(code);

    weatherEl.textContent = `${icon} ${desc}, ${Math.round(temp)}°C`;

    // Weather font fix
    weatherEl.style.fontSize = "16px";
    weatherEl.style.fontWeight = "500";

  } catch {
    weatherEl.textContent = "Weather unavailable";
    weatherEl.style.fontSize = "16px";
    weatherEl.style.fontWeight = "500";
  }
}

// ---------- Join wiring ----------
function wireJoinButton() {
  const joinBtn = el("joinBtn");
  const input = el("nameInput");
  if (!joinBtn || !input) return;

  joinBtn.onclick = async () => {
    const name = input.value.trim();
    if (!name) {
      setMsg("Please enter your name.", true);
      return;
    }

    pendingJoinName = name; // protect optimistic join

    pollingPausedUntil = Date.now() + POLL_PAUSE_AFTER_JOIN_MS;
    setMsg("");

    setSyncing(true);
    joinBtn.disabled = true;

    const result = await joinPlayerOnServer(name);

    joinBtn.disabled = false;
    setSyncing(false);

    if (!result) return;

    players = Array.isArray(result.players) ? result.players : [];
    renderPlayers(players);
    input.value = "";

    pollingPausedUntil = Date.now() + POLL_PAUSE_AFTER_JOIN_MS;

    setTimeout(() => {
      if (Date.now() >= pollingPausedUntil) loadPlayersFromServer(false);
    }, 800);

    setMsg("You’re in! See you on the pitch ⚽", false);
  };
}

// ---------- Polling loop ----------
setInterval(() => {
  if (Date.now() < pollingPausedUntil) return;
  if (isSyncing) return;

  loadPlayersFromServer(false);
}, POLL_INTERVAL_MS);

// ---------- Init ----------
const gameDate = renderNextGameDate();
renderLocation();

// Fix weather label font size
const weatherLine = document.querySelector("#weatherText")?.parentElement;
if (weatherLine) {
  weatherLine.style.fontSize = "16px";
  weatherLine.style.fontWeight = "500";
}

wireJoinButton();
loadPlayersFromServer(false);
loadWeatherAt3pm(gameDate);
