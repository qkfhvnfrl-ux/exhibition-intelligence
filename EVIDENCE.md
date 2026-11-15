# 검증 증거

## 후속 브라우저 확인 — 2026-11-15

- 최종 후속 코드 검증: `node scripts/prepare-redesign-content.mjs`는 26제품·130항목·1보고 생성, `npm run build` exit 0, `npm run check` 184/184 통과·실패/skip 0. 마지막 기아 사실 분류 수정 후 다시 생성·빌드·검사했다. 로그 .local-followup-build.log 및 .local-followup-check.log. `git diff --check` 통과, lint 스크립트 없음.
- 보고서 회귀 4건 추가: 화면/PDF 사진 원문·이용조건 보존, 사진 전용 출처 및 중복 URL 처리, 잘못된 URL 차단, 긴 문구 무손실. DOM stub/마크업 검사는 실제 페이지 맞춤을 보장하지 않음.
- 기아 원천 문구를 압축하고 일부 ‘주요 특징’의 미확인 상태 및 타스만 출품 발표의 사실 분류를 바로잡았다. 제품 ID·12제품·5항목·사진 연결 유지. 출처를 임의로 분산하지 않음.
- 다른4회차 조사 packet 2개 JSON parse 및 Eurosatory/SAHA 기존6제품 참조 검사 통과. 앱 내용에는 아직 연결하지 않음. GDAMS는 Babcock 통신 연동 시연과 별도 ST Engineering 개막전 플랫폼 전시 발표를 구분해 기록하고 기존 이름은 변경하지 않았다.
- 후속 공개 검사: `rg -n -i --hidden --no-ignore 'workConnection|work_connection|당사|우리\s*회사|업무\s*(연결|관련|연계)' src/v2 data/v2/app dist` 매치 0(exit 1은 무매치). 이전 7항목 감사 전체를 이번에 재실행했다고 주장하지 않는다.

- 실행: dist를 tmp/redesign-path-host/exhibition-intelligence/preview에 복사 후 `node scripts/serve.mjs --root tmp/redesign-path-host --host 127.0.0.1 --port 4174`. 로컬 서버이며 공개 반영 없음. 검증 후 해당 서버 종료.
- 실제 IAB에서 `/exhibition-intelligence/preview/#report?event=adex-2025` 로딩과 사진 3개 decode 확인. 1440×1000의 보고판 1365×767.8125로 16:9 확인. 390×844에서 문서 폭 375, 가로 넘침 없음, 세로 보고판 높이 2265.265625. 임시 viewport 해제.
- 타스만 사진 그룹: 표시 사진 2개와 원문 링크 1개로 총 3개. 다음 사진 두 번 이동, URL product 유지, 3번 원문 기록에서 새로고침 후 선택 유지. 닫은 뒤 장비 위치 24.27px/scrollY 4194 복원.
- KMTV 사진 그룹: 1개, 다음 버튼 비활성. 닫기와 뒤로가기에서 KMTV product 및 장비 읽기 위치 유지. 마지막 갤러리 변경의 브라우저 회귀 확인 완료.
- 데스크톱/모바일 캡처: docs/evidence/screenshots/report-implementation-desktop.png 및 report-implementation-mobile.png. 이 캡처는 이후 보고서 출처·인쇄 글자 크기 수정 이전 모습이며 해당 수정의 검증으로 사용하지 않는다. 실제 휴대폰 검증 아님.
- PDF: Chrome 로컬 보고 페이지는 열렸으나 Windows 창 관찰 단계에서 도구가 브라우저 URL을 판정하지 못해 UI 조작을 중단했다. 이 후속 시도에서는 인쇄 실행 전 중단. 실제 파일 없음, 페이지수/한글/잘림 검증 미완료. 도구의 중단 후 추가 UI 입력 없음.
- 상세 구조 기록: docs/evidence/REDESIGN_BROWSER_FOLLOWUP.json. 전체 목표는 미완료이며 B-01 탐색 구현 범위만 완료.

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

## 로컬 저장

