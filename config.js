// Google Sheets CSV 주소입니다.
// 빈 값이면 같은 폴더의 data.csv를 읽습니다.
window.DOPAMINE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTVizAixUdC5uyRDGL_z7lWejOX1rDnmBYFYe2lX6xRJa3K0piqGcbsLGnBDIuaHQ/pub?gid=1068477996&single=true&output=csv";

// 우리팀 캐릭터 속성입니다.
// 속성은 지/수/화/풍 중 보유 속성을 이어서 적으면 됩니다.
// 예: "수화", "지풍", "수"
window.DOPAMINE_TEAM_MEMBERS = [
  { name: "바트", attributes: "수화" },
  { name: "호머", attributes: "수화" },
  { name: "마지", attributes: "화풍" },
  { name: "시바", attributes: "화풍" },
  { name: "크랩", attributes: "지수" },
  { name: "에이브", attributes: "지풍" },
  { name: "매기", attributes: "수" }
];

// 상성 기준
// 지 -> 수
// 수 -> 화
// 화 -> 풍
// 풍 -> 지
window.DOPAMINE_ADVANTAGE_MAP = {
  "지": ["수"],
  "수": ["화"],
  "화": ["풍"],
  "풍": ["지"]
};
