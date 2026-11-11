# 1단계 검증 기록

확인일: 2026-11-12 (Asia/Seoul). 현재 앱 내용 자체의 외부 사실 전수 검증과 1단계 소스·배포 검증을 구분합니다.

## 기준 버전과 공개 배포 — 서로 다른 확인 경로

1. GitHub repository/branches/Actions API와 `git ls-remote`를 대조했습니다. 기본 브랜치 main의 HEAD는 `4990376dfef1b6890666056bb7e526519d79c784`, package 버전은 1.1.0입니다. 마지막 성공 Pages 실행은 [42914289841](https://github.com/qkfhvnfrl-ux/exhibition-intelligence/actions/runs/42914289841), 구현 커밋은 `4713114268f7c678859e1c950c30cc2687b128b2`입니다. 그 뒤 main의 변경은 README와 기존 STATUS 문서뿐입니다.
2. 공개 URL의 `version.json`은 1.1.0, 빌드 시각은 `2026-11-10T22:24:44.865Z`입니다. `index.html`, `src/review.js`, `data/event-reports.json`을 HTTP 200으로 가져와 기준 로컬 파일과 바이트 일치를 확인했습니다. [응답·해시](evidence/EXECUTIVE_V2_BASELINE_HTTP.json).
3. 실제 공개 화면을 브라우저에서 열어 FIELDNOTE 1.1, 4개 주 메뉴와 이전 보관함, 5개 전시회·31개 장비 사례·49장·10개 원문 표시 및 첫 부스사진을 확인했습니다. 이는 전체 사진·모든 화면 검증이 아닙니다.

## 원본 보존과 조사

- 복구 브랜치 `recovery/fieldnote-v1.1-20261112`와 개발 브랜치 `work/fieldnote-v2`를 기준 커밋에서 생성하고 `git ls-remote`로 확인했습니다.
- [보존 목록](evidence/EXECUTIVE_V2_PRESERVATION.json)의 기존 runtime/data/assets 파일은 기준 커밋과 동일합니다. 기존 원본이나 사용자 브라우저 데이터는 삭제하지 않았습니다.
- 원시 JSON 수량과 실제 `normalizeEventReports()` / `photoCoverage()` 결과를 대조했습니다. [기능·데이터 감사](EXECUTIVE_V2_AUDIT.md).
- 31개 장비 사례 중 20개는 sourceUrls가 하나입니다. URL이 둘 이상인 경우에도 독립 출처라는 증거는 아직 확인하지 않았습니다. 이번 검사로 업체/성능/전시 여부가 독립 검증되었다고 말하지 않습니다.

## 실행한 검사

- `npm run check`: **61개 통과**, 실패 0. 원본의 문법·데이터·저장/복구·기존 UI 회귀검사입니다.
- `npm run build`: 통과. 카탈로그 14개 장비/53개 사진, 이전 검토 3개 사례/11개 사진, 현재 보고 5회차/31개 사례 생성. 배포는 수행하지 않았습니다.
- `git diff --check`: 통과.
- 워크플로 YAML을 파싱해 main 조건이 build/deploy 양쪽에 있고, 개발 branch artifact 저장이 검사 뒤에 수행되며 `dist`, 누락 실패, 14일 보관 설정임을 확인했습니다. actionlint는 설치되어 있지 않아 실행하지 않았습니다.
- 프로젝트 문서 JSON·모든 로컬 상대 링크·단계 순서·미수신 단계 원문 미생성 검사를 통과했습니다. 소스/데이터/사진 보존 범위를 다시 대조했고 워크플로 수정 후에도 기존 61개 검사와 빌드가 통과했습니다.
- 개발 미리보기 `http://127.0.0.1:4173/`에서 기존 초기 화면과 5/31/49/10 수량을 확인했습니다. 이 주소는 작업 환경 내부용이며 새 공개 사이트가 아닙니다.

## 아직 확인하지 않은 것

v2 지도/업체 화면·메뉴/기능 제거, 공식 참가기업/지도 내용, 모든 핵심 주장 독립 검증, 모든 외부 사진 최신 로딩, 모바일 실기기, 실제 PDF 전체 페이지 나눔은 미완료입니다. 신규 배포는 하지 않았습니다. 구현 커밋의 원격 CI 결과는 아래에 기록합니다.

개발 브랜치의 main 제한은 이 브랜치 워크플로에 반영한 것입니다. 아직 main의 기존 워크플로를 교체하지 않았습니다. 수동 production 배포를 시험하기 위해 main을 실행하지 않습니다.

## 구현 커밋 원격 검증

- 실제 구현 커밋: `81b88ecfab6740fbf218000a1b310c75b6386a74`. 원격 브랜치 `work/fieldnote-v2`를 API와 git fetch로 확인했고, 준비한 로컬 tree와 원격 tree가 `ee5a44de52735e766fddecf83fd4d77b069f9766`으로 일치했습니다.
- [원격 CI 43105675563](https://github.com/qkfhvnfrl-ux/exhibition-intelligence/actions/runs/43105675563): completed / success.
- 미리보기 artifact: `fieldnote-v2-preview-81b88ecfab6740fbf218000a1b310c75b6386a74`, ID `13894805457`, 21,181,278 bytes, 만료일 `2026-11-25T21:44:23Z`. API에서 생성 확인; 별도로 다운로드해 전체 내용을 검사한 것은 아닙니다.
- 이 브랜치 커밋에는 Pages 배포 실행이 없으며 main과 복구 ref는 기준 커밋으로 유지됐습니다.
- 문서·상태·보존 경계와 워크플로를 별도 검토자가 재검토했고 중대한 오류는 발견하지 않았습니다.
