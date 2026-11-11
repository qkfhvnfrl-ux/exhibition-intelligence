# FIELDNOTE v2 — 다음 실행 인수인계

기준일: 2026-11-12 (Asia/Seoul). **4단계 ADEX 첫 조사 묶음을 구현·검증했습니다. ADEX 전체 조사는 진행 중입니다.** 다음 실행에서도 4단계를 이어가며, 같은 지시를 다시 요청할 필요가 없습니다. main/공개 배포는 유지합니다.

## 공통 지시와 원장

1. `AGENTS.md`, `docs/EXECUTIVE_V2_BRIEF.md`, `docs/EXECUTIVE_V2_STATUS.json`, 이 문서를 읽습니다.
2. **4~8단계 공통 조사 절차: `docs/EXHIBITION_RESEARCH_PROTOCOL.md`.** 매 회차 같은 절차를 사용합니다. 상세 원문은 `docs/EXECUTIVE_V2_STAGE_4.md`이며 5~8단계 개별 상세 지시는 아직 수신하지 않았습니다.
3. 원문 후보/접근 원장: `data/v2/collection/adex-2025.json`. 검증 묶음: `data/v2/research/adex-2025/{small-systems,mission-systems,pavilion-components,stage3-reconciliation}.json`. 모집단/공동관 부분 후보: 같은 디렉터리의 `population.json`.
4. 데이터 입력 계약: `docs/EXECUTIVE_V2_STAGE_4_DATA.md`; 검증/한계: `docs/EXECUTIVE_V2_STAGE_4_VERIFICATION.md`; 재계산 집계: `docs/evidence/EXECUTIVE_V2_STAGE_4_METRICS.json`.

## 브랜치와 기준

- 저장소: https://github.com/qkfhvnfrl-ux/exhibition-intelligence
- 작업 브랜치: `origin/work/fieldnote-v2` — https://github.com/qkfhvnfrl-ux/exhibition-intelligence/tree/work/fieldnote-v2
- 이번 시작: `5045bd513976d812d3c28672e6ddd51b76248637`.
- 3단계 구현 기준: `160efa420211160bf07eed559e4465e1059a25e8`; 초기 구현 `8cc0bcdac335221ce0f40bbc540d9a5baf76f3ec`.
- 현재 버전: `2.0.0-stage.4`. 4단계 구현 SHA는 원격 반영 후 아래 원격 검증 절에 기록합니다. 이 문서 자체의 최종 SHA는 `git log -1 --format=%H -- docs/EXECUTIVE_V2_HANDOFF.md`로 확인합니다.
- 기존 공개 소스 `4990376dfef1b6890666056bb7e526519d79c784`, 배포 구현 `4713114268f7c678859e1c950c30cc2687b128b2`, 복구 `origin/recovery/fieldnote-v1.1-20261112`. **9단계 전까지 main/공개 배포를 교체하지 않습니다.**
- unslop 고정 커밋 `97daa3eb365670ea3f87ed85356cbfcee18105a5`, Damir Sokolovsky, CC BY 4.0. 기존 기록 `docs/EXECUTIVE_V2_UNSLOP.md` 유지.

## 이번 묶음

신규 조사 18개사 + 기존 5개 사례 보완. 분석은 기존 3단계의 3개 메뉴/업체 화면을 그대로 사용합니다. 원장→화면 생성 경로에 연구 묶음을 연결하고 부스 번호/좌표, 실제 출품/행사 발표/배경자료, 사진 원문/이용조건을 보존했습니다.

- 소형·부품 7: 엠앤씨솔루션, 연합정밀, 비츠로셀, 씨엠테크론, 파이어킴, 파이버프로, KTC.
- 임무체계 6: 코츠테크놀로지, 휴니드, 이오시스템, 솔빛시스템, 코난테크놀로지, RFcore.
- 공동관 5: 수성정밀기계, 에이치케이씨, 에델테크, 픽소니어, 펀진.
- 기존 5: 현대로템, 기아, STX엔진, 현대위아, PEI. 기존에 묶였거나 누락된 제품을 세분화하고 정식 원장에 연결했습니다. 기아 지휘차 중복과 PEI 협업의 제품 중복 집계는 제거했습니다.

누적 후보 **369개 명칭**(기업·기관·공동명칭 포함), 관련 22, 조사한 관련성 검토중 1, 미착수 346. 조사 23개 중 근거 범위 내 분석완료 9, 자료부족 14. 공식 전체 모집단은 미확보이며 600여 개사라는 발표를 분모로 쓰지 않습니다. `relevanceReviewed`는 확정/제외만 세는 기존 필드로 22이며, 조사 착수 수 23과 다릅니다.

이번 출품 관련 제품·서비스 항목 79(현장 근거 23 / 행사 발표 56), 별도 배경 3. 신규 ID 75(회차 항목 72 + 배경 3)는 기존 묶음 분리 포함, 기존 묶음 ID 7 대체. 현재 앱 전체는 제품·서비스 기록 84입니다. 이것을 독립 확인한 실물 모델 84종으로 보고하지 않습니다.

