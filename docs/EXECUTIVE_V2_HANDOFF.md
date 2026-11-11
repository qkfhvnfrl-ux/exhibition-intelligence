# FIELDNOTE v2 — 다음 실행 인수인계

기준일: 2026-11-12 (Asia/Seoul). **3단계 소스 구현과 로컬 검증을 마쳤고, 다음은 4단계 ADEX 조사 확장입니다.** 실제 PDF 파일 저장·페이지 검수와 물리적 휴대폰 시험은 남아 있습니다. 전체 참가기업 조사나 공개 배포 완료가 아닙니다.

## 브랜치와 기준

- 저장소: https://github.com/qkfhvnfrl-ux/exhibition-intelligence
- 원격 작업 브랜치: `origin/work/fieldnote-v2` — https://github.com/qkfhvnfrl-ux/exhibition-intelligence/tree/work/fieldnote-v2
- 기존 소스 1.1.0: `4990376dfef1b6890666056bb7e526519d79c784`; 기존 배포 구현 `4713114268f7c678859e1c950c30cc2687b128b2`.
- 복구 브랜치: `origin/recovery/fieldnote-v1.1-20261112`. main은 위 기준 유지. 이번 작업에서 공개 배포하지 않았습니다.
- 2단계 구현: `61ab77ed4af4ad2330d886c9ee58d90e9fe24fd8`; 수집 묶음 `faa792b99c74219d9beb58da0159494b7778739a`.
- 3단계 시작/원격 재확인 SHA: `aff4f5ca909bfbc7a945a512a2813b9513dfbeb5`.
- 현재 구현 버전: `2.0.0-stage.3`. **구현 기준 커밋 `8cc0bcdac335221ce0f40bbc540d9a5baf76f3ec`**, tree `5a31da8951ec3c2861b3b34683489cc596d9f8f1`. GitHub ref/commit 객체, git fetch, 로컬 index tree 일치를 확인했습니다.
- [구현 CI](https://github.com/qkfhvnfrl-ux/exhibition-intelligence/actions/runs/43118714357): success. 미리보기 artifact `fieldnote-v2-preview-8cc0bcdac335221ce0f40bbc540d9a5baf76f3ec`, ID `13898569722`, 2026-11-25T23:18:06Z 만료. 미리보기 산출물이며 공개 배포가 아닙니다.
- 공개 version.json HTTP 200, 버전 `1.1.0`, build `2026-11-10T22:24:44.865Z`를 종료 전 재확인했습니다. [원격 확인 기록](evidence/EXECUTIVE_V2_STAGE_3_REMOTE.json).
- 이 문서를 포함하는 최종 SHA는 `git log -1 --format=%H -- docs/EXECUTIVE_V2_HANDOFF.md`와 원격 ref로 확인합니다. 자기 자신의 SHA를 추정해 넣지 않습니다.

## 실제 변경

ADEX 공식 원본·PNG를 재대조해 32개 사전 배치 영역과 35개 업체명 연결을 실제 지도에서 사용합니다. 3개 메뉴, 2D/단순 입체보기, 홀 전환, 검색/15개 기술분류, 공동부스 선택, 위치 미확인 업체 목록, 사진 확대와 원문, 비교, 인쇄 보고서, URL·뒤로가기를 구현했습니다. 다른 4개 회차도 같은 데이터/화면 구조로 열리며 검증되지 않은 지도를 만들지 않았습니다.

현대로템·기아·STX엔진·현대위아·PEI 5개 사례의 판단·3항목·7개 상세 항목·근거를 준비했습니다. ADEX 사진 개체 42건(원문 참조 포함)을 유지합니다. 회사 일반제품, 다른 회차 참고사진, 제조사 발표를 이번 회차의 독립 검증 성능으로 승격하지 않습니다. 선택 사례는 별도 `editorial` 레이어이고 기존 registry의 전체 모집단 심층완료 집계는 자동으로 변경하지 않았습니다.

PEI는 새 현장 발표 `7-C11`과 사전 발표 `18-20`이 상충해 현재 번호를 `null / unverified`로 정정했습니다. 두 근거·안정 부스 ID·기존 사전 좌표를 보존했습니다. **과거 2단계의 ‘번호 1개 확인’ 기록을 현재 사실로 재사용하지 마세요.** 현장 번호를 원본 도형에 대조하기 전 위치를 옮기지 않습니다.

개인 사진 등록·메모/주석·백업/복원·보관함·조사 관리 라우트/모듈은 v2 화면과 최종 빌드에서 제외했습니다. 원본 소스·자료는 Git에 남았습니다. localStorage `fieldnote.review.adex2025.v1`, `fieldnote.workspace.v1`, IndexedDB `fieldnote-field-photos-v1`/`photos`는 읽거나 쓰거나 지우지 않았습니다.

## 검증 근거와 한계

- clean build + check **128개 통과**, diff 검사 통과. 독립 코드 검토 및 실제 브라우저 경로 검증을 수행했습니다.
- 실제 지도/공동부스/검색/탐방/드래그/휠/2D·입체/사진/직접링크/뒤로가기/원문 PDF·카탈로그 새 창/업체 비교/5개 회차 전환을 확인했습니다.
- 390×844 CSS px 프레임에서 실제 앱의 반응형 화면·지도·사진 왕복과 가로 넘침 없음을 확인했습니다. 실제 휴대폰 시험은 아닙니다. 포인터 핸들러 시험은 탭·드래그·핀치·취소·휠·키보드를 포함합니다.
- 관리 Chromium의 Print 메뉴가 비활성화되어 실제 PDF 저장·페이지 검수는 하지 못했습니다. 업체/비교/전체 보고서 인쇄 내용·사진 준비·출처 보존은 검사했습니다. DevTools도 관리 정책으로 사용할 수 없었습니다. 정책을 바꾸지 않았습니다.
- [동작/한계](EXECUTIVE_V2_STAGE_3_VERIFICATION.md), [기계 기록](evidence/EXECUTIVE_V2_STAGE_3_CHECKS.json), [디자인](EXECUTIVE_V2_STAGE_3_DESIGN.md), [제거 검토](EXECUTIVE_V2_STAGE_3_REMOVAL.md), [사진·출품 근거](research-v2/stage3-cases.md), [지도 원본](research-v2/stage3-map-source.md), [번호 정정](research-v2/stage3-number-correction.md).

## 정확한 다음 시작점

1. `AGENTS.md`, BRIEF, STATUS, 이 문서, [3단계 원문](EXECUTIVE_V2_STAGE_3.md), [화면 데이터 계약](EXECUTIVE_V2_STAGE_3_DATA.md), 위 검증 문서를 읽습니다.
2. `git status --short` 후 `git fetch origin`으로 작업 브랜치의 후속 커밋을 확인합니다. 사용자 변경을 reset/clean하지 않습니다.
3. 다음 **4단계 ADEX 조사 확장** 상세 지시는 미수신입니다. 받으면 원문을 `docs/EXECUTIVE_V2_STAGE_4.md`로 저장하고 BRIEF/STATUS에 연결합니다. 아직 없는 상세 지시를 만들지 않습니다.
4. `npm run build` → `npm run check`를 수행합니다. 빌드 입력은 기존 자료·`data/v2/collection`·`maps`·`corrections`·`editorial`·`taxonomy.json`·`map-display.json`입니다. `registry.json`, `public.json`, `data/v2/app/`, `dist/`는 재생성/ignored 파일입니다.
5. 브라우저는 `dist/data/v2/app/index.json`과 `events/{eventId}.json`을 읽습니다. 원장/큐/전체 조사율을 앱에 배포하지 않습니다. 미리보기는 `npm run build` 후 `npm run dev`이며, 관리 환경에서는 기존 `sites-preview`를 사용합니다.
6. ADEX 원장 큐에서 전체 공식 명단·국가관·야외·214개 밀집 명칭 전사·관련성 판정을 이어갑니다. 5개 사례의 원문 조건과 stable ID를 보존해 정식 analysis/participation 원장으로 대조·연결합니다. PEI 번호 정정은 수집/지도 재생성 스크립트에도 반영돼 있습니다.
7. 검증한 묶음마다 소스·데이터·상태를 함께 커밋하고 원격 ref를 확인합니다. 한 업체의 자료 막힘은 별도 큐로 남기고 다른 묶음을 진행합니다. 9단계 전에는 main/공개 배포를 교체하지 않습니다.

## 남은 조사 범위

| 단계 | 원장 | 남은 범위 |
| --- | --- | --- |
| 4 ADEX | `data/v2/collection/adex-2025.json` | 전체 공식 디렉터리·국가관/협회·야외, 작은 글씨 전사, 관련성, 실제 출품/심층분석, PEI 번호·위치 대조 |
| 5 Eurosatory | `data/v2/collection/eurosatory-2026.json` | LAB 밖 전체 목록의 페이지/알파벳/분류, 공식 부스 지도·관련성·실제 출품 |
| 6 DSEI | `data/v2/collection/dsei-2025.json` | 동일 명칭/공동관 정체성, 관련성·실제 출품, 2025 원본 지도 |
| 7 IDEX | `data/v2/collection/idex-2025.json` | BDSV 밖 주최사 2025 원장·가이드·지도, 관련성·실제 출품 |
| 8 SAHA | `data/v2/collection/saha-2026.json` | 1,466개 프로필, 잘린 분류 407건, 전체 참가수·지도·관련성·실제 출품 |

모든 행사 전체 모집단 완료율은 미확보 상태에서 계산하지 않습니다. 공식 사전 지도와 당일 실측은 구별합니다. 원본 지도 재배포 권한은 미확인으로 보존하고 원격 참조만 사용합니다. unslop 고정 커밋 `97daa3eb365670ea3f87ed85356cbfcee18105a5`, Damir Sokolovsky, CC BY 4.0과 [적용 기록](EXECUTIVE_V2_UNSLOP.md)을 유지합니다.

## 원격 저장 방식

이 환경의 일반 git push 자격증명 대신 연결된 GitHub blob/tree/commit/ref API를 사용합니다. 로컬 blob SHA와 API SHA, index tree와 원격 tree를 비교하고 `expected_sha`를 사용해 fast-forward 합니다. 저장 실패 시 마지막 확인 SHA·미반영 파일·복구 patch를 기록해야 합니다. 구현 묶음 51개 blob SHA와 tree를 대조해 원격 반영했고 미반영 구현 파일은 없습니다. 이 문서는 검증 결과를 기록하는 후속 커밋입니다. 문서 커밋도 원격 ref와 로컬 tree를 확인한 뒤 최종 응답에 실제 SHA를 남깁니다.
