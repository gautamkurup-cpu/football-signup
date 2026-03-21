// ---------- GLOBAL STATE ----------
const tgState = {
  signupNames: [],
  extraPlayers: [],
  playerDB: [],
  nameMap: new Map(), // signupName -> dbPlayerId
  matchedPlayers: [], // final pool with DB data
  teams: [], // [{name, players: [...], strength, scaled}]
};

// ---------- DOM ----------
const loadBtn = document.getElementById('tgLoadBtn');
const loadStatus = document.getElementById('tgLoadStatus');
const signupListDiv = document.getElementById('tgSignupList');

const extraSelect = document.getElementById('tgExtraSelect');
const addExtraBtn = document.getElementById('tgAddExtraBtn');
const extraListDiv = document.getElementById('tgExtraList');

const matchBtn = document.getElementById('tgMatchBtn');
const matchStatus = document.getElementById('tgMatchStatus');
const ambiguousListDiv = document.getElementById('tgAmbiguousList');

const generateBtn = document.getElementById('tgGenerateBtn');
const regenerateBtn = document.getElementById('tgRegenerateBtn');
const generateStatus = document.getElementById('tgGenerateStatus');

const teamsContainer = document.getElementById('tgTeamsContainer');
const structureWarnings = document.getElementById('tgStructureWarnings');

const publishBtn = document.getElementById('tgPublishBtn');
const publishStatus = document.getElementById('tgPublishStatus');

// ---------- HELPERS ----------
function normalizeName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na && !nb) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length) || 1;
  return 1 - dist / maxLen;
}

// ---------- STEP 1: LOAD WEEKLY SIGNUP + DB ----------
loadBtn.addEventListener('click', async () => {
  loadStatus.textContent = 'Loading signup and player database...';
  signupListDiv.innerHTML = '';
  extraListDiv.innerHTML = '';
  extraSelect.innerHTML = '<option value="">-- select player --</option>';
  tgState.signupNames = [];
  tgState.extraPlayers = [];
  tgState.matchedPlayers = [];
  tgState.nameMap.clear();
  ambiguousListDiv.innerHTML = '';
  matchStatus.textContent = '';
  generateStatus.textContent = '';
  teamsContainer.innerHTML = '';
  structureWarnings.textContent = '';
  publishStatus.textContent = '';

  try {
    const [stateRes, dbRes] = await Promise.all([
      fetch('/api/state'),
      fetch('/players.json'),
    ]);

    const stateData = await stateRes.json();
    const dbData = await dbRes.json();

    const signupNames = stateData.players || [];
    tgState.signupNames = signupNames;
    tgState.playerDB = dbData || [];

    loadStatus.textContent = `${signupNames.length} players signed up this week.`;
    renderSignupList();

    populateExtraSelect();
  } catch (err) {
    console.error(err);
    loadStatus.textContent = 'Error loading signup or player database.';
  }
});

function renderSignupList() {
  const names = tgState.signupNames;
  if (!names.length) {
    signupListDiv.textContent = 'No players signed up yet.';
    return;
  }
  signupListDiv.innerHTML = `
    <strong>Signup list (${names.length}):</strong>
    <div>${names.map(n => `<div>${n}</div>`).join('')}</div>
  `;
}

// ---------- STEP 2: EXTRA PLAYERS ----------
function populateExtraSelect() {
  const signupSet = new Set(tgState.signupNames.map(normalizeName));
  const options = ['<option value="">-- select player --</option>'];

  tgState.playerDB.forEach((p, idx) => {
    if (!signupSet.has(normalizeName(p.name))) {
      options.push(`<option value="${idx}">${p.name}</option>`);
    }
  });

  extraSelect.innerHTML = options.join('');
}

addExtraBtn.addEventListener('click', () => {
  const idx = extraSelect.value;
  if (idx === '') return;
  const player = tgState.playerDB[Number(idx)];
  if (!player) return;

  if (tgState.extraPlayers.find(p => p.id === player.id)) return;

  tgState.extraPlayers.push(player);
  renderExtraList();
});

