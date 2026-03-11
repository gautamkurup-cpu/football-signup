// -----------------------------
// Settings
// -----------------------------
const MAX_PLAYERS = 14;

// Totteridge Academy coordinates (used for weather)
const LAT = 51.639470288472275;
const LON = -0.1997028625644069;

// -----------------------------
// Helpers (DOM)
// -----------------------------
const el = (id) => document.getElementById(id);

function setMsg(text, isError = false) {
  const m = el("msg");
  if (!m) return;
  m.textContent = text || "";
  m.style.color = isError ? "#b00020" : "#1a7f37";
}

// -----------------------------
// Date: next Sunday (Option A)
// -----------------------------
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

function nextSunday(fromDate = new Date()) {
  const d = new Date(fromDate);
  const day = d.getDay();          // Sunday = 0
  const daysToAdd = (7 - day) % 7; // 0 if Sunday, else days until Sunday
  d.setDate(d.getDate() + daysToAdd);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatSundayDate(dateObj) {
  const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${weekdays[dateObj.getDay()]} ${ordinal(dateObj.getDate())} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

function renderNextGameDate() {
  const d = nextSunday(new Date());
  const dateEl = el("gameDate");
  if (dateEl) dateEl.textContent = formatSundayDate(d);
  return d; // return so weather uses the same date
}

// -----------------------------
// Shared list state (SERVER)
// -----------------------------
let players = [];

function renderPlayers(list) {
  const listEl = el("playersList");
  const countEl = el("count");
  if (!listEl || !countEl) return;

  listEl.innerHTML = "";

  // Always show 1–14 slots
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

  // Disable join if full
  const joinBtn = el("joinBtn");
  const nameInput = el("nameInput");
  if (joinBtn && nameInput) {
    const full = list.length >= MAX_PLAYERS;
    joinBtn.disabled = full;
    nameInput.disabled = full;
    if (full) setMsg(`Game is full – ${MAX_PLAYERS}/${MAX_PLAYERS} ✅`, false);
  }
}

async function loadPlayersFromServer() {
  try {
    const res = await fetch("/api/state");
    const data = await res.json();
    players = Array.isArray(data.players) ? data.players : [];
    renderPlayers(players);
  } catch (e) {
    setMsg("Could not load the shared list. Try refreshing.", true);
  }
}

async function joinPlayerOnServer(name) {
  const res = await fetch("/api/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  // Full / capped response
  if (res.status === 409) {
    const data = await res.json().catch(() => ({}));
    setMsg(data.error || "Game is full ✅", true);
    return null;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    setMsg(data.error || "Could not join. Try again.", true);
    return null;
  }

  return data;
}

// -----------------------------
// Weather (3pm Sunday) – only if weatherText exists in index.html
// -----------------------------
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
  if (!weatherEl) return; // if you didn't add weather to index.html, do nothing

  // Build YYYY-MM-DD for the SAME Sunday shown on the page
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

    let idx = times.findIndex(t => t.endsWith("T15:00")); // 3pm
    if (idx === -1) idx = 0;

    const temp = temps[idx];
    const code = codes[idx];

    const icon = weatherEmojiFromCode(code);
    const desc = weatherDescFromCode(code);

    weatherEl.textContent = `${icon} ${desc}, ${Math.round(temp)}°C`;
  } catch {
    weatherEl.textContent = "Weather unavailable";
  }
}

// -----------------------------
// Wire up events
// -----------------------------
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

    joinBtn.disabled = true;
    setMsg("");

    const result = await joinPlayerOnServer(name);

    joinBtn.disabled = false;

    if (!result) return;

    players = Array.isArray(result.players) ? result.players : [];
    renderPlayers(players);

    input.value = "";
    setMsg("You’re in! See you on the pitch ⚽", false);
  };
}

// -----------------------------
// Init
// -----------------------------
const gameDate = renderNextGameDate();   // sets the date text and returns the same Date object
wireJoinButton();                        // join button now calls the server
loadPlayersFromServer();                 // loads shared list
loadWeatherAt3pm(gameDate);              // optional: only if weatherText exists
