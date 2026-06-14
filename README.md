# Dopamine Tactics - Simple Version

오더 중 빠르게 보기 위한 초간단 버전입니다.

## 기능

- 부족명 검색
- 팀명 검색
- 닉네임 검색
- 속성 표시
- 체력 표시
- 주요 펫 표시

펫 티어표, 상성 분석, 위험도, 정렬 기능은 제거했습니다.

## 수정해야 하는 파일

`data.json`만 수정하면 됩니다.

## 상대 추가 예시

```json
{
  "id": "OPP-0005",
  "clan": "부족명",
  "team": "팀명",
  "nickname": "닉네임",
  "attributes": "화10",
  "hp": 400,
  "mainPets": ["주요펫1", "주요펫2"]
}
```

## GitHub에 반영하는 법

1. 기존 저장소에서 `index.html`, `style.css`, `script.js`, `data.json`, `README.md`를 새 파일로 덮어씁니다.
2. Commit changes를 누릅니다.
3. 기존 GitHub Pages 주소로 다시 접속합니다.
