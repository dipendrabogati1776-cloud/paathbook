import {
  auth,
  collection,
  getDoc,
  getDocs,
  isConfigValid,
  db,
  limit,
  onAuthStateChanged,
  query,
  resultsDocRef,
  serverTimestamp,
  setDoc,
  signOut
} from "/assets/firebase-init.js";

const DEFAULT_SEATS = [
  {
    id: "ktm-1",
    kshetraNo: 1,
    name: "Kathmandu - 1",
    khasekoMat: 22000,
    candidates: [
      { name: "Candidate A", party: "Party A", votes: 12000, khasekoMat: 22000 },
      { name: "Candidate B", party: "Party B", votes: 10210, khasekoMat: 22000 },
      { name: "Candidate C", party: "Party C", votes: 5410, khasekoMat: 22000 }
    ]
  },
  {
    id: "pkr-2",
    kshetraNo: 2,
    name: "Pokhara - 2",
    khasekoMat: 31000,
    candidates: [
      { name: "Candidate D", party: "Party A", votes: 15200, khasekoMat: 31000 },
      { name: "Candidate E", party: "Party B", votes: 14110, khasekoMat: 31000 },
      { name: "Candidate F", party: "Party C", votes: 7800, khasekoMat: 31000 }
    ]
  },
  {
    id: "ltp-3",
    kshetraNo: 3,
    name: "Lalitpur - 3",
    khasekoMat: 35890,
    candidates: [
      { name: "Candidate G", party: "Party C", votes: 12410, khasekoMat: 35890 },
      { name: "Candidate H", party: "Party A", votes: 12160, khasekoMat: 35890 },
      { name: "Candidate I", party: "Party B", votes: 11320, khasekoMat: 35890 }
    ]
  }
];

const DEMO_STORAGE_KEY = "paathbook_election_demo_data_v1";

const e = {
  configWarning: document.getElementById("config-warning"),
  logoutBtn: document.getElementById("logout-btn"),
  saveStatus: document.getElementById("save-status"),
  electionName: document.getElementById("election-name"),
  isFinal: document.getElementById("is-final"),
  seatSwitcher: document.getElementById("seat-switcher"),
  seatsForm: document.getElementById("seats-form"),
  partyForm: document.getElementById("party-form"),
  addSeatBtn: document.getElementById("add-seat-btn"),
  addPartyBtn: document.getElementById("add-party-btn"),
  formSummary: document.getElementById("form-summary"),
  saveBtn: document.getElementById("save-btn")
};

const state = {
  seats: [],
  activeSeatId: null,
  partyResults: []
};

