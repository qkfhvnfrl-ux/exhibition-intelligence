# 최신 로컬 사진 우선 작업

2026-11-16 PHOTO-01 로컬 1차 사진 묶음 완료. 사진 상태 표시·안정 정렬과 정확한 제품 대표사진 우선 선택을 적용했다. 기존 DSEI 업체 5곳에 참고사진을 추가하여 회차별 사진 보유 업체 합계 32→37, 사진 연결 제품 31→40. 신규 다운로드 4장, SETAS 기존 자산 1장 재사용, 이전 후보 13건 연결. 현장사진 신규 0장. build/check 213개 통과, PC1440/모바일390·사진 확대/새로고침·필터·검색 확인. 로컬 http://127.0.0.1:4177/#companies?event=dsei-2025 를 제공한다. 공개 반영은 별도 요청 범위다.

증거 docs/evidence/PHOTO_PRIORITY_2026-11-16.json.

---

# 2026-11-16 1차 공개 완료

[공개 웹앱](https://qkfhvnfrl-ux.github.io/exhibition-intelligence/preview/) · [GitHub 프리릴리즈](https://github.com/qkfhvnfrl-ux/exhibition-intelligence/releases/tag/v2.0.0-preview.1)

공개 커밋 ca195ab60d60265bba73c49fce6779513a316763. 기존 /preview/에 검증된 65개 장비 설명·325항목·5개 종합보고를 게시했다. main은 a633a9728fdbb1599c0dff5904b2fc4f9ea7a9a7로 유지했다. 로컬 build/check 209개, GitHub CI·Pages, 익명 HTTP 105파일과 공개 브라우저 검증을 통과했다. 전체 자료 확대 목표는 일시정지 상태로 유지하며, 미검증 후속 변경은 원래 작업공간에 보존했다. 변경 PDF 2개와 자료 공백은 미완료다. 아래 이전 공개 보류 문구는 당시 기록이다.

증거: docs/evidence/FIRST_PREVIEW_RELEASE_2026-11-16.json.

---

# 현재 재개 지점 — 2026-11-16

승인된 큰 지도 → 별도 업체 메인 → 장비별 설명 → 16:9 종합보고(모바일 세로)를 로컬 구현·검증 중이다. 현장사진이 없으면 검증한 일반 제품사진을 구분해 표시한다. 첫 공개 대상은 기존 /preview/이며 완성본 검토 전 push·merge·배포하지 않는다.

- 상태: B02/B04 executing, B03 retry_with_revision(변경PDF2개 저장), B05 planned. 전체 보고서 대체 목표는 미완료.
- 자료: 5회차·업체명칭3,685·제품/서비스131·장비서술65·325항목·종합보고5. 기록 수는 실제 참가/실물 전시 확인 수가 아니다.
- 이번 묶음: 12서술60항목, 새 LIBELLE 제품과 IDEX2025 현장사진1장, COBRA II 과거전시 참고사진1장. 기존 외부사진19장·PARS 참고사진2장 재연결은 새 다운로드와 구분한다.
- 사진: 서술29제품에 고유 현장사진49장. 참고사진 포함30제품에 표시사진이 있으며 현장사진공백36·모든표시사진공백35제품이다. 미서술 제품기록66개가 남는다.
- UI/내용: 정확한 제품ID에만 참고사진 fallback과 URL 갤러리를 적용. 현장사진이 아님을 화면/인쇄에 표시한다. Flickr는 웹 원문링크/별도확대, 인쇄는 이미지 대신 원문안내. EO로 오인한 MBDA사진 연결 제외·원본 보존. DTaQ 파생 공개문구196고유어절.
- 검증: build 성공, check209/209·실패/skip0, 기존85이미지 보존·총87개. 신규12서술의1440/390, 사진19장 순환·로딩, PARS2장/새로고침, 최종5보고×1440/1280/390 통과. 보고 데스크톱16:9·모바일세로·넘침0. 실제 휴대폰 미검증.
- PDF: 이전5개 검증본을 보존한다. DSEI 외부사진 제외와 SAHA PARS참고사진 추가 때문에2개 재저장/렌더가 필요하다. 새 PDF0개, SAHA인쇄미리보기1페이지 관찰만 완료. Windows 제어 도구가 인쇄창 입력을 적용하지 못해 사용자가 취소했고 웹앱복귀 확인. 새 인쇄창을 다시 열지 않는다.
- Git: codex/fieldnote-redesign-audit, 이번 구현 저장점 d3c4580091f0c83b580cacfad847ea2d6dcc4b5b. 후속 문서 커밋과 구분한다. 원격변경 없음.

다음: redesign-reference-photo-next-queue.json의 검토16장 중 후보13장(시제차 한정2장 포함)을 조건에 맞춰 연결한다. 현재 모두 운영 미통합이며 나머지33장은 원장 분류만 완료했다. 검증한 제품 참고사진 후보를 연결하고 남은 사진35제품/미서술66기록을 조사한다. 공식지도·명단·전체관련업체·실기기·완성본검토도 남는다. ADEX Hall8 024/SANJU OPTICAL 이후112명칭·공동관/핀란드관/미국관, Eurosatory전체카탈로그, DSEI/IDEX/SAHA명단·원본지도 큐를 유지한다.

현재 증거: [통합 검증](evidence/REDESIGN_NEXT_EXPANSION_2026-11-16.json), [독립 감사](evidence/REDESIGN_NEXT_EXPANSION_AUDIT_2026-11-16.json), [브라우저](evidence/REDESIGN_NEXT_EXPANSION_BROWSER_2026-11-16.json). 이전 PDF 검사 결과는 최신2보고 저장 검증을 대신하지 않는다.

---

# 과거 구성품53서술 체크포인트 — 2026-11-16

아래는 이번 사진 확대 이전 기록이다. 현재 수치·PDF 상태·다음 작업은 문서 맨 위를 따른다.

승인된 큰 지도 → 별도 업체 메인 → 장비별 설명 → 16:9 종합보고(모바일 세로 읽기) 구조로 로컬 구현과 검증을 계속한다. 첫 공개 대상은 기존 `/preview/`이며 완성본 검토 전 push·merge·배포 워크플로를 실행하지 않는다.

- 상태: B02·B04 `executing`, B03 `completed`는 기존 5개 종합보고 화면·실제 PDF 검증 범위다. 전체 조사·보고서 대체·공개 반영은 미완료다.
- 현재 앱: 5개 회차, 업체 명칭 3,685개, 제품·서비스 기록 130개, 장비 서술 53개·265항목, 종합보고 5개. 등록 수를 참가·실물 전시 확인 수로 바꾸지 않는다.
- 이번 내용: ADEX 구성품·중소업체 장비 7개 서술 통합, 출처 메타데이터 보존 보완, 업체 헤더의 국가 표시 추가. 독립 내용 검토 7개 통과.
- 사진: 신규 이미지 다운로드 0·표시 자산 추가 0. 기존 link-only 고유 사진 4개를 5곳에 연결했다. 정부 PDF 검토용 문서 2개 다운로드는 별도 집계다. 첨부는 공공누리 제1유형이지만 현장 사진 0이므로 DTaQ·제조사 사진 허용으로 확대하지 않는다. [조사 기록](research-v2/redesign-photo-candidates-components.json) 참조.
- 사진 공백: 서술 53개 중 직접 표시 사진이 있는 제품 24개·고유 현장사진 29개, 사진 공백 29제품. 전체 앱의 표시 가능한 event 사진 기록 53개 및 보고 사진 수와 구분한다.
- 코드 검증: `npm run build` 성공, `npm run check` 202/202 통과·실패 0·skip 0. `.local-components-build.log`, `.local-components-check.log` 참조.
- 브라우저: 신규 7개 제품을 모두 1440×1000·390×844에서 확인했다. 다섯 항목·이미지 0개·사진 미확보 문구가 정상이며 가로 넘침 0이다. 수성 제품 링크와 새로고침 후 선택 유지, 105MM 전시형/K9 검토 설명의 구분, T-90MS 출처 설명과 Hanwha·Milrem 국가 헤더를 확인했다. [브라우저 증거](evidence/REDESIGN_COMPONENTS_BROWSER_2026-11-16.json) 참조. 실제 휴대폰 검증은 아니다.
- PDF: `output/pdf/final/`의 기존 최종 5개가 자동·시각 검수를 통과했다. 이번 보고 화면의 본문·이미지·링크 주소·배치는 동일하고 DSEI 출처 링크 도움말만 변경돼 재저장하지 않는다. [PDF 검증 기록](evidence/REDESIGN_PDF_VALIDATION_2026-11-16.json)의 범위를 유지한다.
- 이전 묶음: 46개 서술 묶음의 기존 사진 10개 연결(HAVOC 2개 포함), 그 이전 Patria 신규 사진 4장과 TRACKX·TREMOS 추가, i-X·GDAMS 연결을 보존한다. 6×6 두 형상 및 일반 참고사진·해당 회차 사진의 구분을 유지한다. 이전 6개 제품 브라우저 기록은 별도 증거다.
- SAHA: [대체 경로 조사](research-v2/redesign-photo-candidates-saha.json)의 보고 3사례 모두 ready 0. 2024 사진을 2026 사진으로 승격하지 않는다.
- Git: `codex/fieldnote-redesign-audit`, 53개 서술 구현 저장점 `7fa59fa2364ca6b5f08d7eb6b584946bdc0f10ea`. 후속 인계 문서 커밋과 구분한다. 직전 구현 `49d846d0b80c6247db7bb3003c1ea008a874c9bd`, 보고/PDF `16e7e691f232eeee7951c15ef0ae4ea274aea57d`. 원격 push·배포 없음.

다음 작업은 직접 표시 사진이 없는 29개 제품과 전체 관련 업체 조사다. 사진 사용 조건과 해당 회차·형상이 확인된 근거만 연결한다. 이번 서술 확대·브라우저 검증과 기존 PDF 검증을 전체 조사 완료로 확대하지 않는다.

조사 원장은 `data/v2/collection/`의 5개 회차 큐를 유지한다. ADEX의 Hall8 024 / SANJU OPTICAL 이후 112개 명칭, 나머지 공동관·핀란드관·미국관 구성, Eurosatory 전체 카탈로그·지도, DSEI 명칭·관련성·실출품·지도, IDEX 전체 명단·안내서·지도, SAHA 프로필·관련성·분류·모집단·지도를 계속 조사한다. 아래 과거 기록은 이 큐를 보존하기 위한 기록이며 자동 공개 반영 지시가 아니다.

[53개 서술 묶음의 통합 검증 기록](evidence/REDESIGN_COMPONENTS_2026-11-16.json)에 코드·내용·브라우저·사진 조사와 보고 영향 근거를 모았다.

---

# 과거 개편 체크포인트 — 2026-11-15

아래는 당시 기록이다. 승인 대기, PDF 미저장, 과거 검사 수와 커밋을 현재 상태로 해석하지 않는다.

2026-11-15 사용자 결정: 큰 지도 → 별도 업체 메인 → 장비별 설명 → 16:9 종합보고(모바일 세로) 본 구현 승인. 첫 공개 대상은 기존 /preview/만이며 실제 배포는 완성본 검토 뒤 진행한다.

현재 실제 src/data 개편과 후속 검증을 진행했다. 26제품·130설명 항목은 유지하면서 기아 문구를 압축했고 보고서 사진 원문·이용조건·PDF 근거 링크와 최소 8pt 출처를 보완했다. 최신 build/check 184/184 통과. 마지막 사진 그룹·새로고침·닫기 복귀와 /exhibition-intelligence/preview/ 하위경로 브라우저 검증 완료. 보고서 출처 수정 이전 16:9/모바일 캡처는 docs/evidence/screenshots에 있으며 최신 출처 수정의 화면 검증으로 사용하지 않는다. Windows 브라우저 URL 확인 실패로 PDF UI가 두 번째 중단되었고 실제 저장 PDF는 없다. 다른4회차 제한 조사 packet 2개는 작성했으나 앱 미연결. 전체 보고 대체 목표와 공개 배포는 미완료다.

이 절이 아래 과거 A단계 대기 상태보다 우선한다. 로컬 브랜치 codex/fieldnote-redesign-audit, 공개 push/merge/workflow 미실행. 다음 시작은 PROJECT_STATE.md/TASKS.md/EVIDENCE.md 및 승인 구현 계획이다.

당시 후속 구현 커밋: `137fa841eedeaa6ef2d2d041744ad10e11c7cd8e`. 개발서버4174 종료. 당시 다음 작업은 보고 링크/출처 글자 크기의 브라우저 확인과 저장 PDF였으며, 독립적으로 새 4회차 조사 packet의 기존 제품 연결·사진 대조를 계속할 수 있었다.

---

# FIELDNOTE v2 — 다음 실행 인수인계

## 과거 재개 지점 — 2026-11-15 개편 A단계

### 최종 A단계 결과

초안·감사·QA 저장 커밋: `056c2bb4ad6b28644d13277e1f88879991f54b9c` (로컬만). 뒤따르는 문서 커밋은 이 검증한 구현 커밋을 기록한다. Git 작성자 설정이 없어 최초 커밋 시도는 실패했고, 전역 설정을 바꾸지 않고 해당 명령에만 Codex 로컬 작성자 값을 적용해 저장했다.

감사·3화면 초안·브라우저 QA를 마쳤다. 전체 개편 상태는 `needs_human`: 별도 업체 메인/16:9 보고 방향 및 향후 첫 공개 범위 질문 2개를 제출했다. 답변이 오면 DECISIONS/TASKS에 반영하고 승인된 구현을 이어간다. 완료된 요구사항 자체를 재질문하지 않는다.

`review/verification.json`에 표본 7개 사진 decode, 지도/공동부스/검색/복귀, 장비 링크/새로고침, 1440×1000·390×844 검수 결과가 있다. 실제 휴대폰/PDF와 IAB 전체화면은 성공 검증하지 않았다. `review/screenshots/`의 화면 4개가 검토 증거다. 마지막 로컬 저장 커밋은 `git log -1 --format=%H`로 확인한다. 공개 원격 반영은 의도적으로 하지 않았다.

재개 명령: `npm run build`, `node review/build-review.mjs`, `node scripts/serve.mjs --root . --host 127.0.0.1 --port 4174`. 이번 기준검사 2건 실패는 제품 구현 중 Windows 이식성/fixture 권한을 별도로 해결하고 전체 검사 성공을 재확인할 것.

다음 실제 수정 시작점: `src/v2/app.js`, `state.js`, `details.js`, CSS와 `scripts/compile-v2-app.mjs`. 제품 사진 연결은 현대로템·현대위아·기아의 7장부터 원문/형상 대조. 다음 조사 표본 확장은 이오시스템/STX와 한화 계열을 포함하며 전체 원장의 기존 다음 큐(Hall8 024/SANJU OPTICAL)도 보존한다.

- 현재 목표: 의사결정용 기존 보고서를 대체할 사진·설명·근거·가독성을 갖춘 관람 흐름. 이번 실행은 감사·로컬 초안·검증까지다.
- 작업: `codex/fieldnote-redesign-audit`; 기준 `7040964ccc6af9e3ecfd355cb9be53de33ee6ef6`. `review/index.html`의 지도/업체/종합보고 초안은 QA 완료했으며 최종 판정은 `PROJECT_STATE.md`, `TASKS.md`, `EVIDENCE.md`를 확인한다.
- 검토안: `docs/REDESIGN_REVIEW_2026-11-15.md`. 기존 3사 사진·공식 도면을 활용한 초안이며 신규 사진 확보나 전수 조사 완료가 아니다. 기존 보고서 참고 파일은 미제공이다.
- 최신 확인된 기존 배포: preview `7040964ccc6af9e3ecfd355cb9be53de33ee6ef6`, production `a633a9728fdbb1599c0dff5904b2fc4f9ea7a9a7`, run `43128930795`. 이번 작업에서 배포하지 않았다.
- 기준 검증: `npm run build` 성공; `npm run check` 150/152 통과·2 실패. `docs/evidence/REDESIGN_BASELINE_CHECKS.md`에 Windows symlink fixture EPERM/경로 구분자 문제 재현. lint 스크립트 없음.
- 원장 감사: `docs/evidence/REDESIGN_AUDIT_DATA.json`. ADEX 해당 회차 사진 41건 중 src 있는 기록 7건/링크34건; 이 숫자는 모든 이미지 현재 로딩 성공을 뜻하지 않는다.
- 다음: 저장된 QA 증거/검토 보고 확인 → 필요한 결정 반영 → 승인된 화면 방향에서 실제 src/data 개편. 공개 범위·시점 승인 전 push/merge/workflow를 실행하지 않는다.
- 과거 내부 업무 관련성 작성 지시는 중지한다. 공개용 원천·컴파일러·JSON·문서·첨부 정리는 후속 미완료다. 데이터 보존과 공개용 재작성을 함께 검토하고 원본 영구 삭제·Git 이력 재작성·사용자 저장소 삭제를 하지 않는다.
- 아래 ADEX 4단계 큐/완료 기록은 재개 가능한 역사적 상태로 보존한다. 이를 이번 A단계 신규 완료나 자동 원격 반영 지시로 해석하지 않는다.

## 이전 실행 기록 — 2026-11-12

기준일 2026-11-12 (Asia/Seoul). **4단계 ADEX 두 번째 조사 묶음 저장·검증. ADEX 전체 조사는 진행 중.** 추가 승인이나 같은 지시 재입력 없이 4단계를 계속한다.

## 기준·원문

- 저장소 https://github.com/qkfhvnfrl-ux/exhibition-intelligence
- 작업 브랜치 `work/fieldnote-v2`; 버전 `2.0.0-stage.4`.
- 이번 시작 `f6a89fcf07aa09dcd8060359e8ebec942f543b85`.
- 이번 구현 `546838f9556e7441b74dd8e6e6c4b138bb178d41`; tree `bac351fbb758c7729565093d8e884b1df2bd54c4`.
- 1차 구현 `91dee14bbd21c172cd127e18409ad9c582f5c9bc`; 3단계 구현 `160efa420211160bf07eed559e4465e1059a25e8`.
- 일반 Git push 인증은 없었으므로 연결된 GitHub blob/tree/commit/ref API를 사용했다. 기존 원격 SHA 조건의 fast-forward 반영, fetch 후 로컬 검증 tree와 전체 일치 확인. 로컬 자체 커밋은 `local/adex-batch2-validated`에 보존하고 원격 작업 브랜치를 재체크아웃했다. force/reset/clean 미사용.
- main/공개 배포는 **9단계 전까지 교체하지 않는다**. 기존 공개 소스 `4990376dfef1b6890666056bb7e526519d79c784`, 복구 `recovery/fieldnote-v1.1-20261112` 유지.
- unslop 고정 `97daa3eb365670ea3f87ed85356cbfcee18105a5`; 기존 기록 `docs/EXECUTIVE_V2_UNSLOP.md` 유지.
- 시작 시 `AGENTS.md`, `EXECUTIVE_V2_BRIEF.md`, `EXECUTIVE_V2_STATUS.json`, `EXECUTIVE_V2_STAGE_4.md`를 읽는다.
- 4~8단계 공통 조사 절차 **`docs/EXHIBITION_RESEARCH_PROTOCOL.md`** 및 입력 계약 `docs/EXECUTIVE_V2_STAGE_4_DATA.md` 준수.

## 이번 변경

신규 조사 6개사: 한국씨앤오테크, 네스앤텍, 화인정밀, 데크카본, 브로던, Patria. 기존 씨엠테크론 1개사에 사후 현장 근거를 추가했다. 제품군·샘플 10개 추가, 고유 현장사진 원문 링크 5개 추가(화면 복제/임베드 0). 항공용 출품을 차량용 출품으로 바꾸지 않았다. 브로던은 관련성 검토중/자료부족, Patria는 사전 출품 발표/자료부족이다.

씨엠테크론 두 번째 첨부사진 `1768828353277171.jpg`는 AI 생성 콘텐츠 워터마크 때문에 증거에서 제외했다. 나머지 사진에도 무가공 원본 보증을 부여하지 않았다. 본문의 RCWS 표적과 현장 무인전투기 열상전술표적은 중복 집계를 피하려고 같은 항목으로 병기했으며 정확한 형식 동일성은 후속 확인 대상이다.

Hall8 WASCO 001부터 SAMKEE ENERGY SOLUTIONS 023까지 기존 명칭 전사 23행을 원본 PDF 해시·전체 도면·확대 렌더와 대조했다. 명칭 전사 검토는 관련성·참가·제품 조사와 다르다. 누적 전사 검토 102행, 작은 글씨 미검토 112행.

누적 후보 **375명칭**, 관련 **27**, 조사한 관련성 검토중 **2**, 제외 **0**, 분석완료 **14**, 자료부족 **15**, 미착수 **346**. 새 명칭을 조사해서 추가했으므로 미착수 수는 줄지 않았다. 전체 모집단 미확보라 완료율을 계산하지 않는다.

검증 묶음 회차 항목 89 + 배경 3. 기존 자료 포함 앱 제품·서비스 기록 94, 전체 사진 64 중 해당 회차 41. 이는 실물 모델 94종이나 신규사진 64장이라는 뜻이 아니다. 공식 지도 32영역·35명칭 유지, 번호 확인 업체 4개. Patria 8K13은 번호 근거만 등록했고 좌표는 만들지 않았다. PEI 번호 상충 유지.

## 파일·재현

- 원문 명단/큐: `data/v2/collection/adex-2025.json`.
- 신규 원천: `data/v2/research/adex-2025/pavilion-followup.json`, `batch2-roster.json`.
- 기존 보완: `small-systems.json`, 모집단·전사 기록 `population.json`.
- 1차 묶음: `mission-systems.json`, `pavilion-components.json`, `stage3-reconciliation.json` 유지.
- 이번 감사 기록: `docs/research-v2/stage4-batch2-audit.md`.
- 이번 증감: `docs/evidence/EXECUTIVE_V2_STAGE_4_BATCH_2.json`.
- 누적 집계: `docs/evidence/EXECUTIVE_V2_STAGE_4_METRICS.json`. 이 파일의 batch는 3단계 기준 이후 **4단계 누적 증감**이다. 개별 묶음 증감은 BATCH_2와 STATUS 참조.

```sh
python scripts/collect-adex-2025.py --check
npm run build
npm run check
node scripts/report-adex-stage4.mjs
git diff --check
```

147개 검사·빌드·원장 재생성 일치·diff 검사 통과. 신규 회사/상세/제품의 앱 shard 연결과 제외 사진 미포함을 확인했다. UI 코드는 변경하지 않았으며 이번 실행에서 브라우저 화면 재시험은 하지 않았다. 실제 휴대폰·저장 PDF 페이지 나눔 미검증 유지. 1차 원격 CI 성공은 STATUS에 batch_1_remote_ci로 보존하며 2차 CI 검증으로 오인하지 않는다. 개인 브라우저 기록 미접근.

## 정확한 다음 시작점

1. `git status --short`, `git fetch origin`과 최신 원격 HEAD 확인. 사용자 변경 보존.
2. **Hall8 scanned label 024 / SANJU OPTICAL**부터 작은 글씨 나머지 **112행** 대조. 이어 NANG MAN LAB 등. 수집 큐에 남아 있는 135행 문구는 1차 역사적 설명이며 최신 기준은 이 문서·population·metrics의 112행이다.
3. 방위사업청 리플릿의 나머지 공동관 구성 업체: `population.json` 후보에서 이미 채택한 회사 제외 후 진행. 브로던 국가/법인/실출품은 추가 확인.
4. 핀란드관 다른 업체와 미국관 37개 구성 명단. Patria MUSCL·8K13은 이미 등록. 국가관 전체 위치를 구성 업체마다 임의 배정하지 않는다.
5. 공조·소화·좌석·소재·정비·지휘소·의무후송 관련 업체 계속 확장. 완료 업체는 새 근거 있을 때만 변경.
6. 공식 2025 전체 디렉터리·야외 최종명단 미확보. 현재 2027 Sourcehere와 2023 SIBAT PDF를 2025 자료로 가져오지 않는다.
7. 검증 가능한 묶음마다 원장·STATUS·HANDOFF→검사→커밋→원격 tree 대조. 전체 ADEX 완료로 표시하지 않는다.

5~8단계는 같은 공통 조사 절차를 사용하되 개별 상세 지시는 아직 미수신이다. 이 문서 자체의 최종 커밋은 `git log -1 --format=%H -- docs/EXECUTIVE_V2_HANDOFF.md`로 확인한다.

## 고정 진행 확인 링크

사용자 후속 요청으로 로그인 없는 GitHub Pages `/preview/`를 주 진행본으로 사용한다: https://qkfhvnfrl-ux.github.io/exhibition-intelligence/preview/ . 동일 주소 유지. [배포 기록](EXECUTIVE_V2_PREVIEW.json)과 [갱신 절차](EXECUTIVE_V2_PREVIEW.md) 참조. main 앱 루트는 9단계까지 유지하며, main 배포 워크플로만 두 빌드를 조립하도록 변경했다. 개발 CI 성공 후 자동 반영되므로 후속 작업에서 최종 Pages 실행과 원본 SHA를 확인한다. 이전 Sites 링크는 삭제하지 않았다.

공개 첫 배포 성공: main 인프라 `a633a9728fdbb1599c0dff5904b2fc4f9ea7a9a7`, 진행본 원본 `a2e518f84f95e5de51f4cfadcf70841992ac36fe`, Pages 실행 `43128424515`. 익명 HTTP와 브라우저에서 로그인 없이 화면 표시를 확인했다. 152개 로컬 검사 통과, 조립 결과 main 빌드 100개 파일 내용 일치. 이후 문서/인프라 커밋은 같은 주소 갱신을 다시 유발하므로 최신 실제 원본은 공개 `/preview/deployment.json`에서 확인한다.

## 과거 본 구현 저장점 — 2026-11-15

로컬 구현 커밋 `54ca6450aeaa3426d1a55e8926c723ab3577d72d`. 최종 build/check180개 통과와 공개감사7검사 통과를 포함한다. 실제 저장 PDF/마지막뷰어/preview하위경로의 브라우저검증은 미완료다. 개발서버4174는검증종료후중단했다. 다시검토하려면 `npm run build`, `npm run dev`로 로컬 실행한다. 공개push는하지않았다.

다음 조사 후보는 [10제품 큐](research-v2/redesign-next-narrative-queue.json)를 따른다. 아직 서술 없는77제품 중10개를 선정했으며, 회사사진19장은 식별 후보이고 직접 제품 연결사진으로 세지 않는다. 새 원문 조사·내용 작성은 다음 구현 범위다.
