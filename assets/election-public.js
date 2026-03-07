import {
  collection,
  db,
  getDoc,
  getDocs,
  isConfigValid,
  limit,
  onSnapshot,
  query,
  resultsDocRef
} from "/assets/firebase-init.js";

const state = {
  unsub: null
};

const DEFAULT_TOTAL_SEATS = 165;

const DEMO_STORAGE_KEY = "paathbook_election_demo_data_v1";
const DEMO_DATA = {
  electionName: "सामान्य निर्वाचन २०८३ (डेमो)",
  isFinal: false,
  lastUpdated: new Date().toISOString(),
  seats: [
    {
      id: "ktm-1",
      kshetraNo: 1,
      name: "Kathmandu - 1",
      candidates: [
        { name: "Anita Sharma", party: "Party A", votes: 18420 },
        { name: "Rajan Karki", party: "Party B", votes: 17210 },
        { name: "Maya Thapa", party: "Party C", votes: 9360 }
      ]
    },
    {
      id: "pkr-2",
      kshetraNo: 2,
      name: "Pokhara - 2",
      candidates: [
        { name: "Sagar Gurung", party: "Party B", votes: 22880 },
        { name: "Kamal Poudel", party: "Party A", votes: 21940 },
        { name: "Bina Rana", party: "Party C", votes: 8050 }
      ]
    },
    {
      id: "ltp-3",
      kshetraNo: 3,
      name: "Lalitpur - 3",
      candidates: [
        { name: "Nabin Maharjan", party: "Party C", votes: 12410 },
        { name: "Prakash Oli", party: "Party A", votes: 12160 },
        { name: "Rekha KC", party: "Party B", votes: 11320 }
      ]
    }
  ]
};

const e = {
  configWarning: document.getElementById("config-warning"),
  title: document.getElementById("election-title"),
  status: document.getElementById("election-status"),
  updatedAt: document.getElementById("updated-at"),
  partyTotalSeats: document.getElementById("party-total-seats"),
  partyList: document.getElementById("party-list"),
  partyEmpty: document.getElementById("party-empty"),
  list: document.getElementById("seat-list"),
  empty: document.getElementById("empty-state")
};

function fmtNumber(value) {
  return new Intl.NumberFormat("ne-NP").format(value || 0);
}

