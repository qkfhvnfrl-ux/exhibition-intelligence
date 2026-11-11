# FIELDNOTE v2 — 다음 실행 인수인계

기준일: 2026-11-12 (Asia/Seoul). **2단계 완료, 다음은 3단계입니다.** 전체 모집단·심층분석·v2 화면·기능 제거·최종 배포는 완료하지 않았습니다.

## 브랜치와 복구 기준

- 저장소: https://github.com/qkfhvnfrl-ux/exhibition-intelligence
- 원격 작업 브랜치: `origin/work/fieldnote-v2` — https://github.com/qkfhvnfrl-ux/exhibition-intelligence/tree/work/fieldnote-v2
- 기존 기준: `1.1.0`, 소스 `4990376dfef1b6890666056bb7e526519d79c784`, 기존 배포 구현 `4713114268f7c678859e1c950c30cc2687b128b2`.
- 복구 브랜치 `origin/recovery/fieldnote-v1.1-20261112`와 main은 모두 `4990376dfef1b6890666056bb7e526519d79c784` 유지. 원격 재조회 확인.
- 1단계 구현 `81b88ecfab6740fbf218000a1b310c75b6386a74`, 2단계 시작 `622cb9149912bacf6b46a378c53de7ae1972ec6e`.
- 2단계 수집 묶음 `faa792b99c74219d9beb58da0159494b7778739a`.
- **2단계 구현 기준 커밋 `61ab77ed4af4ad2330d886c9ee58d90e9fe24fd8`**, tree `187efeebd818dddad7f70039c0473cdfee5e4158`. 원격 ref/commit API, git fetch, 로컬 index tree 일치 확인.
- 구현 CI: https://github.com/qkfhvnfrl-ux/exhibition-intelligence/actions/runs/43110872701 — success. 미리보기 artifact `fieldnote-v2-preview-61ab77ed4af4ad2330d886c9ee58d90e9fe24fd8`, ID `13895867596`, 14일 보관. 이는 배포 성공이 아닙니다.
- 이 문서는 검증한 구현의 후속 인수인계 커밋입니다. 포함된 최신 SHA는 `git log -1 --format=%H -- docs/EXECUTIVE_V2_HANDOFF.md`와 원격 ref로 확인합니다. 자기 자신의 SHA를 추정해 넣지 않습니다.

## 이번에 실제 수행한 일

5개 원장에 공식/보조 명단 원문 3,670행, 확보 일시·회차·페이지 범위·누락·접근 상태·이용 조건·다음 큐를 저장했습니다. DSEI는 2025 본문 8페이지 1,754행, SAHA는 62페이지 1,466행을 끝까지 확인했습니다. ADEX 362행은 공식 사전 배치도의 명칭 블록, Eurosatory 58행은 LAB, IDEX 30행은 BDSV 부분명단입니다. 전체 행사 모집단으로 승격하지 않았습니다.

ADEX 32개 도형을 공식 원본 벡터 경계·확대 이미지와 별도 재검토로 검증했습니다. 35개 원문 업체명과 43개 영역 점유 연결을 준비했습니다. PEI `18-20`만 발행사 사전발표 단일 근거로 번호 확인; 다른 31개 번호는 비워 두었습니다. 지도는 당일 실측 배치가 아닌 사전 계획이며 원본은 `link_only`입니다.

공통 모델은 조직·기업 관계·참가·부스·제품·출품·사진·카탈로그·분석·근거를 분리합니다. 기업↔부스는 다대다입니다. 원문 명칭 ID는 3,579개이며 법적으로 확인한 기업 총수가 아닙니다. 기존 ID 이전 매핑 271개, 제품 41개, 사진 개체 116개, 분석 62개를 보존했습니다. 심층분석 완료는 모든 행사에서 0입니다. 한영 동일 법인 별칭 4개만 공시/정관 근거로 연결했으며 계열사는 합치지 않았습니다.

검사 83개, 빌드, 결정적 재생성, 원장 참조/회차, 원본 보존 비교, 미리보기 HTTP·관리 원장 배포 제외를 확인했습니다. [검증](EXECUTIVE_V2_STAGE_2_VERIFICATION.md), [독립 코드 검토](research-v2/code-review.md), [지도 검토](research-v2/adex-map-review.md), [원격 근거](evidence/EXECUTIVE_V2_STAGE_2_REMOTE.json)를 참고합니다. 데이터 검사가 전시 사실·성능을 모두 재검증한 것은 아닙니다.

## 정확한 다음 시작점

