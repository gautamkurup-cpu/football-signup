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