function renderExtraList() {
  if (!tgState.extraPlayers.length) {
    extraListDiv.textContent = 'No extra players added.';
    return;
  }
  extraListDiv.innerHTML = `
    <strong>Extra players this week (${tgState.extraPlayers.length}):</strong>
    <div>${tgState.extraPlayers.map(p => `<div>${p.name}</div>`).join('')}</div>
  `;
}

// ---------- STEP 3: NAME MATCHING ----------
matchBtn.addEventListener('click', () => {
  runNameMatching();
});

function runNameMatching() {
  matchStatus.textContent = 'Running name matching...';
  ambiguousListDiv.innerHTML = '';
  tgState.nameMap.clear();
  tgState.matchedPlayers = [];

  const allNames = [...tgState.signupNames];
  const db = tgState.playerDB;

  const normalizedDB = db.map(p => ({
    player: p,
    norm: normalizeName(p.name),
  }));

  const ambiguous = [];

  allNames.forEach(signupName => {
    const normSignup = normalizeName(signupName);

    // exact match
    const exactMatches = normalizedDB.filter(d => d.norm === normSignup);
    if (exactMatches.length === 1) {
      tgState.nameMap.set(signupName, exactMatches[0].player.id);
      return;
    }
    if (exactMatches.length > 1) {
      ambiguous.push({ signupName, candidates: exactMatches.map(d => d.player) });
      return;
    }

    // fuzzy
    const candidates = [];
    normalizedDB.forEach(d => {
      const sim = similarity(normSignup, d.norm);
      if (sim >= 0.85) {
        candidates.push({ player: d.player, sim });
      }
    });

    if (candidates.length === 1) {
      tgState.nameMap.set(signupName, candidates[0].player.id);
    } else if (candidates.length > 1) {
      candidates.sort((a, b) => b.sim - a.sim);
      ambiguous.push({
        signupName,
        candidates: candidates.map(c => c.player),
      });
    } else {
      ambiguous.push({ signupName, candidates: [] });
    }
  });

  renderAmbiguous(ambiguous);

  // Build matchedPlayers for those resolved
  const pool = [];
  tgState.signupNames.forEach(signupName => {
    const id = tgState.nameMap.get(signupName);
    if (!id) return;
    const p = db.find(x => x.id === id);
    if (p) {
      pool.push({
        signupName,
        ...p,
      });
    }
  });

  // Add extra players directly (they are DB players)
  tgState.extraPlayers.forEach(p => {
    pool.push({
      signupName: p.name,
      ...p,
    });
  });

  tgState.matchedPlayers = pool;
  matchStatus.textContent = `Matched ${pool.length} players. Resolve any ambiguous names below.`;
}

function renderAmbiguous(list) {
  if (!list.length) {
    ambiguousListDiv.textContent = 'No ambiguous or unmatched names.';
    return;
  }

  const html = list
    .map(item => {
      if (!item.candidates.length) {
        return `
          <div style="margin-bottom:10px;">
            <strong>${item.signupName}</strong> — no close matches in DB.
          </div>
        `;
      }
      const options = item.candidates
        .map(
          p =>
            `<option value="${p.id}">${p.name} (DEF ${p.def}, MID ${p.mid}, FWD ${p.fwd}, GK ${p.gk})</option>`
        )
        .join('');
      return `
        <div style="margin-bottom:10px;">
          <div><strong>${item.signupName}</strong> matches multiple players:</div>
          <select data-signup="${item.signupName}" class="tg-amb-select">
            <option value="">-- select match --</option>
            ${options}
          </select>
        </div>
      `;
    })
    .join('');

  ambiguousListDiv.innerHTML = html;

  // Attach change handlers
  const selects = ambiguousListDiv.querySelectorAll('.tg-amb-select');
  selects.forEach(sel => {
    sel.addEventListener('change', () => {
      const signupName = sel.getAttribute('data-signup');
      const id = sel.value;
      if (!id) return;
      tgState.nameMap.set(signupName, id);

      // Rebuild matchedPlayers
      const db = tgState.playerDB;
      const pool = [];
      tgState.signupNames.forEach(sn => {
        const pid = tgState.nameMap.get(sn);
        if (!pid) return;
        const p = db.find(x => x.id === pid);
        if (p) {
          pool.push({
            signupName: sn,
            ...p,
          });
        }
      });
      tgState.extraPlayers.forEach(p => {
        pool.push({
          signupName: p.name,
          ...p,
        });
      });
      tgState.matchedPlayers = pool;
      matchStatus.textContent = `Matched ${pool.length} players (including resolved names).`;
    });
  });
}

