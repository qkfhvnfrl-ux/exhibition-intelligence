# FIELDNOTE v2 — 다음 실행 인수인계

기준일: 2026-11-12 (Asia/Seoul).

## 현재 상태

1단계 문서·감사·작업 규칙·개발 검증/배포 가드를 커밋하고 GitHub 원격 반영·CI 성공·미리보기 산출물 생성을 확인했습니다. 현재 화면은 기존 FIELDNOTE 1.1이며 v2 화면·삭제 구현·전수 조사·배포를 완료한 상태가 아닙니다.

- 저장소: https://github.com/qkfhvnfrl-ux/exhibition-intelligence
- 원격 작업 브랜치: `origin/work/fieldnote-v2`
- 브랜치 주소: https://github.com/qkfhvnfrl-ux/exhibition-intelligence/tree/work/fieldnote-v2
- 기준 소스: `4990376dfef1b6890666056bb7e526519d79c784` (`1.1.0`)
- 기존 배포 구현: `4713114268f7c678859e1c950c30cc2687b128b2`
- 복구 브랜치: `origin/recovery/fieldnote-v1.1-20261112` → 기준 소스 커밋 (원격 조회 확인)
- v2 1단계 구현 기준 커밋: `81b88ecfab6740fbf218000a1b310c75b6386a74` — 원격 ref, 로컬/원격 tree 일치 확인. 이 문서는 그 구현을 확인한 후속 인수인계 커밋입니다.
- 구현 CI: https://github.com/qkfhvnfrl-ux/exhibition-intelligence/actions/runs/43105675563 — success. 미리보기 artifact `fieldnote-v2-preview-81b88ecfab6740fbf218000a1b310c75b6386a74` (ID `13894805457`, 14일 보관).
- 인수인계 커밋 자체의 SHA는 `git log -1 --format=%H -- docs/EXECUTIVE_V2_HANDOFF.md`로 확인합니다. 최종 작업 응답에도 실제 원격 반영 SHA를 기록합니다.
- 상세 상태: [EXECUTIVE_V2_STATUS.json](EXECUTIVE_V2_STATUS.json)

## 이 묶음에서 실제 수행한 일

- 기존 저장소 clone, 원격 refs·최근 Actions·공개 화면·배포 파일 대조.
- 복구 브랜치와 개발 브랜치를 원격 생성. 기준 커밋의 소스·데이터·사진 보존.
- 기존 기능·빌드·원천 데이터·저장 키를 조사하고 유지/제거/이전 결정표 저장.
- 공통 기준, 사용자 1단계 원문, 단계 순서, 상태/인수인계, 루트 AGENTS 작업 규칙 저장.
- unslop 설치, 원본 및 5개 reference 읽기, 커밋·저작자·라이선스·화면 감사 기록.
- Pages 워크플로의 build/deploy에 main 조건 추가. 개발 브랜치 CI는 검사 뒤 dist 미리보기 artifact를 저장하도록 변경.
- 기존 61개 검사·빌드, YAML 정적 확인, 공개 화면과 개발 미리보기 초기 화면 확인.

## 정확한 다음 시작점

1. 루트 [AGENTS.md](../AGENTS.md), [BRIEF](EXECUTIVE_V2_BRIEF.md), [STATUS](EXECUTIVE_V2_STATUS.json), 이 문서 및 [AUDIT](EXECUTIVE_V2_AUDIT.md)를 읽습니다.
2. `git status --short`로 사용자 변경을 확인하고 `git fetch origin` 후 `work/fieldnote-v2`와 원격 구현 커밋을 비교합니다. 아래 기록된 구현 커밋보다 원격이 앞서면 후속 커밋도 읽고 이어갑니다.
3. 다음은 **2단계 공식 원장·지도**입니다. 상세 지시는 아직 받지 않았습니다. 받은 지시 원문을 `docs/EXECUTIVE_V2_STAGE_2.md`에 저장하고 BRIEF/STATUS에 연결한 다음 수행합니다. 현재 정보만으로 상세 지시를 작성하지 않습니다.
4. 실제 조사 시작 자료는 `data/exhibitions.json`, `data/research-v1.1/*.json`, `src/review.js`의 기존 ADEX 외부 배치도 링크입니다. 현재 공식 참가기업 원장·공식 배치도 파일·부스 좌표·정규화된 업체 ID가 없습니다. 기존 manufacturer 문자열은 기업 전수 목록이 아닙니다.
5. 자료/업체 하나가 막히면 상태에 사유를 남기고 독립 작업을 계속합니다. 검증한 묶음마다 소스·데이터·상태를 커밋하고 원격을 재조회합니다.