현장사진 신규 고유 자산 **17장**, 모두 link-only. 현재 앱 사진 59건 중 해당 회차 36건. DTaQ 사진은 여러 업체에 연결되지만 고유 사진을 중복 합산하지 않습니다. 기자 기사 작성자와 촬영자를 구별했고, 사진의 `sourceDate`는 자료 날짜로 표시합니다. 신규 복제 이미지 파일은 0장입니다.

공식 지도 32영역 / 35명칭 연결 유지. 번호 확인 3개(CMTECHRON 10-M1, 파이버프로 9-C4, KTC 8-P4); 앞의 2개는 사전 발표, KTC는 현장사진. 이 3개를 임의 좌표로 연결하지 않았습니다. PEI `18-20`/`7-C11` 상충은 미해결이며 stable ID·공식 사전 도형을 유지합니다.

## 재현과 검증

```sh
python scripts/collect-adex-2025.py --check
npm run build
npm run check
node scripts/report-adex-stage4.mjs
git diff --check
```

`collect-adex-2025.py`는 `adex_population_review.py`로 79행 전사 재검토와 3개 공동관 신규명칭을 재적용합니다. 같은 사실을 생성물에서만 고치지 않습니다. `registry.json`, `public.json`, `data/v2/app/`, `dist/`는 재생성 파일입니다. 앱은 `dist/data/v2/app/`만 사용하며 조사 큐/진행률은 배포하지 않습니다.

147개 테스트·빌드·수집원장 재생성 일치·diff 검사 통과. 실제 브라우저에서 연합정밀 지도/사진 왕복, HKC 미확인 좌표 안내, SMV350 제품 검색, HKC/STX 비교, KTC 부스번호/서비스 항목을 확인했습니다. 독립 원문 검수 및 수정 결과는 `docs/research-v2/stage4-independent-audit.md`에 있습니다.

실제 휴대폰 터치와 저장 PDF 페이지 나눔은 여전히 미검증입니다. 과거 관리 Chromium의 인쇄 비활성 한계를 해결했다고 말하지 않습니다. 모든 외부 원문의 실시간 접근성을 전수 검증하지 않았습니다. localStorage/IndexedDB의 기존 개인 기록을 읽거나 변경하지 않았습니다.

## 정확한 다음 시작점

1. `git status --short`와 `git fetch origin`으로 후속 변경을 확인합니다. 사용자 변경을 reset/clean하지 않습니다.
2. **Hall 8 / scanned label 001 / WASCO**부터 남은 작은 글씨 135행을 확인합니다. Hall 7의 79행 확인은 관련성/현장 출품 확인과 별개입니다.
3. **한국씨앤오테크·네스앤텍·화인정밀·데크카본·브로던**을 다음 공동관 묶음으로 시작합니다. `population.json`의 19명칭/22품목 및 DTaQ의 7기업/9품목 사후 보고를 대조합니다. 이미 등록된 영문 이름/계열사와의 중복을 먼저 확인합니다. 19명칭을 모두 신규 법인으로 추가하지 않습니다.
4. **Patria / Finland pavilion 8K13**, 미국관 전체 37개 하위 명단을 이어갑니다. 미국관 Meeting Point 7-L9를 전체 업체의 부스로 대입하지 않습니다.
5. 공조·소화·좌석·소재·정비 및 지휘소·의무후송 연결을 계속 넓힙니다. FIRE KIM/CMTECHRON 등의 자료부족 기업은 원문이 생길 때 보완하고 완료한 기업은 새 근거가 있을 때만 갱신합니다.
6. 전체 2025 공식 디렉터리·야외·최종 회차 명단은 별도 미확보. Sourcehere 현재 회차는 2027, SIBAT 연결 PDF는 2023이므로 2025 모집단으로 가져오지 않습니다.
7. 검증 가능한 다음 묶음마다 원장·STATUS·HANDOFF 갱신→검사→커밋→원격 SHA 확인. 이 묶음 종료를 ADEX 전체 단계 완료로 보고하지 않습니다.

## 이후 회차

5 Eurosatory / 6 DSEI / 7 IDEX / 8 SAHA 모두 `docs/EXHIBITION_RESEARCH_PROTOCOL.md`를 사용합니다. 각각 `data/v2/collection/{eventId}.json` 큐에서 공식 모집단·관련성·실출품·지도 조사를 이어갑니다. 각 단계 상세 지시의 미수신 상태는 보존합니다.

## 원격 검증

이번 구현은 로컬 검증 완료 후 원격 반영 대기 상태입니다. 일반 Git 인증이 없으면 GitHub blob/tree/commit/ref API로 같은 작업 브랜치에 fast-forward하며 expected SHA를 사용합니다. 로컬 blob/index tree와 원격 객체 및 ref를 재확인한 뒤 이 절과 STATUS를 실제 SHA로 갱신합니다.
