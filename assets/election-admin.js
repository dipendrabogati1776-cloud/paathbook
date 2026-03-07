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
const PARTY_OPTIONS = [
  "Rastriya Swatantra Party",
  "Nepali Congress",
  "Nepali Communist Party",
  "CPN-UML",
  "Shram Sanskriti Party",
  "Rastriya Prajatantra Party",
  "Janata Samjbadi Party-Nepal",
  "Nepal Communist Party (Maoist)",
  "Ujaylo Nepal Party",
  "Rastriya Mukti Party Nepal (Ekal Chunab Chinha)",
  "Janamat Party",
  "Nagarik Unmukti Party",
  "Independent"
];

const e = {
  configWarning: document.getElementById("config-warning"),
  logoutBtn: document.getElementById("logout-btn"),
  saveStatus: document.getElementById("save-status"),
  formEditor: document.getElementById("form-editor"),
  jsonEditor: document.getElementById("json-editor"),
  modeFormBtn: document.getElementById("mode-form-btn"),
  modeJsonBtn: document.getElementById("mode-json-btn"),
  jsonInput: document.getElementById("json-editor-input"),
  syncJsonBtn: document.getElementById("sync-json-btn"),
  applyJsonBtn: document.getElementById("apply-json-btn"),
  electionName: document.getElementById("election-name"),
  isFinal: document.getElementById("is-final"),
  seatSwitcher: document.getElementById("seat-switcher"),
  seatsForm: document.getElementById("seats-form"),
  partyForm: document.getElementById("party-form"),
  addSeatBtn: document.getElementById("add-seat-btn"),
  addPartyBtn: document.getElementById("add-party-btn"),
  togglePartyCardsBtn: document.getElementById("toggle-party-cards-btn"),
  formSummary: document.getElementById("form-summary"),
  saveBtn: document.getElementById("save-btn"),
  saveTopBtn: document.getElementById("save-top-btn")
};

const state = {
  seats: [],
  activeSeatId: null,
  partyResults: [],
  collapsedPartyIds: new Set(),
  isSaving: false,
  editorMode: "form"
};

function setStatus(node, message, level = "ok") {
  node.textContent = message;
  node.className = `status ${level}`;
}

function setSavingState(isSaving) {
  state.isSaving = isSaving;
  const buttons = [e.saveBtn, e.saveTopBtn].filter(Boolean);
  for (const btn of buttons) {
    btn.disabled = isSaving;
    btn.classList.toggle("is-loading", isSaving);
    btn.textContent = isSaving ? "सेभ हुँदैछ..." : "सेभ गर्नुहोस्";
  }
}

function snapshotDraftDataFromState() {
  return {
    electionName: e.electionName.value.trim() || "निर्वाचन नतिजा",
    isFinal: !!e.isFinal.checked,
    seats: state.seats.map((seat) => ({
      id: seat.id,
      kshetraNo: seat.kshetraNo,
      name: seat.name,
      khasekoMat: seat.khasekoMat,
      candidates: (seat.candidates || []).map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        party: candidate.party,
        votes: candidate.votes,
        khasekoMat: candidate.khasekoMat
      }))
    })),
    partyResults: state.partyResults.map((row) => ({
      id: row.id,
      party: row.party,
      win: row.win,
      lead: row.lead,
      votes: row.votes
    }))
  };
}

function updateJsonEditorFromState() {
  if (!e.jsonInput) return;
  const draft = snapshotDraftDataFromState();
  e.jsonInput.value = JSON.stringify(draft, null, 2);
}

function parseJsonInputObject() {
  if (!e.jsonInput) {
    throw new Error("JSON editor भेटिएन।");
  }
  const raw = e.jsonInput.value.trim();
  if (!raw) {
    throw new Error("JSON खाली छ।");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("JSON format मिलेन।");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON object चाहिन्छ।");
  }
  return parsed;
}

