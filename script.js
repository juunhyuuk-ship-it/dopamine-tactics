let opponents = [];

const searchInput = document.querySelector("#searchInput");
const clearBtn = document.querySelector("#clearBtn");
const results = document.querySelector("#results");
const resultCount = document.querySelector("#resultCount");
const dataSource = document.querySelector("#dataSource");
const teamList = document.querySelector("#teamList");

const CSV_URL = window.DOPAMINE_SHEET_CSV_URL || "";
const TEAM_MEMBERS = window.DOPAMINE_TEAM_MEMBERS || [];
const ADVANTAGE_MAP = window.DOPAMINE_ADVANTAGE_MAP || {
  "지": ["수"],
  "수": ["화"],
  "화": ["풍"],
  "풍": ["지"]
};

init();

async function init() {
  renderTeamList();

  try {
    const csvText = await loadCsvText();
    opponents = csvToOpponents(csvText);
    render(opponents);
  } catch (error) {
    console.error(error);
    results.innerHTML = `<div class="empty">데이터를 불러오지 못했습니다.<br>Google Sheets 게시 URL 또는 data.csv를 확인해주세요.</div>`;
    resultCount.textContent = "데이터 오류";
  }

  searchInput.addEventListener("input", () => {
    const keyword = normalize(searchInput.value);
    const filtered = opponents.filter((item) => {
      const text = [
        item.clan,
        item.team,
        item.nickname,
        item.attributes,
        item.hp,
        item.mainPets
      ].join(" ");
      return normalize(text).includes(keyword);
    });

    render(filtered, keyword);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    render(opponents);
  });
}


async function loadCsvText() {
  if (CSV_URL) {
    try {
      dataSource.textContent = "Google Sheets CSV 연동 중";
      const response = await fetch(CSV_URL, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Google Sheets CSV 응답 오류: ${response.status}`);
      }

      const text = await response.text();

      // 구글 권한/게시 문제가 있으면 CSV가 아니라 HTML이 내려오는 경우가 있어 방어합니다.
      if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
        throw new Error("Google Sheets CSV가 아니라 HTML 페이지가 내려왔습니다.");
      }

      return text;
    } catch (error) {
      console.warn("Google Sheets CSV 불러오기 실패. 로컬 data.csv로 대체합니다.", error);
      dataSource.textContent = "Google Sheets 실패 → 로컬 data.csv 사용 중";
    }
  } else {
    dataSource.textContent = "로컬 data.csv 사용 중";
  }

  const localResponse = await fetch("./data.csv", { cache: "no-store" });
  if (!localResponse.ok) {
    throw new Error(`로컬 data.csv 응답 오류: ${localResponse.status}`);
  }
  return await localResponse.text();
}


function render(list, keyword = "") {
  resultCount.textContent = keyword
    ? `검색 결과 ${list.length}명`
    : `전체 데이터 ${opponents.length}명`;

  if (!list.length) {
    results.innerHTML = `<div class="empty">검색 결과가 없습니다.<br>부족명, 팀명, 닉네임을 다시 확인해주세요.</div>`;
    return;
  }

  results.innerHTML = list.map((item) => {
    const pets = splitPets(item.mainPets);
    const recommendation = getRecommendedMembers(item.attributes);

    return `
      <article class="result-card">
        <div class="result-main">
          <div class="nickname">${escapeHtml(item.nickname || "-")}</div>
          <div class="sub">${escapeHtml(item.clan || "-")} ${item.team ? "· " + escapeHtml(item.team) : ""}</div>
        </div>

        <div class="info-box">
          <span class="info-label">속성</span>
          <strong class="info-value">${escapeHtml(item.attributes || "-")}</strong>
        </div>

        <div class="info-box">
          <span class="info-label">체력</span>
          <strong class="info-value">${escapeHtml(String(item.hp ?? "-"))}</strong>
        </div>

        <div class="info-box">
          <span class="info-label">주요 펫</span>
          <div class="pet-list">
            ${pets.map((pet) => `<span class="pet">${escapeHtml(pet)}</span>`).join("") || "-"}
          </div>
        </div>

        <div class="info-box advantage">
          <span class="info-label">유리한 우리팀</span>
          <div class="member-list">
            ${recommendation.members.length
              ? recommendation.members.map((member) => `<span class="member">${escapeHtml(member.name)} <small>${escapeHtml(member.attributes)}</small></span>`).join("")
              : `<span class="member">판단 필요</span>`}
          </div>
          <span class="advantage-note">${escapeHtml(recommendation.reason)}</span>
        </div>
      </article>
    `;
  }).join("");
}

function getRecommendedMembers(enemyAttributeText = "") {
  const enemyAttributes = extractAttributes(enemyAttributeText);
  const neededAttributes = getCounterAttributes(enemyAttributes);

  if (!neededAttributes.length) {
    return {
      members: [],
      reason: "상대 속성을 읽지 못했습니다."
    };
  }

  const scored = TEAM_MEMBERS.map((member) => {
    const memberAttributes = extractAttributes(member.attributes);
    const score = memberAttributes.filter((attr) => neededAttributes.includes(attr)).length;
    return { ...member, score };
  })
    .filter((member) => member.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "ko"));

  const uniqueNeeded = [...new Set(neededAttributes)];
  const reason = `상대 ${enemyAttributes.join("/")} 기준, ${uniqueNeeded.join("/")} 속성이 유리`;

  return {
    members: scored,
    reason
  };
}

function getCounterAttributes(enemyAttributes) {
  const counters = [];

  Object.entries(ADVANTAGE_MAP).forEach(([ourAttribute, strongAgainstList]) => {
    enemyAttributes.forEach((enemyAttribute) => {
      if (strongAgainstList.includes(enemyAttribute)) {
        counters.push(ourAttribute);
      }
    });
  });

  return [...new Set(counters)];
}

function extractAttributes(text = "") {
  const found = String(text).match(/[지수화풍]/g) || [];
  return [...new Set(found)];
}

function splitPets(value = "") {
  return String(value)
    .split(/[,，/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function csvToOpponents(csvText) {
  const rows = parseCsv(csvText).filter((row) => row.some((cell) => String(cell).trim() !== ""));
  if (!rows.length) return [];

  const headers = rows[0].map((header) => normalizeHeader(header));
  return rows.slice(1).map((row, index) => {
    const item = {};
    headers.forEach((header, i) => {
      item[header] = row[i] || "";
    });

    return {
      id: `OPP-${String(index + 1).padStart(4, "0")}`,
      clan: item["부족명"] || item["clan"] || "",
      team: item["팀명"] || item["team"] || "",
      nickname: item["닉네임"] || item["nickname"] || "",
      attributes: item["속성"] || item["attributes"] || "",
      hp: item["체력"] || item["hp"] || "",
      mainPets: item["주요펫"] || item["mainpets"] || ""
    };
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      cell += '"';
      i++;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function renderTeamList() {
  if (!teamList) return;
  teamList.innerHTML = TEAM_MEMBERS.map((member) => `
    <span class="team-member">
      <strong>${escapeHtml(member.name)}</strong>
      <span class="attr">${escapeHtml(member.attributes)}</span>
    </span>
  `).join("");
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function normalizeHeader(value) {
  return String(value ?? "").replace(/\s+/g, "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