- 초안·감사·검증 커밋: `056c2bb4ad6b28644d13277e1f88879991f54b9c`.
- `git diff --cached --check`: 성공. 기존 src/data/scripts/tests/package/index의 커밋 차이 0개.
- 최초 commit은 작성자 미설정으로 실패. `git -c user.name=Codex -c user.email=codex@local.invalid commit ...`으로 해당 명령에만 작성자 지정, 전역 설정 변경 없이 성공.
- `git status --short --branch`: 로컬 작업 트리 clean 확인. 원격 push 없음.
- 문서 정리용 Python 실행은 설치 별칭 접근 실패. 같은 파일 작업을 Node로 수행하고 JSON parse로 확인했다. 제품 실행 오류와 구분한다.

## 2026-11-15 승인된 본 구현 검증

- 승인: 큰 지도 → 별도 업체 메인 → 장비별 설명 → 16:9 보고, 모바일 세로. 첫 공개 대상 /preview/만, 완성본 검토 뒤. 이번 push/배포 없음.
- node scripts/prepare-redesign-content.mjs: 26 narratives / 130 sections / 1 ADEX comparison report 생성. 기존 ID 유지, 한화2제품 포함.
- npm run build: exit 0. 5회차 업체 375/64/1743/36/1467, 지도32영역 유지.
- npm run check: 최종 exit 0, 180 tests / 180 pass / 0 fail / 0 skipped. 178개 통과 뒤 장비별뷰어 회귀2개 추가. 전체로그 .local-redesign-check.log(로컬), .local-redesign-build.log(로컬).
- Windows 링크 검사는 sandbox에서 junction 생성 EPERM 재현. 승인된 exec 환경에서 실제 junction을 생성하고 거부 동작을 검증해 통과했으며 skip 처리하지 않았다. 경로 allowlist는 path.sep 정규화로 수정했다.
- lint 별도 스크립트 없음. git diff --check 통과.
- 실제 IAB 브라우저: 1440×1000 지도 크기 1077×670, 공식도면 표시; 1.35확대→공동부스3사→현대로템→K2PL→새로고침→지도복귀 URL z=1.35 보존 확인.
- 보고: 실제 현장사진3개 모두 naturalWidth>0, object-fit contain, 대표사례→타스만 장비 URL 연결. 390×844에서 가로넘침 없음, 보고본문18px/제목27px, 모바일 세로. 실제 휴대폰 검증 아님.
- 업체: 5회차3685회사/128제품 렌더 검사, 기존24개 서술120항목 기본노출과 제품갤러리31개연결 참조 검사 통과. 이후 한화2제품 추가까지 전체 check통과.
- 마지막 장비별뷰어 수정은 단위검사만 확인: 타스만3기록(표시2/링크1), 샤시2, KMTV1 분리. 수정 뒤 실제 브라우저의 스크롤·새로고침·뒤로가기는 미검증.
- 원본사진7개: 제조사 POST 다운로드200·이미지decode·치수/SHA보존; 기존자산 시각 확인과64×64표본 RGB차 평균1.318~6.351/255 대조. 원본과축소본해시가다르므로동일바이트라고주장하지않음. 신규사진확보0. docs/evidence/REDESIGN_CONTENT_PHOTOS.json 참조.
- 독립검토 수정: 다른회차 기본보고의 회사사진/첫제품 오연결을 회사자료형으로제한, 기아2문장출처재연결, 화면이탈중인쇄취소/경합회귀추가.
- PDF: IAB 인쇄호출후 토스트만확인. Chrome실제인쇄버튼실행후 Windows app검사에서 도구가 현재브라우저URL을정책상판정하지못해중단. 이후 컴퓨터입력없음. 파일저장·페이지수·비율·잘림검증완료를선언하지않음.
- 남은위험: 저장PDF, 마지막viewer브라우저회귀, /exhibition-intelligence/preview/ 경로실브라우저, 다른4회차 비교근거,26서술중19제품의직접표시현장사진,사내참고장표미제공.
- 판정: retry_with_revision. 구현과코드검증체크포인트이며 전체보고대체목표·전수조사·공개배포완료아님.

최종 공개 감사: docs/evidence/REDESIGN_PUBLIC_AUDIT.json의 7검사 PASS. 공개 금지문구0, dist allowlist와 원천산출물 대응, 추적 첨부93개(모두이미지; Office/PDF0), 기존 이력3개객체보존 확인. API의 undefined와JSON생략 차이는 직렬화 경계 비교로 정정하고 최초 결과와 원인을 보존했다. 마지막 root rg --hidden --no-ignore 공백정규식 scan도0매치.