function fmtTime(timestamp) {
  if (!timestamp) {
    return "उपलब्ध छैन";
  }
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("ne-NP", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function pickLeadingParty(seats = []) {
  const count = {};
  for (const seat of seats) {
    const candidates = Array.isArray(seat.candidates) ? [...seat.candidates] : [];
    if (!candidates.length) continue;
    candidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    const leader = candidates[0];
    if (!leader.party) continue;
    count[leader.party] = (count[leader.party] || 0) + 1;
  }

  const result = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  if (!result) return "N/A";
  return `${result[0]} (${result[1]} क्षेत्रमा अग्रता)`;
}

function renderSeatCard(seat, isFinal) {
  const card = document.createElement("article");
  card.className = "seat-card";

  const candidates = Array.isArray(seat.candidates) ? [...seat.candidates] : [];
  candidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const leading = candidates[0];

  const name = seat.name || "नाम नभएको क्षेत्र";
  const kshetraNo = seat.kshetraNo || seat.number || "-";
  const winnerBadge = isFinal ? "badge-final" : "badge-leading";
  const winnerText = isFinal ? "अन्तिम विजेता" : "हाल अग्रता";

  const tableRows = candidates
    .map((candidate, index) => {
      const rowClass = index === 0 ? "leading" : "";
      return `<tr class="${rowClass}">
        <td>${kshetraNo}</td>
        <td>${candidate.name || "-"}</td>
        <td>${candidate.party || "-"}</td>
        <td>${fmtNumber(candidate.votes || 0)}</td>
      </tr>`;
    })
    .join("");

  card.innerHTML = `
    <div class="seat-head">
      <div class="seat-name">${name}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>क्षेत्र नं.</th>
          <th>उम्मेदवार</th>
          <th>दल</th>
          <th>मत</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="meta">
      <span class="pill">
        <span class="badge ${winnerBadge}">${winnerText}</span>
        ${leading ? leading.name : "N/A"}
      </span>
      <span class="pill">दोस्रोसँग अन्तर: ${
        candidates.length > 1
          ? fmtNumber((candidates[0].votes || 0) - (candidates[1].votes || 0))
          : "N/A"
      }</span>
    </div>
  `;

  return card;
}

function buildPartyStats(seats = [], isFinal = false) {
  const byParty = {};

  for (const seat of seats) {
    const candidates = Array.isArray(seat.candidates) ? [...seat.candidates] : [];
    if (!candidates.length) continue;

    candidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    const leader = candidates[0];

    for (const candidate of candidates) {
      const party = candidate.party || "अन्य";
      if (!byParty[party]) {
        byParty[party] = { party, lead: 0, win: 0, votes: 0 };
      }
      byParty[party].votes += candidate.votes || 0;
    }

    if (leader && leader.party) {
      if (!byParty[leader.party]) {
        byParty[leader.party] = { party: leader.party, lead: 0, win: 0, votes: 0 };
      }
      byParty[leader.party].lead += 1;
    }

    const declaredWinner =
      seat.winnerParty ||
      seat.winningParty ||
      (candidates.find((c) => c.isWinner)?.party || null) ||
      (isFinal && leader && leader.party ? leader.party : null);

    if (declaredWinner) {
      if (!byParty[declaredWinner]) {
        byParty[declaredWinner] = { party: declaredWinner, lead: 0, win: 0, votes: 0 };
      }
      byParty[declaredWinner].win += 1;
    }
  }

  return Object.values(byParty).sort((a, b) => {
    if (b.lead !== a.lead) return b.lead - a.lead;
    if (b.win !== a.win) return b.win - a.win;
    return b.votes - a.votes;
  });
}

function normalizeManualPartyStats(rows = []) {
  return rows
    .filter((row) => row && row.party)
    .map((row) => ({
      party: row.party,
      win: Number(row.win) || 0,
      lead: Number(row.lead) || 0,
      votes: Number(row.votes) || 0
    }))
    .sort((a, b) => b.votes - a.votes);
}

function renderPartyStats(
  seats = [],
  isFinal = false,
  totalVotes = 0,
  manualRows = [],
  totalSeats = DEFAULT_TOTAL_SEATS
) {
  const manual = normalizeManualPartyStats(manualRows);
  const partyStats = manual.length ? manual : buildPartyStats(seats, isFinal);
  const safeTotalSeats = Number(totalSeats) > 0 ? Number(totalSeats) : DEFAULT_TOTAL_SEATS;

  e.partyList.innerHTML = "";
  if (!partyStats.length) {
    e.partyEmpty.classList.remove("hidden");
    return;
  }

  e.partyEmpty.classList.add("hidden");

  for (const party of partyStats) {
    const row = document.createElement("article");
    row.className = "party-row";
    const seatCount = party.win || 0;
    const share = (seatCount / safeTotalSeats) * 100;
    const progressWidth = share > 0 ? Math.max(2, Math.min(100, share)) : 0;

    row.innerHTML = `
      <div class="party-line">
        <div class="party-name">${party.party}</div>
        <div class="party-kpi win">
          <span class="k">जित</span>
          <span class="v">${fmtNumber(party.win)}</span>
        </div>
        <div class="party-kpi lead">
          <span class="k">अग्रता</span>
          <span class="v">${fmtNumber(party.lead)}</span>
        </div>
        <div class="party-kpi vote">
          <span class="k">कुल मत</span>
          <span class="v">${fmtNumber(party.votes)}</span>
        </div>
      </div>
      <div class="party-track">
        <div class="party-fill" style="width: ${progressWidth}%"></div>
      </div>
    `;
    e.partyList.appendChild(row);
  }
}

function getLocalDemoData() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return DEMO_DATA;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.seats)) return DEMO_DATA;
    return parsed;
  } catch {
    return DEMO_DATA;
  }
}

function renderDoc(data) {
  const seats = Array.isArray(data.seats) ? data.seats : [];
  const totalVotes = seats.reduce((acc, seat) => {
    const perSeat = (seat.candidates || []).reduce((sum, c) => sum + (c.votes || 0), 0);
    return acc + perSeat;
  }, 0);

  e.title.textContent = data.electionName || "निर्वाचन नतिजा";
  e.status.textContent = data.isFinal ? "अन्तिम नतिजा" : "मतगणना जारी";
  e.updatedAt.textContent = fmtTime(data.lastUpdated);
  const totalSeats = Number(data.totalSeats) > 0 ? Number(data.totalSeats) : DEFAULT_TOTAL_SEATS;
  if (e.partyTotalSeats) {
    e.partyTotalSeats.textContent = fmtNumber(totalSeats);
  }
  renderPartyStats(seats, !!data.isFinal, totalVotes, data.partyResults || [], totalSeats);

  e.list.innerHTML = "";
  if (!seats.length) {
    e.empty.classList.remove("hidden");
    return;
  }

  e.empty.classList.add("hidden");
  for (const seat of seats) {
    e.list.appendChild(renderSeatCard(seat, !!data.isFinal));
  }
}

async function boot() {
  if (!isConfigValid) {
    e.configWarning.classList.remove("hidden");
    e.configWarning.innerHTML =
      "Firebase कन्फिग छैन। UI हेर्न स्थानीय डेमो डेटा देखाइएको छ।";
    renderDoc(getLocalDemoData());
    return;
  }

  const ref = resultsDocRef();
  if (!ref) return;

  let activeRef = ref;
  const first = await getDoc(ref);
  if (first.exists()) {
    renderDoc(first.data());
  } else {
    const alt = await getDocs(query(collection(db, "election_results"), limit(1)));
    if (!alt.empty) {
      activeRef = alt.docs[0].ref;
      renderDoc(alt.docs[0].data());
    }
  }

  state.unsub = onSnapshot(activeRef, (snap) => {
    if (!snap.exists()) {
      e.empty.classList.remove("hidden");
      e.list.innerHTML = "";
      return;
    }
    renderDoc(snap.data());
  });
}

boot();