## 제거·보존 경계

삭제 대상은 개인 사진 등록·메모·주석·백업/복원·확정본/검토상태 편집·과거 보관함·진행률/디버그 등입니다. 3개 주 메뉴의 구조와 검색/비교/PDF 이동을 결정했습니다. 실제 화면 변경은 3단계에 남아 있습니다.

`scripts/build.mjs`가 현재 `legacy.html` 및 전체 `src`를 배포합니다. 최종 v2에서는 메뉴뿐 아니라 제거 기능의 라우트/진입점/의존 모듈을 배포 산출물에서 제외해야 합니다. 원본은 복구 브랜치와 Git 이력에 보존합니다. 별도 관리자 화면은 만들지 않습니다.

기존 localStorage `fieldnote.review.adex2025.v1`, `fieldnote.workspace.v1`과 IndexedDB `fieldnote-field-photos-v1` / `photos`는 읽어 축소 저장하거나 삭제하지 않습니다. 사용자 브라우저 원본 기록은 저장소에 없으며 이번 작업에서 읽거나 변경하지 않았습니다.

## 검증 범위와 남은 일

[검증 기록](EXECUTIVE_V2_VERIFICATION.md)과 [보존 파일 목록](evidence/EXECUTIVE_V2_PRESERVATION.json)을 참고합니다. 검사 61개는 기존 동작/구조 검사이며 전시 주장·성능의 독립 검증이 아닙니다. 사진 49개도 메타데이터상 표시 가능한 URL 수이며 모든 사진의 최신 로딩 검증은 아닙니다.

단계 2~9는 미착수입니다. 공식 원장/지도, v2 화면/삭제, 부품·소형 임무장비 공급망 조사, 핵심 주장 독립 근거 확인, 모바일·모든 사진·전체 PDF 페이지 나눔, 종합 보고와 최종 배포가 남아 있습니다. 개발 미리보기에서 기존 초기 화면만 확인했습니다. 새 공개 사이트는 만들지 않았습니다.

## 원격 저장 및 복구 방법

이 환경의 일반 `git push`는 GitHub 자격증명 부재로 실패했습니다. 읽기 fetch는 가능하며 연결된 GitHub API로 같은 저장소의 브랜치·커밋을 저장할 수 있습니다. 이 실패를 원격 저장 성공으로 취급하지 않고 실제 ref와 파일을 확인합니다.

API 저장은 최신 branch head 확인 → 기존 tree 기반 변경파일 tree → 해당 head를 부모로 commit → 예상 head와 일치하는 ref 이동 → fetch/fast-forward → 원격/로컬 tree 대조 순서입니다. 원격 저장 실패 시 마지막 성공 ref, 미반영 파일, 복구용 patch/bundle 경로를 STATUS에 남깁니다. main/recovery 브랜치에는 작업 커밋을 반영하지 않습니다.

## 최종 원격 확인 기록

구현 커밋 `81b88ecfab6740fbf218000a1b310c75b6386a74`을 GitHub API로 저장했고 원격 ref 조회·일반 git fetch·tree 일치(`ee5a44de52735e766fddecf83fd4d77b069f9766`)로 대조했습니다. 원격 CI가 통과하고 dist 미리보기 artifact가 생성되었습니다. main과 복구 브랜치는 모두 `4990376dfef1b6890666056bb7e526519d79c784`로 유지된 것을 재조회했습니다. 미반영 구현 파일은 없습니다. 이 후속 문서 갱신도 별도 커밋 후 원격 ref를 확인하는 것으로 1단계를 종료합니다. [원격 근거](evidence/EXECUTIVE_V2_REMOTE.json).
