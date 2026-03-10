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
  const day = d.getDay();
  const daysToAdd = (7 - day) % 7;
  d.setDate(d.getDate() + daysToAdd);
  d.setHours(0,0,0,0);
  return d;
}

function formatSundayDate(dateObj) {
  const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${weekdays[dateObj.getDay()]} ${ordinal(dateObj.getDate())} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

function renderNextGameDate() {
  const el = document.getElementById("gameDate");
  if (el) el.textContent = formatSundayDate(nextSunday(new Date()));
}

renderNextGameDate();

const MAX_PLAYERS = 14;

function loadPlayers() {
  return JSON.parse(localStorage.getItem("players") || "[]");
}
function savePlayers(players) {
  localStorage.setItem("players", JSON.stringify(players));
}

function renderPlayers(players) {
  const list = document.getElementById("playersList");
  const count = document.getElementById("count");
  list.innerHTML = "";

  for (let i = 0; i < MAX_PLAYERS; i++) {
    const li = document.createElement("li");
    if (players[i]) {
      li.textContent = players[i];
    } else {
      li.textContent = "—";
      li.className = "emptySlot";
    }
    list.appendChild(li);
  }

  count.textContent = players.length;
}

let players = loadPlayers();
renderPlayers(players);

document.getElementById("joinBtn").addEventListener("click", () => {
  const input = document.getElementById("nameInput");
  const name = input.value.trim();

  if (!name) return;
  if (players.length >= MAX_PLAYERS) return;

  players.push(name);
  savePlayers(players);
  input.value = "";
  renderPlayers(players);
});
// --- Weather at 3pm on the SAME Sunday shown on the page (Open-Meteo, free) ---
async function loadWeatherAt3pm() {
  const el = document.getElementById("weatherText");
  if (!el) return;
  // Totteridge Academy coordinates
  const lat = 51.639470288472275;
  const lon = -0.1997028625644069;
  // Use the same Sunday date logic as the page
  const d = nextSunday(new Date());
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,weather_code&timezone=Europe/London` +
    `&start_date=${dateStr}&end_date=${dateStr}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const times = data.hourly.time;
    const temps = data.hourly.temperature_2m;
    const codes = data.hourly.weather_code;
    // pick 15:00 (3pm)
    let idx = times.findIndex(t => t.endsWith("T15:00"));
    if (idx === -1) idx = 0;
    const temp = temps[idx];
    const code = codes[idx];
    // very simple description
    const desc =
      code === 0 ? "Clear" :
      (code === 1 ? "Mainly clear" :
      (code === 2 ? "Partly cloudy" :
      (code === 3 ? "Cloudy" :
      (code === 45 || code === 48 ? "Fog" :
      ([51,53,55].includes(code) ? "Drizzle" :
      ([61,63,65].includes(code) ? "Rain" :
      ([71,73,75].includes(code) ? "Snow" :
      ([80,81,82].includes(code) ? "Showers" :
      ([95,96,99].includes(code) ? "Thunder" : "Mixed")))))))));
    el.textContent = `${desc} – ${Math.round(temp)}°C`;
  } catch {
    el.textContent = "Weather unavailable";
  }
}
loadWeatherAt3pm();
