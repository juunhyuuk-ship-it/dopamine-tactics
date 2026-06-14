# Dopamine Tactics

부족전 듀얼 오더용 정적 웹앱입니다.  
GitHub Pages에 그대로 올릴 수 있게 `HTML/CSS/JavaScript/data.json`만으로 구성되어 있습니다.

## 파일 구성

```text
index.html   # 화면 구조
style.css    # 디자인
script.js    # 검색, 필터, 상성 계산
data.json    # 상대팀 데이터, 펫 티어표, 속성 상성 설정
README.md    # 사용법
```

## GitHub Pages 업로드 방법

1. GitHub에서 새 Repository를 만듭니다.
2. 이 폴더 안의 파일 5개를 전부 업로드합니다.
3. Repository의 Settings > Pages로 이동합니다.
4. Source를 `Deploy from a branch`로 설정합니다.
5. Branch를 `main`, Folder를 `/root`로 설정한 뒤 Save 합니다.
6. 잠시 후 `https://아이디.github.io/저장소명/` 주소로 접속합니다.

## 데이터 수정법

`data.json` 파일만 수정하면 됩니다.

### 상대팀 추가 예시

```json
{
  "id": "OPP-0006",
  "clan": "부족명",
  "nickname": "닉네임",
  "attributes": "화10",
  "hp": 400,
  "mainPets": ["주작(환)", "백호"],
  "traits": "특징",
  "risk": "높음",
  "notes": "공략 메모",
  "updatedAt": "2026-06-14"
}
```

### 펫 티어 추가 예시

```json
{
  "id": "PET-0007",
  "tier": "A",
  "name": "펫이름",
  "attribute": "수10",
  "role": "딜러",
  "counter": "지속성",
  "memo": "실전 메모"
}
```

## 속성 상성 수정

현재 기본값은 아래 기준입니다.

```json
"attributeAdvantage": {
  "수": ["화"],
  "화": ["풍"],
  "풍": ["지"],
  "지": ["수"]
}
```

게임 내 실제 상성과 다르면 `data.json`의 `settings.attributeAdvantage`와 `settings.attributeDisadvantage`를 수정하면 됩니다.

## 주의

이 웹앱은 GitHub Pages용 정적 사이트입니다.  
데이터를 숨기는 보안 기능은 없습니다. 민감한 데이터는 올리지 않는 것을 추천합니다.
