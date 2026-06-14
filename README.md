# Dopamine Tactics - Google Sheets CSV Version

이 버전은 `data.json`을 쓰지 않습니다.

## 데이터 관리 방식

둘 중 하나를 선택하면 됩니다.

1. `data.csv` 파일을 엑셀/구글시트로 수정해서 GitHub에 다시 업로드
2. Google Sheets를 웹에 CSV로 게시하고 `config.js`에 CSV URL 붙여넣기

## 필요한 컬럼

반드시 첫 줄에 아래 컬럼명이 있어야 합니다.

```csv
부족명,팀명,닉네임,속성,체력,주요펫
```

## Google Sheets 연동 방법

1. Google Sheets에 아래 컬럼을 만듭니다.
   - 부족명
   - 팀명
   - 닉네임
   - 속성
   - 체력
   - 주요펫
2. 파일 > 공유 > 웹에 게시
3. 상대정보 시트 선택
4. CSV 형식 선택
5. 게시 후 CSV URL 복사
6. `config.js` 파일의 아래 부분에 붙여넣기

```js
window.DOPAMINE_SHEET_CSV_URL = "여기에 CSV URL";
```

## 주의

Google Sheets CSV 게시 방식은 공개 데이터입니다.
민감한 정보는 올리지 마세요.
