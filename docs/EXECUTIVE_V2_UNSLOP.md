# unslop 원본 및 FIELDNOTE 적용 기록

확인일: 2026-11-12 (Asia/Seoul).

- 원본: https://github.com/heydamir/unslop
- 고정 커밋: `97daa3eb365670ea3f87ed85356cbfcee18105a5` (2026-11-08T21:16:22Z)
- 태그 버전이 확인되지 않아 커밋을 적용 버전으로 사용합니다. `git ls-remote`와 GitHub 커밋 API로 대조했습니다.
- 저작자: **Damir Sokolovsky (@heydamir)**, https://heydamir.design/unslop
- 라이선스: **CC BY 4.0**, https://creativecommons.org/licenses/by/4.0/
- 원문: https://github.com/heydamir/unslop/blob/97daa3eb365670ea3f87ed85356cbfcee18105a5/skills/unslop/SKILL.md
- 라이선스 원문: https://github.com/heydamir/unslop/blob/97daa3eb365670ea3f87ed85356cbfcee18105a5/LICENSE
- `SKILL.md` SHA-256: `19afd7f1841316ddff3f854ea8ead675c738e08b30c41e51a8f1822fa0111947`
- `LICENSE` SHA-256: `9ba9550ad48438d0836ddab3da480b3b69ffa0aac7b7878b5a0039e7ab429411`

## 설치 및 읽기

개인 스킬 설치 기능을 사용해 설치하고 원격 활성 경로·원문 및 라이선스 바이트 일치·검증기를 확인했습니다. 원본 스킬 텍스트와 저작자·라이선스를 수정하지 않았습니다. 설치본의 UI 메타데이터/아이콘은 설치 시스템이 추가했습니다. 프로젝트용 사본은 중복 생성하지 않았습니다.

읽은 자료는 원본 `SKILL.md`, `references/signs.md`, `references/tokens.md`, `references/visuals.md`, `references/refs.md`, `references/effects.md`, README, CITATION.cff, LICENSE입니다. 시각 예시 이미지와 snapshot/story 스크립트는 이번 1단계에 사용하지 않았습니다. 3단계에서 실제 시각 개선을 할 때 필요한 예시를 추가 확인합니다.

다른 실행 환경에서 설치가 없다면 같은 커밋의 스킬을 설치합니다. 설치 기능이 없으면 이 저장소에는 기존 스킬 경로 규칙이 없으므로 `.agents/skills/unslop/`에 원본 `skills/unslop/`와 LICENSE를 보존합니다. 복사본에 프로젝트 예외를 덮어쓰지 말고 이 문서를 따릅니다.

## 실제 화면 감사

공개 배포 화면을 2026-11-12에 열어 확인하고 해당 CSS/JS와 대조했습니다. 기존 FIELDNOTE의 사진과 한국어 글꼴은 유지할 가치가 있습니다. 전면적인 장식 재디자인보다 요청된 정보 구조 변경과 아래 개선이 필요합니다.

| 확인한 현상 | 위치 | 적용 방향 |
| --- | --- | --- |
| 47px 메뉴 높이, 7/13/19/25/35px 등 산발적인 간격 | `src/review.css`의 nav, page-head, story-grid, main | 밀도에 맞는 4px 간격 체계; 같은 요소의 높이·패딩 정렬 |
| 큰 녹색 사이드바/히어로와 밝은 선택색이 사진과 경쟁 | review.css의 sidebar, event-reports.css의 hero | 중립 표면, 선택과 상태에만 절제된 강조색 |
| 영문 대문자와 넓은 자간, 9~11px 보조문구 | eyebrow, brand-copy small, photo-credit | 한국어 우선 문구, 읽을 수 있는 출처, 짧은 레이블 |
| 3개 메뉴 목표와 다른 4개 메뉴·보관함 | `src/review.js`의 shell | 전시장 탐색 / 업체·장비 / 핵심 보고로 변경 |
| 큰 수량 상자·보고 링크 반복이 첫 화면을 차지 | `src/event-reports.js`의 overview | 실제 전시장 지도와 선택 업체의 실사진에 공간 배분 |
| 제목 일부의 과한 굵기·음수 자간 | review.css의 h1/h2 및 기본 제목 스타일 | IBM Plex Sans KR 등 한글 글꼴 유지, 크기·행간으로 위계 |
| 지도·부스 데이터와 인터랙션 없음 | 소스 및 assets 전수 검색 | 근거가 확보된 배치도·위치만 구현, 빈 위치를 발명하지 않음 |

보라색 그라데이션·네온·이모지 과다·지속적인 pulse가 있다고 확인하지 않았으며, 없는 문제를 개선 실적으로 만들지 않습니다. 이미지 상세 전부·모바일·실제 PDF 페이지 나눔은 이번 감사 범위가 아닙니다.

## 확정한 방향

1. 제품: 상무가 실제 전시장·업체·장비를 탐색하고 개발 방향과 검토 가치를 읽는 FIELDNOTE v2.
2. 성격: 정확함, 차분함, 현장 중심.
3. 소재: 공식 전시장 배치도, 실제 부스·장비 사진, 짧은 기술 보고.
4. 중심: 실제 지도와 많은 현장사진에 색과 디테일을 집중.
5. 식별 요소: 근거가 있는 홀·부스 식별자를 지도와 업체 정보에 일관되게 연결.

## 적용 순서와 우선순위

간격 → 색 → 아이콘 → 문구 → 글꼴 → 배치 → 세부요소 → 사진 → 움직임 순으로 적용합니다. 1단계에서는 원문 설치·감사·방향·검증 순서를 반영했습니다. CSS/UI 9개 패스의 구현 및 시각 회귀검수는 아직 하지 않았습니다.

사용자 지시가 일반 스킬 예시보다 우선합니다. 요청한 기능 삭제·구조 변경·FIELDNOTE v2 명칭을 수행하며 디자인 승인을 다시 요구하지 않습니다. 실사진의 양을 줄이거나 그럴듯한 mock data·생성 이미지·가짜 지도·영상 효과로 실제 전시자료를 대체하지 않습니다. 정확한 수치·한글 가독성·의미 있는 상태색을 유지합니다. 사진의 색상이나 형상을 장식 효과로 바꾸지 않습니다.

이 적용 지침은 unslop by Damir Sokolovsky (@heydamir), CC BY 4.0을 FIELDNOTE의 사용자 요구에 맞게 정리한 것입니다. 원본 저작권·라이선스와 별개로 사용자 요청의 구체적인 우선순위를 추가했으며 원본 자체는 수정하지 않았습니다.

## 3단계 적용 갱신

2026-11-12에 같은 고정 커밋의 실제 SKILL.md와 위 5개 references를 읽고, 기존 화면 감사와 사용자 확정 방향을 바탕으로 9개 순서의 화면 개선을 적용했습니다. 상세한 변경·증거는 [3단계 적용 기록](EXECUTIVE_V2_STAGE_3_DESIGN.md)에 있습니다. 원본 텍스트·저작자·CC BY 4.0 표기는 변경하지 않았습니다. 생성 이미지는 사용하지 않았습니다. 실제 PDF 파일 및 물리적 휴대폰 검증은 완료하지 않았고 별도 검증 문서에 남겼습니다.
