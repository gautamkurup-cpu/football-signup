// =============================
// Football Signup — MAIN.JS (FULL REPLACEMENT)
// Shared list + cache-busting + polling guard + stop-at-full + syncing indicator
// + full location address + Google Maps link + 3pm weather
// =============================

// ---------- Config ----------
const MAX_PLAYERS = 14;
const POLL_INTERVAL_MS = 2000;
const POLL_PAUSE_AFTER_JOIN_MS = 3000;

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

// ---------- DOM helpers ----------
const el = (id) => document.getElementById(id);

function setMsg(text, isError = false) {
  const m = el("msg");
  if (!m) return;
  // Don't overwrite syncing indicator if it's being shown separately
  m.textContent = text || "";
  m.style.color = isError ? "#b00020" : "#1a7f37";
}

function ensureSyncIndicator() {
  let s = el("syncIndicator");
  if (s) return s;

  // Prefer placing inside the join box next to the button
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

  // Fallback: create in card footer
  const
