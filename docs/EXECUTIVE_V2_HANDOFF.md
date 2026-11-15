# 현재 재개 지점 — 2026-11-16

본 구현은 승인되었으며 로컬 구현과 검증을 계속한다. 큰 지도 → 별도 업체 메인 → 장비별 설명 → 16:9 종합보고(모바일은 세로 읽기) 구조를 유지한다. 첫 공개 대상은 기존 `/preview/`이며 완성본 검토 전 push·merge·배포 워크플로 실행은 금지한다.

- 상태: B03 `completed`는 5개 종합보고의 화면·실제 PDF 검증 범위에 한정한다. B04는 `executing`이며 전체 보고서 대체·전수 조사·공개 반영은 완료하지 않았다.
- 현재 앱: 5개 회차, 업체 명칭 3,685개, 제품·서비스 기록 130개, 장비별 서술 40개·설명 항목 200개, 종합보고 5개. 등록 수와 실제 참가·실물 전시 확인 수를 구분한다.
- 사진: Patria 신규 자산 4장과 TRACKX·TREMOS를 연결하고 기존 6×6 ID를 보존했다. Cockerill i-X·GDAMS의 기존 사진을 추가 연결했다. 6×6의 서로 다른 두 형상과 일반 참고사진의 구분, 출처별 제약을 유지한다.
- 사진 공백: 서술이 연결된 40개 제품 중 18개 제품에 표시 가능한 해당 회차 사진 19개가 연결되어 있고, 22개 제품은 사진 공백이 남아 있다. 종합보고의 사진 수와 구분한다.
- 검증: 최신 Eurosatory·IDEX 문구 압축을 포함한 `npm run build` 성공, `npm run check` 200/200 통과·실패 0·skip 0. `.local-reports-build.log`, `.local-reports-check.log` 참조.
- PDF: `output/pdf/final/`의 ADEX·Eurosatory·DSEI·IDEX·SAHA 최종 파일 5개가 자동 검사와 시각 검수를 통과했다. 모두 1쪽·약 320×180mm이며 본문·근거 링크·폰트 포함, 페이지 밖 글자·글자 겹침·사진과 글자 겹침 없음이 확인됐다. [최종 PDF 검증 기록](evidence/REDESIGN_PDF_VALIDATION_2026-11-16.json) 참조. 실제 휴대폰 검증은 별도로 남아 있다.
- 미통합 초안: `docs/research-v2/redesign-narratives-photo-coverage.json`의 추가 6개 제품 서술. 위 40개 서술·200개 항목에 포함하지 않는다. 사진·제품·회차·출처와 표현의 확인 범위를 검토한 뒤 기존 생성기에 연결한다.
- Git: `codex/fieldnote-redesign-audit`, 현재 기준 HEAD `6b2999bcafafbea1800e84547ce97a91f8a6e601`. 이후 구현 묶음은 작업 트리에 있으며 새 커밋은 저장 후 기록한다. `137fa841eedeaa6ef2d2d041744ad10e11c7cd8e`는 최신 구현 커밋이 아니다.

다음 작업은 미통합 6개 제품 초안 검토·연결 → 남은 22개 제품의 사진 보강과 전체 회차 조사 → 변경 범위의 화면·사진 검증이다. 완료한 5개 보고 검증을 전체 조사나 공개 반영 완료로 확대하지 않는다.

조사 원장은 `data/v2/collection/`의 5개 회차 큐를 유지한다. ADEX의 Hall8 024 / SANJU OPTICAL 이후 112개 명칭, 나머지 공동관·핀란드관·미국관 구성, Eurosatory 전체 카탈로그·지도, DSEI 명칭·관련성·실출품·지도, IDEX 전체 명단·안내서·지도, SAHA 프로필·관련성·분류·모집단·지도를 계속 조사한다. 아래 과거 조사 기록은 이 재개 가능한 큐를 보존하기 위한 기록이며 자동 공개 반영 지시가 아니다.

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
