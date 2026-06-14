let opponents = [];

const searchInput = document.querySelector("#searchInput");
const clearBtn = document.querySelector("#clearBtn");
const results = document.querySelector("#results");
const resultCount = document.querySelector("#resultCount");

init();

async function init() {
  try {
    const response = await fetch("./data.json", { cache: "no-store" });
    const data = await response.json();
    opponents = data.opponents || [];
    render(opponents);
  } catch (error) {
    results.innerHTML = `<div class="empty">data.json을 불러오지 못했습니다. GitHub Pages에 올린 뒤 다시 확인해주세요.</div>`;
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
        <strong class="info-value">${escapeHtml(String(item.hp ?? "-"))}</strong>
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
