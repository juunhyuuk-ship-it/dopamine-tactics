let DATA = null;

const state = {
  search: "",
  opponentSearch: "",
  sortMode: "easy",
  teamAttributes: ["수", "화", "풍", "지"],
  tierFilter: "전체",
  petSearch: ""
};

const $ = (selector) => document.querySelector(selector);

async function init() {
  try {
    const response = await fetch("./data.json", { cache: "no-store" });
    DATA = await response.json();
  } catch (error) {
    console.error(error);
    document.body.innerHTML = `<main class="app-shell"><section class="panel"><h1>data.json을 불러오지 못했습니다.</h1><p>GitHub Pages에 올리면 정상 작동합니다. 로컬에서 테스트하려면 VS Code Live Server 또는 간단한 로컬 서버를 사용하세요.</p></section></main>`;
    return;
  }

  bindEvents();
  renderAll();
}

function bindEvents() {
  $("#globalSearch").addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    state.opponentSearch = state.search;
    $("#opponentSearch").value = state.search;
    location.hash = "#search";
    renderOpponents();
  });

  $("#clearGlobalSearch").addEventListener("click", () => {
    state.search = "";
    state.opponentSearch = "";
    $("#globalSearch").value = "";
    $("#opponentSearch").value = "";
    renderOpponents();
  });

  $("#opponentSearch").addEventListener("input", (event) => {
    state.opponentSearch = event.target.value.trim();
    $("#globalSearch").value = state.opponentSearch;
    renderOpponents();
  });

  $("#sortMode").addEventListener("change", (event) => {
    state.sortMode = event.target.value;
    renderOpponents();
  });

  $("#petSearch").addEventListener("input", (event) => {
    state.petSearch = event.target.value.trim();
    renderPets();
  });
}

function renderAll() {
  renderStats();
  renderTeamAttributeChips();
  renderTierChips();
  renderOpponents();
  renderPets();
}

function renderStats() {
  $("#statOpponents").textContent = DATA.opponents.length;
  $("#statClans").textContent = new Set(DATA.opponents.map((item) => item.clan)).size;
  $("#statPets").textContent = DATA.petTiers.length;
}

function renderTeamAttributeChips() {
  const wrap = $("#teamAttributeChips");
  wrap.innerHTML = "";
  DATA.settings.attributeOrder.forEach((attribute) => {
    const button = document.createElement("button");
    button.className = `chip ${state.teamAttributes.includes(attribute) ? "active" : ""}`;
    button.type = "button";
    button.textContent = attribute;
    button.addEventListener("click", () => {
      const exists = state.teamAttributes.includes(attribute);
      state.teamAttributes = exists
        ? state.teamAttributes.filter((item) => item !== attribute)
        : [...state.teamAttributes, attribute];

      if (state.teamAttributes.length === 0) {
        state.teamAttributes = [attribute];
      }

      renderTeamAttributeChips();
      renderOpponents();
    });
    wrap.appendChild(button);
  });
}

