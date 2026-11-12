# FIELDNOTE v2 — 다음 실행 인수인계

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
