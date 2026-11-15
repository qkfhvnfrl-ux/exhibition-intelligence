# 검증 증거

기준일: 2026-11-15 (Asia/Seoul). A단계 감사·초안 검증 진행 중. 기존 기록은 역사적 증거이며 이번 재검증과 구분한다.

## 기준·배포 대조

- `git status --short --branch`, `git log`, `git remote -v`: 기존 체크아웃 기준 `7040964ccc6af9e3ecfd355cb9be53de33ee6ef6`; 시작 시 사용자 미커밋 변경 없음.
- 분리 로컬 브랜치: `codex/fieldnote-redesign-audit`.
- 원격 개발 HEAD와 `/preview/deployment.json` 대조: preview `7040964ccc6af9e3ecfd355cb9be53de33ee6ef6`, production `a633a9728fdbb1599c0dff5904b2fc4f9ea7a9a7`, 기존 run `43128930795`. 이번 배포 실행 아님.
- README의 “v2 1단계” 안내는 실제 package `2.0.0-stage.4` 및 UI와 불일치하여 현재 안내를 보완한다.

## 기준 빌드·검사

- `npm run build`: 성공.
- `npm run check`: 152개 검사 중 150 통과·2 실패. 전체 통과로 처리하지 않음.
- 정확한 이름 필터로 두 검사 재현: 2개 실패, 종료 코드 1. 링크 fixture 생성 `EPERM`, Windows 경로 `\\`와 allowlist 정규식 `/` 차이.
- 산출물 경로 정규화 보조 점검: 98개 파일 중 허용 범위 밖 0개. 원래 검사 통과나 내용의 공개 적합성 확인을 대신하지 않음.
- `package.json`에 lint 스크립트 없음.
- 자세한 명령·오류·제한: [REDESIGN_BASELINE_CHECKS.md](docs/evidence/REDESIGN_BASELINE_CHECKS.md).

## 데이터·화면 감사

- 수량과 권리/표시 구분: [REDESIGN_AUDIT_DATA.json](docs/evidence/REDESIGN_AUDIT_DATA.json).
- ADEX 해당 회차 사진 기록 41건 중 표시 가능 7건·링크 34건. src 존재와 현재 브라우저 로딩 성공은 별도 집계한다.
- 공개 화면의 회차 전환·지도에서 현대로템 진입·사진 2장 로딩·기존 보고를 확인한 범위는 [검토안](docs/REDESIGN_REVIEW_2026-11-15.md)에 기록했다. 지도 배경 로딩 지연과 직접 HTTP 응답 차이는 분리 기록한다.
- 신규 사진 확보 0장. 기존 자산 검토를 신규 확보로 집계하지 않는다.
- 사내 참고 장표는 현재 제공되지 않았다. 그 내용을 읽거나 검수했다고 주장하지 않는다.

## 진행 중 검증과 남은 위험

`review/` 초안의 3개 화면, 링크·지도 복귀·사진 확대, 화면 폭별 가독성은 현재 QA 중이며 결과를 아래에 추가한다. 실제 휴대폰·저장 PDF·전체 장비별 원문 대조·공개 원천 정리·5개 행사 전수조사·이번 공개 배포는 미완료다.

이 문서와 상태 문서의 갱신은 제품·테스트 수정과 구분한다. 이번 A단계의 최종 판정과 커밋은 QA 이후 기록한다.

## 로컬 초안 QA 최종 결과

- `node review/build-review.mjs`, `node --check review/review.js`, `node --check review/build-review.mjs`: 성공. 공개 필드 allowlist와 7개 파일/credit/sourceURL 검사 통과.
- 로컬 서버: 최초 격리 환경의 4173 연결은 접근 권한/timeout 실패. 일반 실행의 127.0.0.1:4174 서버와 HTTP 200으로 복구. 공개 호스팅 아님.
- 1440×1000 데스크톱: 지도 원본 실제 표시, 공동부스 3사 선택, 한화 검색, 현대로템/현대위아/기아 현장사진 7개 decode 확인. 사진 확대 dialog 정상.
- 지도 확대 1.35에서 업체에 들어갔다가 복귀한 URL의 view=0.5,0.5,1.35 일치. 공동부스 진입 후 브라우저 뒤로가기도 지도 복귀.
- 기아 product=tasman-military 링크와 새로고침 후 해당 장비 유지 확인.
- 390×844 화면 크기 시뮬레이션: 장비 설명·사진과 보고 세로 배치, document scrollWidth 375 / viewport 390으로 가로 넘침 없음. 실제 휴대폰 검증 아님.
- 종합보고 현장사진 3개 decode 및 대표 사례 링크 확인. 전체화면 요청은 현재 in-app 브라우저에서 미지원으로 안내됨. 전체화면 동작 성공으로 집계하지 않음.
- 관찰에 맞춰 보고 주제를 “임무장비의 다양한 구성”으로 수정. AI RCWS는 공유 현장사진이 있는 상태로 문구 정정. 수정 후 브라우저 재열람 확인.
- 상세 기록: `review/verification.json`. 이미지 증거: `review/screenshots/map-desktop.jpg`, `company-desktop.jpg`, `report-desktop.jpg`, `equipment-mobile.jpg`.
- 실제 PDF 파일, 사진 7장 개별 원본의 새 독립 대조, 2023 동일 형상 비교는 이번에 완료하지 않았다.

A단계 감사·초안 제출 범위는 완료. 본 개편은 화면 방향 결정 대기이며 전체 목표 달성으로 표시하지 않는다. 공개 push/merge/workflow 실행 없음.
