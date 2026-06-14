# Dopamine Tactics - Advantage Version

Google Sheets CSV를 읽어 상대 정보를 검색하고, 상대 속성 기준으로 유리한 우리팀 캐릭터를 자동 표시합니다.

## 표시 정보

- 부족명
- 팀명
- 닉네임
- 속성
- 체력
- 주요펫
- 유리한 우리팀

## 상성 기준

- 지 -> 수
- 수 -> 화
- 화 -> 풍
- 풍 -> 지

## 우리팀 속성 수정

`config.js`의 아래 영역을 수정하세요.

```js
window.DOPAMINE_TEAM_MEMBERS = [
  { name: "바트", attributes: "수화" },
  { name: "호머", attributes: "수화" }
];
```

## Google Sheets 컬럼

Google Sheets 첫 줄은 아래처럼 유지하세요.

```text
부족명, 팀명, 닉네임, 속성, 체력, 주요펫
```

## CSV 주소 수정

`config.js`에서 아래 값을 수정하세요.

```js
window.DOPAMINE_SHEET_CSV_URL = "구글시트 CSV 주소";
```
