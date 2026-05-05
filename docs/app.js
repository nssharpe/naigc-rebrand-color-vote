import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// ── Constants ────────────────────────────────────────────────────────────────

const USERS = [
  { id: 'chandler', label: 'Chandler' },
  { id: 'dot',      label: 'Dot' },
  { id: 'ilana',    label: 'Ilana' },
  { id: 'jayden',   label: 'Jayden' },
  { id: 'jules',    label: 'Jules' },
  { id: 'nate',     label: 'Nate' },
  { id: 'olivia',   label: 'Olivia' },
  { id: 'scarlett', label: 'Scarlett' },
  { id: 'eric',     label: 'Eric' },
  { id: 'kristin',  label: 'Kristin' },
];

const OPTIONS = [
  { id: 'opt1',  label: 'Option 1',  logo: 'Logos1.png', palette: 'Palette1.png'  },
  { id: 'opt2',  label: 'Option 2',  logo: 'Logos2.png', palette: 'Palette2.png'  },
  { id: 'opt3',  label: 'Option 3',  logo: 'Logos3.png', palette: 'Palette3.png'  },
  { id: 'opt4',  label: 'Option 4',  logo: 'Logos4.png', palette: 'Palette4.png'  },
  { id: 'opt5',  label: 'Option 5',  logo: 'Logos5.png', palette: 'Palette5.png'  },
  { id: 'opt6',  label: 'Option 6',  logo: 'Logos6.png', palette: 'Palette6.png'  },
  { id: 'opt7',  label: 'Option 7',  logo: 'Logos7.png', palette: 'Palette7.png'  },
  { id: 'opt8',  label: 'Option 8',  logo: 'Logos8.png', palette: 'Palette8.png'  },
  { id: 'opt9',  label: 'Option 9',  logo: 'Logos8.png', palette: 'Palette9.png'  },
  { id: 'opt10', label: 'Option 10', logo: 'Logos8.png', palette: 'Palette10.png' },
];

const POINTS = { '1': 3, '2': 2, '3': 1 };
const RANKS  = ['1', '2', '3'];
const RANK_LABEL = { '1': '1st', '2': '2nd', '3': '3rd' };

// ── Firebase ─────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── State ─────────────────────────────────────────────────────────────────────

let currentUser = localStorage.getItem('naigc_rebrand_user') || '';

// allVotes[userId] = { '1': optionId, '2': optionId, '3': optionId }  (sparse)
const allVotes = {};
USERS.forEach(u => { allVotes[u.id] = {}; });

// ── DOM refs ─────────────────────────────────────────────────────────────────

const identitySelect     = document.getElementById('identity-select');
const leaderboardEl      = document.getElementById('leaderboard');
const leaderboardSection = document.getElementById('leaderboard-section');
const ballotEl           = document.getElementById('ballot');
const ballotStatusEl     = document.getElementById('ballot-status');
const voteCountEl        = document.getElementById('vote-count');
const resultsToggle      = document.getElementById('results-toggle');

resultsToggle.addEventListener('click', () => {
  const showing = !leaderboardSection.hidden;
  leaderboardSection.hidden = showing;
  resultsToggle.textContent = showing ? 'Show results' : 'Hide results';
});

// ── Identity ─────────────────────────────────────────────────────────────────

identitySelect.value = currentUser;

identitySelect.addEventListener('change', () => {
  currentUser = identitySelect.value;
  localStorage.setItem('naigc_rebrand_user', currentUser);
  renderBallot();
  renderBallotStatus();
});

// ── Firebase listeners ───────────────────────────────────────────────────────

USERS.forEach(u => {
  const ref = doc(db, 'votes', u.id);
  onSnapshot(ref, snap => {
    allVotes[u.id] = snap.exists() ? (snap.data().ranks || {}) : {};
    renderLeaderboard();
    renderBallot();
    renderBallotStatus();
  });
});