// ---------- STEP 4–7: TEAM GENERATION PIPELINE ----------
generateBtn.addEventListener('click', () => {
  generateTeams();
});

regenerateBtn.addEventListener('click', () => {
  generateTeams();
});

function generateTeams() {
  const players = tgState.matchedPlayers;
  if (!players.length) {
    generateStatus.textContent = 'No matched players. Run name matching first.';
    return;
  }

  generateStatus.textContent = 'Generating teams...';
  structureWarnings.textContent = '';
  teamsContainer.innerHTML = '';

  const totalPlayers = players.length;
  const teamsCount = 2; // v1: always 2 teams
  const perTeam = Math.floor(totalPlayers / teamsCount);

  // 1. Assign positions (we treat DB fields as positional ratings)
  const assigned = players.map(p => ({
    ...p,
    assignedPos: null,
    assignedRating: 0,
  }));

  // 2. GK assignment
  assigned.sort((a, b) => b.gk - a.gk);
  const teamA = { name: 'Team 1', players: [], strength: 0, scaled: 0 };
  const teamB = { name: 'Team 2', players: [], strength: 0, scaled: 0 };

  if (assigned.length >= 1) {
    const gk1 = assigned.shift();
    gk1.assignedPos = 'GK';
    gk1.assignedRating = gk1.gk;
    teamA.players.push(gk1);
  }
  if (assigned.length >= 1) {
    const gk2 = assigned.shift();
    gk2.assignedPos = 'GK';
    gk2.assignedRating = gk2.gk;
    teamB.players.push(gk2);
  }

  // 3. Build defensive units
  // Simple heuristic: sort remaining by DEF, then alternate to balance GK strength
  assigned.sort((a, b) => b.def - a.def);
  const defTarget = 2; // baseline per team for 7/8-a-side

  function gkStrength(team) {
    const gk = team.players.find(p => p.assignedPos === 'GK');
    return gk ? gk.gk : 0;
  }

  while (assigned.length && (teamA.players.filter(p => p.assignedPos === 'DEF').length < defTarget ||
    teamB.players.filter(p => p.assignedPos === 'DEF').length < defTarget)) {
    const p = assigned.shift();
    const aDefCount = teamA.players.filter(x => x.assignedPos === 'DEF').length;
    const bDefCount = teamB.players.filter(x => x.assignedPos === 'DEF').length;

    // Decide which team needs DEF more, factoring GK strength
    const aNeed = defTarget - aDefCount;
    const bNeed = defTarget - bDefCount;

    let targetTeam;
    if (aNeed > bNeed) {
      targetTeam = teamA;
    } else if (bNeed > aNeed) {
      targetTeam = teamB;
    } else {
      // equal need: give stronger DEF to weaker GK
      targetTeam = gkStrength(teamA) <= gkStrength(teamB) ? teamA : teamB;
    }

    p.assignedPos = 'DEF';
    p.assignedRating = p.def;
    targetTeam.players.push(p);
  }

  // 4. Remaining players: snake draft by overall strength (max of outfield ratings)
  assigned.forEach(p => {
    p.outfieldStrength = Math.max(p.def, p.mid, p.fwd);
  });
  assigned.sort((a, b) => b.outfieldStrength - a.outfieldStrength);

  const teams = [teamA, teamB];
  let direction = 1; // 1 = forward, -1 = backward
  let index = 0;

  function nextTeamIndex() {
    const idx = index;
    index += direction;
    if (index >= teams.length) {
      index = teams.length - 1;
      direction = -1;
    } else if (index < 0) {
      index = 0;
      direction = 1;
    }
    return idx;
  }

  while (assigned.length) {
    const p = assigned.shift();
    const tIdx = nextTeamIndex();
    const team = teams[tIdx];

    // Decide best outfield position based on team needs
    const defCount = team.players.filter(x => x.assignedPos === 'DEF').length;
    const midCount = team.players.filter(x => x.assignedPos === 'MID').length;
    const fwdCount = team.players.filter(x => x.assignedPos === 'FWD').length;

    // Simple target structure
    const targetDef = defTarget;
    const targetMid = 2;
    const targetFwd = 2;

    let pos = 'MID';
    let rating = p.mid;

    if (defCount < targetDef && p.def >= p.mid && p.def >= p.fwd) {
      pos = 'DEF';
      rating = p.def;
    } else if (fwdCount < targetFwd && p.fwd >= p.mid && p.fwd >= p.def) {
      pos = 'FWD';
      rating = p.fwd;
    } else if (midCount < targetMid && p.mid >= p.def && p.mid >= p.fwd) {
      pos = 'MID';
      rating = p.mid;
    } else {
      // fallback: best of outfield
      if (p.def >= p.mid && p.def >= p.fwd) {
        pos = 'DEF';
        rating = p.def;
      } else if (p.fwd >= p.mid && p.fwd >= p.def) {
        pos = 'FWD';
        rating = p.fwd;
      } else {
        pos = 'MID';
        rating = p.mid;
      }
    }

    p.assignedPos = pos;
    p.assignedRating = rating;
    team.players.push(p);
  }

  // 5. Compute team strength
  teams.forEach(team => {
    const strength = team.players.reduce((sum, p) => sum + (p.assignedRating || 0), 0);
    const perTeam = team.players.length;
    const maxPossible = perTeam * 10;
    const scaled = maxPossible ? (strength / maxPossible) * 100 : 0;
    team.strength = strength;
    team.scaled = Math.round(scaled);
  });

  tgState.teams = teams;
  renderTeams();
  checkStructureWarnings();
  generateStatus.textContent = 'Teams generated.';
}

