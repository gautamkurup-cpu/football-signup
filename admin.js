const ADMIN_PASSWORD = "football123"; // CHANGE THIS
const MAX_PLAYERS = 14;

function nextSunday(fromDate = new Date()) {
  const d = new Date(fromDate);
  const day = d.getDay();
  const daysToAdd = (7 - day) % 7;
  d.setDate(d.getDate() + daysToAdd);
  d.setHours(0,0,0,0);
  return d;
}

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

function formatSundayDate(dateObj) {
  const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${weekdays[dateObj.getDay()]} ${ordinal(dateObj.getDate())} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

function storageKey() {
  const d = nextSunday(new Date());
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `players_${yyyy}-${mm}-${dd}`;
}

function loadPlayers() {
  return JSON.parse(localStorage.getItem(storageKey()) || "[]");
}

function savePlayers(players) {
  localStorage.setItem(storageKey(), JSON.stringify(players));
}

function render(players) {
  document.getElementById("countAdmin").textContent = players.length;
  const list = document.getElementById("adminList");
  list.innerHTML = "";

  players.forEach((name, idx) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";

    const span = document.createElement("span");
    span.textContent = name;

    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.onclick = () => {
      players.splice(idx, 1);
      savePlayers(players);
      render(players);
    };

    li.appendChild(span);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

document.getElementById("loginBtn").onclick = () => {
  const pass = document.getElementById("adminPass").value;
  const msg = document.getElementById("loginMsg");

  if (pass !== ADMIN_PASSWORD) {
    msg.textContent = "Wrong password";
    msg.style.color = "#b00020";
    return;
  }

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";

  document.getElementById("gameDateAdmin").textContent = formatSundayDate(nextSunday(new Date()));

  let players = loadPlayers();
  render(players);

  document.getElementById("resetBtn").onclick = () => {
    localStorage.removeItem(storageKey());
    players = [];
    render(players);
  };
};