function setEditorMode(mode) {
  const isJson = mode === "json";
  if (state.editorMode === (isJson ? "json" : "form")) return;
  state.editorMode = isJson ? "json" : "form";

  if (e.modeFormBtn) {
    e.modeFormBtn.classList.toggle("active", !isJson);
    e.modeFormBtn.classList.toggle("ghost", isJson);
  }
  if (e.modeJsonBtn) {
    e.modeJsonBtn.classList.toggle("active", isJson);
    e.modeJsonBtn.classList.toggle("ghost", !isJson);
  }
  if (e.formEditor) {
    e.formEditor.classList.toggle("hidden", isJson);
  }
  if (e.jsonEditor) {
    e.jsonEditor.classList.toggle("hidden", !isJson);
  }

  if (isJson) {
    updateJsonEditorFromState();
  }
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

function renderPartySelectOptions(selectedParty) {
  const selected = `${selectedParty || ""}`.trim();
  const hasPreset = PARTY_OPTIONS.includes(selected);
  const customOption = selected && !hasPreset
    ? `<option value="${escAttr(selected)}" selected>${escAttr(selected)} (existing)</option>`
    : "";
  const placeholder = `<option value="" ${selected ? "" : "selected"}>दलको नाम छान्नुहोस्</option>`;
  const presetOptions = PARTY_OPTIONS.map(
    (party) => `<option value="${escAttr(party)}" ${party === selected ? "selected" : ""}>${escAttr(party)}</option>`
  ).join("");
  return `${customOption}${placeholder}${presetOptions}`;
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
      (candidate) => `
          <div class="candidate-row">
            <div class="row">
              <div>
                <label>उम्मेदवार नाम</label>
                <input type="text" data-seat-index="${seatIndex}" data-cand-id="${escAttr(candidate.id)}" data-field="name" value="${escAttr(candidate.name)}" placeholder="नाम" />
              </div>
              <div>
                <label>दल</label>
                <select data-seat-index="${seatIndex}" data-cand-id="${escAttr(candidate.id)}" data-field="party">
                  ${renderPartySelectOptions(candidate.party)}
                </select>
              </div>
            </div>
            <div class="row">
              <div class="full">
                <label>मत</label>
                <input type="number" min="0" data-seat-index="${seatIndex}" data-cand-id="${escAttr(candidate.id)}" data-field="votes" value="${escAttr(candidate.votes)}" placeholder="०" />
              </div>
            </div>
            <div class="small-actions">
              <button type="button" class="tiny danger-ghost" data-action="remove-candidate" data-seat-index="${seatIndex}" data-cand-id="${escAttr(candidate.id)}">उम्मेदवार हटाउनुहोस्</button>
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
    if (e.togglePartyCardsBtn) {
      e.togglePartyCardsBtn.textContent = "सबै collapse";
    }
    return;
  }

  let hasExpanded = false;
  state.partyResults.forEach((row, index) => {
    const partyLabel = `${row.party || ""}`.trim() || `दल ${index + 1}`;
    const isCollapsed = state.collapsedPartyIds.has(row.id);
    if (!isCollapsed) hasExpanded = true;
    const card = document.createElement("div");
    card.className = `party-row${isCollapsed ? " collapsed" : ""}`;
    card.dataset.partyId = row.id;
    card.innerHTML = `
      <div class="party-row-head">
        <button
          type="button"
          class="party-toggle"
          data-action="toggle-party"
          data-party-index="${index}"
          aria-expanded="${isCollapsed ? "false" : "true"}"
        >
          ${partyLabel}
        </button>
      </div>
      <div class="party-row-body">
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
      </div>
    `;
    e.partyForm.appendChild(card);
  });

  if (e.togglePartyCardsBtn) {
    e.togglePartyCardsBtn.textContent = hasExpanded ? "सबै collapse" : "सबै expand";
  }
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

function normalizePayloadForSave(data) {
  const seats = normalizeSeatsForStorage((data.seats || []).map((seat) => createSeat(seat)));
  const partyResults = normalizePartyResultsForStorage(
    (data.partyResults || []).map((row) => createPartyRow(row)),
    seats
  );

  return {
    electionName: `${data.electionName || ""}`.trim() || "निर्वाचन नतिजा",
    isFinal: !!data.isFinal,
    seats,
    partyResults,
    lastUpdated: new Date().toISOString()
  };
}

function collectPayload() {
  return normalizePayloadForSave(snapshotDraftDataFromState());
}

function applyDataToForm(data) {
  e.electionName.value = data.electionName || "";
  e.isFinal.checked = !!data.isFinal;
  state.seats = (data.seats || []).map((seat) => createSeat(seat));
  state.partyResults = (data.partyResults || []).map((row) => createPartyRow(row));
  state.collapsedPartyIds.clear();
  if (!state.seats.length) {
    state.seats = [createSeat()];
  }
  state.activeSeatId = state.seats[0].id;
  renderSeatsForm();
  renderPartyForm();
  if (state.editorMode === "json") {
    updateJsonEditorFromState();
  }
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

function saveToLocalDemo(payload = collectPayload()) {
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

async function saveCurrent(payload = collectPayload()) {
  if (!isConfigValid) {
    saveToLocalDemo(payload);
    return;
  }

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
  const candId = `${target.dataset.candId || ""}`.trim();

  if (candId) {
    const candidate = seat.candidates.find((item) => item.id === candId);
    if (!candidate || !field) return;
    candidate[field] = target.value;
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
    const candId = `${target.dataset.candId || ""}`.trim();
    if (!Number.isInteger(seatIndex) || !state.seats[seatIndex]) return;
    const candIndex = state.seats[seatIndex].candidates.findIndex((item) => item.id === candId);
    if (!candId || candIndex < 0) return;

    state.seats[seatIndex].candidates.splice(candIndex, 1);
    if (!state.seats[seatIndex].candidates.length) {
      state.seats[seatIndex].candidates.push(createCandidate());
    }
    renderSeatsForm();
  }

  if (action === "remove-party") {
    const partyIndex = Number(target.dataset.partyIndex);
    if (!Number.isInteger(partyIndex) || !state.partyResults[partyIndex]) return;
    const removingParty = state.partyResults[partyIndex];
    if (removingParty?.id) {
      state.collapsedPartyIds.delete(removingParty.id);
    }
    state.partyResults.splice(partyIndex, 1);
    renderPartyForm();
    return;
  }

  if (action === "toggle-party") {
    const partyIndex = Number(target.dataset.partyIndex);
    if (!Number.isInteger(partyIndex) || !state.partyResults[partyIndex]) return;
    const partyId = state.partyResults[partyIndex].id;
    if (!partyId) return;
    if (state.collapsedPartyIds.has(partyId)) {
      state.collapsedPartyIds.delete(partyId);
    } else {
      state.collapsedPartyIds.add(partyId);
    }
    renderPartyForm();
    return;
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
    const row = createPartyRow();
    state.partyResults.push(row);
    state.collapsedPartyIds.delete(row.id);
    renderPartyForm();
  });

  if (e.togglePartyCardsBtn) {
    e.togglePartyCardsBtn.addEventListener("click", () => {
      const allCollapsed = state.partyResults.length > 0 &&
        state.partyResults.every((row) => state.collapsedPartyIds.has(row.id));

      if (allCollapsed) {
        state.collapsedPartyIds.clear();
      } else {
        state.collapsedPartyIds = new Set(state.partyResults.map((row) => row.id));
      }
      renderPartyForm();
    });
  }

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

  if (e.modeFormBtn) {
    e.modeFormBtn.addEventListener("click", () => {
      setEditorMode("form");
    });
  }
  if (e.modeJsonBtn) {
    e.modeJsonBtn.addEventListener("click", () => {
      setEditorMode("json");
    });
  }
  if (e.syncJsonBtn) {
    e.syncJsonBtn.addEventListener("click", () => {
      updateJsonEditorFromState();
      setStatus(e.saveStatus, "Form data JSON editor मा राखियो।", "info");
    });
  }
  if (e.applyJsonBtn) {
    e.applyJsonBtn.addEventListener("click", () => {
      try {
        const parsed = parseJsonInputObject();
        applyDataToForm(parsed);
        setStatus(e.saveStatus, "JSON बाट form data लोड भयो।", "ok");
      } catch (error) {
        setStatus(e.saveStatus, error.message, "error");
      }
    });
  }

  const onSave = async () => {
    if (state.isSaving) return;
    setSavingState(true);
    try {
      let payload;
      if (state.editorMode === "json") {
        const parsed = parseJsonInputObject();
        payload = normalizePayloadForSave(parsed);
        applyDataToForm(parsed);
      } else {
        payload = collectPayload();
      }
      await saveCurrent(payload);
    } catch (error) {
      setStatus(e.saveStatus, error.message, "error");
    } finally {
      setSavingState(false);
    }
  };

  e.saveBtn.addEventListener("click", onSave);
  if (e.saveTopBtn) {
    e.saveTopBtn.addEventListener("click", onSave);
  }
}

function boot() {
  setBlankForm();
  attachHandlers();
  setEditorMode("form");

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