// ── Write vote ───────────────────────────────────────────────────────────────

async function setRank(optionId, rank) {
  if (!currentUser) { alert('Please select your name first.'); return; }

  const myVotes = { ...allVotes[currentUser] };
  const currentlyAtRank = myVotes[rank];

  if (currentlyAtRank === optionId) {
    // toggle off — clicking the active rank for this option clears it
    delete myVotes[rank];
  } else {
    // assigning this rank to optionId — first, if optionId currently holds a different rank, drop that
    for (const r of RANKS) {
      if (myVotes[r] === optionId) delete myVotes[r];
    }
    myVotes[rank] = optionId;
  }

  // optimistic update
  allVotes[currentUser] = myVotes;
  renderLeaderboard();
  renderBallot();
  renderBallotStatus();

  await setDoc(doc(db, 'votes', currentUser), {
    ranks: myVotes,
    updatedAt: serverTimestamp(),
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rankOfOptionForUser(userId, optionId) {
  const v = allVotes[userId];
  for (const r of RANKS) if (v[r] === optionId) return r;
  return null;
}

function userLabel(userId) {
  return USERS.find(u => u.id === userId)?.label || userId;
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

function renderLeaderboard() {
  // tally
  const totals = {};        // optionId -> total points
  const byOption = {};      // optionId -> [{userId, rank}, ...]
  OPTIONS.forEach(o => { totals[o.id] = 0; byOption[o.id] = []; });

  USERS.forEach(u => {
    const v = allVotes[u.id];
    for (const r of RANKS) {
      const optId = v[r];
      if (!optId || !totals.hasOwnProperty(optId)) continue;
      totals[optId] += POINTS[r];
      byOption[optId].push({ userId: u.id, rank: r });
    }
  });

  // count voters who submitted at least one rank
  const votedCount = USERS.filter(u => Object.keys(allVotes[u.id]).length > 0).length;
  voteCountEl.textContent = `(${votedCount} of ${USERS.length} ${votedCount === 1 ? 'voter' : 'voters'} so far)`;

  // sort by total desc, then by option order
  const sorted = [...OPTIONS].sort((a, b) => {
    if (totals[b.id] !== totals[a.id]) return totals[b.id] - totals[a.id];
    return OPTIONS.indexOf(a) - OPTIONS.indexOf(b);
  });

  // assign display ranks (ties share rank #)
  let displayRank = 0;
  let prevPoints = null;
  let stride = 0;
  const rankOf = new Map();
  sorted.forEach(opt => {
    stride += 1;
    if (totals[opt.id] !== prevPoints) {
      displayRank = stride;
      prevPoints = totals[opt.id];
    }
    rankOf.set(opt.id, displayRank);
  });

  leaderboardEl.innerHTML = '';
  sorted.forEach(opt => {
    const points = totals[opt.id];
    const rank = rankOf.get(opt.id);

    const row = document.createElement('div');
    row.className = 'lb-row';
    if (rank === 1) row.classList.add('top1');
    else if (rank === 2) row.classList.add('top2');
    else if (rank === 3) row.classList.add('top3');

    // sort voters: 1st, 2nd, 3rd
    const voters = byOption[opt.id].slice().sort((a, b) => Number(a.rank) - Number(b.rank));

    row.innerHTML = `
      <div class="lb-rank">#${rank}</div>
      <div class="lb-thumbs">
        <img src="images/${opt.logo}" alt="${opt.label} logo" />
        <img src="images/${opt.palette}" alt="${opt.label} palette" />
      </div>
      <div class="lb-info">
        <div class="lb-label">${opt.label}</div>
        <div class="lb-voters">
          ${voters.map(v => `<span class="voter-chip r${v.rank}">${userLabel(v.userId)} ${'★'.repeat(POINTS[v.rank])}</span>`).join('')}
        </div>
      </div>
      <div class="lb-points">${points}<small>${points === 1 ? 'PT' : 'PTS'}</small></div>
    `;
    leaderboardEl.appendChild(row);
  });
}

// ── Ballot ───────────────────────────────────────────────────────────────────

function renderBallot() {
  ballotEl.innerHTML = '';
  OPTIONS.forEach(opt => {
    const myRank = currentUser ? rankOfOptionForUser(currentUser, opt.id) : null;

    const card = document.createElement('div');
    card.className = 'ballot-card' + (myRank ? ` ranked-${myRank}` : '');

    const buttonsHtml = RANKS.map(r => {
      const active = myRank === r ? ' active' : '';
      return `
        <button class="rank-btn r${r}${active}" data-opt="${opt.id}" data-rank="${r}" ${currentUser ? '' : 'disabled'}>
          ${RANK_LABEL[r]}
          <small>${POINTS[r]} pt${POINTS[r] === 1 ? '' : 's'}</small>
        </button>
      `;
    }).join('');

    // who else voted for this option
    const others = USERS
      .filter(u => u.id !== currentUser)
      .map(u => ({ userId: u.id, rank: rankOfOptionForUser(u.id, opt.id) }))
      .filter(x => x.rank);

    const otherChips = others.length === 0
      ? ''
      : others.map(x => `<span class="voter-chip r${x.rank}">${userLabel(x.userId)} ${'★'.repeat(POINTS[x.rank])}</span>`).join('');

    card.innerHTML = `
      <div class="ballot-card-title">${opt.label}</div>
      <div class="ballot-images">
        <img src="images/${opt.logo}" alt="${opt.label} logo" />
        <img src="images/${opt.palette}" alt="${opt.label} palette" />
      </div>
      <div class="rank-buttons">${buttonsHtml}</div>
      <div class="other-voters">${otherChips}</div>
    `;

    card.querySelectorAll('.rank-btn').forEach(btn => {
      btn.addEventListener('click', () => setRank(btn.dataset.opt, btn.dataset.rank));
    });
    card.querySelectorAll('.ballot-images img').forEach(img => {
      img.addEventListener('click', () => openZoom(img.src, img.alt));
    });

    ballotEl.appendChild(card);
  });
}

function renderBallotStatus() {
  if (!currentUser) {
    ballotStatusEl.textContent = 'Pick your name above to start ranking.';
    return;
  }
  const myVotes = allVotes[currentUser];
  const filled = RANKS.filter(r => myVotes[r]);
  const missing = RANKS.filter(r => !myVotes[r]);
  if (missing.length === 0) {
    ballotStatusEl.textContent = `All three ranks set. Tap any rank again to change your mind — saves automatically.`;
  } else if (filled.length === 0) {
    ballotStatusEl.textContent = `Voting as ${userLabel(currentUser)} — pick your 1st, 2nd, and 3rd choices.`;
  } else {
    ballotStatusEl.textContent = `Voting as ${userLabel(currentUser)} — ${filled.length} of 3 ranks set.`;
  }
}

// ── Zoom overlay (lazy-built) ────────────────────────────────────────────────

let zoomOverlay = null;

function ensureZoom() {
  if (zoomOverlay) return zoomOverlay;
  zoomOverlay = document.createElement('div');
  zoomOverlay.id = 'zoom-overlay';
  zoomOverlay.innerHTML = '<img alt="" />';
  zoomOverlay.addEventListener('click', closeZoom);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeZoom();
  });
  document.body.appendChild(zoomOverlay);
  return zoomOverlay;
}

function openZoom(src, alt) {
  const overlay = ensureZoom();
  const img = overlay.querySelector('img');
  img.src = src;
  img.alt = alt || '';
  overlay.classList.add('open');
}

function closeZoom() {
  if (zoomOverlay) zoomOverlay.classList.remove('open');
}

// ── Init ─────────────────────────────────────────────────────────────────────

renderLeaderboard();
renderBallot();
renderBallotStatus();