function setStatus(node, message, level = "ok") {
  node.textContent = message;
  node.className = `status ${level}`;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function createCandidate(candidate = {}) {
  return {
    id: candidate.id || uid(),
    name: candidate.name || "",
    party: candidate.party || "",
    votes: candidate.votes ?? "",
    khasekoMat: candidate.khasekoMat ?? ""
  };
}

function createSeat(seat = {}) {
  const candidates = Array.isArray(seat.candidates) && seat.candidates.length
    ? seat.candidates.map((c) => createCandidate(c))
    : [createCandidate()];

  return {
    id: seat.id || uid(),
    kshetraNo: seat.kshetraNo ?? seat.number ?? "",
    name: seat.name || "",
    khasekoMat: seat.khasekoMat ?? "",
    candidates
  };
}

function createPartyRow(row = {}) {
  return {
    id: row.id || uid(),
    party: row.party || "",
    win: row.win ?? "",
    lead: row.lead ?? "",
    votes: row.votes ?? ""
  };
}

function nextKshetraNo() {
  let max = 0;
  for (const seat of state.seats) {
    const n = Number(seat.kshetraNo);
    if (Number.isFinite(n) && n > max) {
      max = n;
    }
  }
  return max + 1;
}

function getActiveSeatIndex() {
  const idx = state.seats.findIndex((s) => s.id === state.activeSeatId);
  if (idx >= 0) return idx;
  return state.seats.length ? 0 : -1;
}

function countCandidates() {
  return state.seats.reduce((sum, s) => sum + s.candidates.length, 0);
}

function updateSummary() {
  e.formSummary.textContent = `क्षेत्र: ${state.seats.length} | उम्मेदवार: ${countCandidates()}`;
}

function seatLabel(index, seat) {
  const no = seat.kshetraNo === "" ? "-" : seat.kshetraNo;
  return `क्षेत्र ${index + 1} (क्षेत्र नं: ${no})`;
}

function seatChipLabel(index, seat) {
  const no = seat.kshetraNo === "" ? "?" : seat.kshetraNo;
  const name = (seat.name || "").trim();
  return name ? `${no} - ${name}` : `क्षेत्र ${index + 1}`;
}

function escAttr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderSeatSwitcher() {
  e.seatSwitcher.innerHTML = "";
  if (!state.seats.length) return;

  state.seats.forEach((seat, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `seat-chip${seat.id === state.activeSeatId ? " active" : ""}`;
    chip.dataset.action = "select-seat";
    chip.dataset.seatId = seat.id;
    chip.textContent = seatChipLabel(index, seat);
    e.seatSwitcher.appendChild(chip);
  });
}

function renderSeatsForm() {
  e.seatsForm.innerHTML = "";

  if (!state.seats.length) {
    e.seatsForm.innerHTML = '<div class="help">कुनै क्षेत्र छैन। माथिको बटनबाट नयाँ क्षेत्र थप्नुहोस्।</div>';
    renderSeatSwitcher();
    updateSummary();
    return;
  }

  const seatIndex = getActiveSeatIndex();
  const seat = state.seats[seatIndex];
  if (!seat) {
    updateSummary();
    return;
  }

  state.activeSeatId = seat.id;
  const card = document.createElement("article");
  card.className = "seat-card";

  const candidateRows = seat.candidates
    .map(
      (candidate, cIndex) => `
          <div class="candidate-row">
            <div class="row">
              <div>
                <label>उम्मेदवार नाम</label>
                <input type="text" data-seat-index="${seatIndex}" data-cand-index="${cIndex}" data-field="name" value="${escAttr(candidate.name)}" placeholder="नाम" />
              </div>
              <div>
                <label>दल</label>
                <input type="text" data-seat-index="${seatIndex}" data-cand-index="${cIndex}" data-field="party" value="${escAttr(candidate.party)}" placeholder="दलको नाम" />
              </div>
            </div>
            <div class="row">
              <div>
                <label>मत</label>
                <input type="number" min="0" data-seat-index="${seatIndex}" data-cand-index="${cIndex}" data-field="votes" value="${escAttr(candidate.votes)}" placeholder="०" />
              </div>
              <div>
                <label>जम्मा खसेको मत (वैकल्पिक)</label>
                <input type="number" min="0" data-seat-index="${seatIndex}" data-cand-index="${cIndex}" data-field="khasekoMat" value="${escAttr(candidate.khasekoMat)}" placeholder="खाली छोड्दा स्वतः" />
              </div>
            </div>
            <div class="small-actions">
              <button type="button" class="tiny danger-ghost" data-action="remove-candidate" data-seat-index="${seatIndex}" data-cand-index="${cIndex}">उम्मेदवार हटाउनुहोस्</button>
            </div>
          </div>
        `
    )
    .join("");

  card.innerHTML = `
      <div class="seat-head">
        <div class="seat-title">${seatLabel(seatIndex, seat)}</div>
        <button type="button" class="tiny danger-ghost" data-action="remove-seat" data-seat-index="${seatIndex}">क्षेत्र हटाउनुहोस्</button>
      </div>

      <div class="row">
        <div>
          <label>क्षेत्र नं.</label>
          <input type="text" data-seat-index="${seatIndex}" data-field="kshetraNo" value="${escAttr(seat.kshetraNo)}" placeholder="जस्तै १" />
        </div>
        <div>
          <label>क्षेत्र नाम</label>
          <input type="text" data-seat-index="${seatIndex}" data-field="name" value="${escAttr(seat.name)}" placeholder="जस्तै Kathmandu - 1" />
        </div>
      </div>

      <div class="row">
        <div>
          <label>क्षेत्रको जम्मा खसेको मत (वैकल्पिक)</label>
          <input type="number" min="0" data-seat-index="${seatIndex}" data-field="khasekoMat" value="${escAttr(seat.khasekoMat)}" placeholder="खाली छोड्दा स्वतः" />
        </div>
      </div>

      <div class="candidate-list">
        ${candidateRows}
      </div>

      <div class="small-actions">
        <button type="button" class="tiny ghost" data-action="add-candidate" data-seat-index="${seatIndex}">+ उम्मेदवार थप्नुहोस्</button>
      </div>
    `;

  e.seatsForm.appendChild(card);

  renderSeatSwitcher();
  updateSummary();
}

function renderPartyForm() {
  e.partyForm.innerHTML = "";

  if (!state.partyResults.length) {
    e.partyForm.innerHTML =
      '<div class="help">दलगत manual data खाली छ। चाहिने भए माथिबाट दल थप्नुहोस्।</div>';
    return;
  }

  state.partyResults.forEach((row, index) => {
    const card = document.createElement("div");
    card.className = "party-row";
    card.innerHTML = `
      <div class="row">
        <div>
          <label>दलको नाम</label>
          <input type="text" data-party-index="${index}" data-party-field="party" value="${escAttr(row.party)}" placeholder="जस्तै RSP" />
        </div>
        <div>
          <label>कुल मत (वैकल्पिक)</label>
          <input type="number" min="0" data-party-index="${index}" data-party-field="votes" value="${escAttr(row.votes)}" placeholder="खाली छोड्दा स्वतः" />
        </div>
      </div>
      <div class="row">
        <div>
          <label>जित</label>
          <input type="number" min="0" data-party-index="${index}" data-party-field="win" value="${escAttr(row.win)}" placeholder="०" />
        </div>
        <div>
          <label>अग्रता</label>
          <input type="number" min="0" data-party-index="${index}" data-party-field="lead" value="${escAttr(row.lead)}" placeholder="०" />
        </div>
      </div>
      <div class="small-actions">
        <button type="button" class="tiny danger-ghost" data-action="remove-party" data-party-index="${index}">दल हटाउनुहोस्</button>
      </div>
    `;
    e.partyForm.appendChild(card);
  });
}

function parseNumericInput(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

function normalizeSeatsForStorage(seats) {
  return seats.map((seat, index) => {
    const seatName = `${seat.name || ""}`.trim();
    if (!seatName) {
      throw new Error(`इन्डेक्स ${index + 1} मा क्षेत्र नाम चाहिन्छ।`);
    }

    const kshetraNoRaw = `${seat.kshetraNo || ""}`.trim();
    if (!kshetraNoRaw) {
      throw new Error(`'${seatName}' मा क्षेत्र नं. चाहिन्छ।`);
    }

    if (!Array.isArray(seat.candidates) || !seat.candidates.length) {
      throw new Error(`'${seatName}' क्षेत्रमा कम्तीमा १ जना उम्मेदवार चाहिन्छ।`);
    }

    const normalizedCandidates = seat.candidates.map((candidate, cIndex) => {
      const candidateName = `${candidate.name || ""}`.trim();
      const partyName = `${candidate.party || ""}`.trim();
      const votes = parseNumericInput(candidate.votes);
      const khasekoMat = parseNumericInput(candidate.khasekoMat);

      if (!candidateName || !partyName) {
        throw new Error(`'${seatName}' को उम्मेदवार ${cIndex + 1} मा नाम र दल चाहिन्छ।`);
      }
      if (votes === undefined || Number.isNaN(votes)) {
        throw new Error(`'${seatName}' को '${candidateName}' मा मत अंकिय चाहिन्छ।`);
      }
      if (khasekoMat !== undefined && Number.isNaN(khasekoMat)) {
        throw new Error(`'${seatName}' को '${candidateName}' मा जम्मा खसेको मत अंकिय हुनुपर्छ।`);
      }

      return {
        name: candidateName,
        party: partyName,
        votes,
        khasekoMat
      };
    });

    const seatVotesTotal = normalizedCandidates.reduce((sum, c) => sum + c.votes, 0);
    const seatKhasekoMatRaw = parseNumericInput(seat.khasekoMat);
    if (seatKhasekoMatRaw !== undefined && Number.isNaN(seatKhasekoMatRaw)) {
      throw new Error(`'${seatName}' को क्षेत्र-level जम्मा खसेको मत अंकिय हुनुपर्छ।`);
    }

    const seatKhasekoMat = seatKhasekoMatRaw ?? seatVotesTotal;

    return {
      id: seat.id || uid(),
      kshetraNo: kshetraNoRaw,
      name: seatName,
      khasekoMat: seatKhasekoMat,
      candidates: normalizedCandidates.map((candidate) => ({
        ...candidate,
        khasekoMat: candidate.khasekoMat ?? seatKhasekoMat
      }))
    };
  });
}

function buildPartyVoteMapFromSeats(seats) {
  const map = {};
  for (const seat of seats) {
    for (const candidate of seat.candidates || []) {
      const party = candidate.party || "";
      if (!party) continue;
      map[party] = (map[party] || 0) + (candidate.votes || 0);
    }
  }
  return map;
}

function normalizePartyResultsForStorage(rows, seats) {
  const autoVotesByParty = buildPartyVoteMapFromSeats(seats);
  return rows.map((row, index) => {
    const party = `${row.party || ""}`.trim();
    if (!party) {
      throw new Error(`दलगत नतिजाको इन्डेक्स ${index + 1} मा दलको नाम चाहिन्छ।`);
    }

    const win = parseNumericInput(row.win);
    const lead = parseNumericInput(row.lead);
    const votes = parseNumericInput(row.votes);

    if (win === undefined || Number.isNaN(win)) {
      throw new Error(`'${party}' मा जित अंकिय चाहिन्छ।`);
    }
    if (lead === undefined || Number.isNaN(lead)) {
      throw new Error(`'${party}' मा अग्रता अंकिय चाहिन्छ।`);
    }
    if (votes !== undefined && Number.isNaN(votes)) {
      throw new Error(`'${party}' मा कुल मत अंकिय हुनुपर्छ।`);
    }

    return {
      party,
      win,
      lead,
      votes: votes ?? autoVotesByParty[party] ?? 0
    };
  });
}

function collectPayload() {
  const seats = normalizeSeatsForStorage(state.seats);
  const partyResults = normalizePartyResultsForStorage(state.partyResults, seats);
  return {
    electionName: e.electionName.value.trim() || "निर्वाचन नतिजा",
    isFinal: e.isFinal.checked,
    seats,
    partyResults,
    lastUpdated: new Date().toISOString()
  };
}

function applyDataToForm(data) {
  e.electionName.value = data.electionName || "";
  e.isFinal.checked = !!data.isFinal;
  state.seats = (data.seats || []).map((seat) => createSeat(seat));
  state.partyResults = (data.partyResults || []).map((row) => createPartyRow(row));
  if (!state.seats.length) {
    state.seats = [createSeat()];
  }
  state.activeSeatId = state.seats[0].id;
  renderSeatsForm();
  renderPartyForm();
}

function setInitialForm() {
  applyDataToForm({
    electionName: "सामान्य निर्वाचन २०८३",
    isFinal: false,
    seats: DEFAULT_SEATS
  });
}

function setBlankForm() {
  applyDataToForm({
    electionName: "सामान्य निर्वाचन २०८३",
    isFinal: false,
    seats: [createSeat()],
    partyResults: []
  });
}

function loadFromLocalDemo() {
  const raw = localStorage.getItem(DEMO_STORAGE_KEY);
  if (!raw) {
    setInitialForm();
    setStatus(e.saveStatus, "लोकल डेमो फेला परेन। नमूना डेटा लोड गरियो।", "error");
    return;
  }

  const data = JSON.parse(raw);
  applyDataToForm(data);
  setStatus(e.saveStatus, "लोकल डेमो डेटा लोड भयो।", "ok");
}

function saveToLocalDemo() {
  const payload = collectPayload();
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(payload));
  setStatus(e.saveStatus, "UI preview का लागि लोकलमा सेभ भयो।", "ok");
}

async function loadCurrent() {
  if (!isConfigValid) {
    loadFromLocalDemo();
    return;
  }

  const ref = resultsDocRef();
  if (!ref) return;

  const snap = await getDoc(ref);
  if (snap.exists()) {
    applyDataToForm(snap.data());
    setStatus(e.saveStatus, "Firestore बाट `current` डेटा लोड भयो।", "ok");
    return;
  }

  const alt = await getDocs(query(collection(db, "election_results"), limit(1)));
  if (!alt.empty) {
    applyDataToForm(alt.docs[0].data());
    setStatus(e.saveStatus, "Firestore मा भेटिएको document बाट डेटा लोड भयो।", "ok");
    return;
  }

  setBlankForm();
  setStatus(e.saveStatus, "Firestore मा डेटा छैन। कृपया नयाँ क्षेत्र थपेर सेभ गर्नुहोस्।", "error");
}

async function saveCurrent() {
  if (!isConfigValid) {
    saveToLocalDemo();
    return;
  }

  const payload = collectPayload();
  const ref = resultsDocRef();
  if (!ref) return;

  await setDoc(
    ref,
    {
      electionName: payload.electionName,
      isFinal: payload.isFinal,
      seats: payload.seats,
      partyResults: payload.partyResults,
      lastUpdated: serverTimestamp()
    },
    { merge: true }
  );

  setStatus(e.saveStatus, "Firestore मा सफलतापूर्वक सेभ भयो।", "ok");
}

function handleFormInput(target) {
  const partyIndexRaw = target.dataset.partyIndex;
  const partyField = target.dataset.partyField;
  if (partyIndexRaw !== undefined && partyField) {
    const partyIndex = Number(partyIndexRaw);
    if (!Number.isInteger(partyIndex) || !state.partyResults[partyIndex]) return;
    state.partyResults[partyIndex][partyField] = target.value;
    return;
  }

  const seatIndex = Number(target.dataset.seatIndex);
  if (!Number.isInteger(seatIndex) || !state.seats[seatIndex]) return;

  const seat = state.seats[seatIndex];
  const field = target.dataset.field;
  const candIndexRaw = target.dataset.candIndex;

  if (candIndexRaw !== undefined) {
    const candIndex = Number(candIndexRaw);
    if (!Number.isInteger(candIndex) || !seat.candidates[candIndex]) return;
    seat.candidates[candIndex][field] = target.value;
  } else if (field) {
    seat[field] = target.value;
  }

  renderSeatSwitcher();
  updateSummary();
}

function handleFormClick(target) {
  const action = target.dataset.action;
  if (!action) return;

  const seatIndex = Number(target.dataset.seatIndex);

  if (action === "add-candidate") {
    if (!Number.isInteger(seatIndex) || !state.seats[seatIndex]) return;
    state.seats[seatIndex].candidates.push(createCandidate());
    renderSeatsForm();
    return;
  }

  if (action === "remove-seat") {
    if (!Number.isInteger(seatIndex) || !state.seats[seatIndex]) return;
    const removingId = state.seats[seatIndex].id;
    state.seats.splice(seatIndex, 1);
    if (!state.seats.length) {
      state.seats.push(createSeat());
    }
    if (state.activeSeatId === removingId) {
      const safeIndex = Math.min(seatIndex, state.seats.length - 1);
      state.activeSeatId = state.seats[safeIndex]?.id || state.seats[0].id;
    }
    renderSeatsForm();
    return;
  }

  if (action === "remove-candidate") {
    const candIndex = Number(target.dataset.candIndex);
    if (!Number.isInteger(seatIndex) || !state.seats[seatIndex]) return;
    if (!Number.isInteger(candIndex) || !state.seats[seatIndex].candidates[candIndex]) return;

    state.seats[seatIndex].candidates.splice(candIndex, 1);
    if (!state.seats[seatIndex].candidates.length) {
      state.seats[seatIndex].candidates.push(createCandidate());
    }
    renderSeatsForm();
  }

  if (action === "remove-party") {
    const partyIndex = Number(target.dataset.partyIndex);
    if (!Number.isInteger(partyIndex) || !state.partyResults[partyIndex]) return;
    state.partyResults.splice(partyIndex, 1);
    renderPartyForm();
  }
}

function handleSeatSwitcherClick(target) {
  const action = target.dataset.action;
  if (action !== "select-seat") return;
  const seatId = target.dataset.seatId;
  if (!seatId) return;
  state.activeSeatId = seatId;
  renderSeatsForm();
}

function attachHandlers() {
  e.logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/admin/index.html";
  });

  e.addSeatBtn.addEventListener("click", () => {
    const no = nextKshetraNo();
    const newSeat = createSeat({ kshetraNo: no, name: `New Area - ${no}` });
    state.seats.push(newSeat);
    state.activeSeatId = newSeat.id;
    renderSeatsForm();
  });

  e.addPartyBtn.addEventListener("click", () => {
    state.partyResults.push(createPartyRow());
    renderPartyForm();
  });

  e.seatSwitcher.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-action]");
    if (target) handleSeatSwitcherClick(target);
  });

  e.seatsForm.addEventListener("input", (event) => {
    handleFormInput(event.target);
  });
  e.partyForm.addEventListener("input", (event) => {
    handleFormInput(event.target);
  });

  e.seatsForm.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-action]");
    if (target) handleFormClick(target);
  });
  e.partyForm.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-action]");
    if (target) handleFormClick(target);
  });

  e.saveBtn.addEventListener("click", async () => {
    try {
      await saveCurrent();
    } catch (error) {
      setStatus(e.saveStatus, error.message, "error");
    }
  });
}

function boot() {
  setBlankForm();
  attachHandlers();

  if (!isConfigValid) {
    e.configWarning.classList.remove("hidden");
    e.configWarning.textContent =
      "Firebase कन्फिग छैन। लोकल डेमो मोड चलिरहेको छ (लगइन/क्लाउड सेभ छैन)।";
    e.logoutBtn.classList.add("hidden");
    loadFromLocalDemo();
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      e.logoutBtn.classList.remove("hidden");
      try {
        await loadCurrent();
      } catch (error) {
        setStatus(e.saveStatus, error.message, "error");
      }
    } else {
      window.location.href = "/admin/index.html";
    }
  });
}

boot();