1. [AGENTS](../AGENTS.md), [BRIEF](EXECUTIVE_V2_BRIEF.md), [STATUS](EXECUTIVE_V2_STATUS.json), 이 문서, [2단계 원문](EXECUTIVE_V2_STAGE_2.md), [데이터 계약](EXECUTIVE_V2_DATA_CONTRACT.md)을 읽습니다.
2. `git status --short`로 사용자 변경을 확인합니다. `git fetch origin` 후 `work/fieldnote-v2`가 위 구현 커밋과 후속 인수인계 커밋을 포함하는지 확인합니다. 원격이 더 앞서면 후속 변경을 읽고 이어갑니다. reset/clean하지 않습니다.
3. 다음은 **3단계 지도·업체 화면 구현**입니다. 상세 지시는 아직 받지 않았습니다. 받은 원문을 `docs/EXECUTIVE_V2_STAGE_3.md`에 저장하고 BRIEF/STATUS에 연결한 뒤 수행합니다. 새로운 상세 지시를 추측해 작성하지 않습니다.
4. `npm run compile:v2` 또는 `npm run check`로 `data/v2/registry.json`과 `public.json`을 재생성합니다. 두 파일은 생성물로 Git에서 제외됩니다. 영속 원천은 `data/v2/collection`, `data/v2/maps`, `entity-aliases.json`, 기존 JSON 및 컴파일러입니다. `legacy-mapping.json`은 커밋된 이전표입니다.
5. UI 입력은 `dist/data/v2/public.json`입니다. 현재 기존 화면은 이 파일을 아직 사용하지 않습니다. 상세 구조는 DATA_CONTRACT를 따릅니다. 조사 원장·큐·완료 집계는 UI에 노출하지 않고, 단일 근거·명칭 불확실·사전 배치도·재검증 미완료 조건은 작고 명확하게 유지합니다.
6. ADEX부터 구현용 도형을 사용할 수 있으나 원본 지도 재호스팅/임베드 권한은 확보하지 않았습니다. `link_only`, 원본 URL, 번호 null, 전사 미확인 상태를 유지하며 사용 가능한 배경의 근거를 확인합니다. 좌표와 번호를 만들어 채우지 않습니다.
7. 검증한 묶음마다 실제 소스·데이터·상태 문서를 함께 저장·커밋하고 원격 ref를 확인합니다. 한 업체나 출처의 막힘으로 다른 묶음을 멈추지 않습니다. main/공개 배포는 9단계 전까지 교체하지 않습니다.

## 남은 조사 큐

각 원장 `queues` 17개가 4~8단계에 연결됩니다. 이들은 2단계의 미완료 범위 기록이며 미수신 상세 지시를 대체하지 않습니다.

| 단계 | 다음 조사 파일 | 남은 범위 |
| --- | --- | --- |
| 4 ADEX | `data/v2/collection/adex-2025.json` | 전체 공식 디렉터리·국가관/협회 구성원·야외, 214개 작은 글씨 전사 재검토, 모든 관련성/실제 출품/심층분석 |
| 5 Eurosatory | `data/v2/collection/eurosatory-2026.json` | LAB 밖 전체 catalogue의 모든 페이지/알파벳/분류, 홀/야외 부스 지도와 조사 |
| 6 DSEI | `data/v2/collection/dsei-2025.json` | 공개 목록 페이지 누락 없음. 동일 명칭/공동관 정체성, 모든 관련성/실제 출품, 2025 원본 지도 |
| 7 IDEX | `data/v2/collection/idex-2025.json` | BDSV 밖 주최사 2025 전체 원장·가이드·지도, 20개 미판정과 10개 단일근거 관련성 재대조 |
| 8 SAHA | `data/v2/collection/saha-2026.json` | 공개 목록 페이지 누락 없음. 1,466개 상세 프로필, 잘린 분류 407건, 전체 참가수 대조, 원본 지도/관련성/실제 출품 |

회차 불일치 자료(ADEX Sourcehere 2027, SIBAT 연결 2023 PDF, IDEX 현재 2027 지도)는 가져오지 않았습니다. Eurosatory 안내도는 부스 지도와 다르며 원본 크기가 아직 미확보입니다. 모든 행사 전체 완료율은 `null`입니다.

## 제거·보존·배포 경계

3개 메뉴는 전시장 탐색 / 업체·장비 / 핵심 보고입니다. 개인 사진 등록·메모/주석·백업/복원·과거 보관함·진행률/디버그 및 관리 편집은 3단계에서 실제로 제거해야 합니다. 현재 빌드는 기존 `legacy.html`과 전체 `src`를 여전히 포함합니다. 최종 v2에서는 제거 기능의 메뉴뿐 아니라 라우트·진입점·의존 모듈을 배포에서 제외합니다. 원본은 복구 브랜치/이력으로 보존하고 관리자 화면을 새로 만들지 않습니다.

localStorage `fieldnote.review.adex2025.v1`, `fieldnote.workspace.v1` 및 IndexedDB `fieldnote-field-photos-v1`/`photos`는 이번에 읽거나 변경하지 않았습니다. 추후에도 지우거나 축소된 구조로 덮어쓰지 않습니다.

unslop 고정 버전은 `97daa3eb365670ea3f87ed85356cbfcee18105a5`입니다. [원문/저작자/라이선스와 적용 순서](EXECUTIVE_V2_UNSLOP.md)를 유지합니다. 2단계는 데이터 기반 작업이며 시각 다듬기 완료로 보고하지 않습니다.

## 원격 저장 방식

일반 Git push 자격증명이 없으므로 연결된 GitHub blob/tree/commit/ref API로 같은 브랜치에 저장했습니다. 파일 blob 해시를 로컬과 대조하고, 기존 tree 기반 commit을 만든 뒤 `expected_sha`/fast-forward로 ref를 옮겼습니다. fetch 후 로컬 index tree와 원격 tree를 재대조했습니다. force push하지 않았습니다.

구현 파일의 원격 미반영 범위는 없습니다. 이 후속 문서도 커밋 후 ref와 로컬/원격 일치를 확인합니다. 원격 저장에 실패하는 다음 실행은 성공으로 표시하지 말고 마지막 원격 SHA, 미반영 파일, 복구 가능한 patch/bundle을 남겨야 합니다.