function renderTierChips() {
  const tiers = ["전체", "S", "A", "B", "C", "연구중"];
  const wrap = $("#tierChips");
  wrap.innerHTML = "";

  tiers.forEach((tier) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip ${state.tierFilter === tier ? "active" : ""}`;
    button.textContent = tier;
    button.addEventListener("click", () => {
      state.tierFilter = tier;
      renderTierChips();
      renderPets();
    });
    wrap.appendChild(button);
  });
}

function renderOpponents() {
  const opponents = getFilteredOpponents().map((opponent) => ({
    ...opponent,
    analysis: analyzeOpponent(opponent)
  }));

  const sorted = sortOpponents(opponents);

  renderSummary(sorted);
  renderTargetLists(opponents);
  renderOpponentRows(sorted);
}

function getFilteredOpponents() {
  const keyword = normalize(state.opponentSearch || state.search);

  return DATA.opponents.filter((item) => {
    if (!keyword) return true;

    const searchable = [
      item.clan,
      item.nickname,
      item.attributes,
      item.hp,
      ...(item.mainPets || []),
      item.traits,
      item.risk,
      item.notes,
      item.updatedAt
    ].join(" ");

    return normalize(searchable).includes(keyword);
  });
}

function sortOpponents(items) {
  const list = [...items];
  const riskScore = DATA.settings.riskScore;

  const sorters = {
    easy: (a, b) => b.analysis.easeScore - a.analysis.easeScore,
    hard: (a, b) => b.analysis.hardScore - a.analysis.hardScore,
    hpAsc: (a, b) => Number(a.hp || 0) - Number(b.hp || 0),
    hpDesc: (a, b) => Number(b.hp || 0) - Number(a.hp || 0),
    risk: (a, b) => (riskScore[b.risk] || 0) - (riskScore[a.risk] || 0),
    name: (a, b) => a.nickname.localeCompare(b.nickname, "ko")
  };

  return list.sort(sorters[state.sortMode] || sorters.easy);
}

function analyzeOpponent(opponent) {
  const parsed = parseAttributes(opponent.attributes);
  const attributeScore = calculateAttributeScore(parsed);
  const health = Number(opponent.hp || 0);
  const risk = DATA.settings.riskScore[opponent.risk] ?? 0;
  const petDifficulty = calculatePetDifficulty(opponent.mainPets || []);

  // 높을수록 잡기 쉬움. 속성 유리 + 저체력 + 낮은 위험도 + 낮은 펫티어를 반영.
  const healthEase = Math.max(0, 60 - health / 10);
  const easeScore = Math.round(attributeScore * 20 + healthEase - risk - petDifficulty);

  // 높을수록 잡기 어려움. 속성 불리/고체력/고위험/상위펫을 반영.
  const hardScore = Math.round((attributeScore * -18) + health / 12 + risk + petDifficulty);

  let label = "중립";
  if (attributeScore >= 1.5) label = "상성 유리";
  if (attributeScore <= -1.5) label = "상성 불리";

  const reasons = [];
  if (attributeScore > 0) reasons.push(`우리팀 ${state.teamAttributes.join("/")} 기준 상성 유리`);
  if (attributeScore < 0) reasons.push(`우리팀 ${state.teamAttributes.join("/")} 기준 상성 불리`);
  if (health <= 380) reasons.push("체력 낮은 편");
  if (health >= 500) reasons.push("체력 높은 편");
  if (risk >= 12) reasons.push(`위험도 ${opponent.risk}`);
  if (petDifficulty >= 12) reasons.push("상위 티어 펫 보유");

  return {
    attributeScore,
    easeScore,
    hardScore,
    label,
    reasons: reasons.length ? reasons : ["추가 정보 확인 필요"]
  };
}

function parseAttributes(attributeText = "") {
  const result = {};
  const regex = /([지수화풍])\s*(\d+)?/g;
  let match;

  while ((match = regex.exec(attributeText)) !== null) {
    const attribute = match[1];
    const value = Number(match[2] || 10);
    result[attribute] = (result[attribute] || 0) + value;
  }

  return result;
}

function calculateAttributeScore(opponentAttributes) {
  const advantage = DATA.settings.attributeAdvantage;
  const disadvantage = DATA.settings.attributeDisadvantage;

  let score = 0;
  const entries = Object.entries(opponentAttributes);

  if (!entries.length) return 0;

  state.teamAttributes.forEach((ourAttribute) => {
    entries.forEach(([enemyAttribute, weight]) => {
      const ratio = weight / 10;
      if ((advantage[ourAttribute] || []).includes(enemyAttribute)) score += 1 * ratio;
      if ((disadvantage[ourAttribute] || []).includes(enemyAttribute)) score -= 1 * ratio;
    });
  });

  return score / Math.max(1, state.teamAttributes.length);
}

function calculatePetDifficulty(pets) {
  const tierByName = new Map(DATA.petTiers.map((pet) => [normalize(pet.name), pet.tier]));
  return pets.reduce((sum, petName) => {
    const tier = tierByName.get(normalize(petName));
    return sum + (DATA.settings.tierScore[tier] || 0);
  }, 0);
}

function renderSummary(items) {
  const total = items.length;
  const hpAvg = total ? Math.round(items.reduce((sum, item) => sum + Number(item.hp || 0), 0) / total) : 0;
  const veryHigh = items.filter((item) => item.risk === "매우높음").length;
  const easyTop = items.length ? sortOpponents([...items].map((item) => item)).sort((a, b) => b.analysis.easeScore - a.analysis.easeScore)[0]?.nickname : "-";
  const hardTop = items.length ? [...items].sort((a, b) => b.analysis.hardScore - a.analysis.hardScore)[0]?.nickname : "-";

  const attributeCounts = {};
  items.forEach((item) => {
    Object.entries(parseAttributes(item.attributes)).forEach(([attribute, value]) => {
      attributeCounts[attribute] = (attributeCounts[attribute] || 0) + value;
    });
  });

  const attributeText = Object.keys(attributeCounts).length
    ? Object.entries(attributeCounts).map(([key, value]) => `${key}${value}`).join(" / ")
    : "-";

  const cards = [
    ["검색 인원", `${total}명`],
    ["속성 분포", attributeText],
    ["평균 체력", hpAvg || "-"],
    ["매우높음", `${veryHigh}명`],
    ["최우선 체크", hardTop || easyTop || "-"]
  ];

  $("#summaryCards").innerHTML = cards.map(([label, value]) => `
    <div class="summary-card">
      <strong>${escapeHtml(String(value))}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `).join("");
}

function renderTargetLists(items) {
  const easy = [...items].sort((a, b) => b.analysis.easeScore - a.analysis.easeScore).slice(0, 5);
  const hard = [...items].sort((a, b) => b.analysis.hardScore - a.analysis.hardScore).slice(0, 5);

  $("#easyTargets").innerHTML = easy.length
    ? easy.map((item) => `<li><b>${escapeHtml(item.nickname)}</b> · ${escapeHtml(item.attributes)} · 체력 ${escapeHtml(String(item.hp))}<br><span>${escapeHtml(item.analysis.reasons.join(" / "))}</span></li>`).join("")
    : `<li>검색 결과가 없습니다.</li>`;

  $("#hardTargets").innerHTML = hard.length
    ? hard.map((item) => `<li><b>${escapeHtml(item.nickname)}</b> · ${escapeHtml(item.attributes)} · 체력 ${escapeHtml(String(item.hp))}<br><span>${escapeHtml(item.analysis.reasons.join(" / "))}</span></li>`).join("")
    : `<li>검색 결과가 없습니다.</li>`;
}

function renderOpponentRows(items) {
  $("#resultCount").textContent = `${items.length}명`;

  if (!items.length) {
    $("#opponentRows").innerHTML = `<tr><td colspan="8" class="empty">검색 결과가 없습니다.</td></tr>`;
    return;
  }

  $("#opponentRows").innerHTML = items.map((item) => `
    <tr>
      <td>${escapeHtml(item.clan)}</td>
      <td><strong>${escapeHtml(item.nickname)}</strong></td>
      <td>${escapeHtml(item.attributes)}</td>
      <td>${escapeHtml(String(item.hp))}</td>
      <td>${escapeHtml((item.mainPets || []).join(", "))}</td>
      <td>${escapeHtml(item.traits || "-")}</td>
      <td>${riskBadge(item.risk)}</td>
      <td class="judgement">
        <b>${escapeHtml(item.analysis.label)}</b><br>
        ${escapeHtml(item.notes || "")}<br>
        <span>${escapeHtml(item.analysis.reasons.join(" / "))}</span>
      </td>
    </tr>
  `).join("");
}

function renderPets() {
  const keyword = normalize(state.petSearch);
  const pets = DATA.petTiers.filter((pet) => {
    const tierMatch = state.tierFilter === "전체" || pet.tier === state.tierFilter;
    const searchText = normalize([pet.name, pet.attribute, pet.role, pet.counter, pet.memo, pet.tier].join(" "));
    return tierMatch && (!keyword || searchText.includes(keyword));
  });

  $("#petCards").innerHTML = pets.length
    ? pets.map((pet) => `
      <article class="pet-card">
        <div class="pet-head">
          <div>
            <h3>${escapeHtml(pet.name)}</h3>
            <p>${escapeHtml(pet.memo)}</p>
          </div>
          <span class="badge tier">${escapeHtml(pet.tier)}</span>
        </div>
        <div class="pet-meta">
          <span class="badge risk-unknown">${escapeHtml(pet.attribute)}</span>
          <span class="badge risk-low">${escapeHtml(pet.role)}</span>
        </div>
        <p><strong>카운터:</strong> ${escapeHtml(pet.counter)}</p>
      </article>
    `).join("")
    : `<div class="empty">검색 결과가 없습니다.</div>`;
}

function riskBadge(risk = "정보부족") {
  const classMap = {
    "매우높음": "risk-very-high",
    "높음": "risk-high",
    "중간": "risk-mid",
    "낮음": "risk-low",
    "정보부족": "risk-unknown"
  };

  return `<span class="badge ${classMap[risk] || "risk-unknown"}">${escapeHtml(risk)}</span>`;
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
