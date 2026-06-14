let opponents = [];

const searchInput = document.querySelector("#searchInput");
const clearBtn = document.querySelector("#clearBtn");
const results = document.querySelector("#results");
const resultCount = document.querySelector("#resultCount");
const sourceStatus = document.querySelector("#sourceStatus");

init();

async function init() {
  try {
    const csvUrl = (window.DOPAMINE_SHEET_CSV_URL || "").trim();
    const sourceUrl = csvUrl || "./data.csv";
    const response = await fetch(sourceUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`CSV 불러오기 실패: ${response.status}`);
    }

    const csvText = await response.text();
    opponents = parseOpponentCsv(csvText);
    sourceStatus.textContent = csvUrl ? "Google Sheets CSV 연동 중" : "로컬 data.csv 사용 중";
    render(opponents);
  } catch (error) {
    console.error(error);
    results.innerHTML = `<div class="empty">데이터를 불러오지 못했습니다.<br>config.js의 CSV 주소 또는 data.csv 파일을 확인해주세요.</div>`;
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
        ...(item.mainPets || [])
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

function parseOpponentCsv(csvText) {
  const rows = parseCsv(csvText).filter((row) => row.some((cell) => String(cell).trim() !== ""));
  if (rows.length < 2) return [];

  const header = rows[0].map((value) => normalizeHeader(value));

  return rows.slice(1).map((row, index) => {
    const get = (...names) => {
      for (const name of names) {
        const i = header.indexOf(normalizeHeader(name));
        if (i >= 0) return String(row[i] ?? "").trim();
      }
      return "";
    };

    const petText = get("주요펫", "주요 펫", "mainPets", "pets");
    const hpText = get("체력", "hp");

    return {
      id: get("id") || `OPP-${String(index + 1).padStart(4, "0")}`,
      clan: get("부족명", "부족", "clan"),
      team: get("팀명", "팀", "team"),
      nickname: get("닉네임", "이름", "nickname", "name"),
      attributes: get("속성", "attribute", "attributes"),
      hp: hpText,
      mainPets: petText
        .split(/[,，/]/)
        .map((pet) => pet.trim())
        .filter(Boolean)
    };
  }).filter((item) => item.clan || item.team || item.nickname);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function render(list, keyword = "") {
  resultCount.textContent = keyword
    ? `검색 결과 ${list.length}명`
    : `전체 데이터 ${opponents.length}명`;

  if (!list.length) {
    results.innerHTML = `<div class="empty">검색 결과가 없습니다.<br>부족명, 팀명, 닉네임을 다시 확인해주세요.</div>`;
    return;
  }

  results.innerHTML = list.map((item) => `
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
        <strong class="info-value">${escapeHtml(String(item.hp || "-"))}</strong>
      </div>

      <div class="info-box">
        <span class="info-label">주요 펫</span>
        <div class="pet-list">
          ${(item.mainPets || []).map((pet) => `<span class="pet">${escapeHtml(pet)}</span>`).join("") || "-"}
        </div>
      </div>
    </article>
  `).join("");
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function normalizeHeader(value) {
  return normalize(value)
    .replace(/[()\[\]{}]/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