// ---------- RENDER TEAMS + MANUAL ADJUSTMENTS ----------
function renderTeams() {
  teamsContainer.innerHTML = '';
  tgState.teams.forEach((team, idx) => {
    const html = `
      <div class="team-column" data-team="${idx}">
        <div class="team-header">
          <strong>${team.name}</strong>
          <span class="team-strength">${team.scaled}% (${team.strength})</span>
        </div>
        <div>
          ${team.players
            .map(
              (p, pIdx) => `
            <div class="player-card" data-player-index="${pIdx}">
              <div class="player-main">
                <span class="player-name">${p.name}</span>
                <span class="player-meta">
                  Best: DEF ${p.def}, MID ${p.mid}, FWD ${p.fwd}, GK ${p.gk}
                </span>
              </div>
              <div>
                <span class="player-pos pos-${p.assignedPos.toLowerCase()}">
                  ${p.assignedPos} ${p.assignedRating}
                </span>
                <span class="swap-buttons">
                  <button data-action="to-other">⇄</button>
                </span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
    teamsContainer.insertAdjacentHTML('beforeend', html);
  });

  // Attach swap handlers
  teamsContainer.querySelectorAll('button[data-action="to-other"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const playerCard = btn.closest('.player-card');
      const teamCol = btn.closest('.team-column');
      const teamIdx = Number(teamCol.getAttribute('data-team'));
      const playerIdx = Number(playerCard.getAttribute('data-player-index'));
      movePlayerToOtherTeam(teamIdx, playerIdx);
    });
  });
}

function movePlayerToOtherTeam(fromTeamIdx, playerIdx) {
  const fromTeam = tgState.teams[fromTeamIdx];
  const toTeamIdx = fromTeamIdx === 0 ? 1 : 0;
  const toTeam = tgState.teams[toTeamIdx];

  const [player] = fromTeam.players.splice(playerIdx, 1);
  if (!player) return;

  // Reassign position based on new team needs
  const defCount = toTeam.players.filter(x => x.assignedPos === 'DEF').length;
  const midCount = toTeam.players.filter(x => x.assignedPos === 'MID').length;
  const fwdCount = toTeam.players.filter(x => x.assignedPos === 'FWD').length;
  const hasGK = toTeam.players.some(x => x.assignedPos === 'GK');

  let pos = player.assignedPos;
  let rating = player.assignedRating;

  if (!hasGK && player.gk >= player.def && player.gk >= player.mid && player.gk >= player.fwd) {
    pos = 'GK';
    rating = player.gk;
  } else {
    const targetDef = 2;
    const targetMid = 2;
    const targetFwd = 2;

    if (defCount < targetDef && player.def >= player.mid && player.def >= player.fwd) {
      pos = 'DEF';
      rating = player.def;
    } else if (fwdCount < targetFwd && player.fwd >= player.mid && player.fwd >= player.def) {
      pos = 'FWD';
      rating = player.fwd;
    } else if (midCount < targetMid && player.mid >= player.def && player.mid >= player.fwd) {
      pos = 'MID';
      rating = player.mid;
    } else {
      if (player.def >= player.mid && player.def >= player.fwd) {
        pos = 'DEF';
        rating = player.def;
      } else if (player.fwd >= player.mid && player.fwd >= player.def) {
        pos = 'FWD';
        rating = player.fwd;
      } else {
        pos = 'MID';
        rating = player.mid;
      }
    }
  }

  player.assignedPos = pos;
  player.assignedRating = rating;
  toTeam.players.push(player);

  // Recompute strengths
  tgState.teams.forEach(team => {
    const strength = team.players.reduce((sum, p) => sum + (p.assignedRating || 0), 0);
    const perTeam = team.players.length;
    const maxPossible = perTeam * 10;
    const scaled = maxPossible ? (strength / maxPossible) * 100 : 0;
    team.strength = strength;
    team.scaled = Math.round(scaled);
  });

  renderTeams();
  checkStructureWarnings();
}

// ---------- STRUCTURE WARNINGS ----------
function checkStructureWarnings() {
  const msgs = [];
  tgState.teams.forEach(team => {
    const gk = team.players.filter(p => p.assignedPos === 'GK').length;
    const def = team.players.filter(p => p.assignedPos === 'DEF').length;
    const mid = team.players.filter(p => p.assignedPos === 'MID').length;
    const fwd = team.players.filter(p => p.assignedPos === 'FWD').length;

    if (gk !== 1) {
      msgs.push(`${team.name}: GK count is ${gk}, expected 1.`);
    }
    if (def < 2 || def > 3) {
      msgs.push(`${team.name}: DEF count is ${def}, ideal 2–3.`);
    }
    if (mid < 1 || mid > 3) {
      msgs.push(`${team.name}: MID count is ${mid}, ideal 1–3.`);
    }
    if (fwd < 1 || fwd > 3) {
      msgs.push(`${team.name}: FWD count is ${fwd}, ideal 1–3.`);
    }
  });

  structureWarnings.textContent = msgs.join(' ');
}

// ---------- PUBLISH ----------
publishBtn.addEventListener('click', async () => {
  publishStatus.textContent = 'Publishing teams...';

  try {
    const payload = {
      teams: tgState.teams.map(team => ({
        name: team.name,
        strength: team.strength,
        scaled: team.scaled,
        players: team.players.map(p => ({
          name: p.name,
          assignedPos: p.assignedPos,
          assignedRating: p.assignedRating,
        })),
      })),
    };

    const res = await fetch('/api/publishTeams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Publish failed');

    publishStatus.textContent = 'Teams published successfully.';
  } catch (err) {
    console.error(err);
    publishStatus.textContent = 'Error publishing teams.';
  }
});
