# 작업 목록과 상태 전이

| ID | 작업 | 상태 | 범위 |
| --- | --- | --- | --- |
| A-01~03 | 감사·3종 로컬 초안 | completed | 이전 a21b781 체크포인트 |
| R-01 | 3사 및 한화 근거 보강 | completed | 4개 조사 packet, 26제품 서술 연결. 사진 완성·전수조사 아님 |
| B-01 | 관람 흐름·장비 링크 | completed | 해당 구현 범위: 지도 동선과 마지막 사진 그룹·하위경로 회귀 확인. 전체 자료 완성 의미 아님 |
| B-02 | 장비별 설명·공개 정리 | executing | 46제품·230항목 검증, 사진 없는 22제품과 추가 자료 확장 진행 |
| B-03 | 종합보고·인쇄/PDF | completed | 5회차 화면·반응형·실제 한 장 PDF 검증 완료. 전체 자료 완성 의미 아님 |
| B-04 | 전체 관련 범위·다른4회차 | executing | 모든 기존 업체 접근·화면 구조 적용, 심층 자료 확장 미완료 |
| B-05 | 고정 URL 공개 반영 | planned | /preview/만, 완성본 검토 뒤. push/배포 없음 |
| V-01 | Windows 검사 2건 | completed | junction fixture+경로 정규화; 권한 허용 실행에서 실제 검증 성공 |

## 후속 검증 계획 — 2026-11-15

### 4회차 설명 연결 묶음

- 목표: 새 DSEI/IDEX·Eurosatory/SAHA 조사에서 정확히 식별된 기존 제품을 5항목 설명과 검증된 사진에 연결한다. 최신 보고서 화면도 확인한다.
- 수정 파일: docs/research-v2/redesign-narratives-*.json, scripts/prepare-redesign-content.mjs, data/v2/editorial/product-narratives.json, 필요 시 compile-v2-app.mjs와 관련 회귀 검사, 상태·증거 문서.
- 영향: 5회차/회사·제품 ID·출처 원장 보존. 근거가 확인된 제품만 설명 보강; 사진은 회차·제품·권리 대조 후 연결한다.
- 위험: 같은 제품군의 다른 형상 오연결, 일반자료를 출품으로 승격, 전시예고를 실제전시로 처리. 자료 부족은 별도 제한으로 남긴다.
- 검증: 원문과 기존 사진 대조 → 생성 → build/check → 해당 회사·제품 URL의 브라우저 표시와 사진 로딩 → 결과 기록. 저장 PDF의 환경 제한은 별도이며 이 자료 연결을 중단시키지 않는다.

- 목표: 마지막 사진 뷰어 수정과 실제 공개와 같은 하위 경로를 브라우저에서 확인하고 한 장 PDF의 저장·렌더 증거를 확보한다. 다른 4회차 자료는 독립 조사 packet으로 보강한다.
- 수정 파일: 검증 결과에 따라 src/v2/report.css, report.js, details.js, app.js와 관련 검사; docs/evidence, docs/research-v2, 프로젝트 상태 문서. 조사 결과는 출처 검토 후 기존 원천에 연결한다.
- 영향: 기존 회사·제품 ID, 지도 위치, 사용자 저장소와 공개 배포는 유지하며 승인된 화면·인쇄 흐름만 보완한다.
- 위험: 브라우저 인쇄 UI 접근 제한, 긴 한국어의 페이지 넘침, 현장사진과 일반 제품사진 혼동.
- 검증: 변경 시 build → check → diff 검사, 실제 하위 경로·제품 사진 순환·새로고침, PDF 페이지수/16:9/한국어/이미지 렌더 확인. 미확인 결과는 완료로 처리하지 않는다.

## 전이

2026-11-15 후속: B-01 verifying → completed(승인된 탐색 구현·하위경로 범위). B-03 retry_with_revision → executing(출처/인쇄 가독성 보완), PDF UI 검증은 동일 환경 제한이 재발하여 미완료. B-04 executing 유지(다른 4회차 제한 조사, 아직 화면 데이터 미연결).

2026-11-15 B-01 needs_human → planned → executing → verifying (사용자 구조 승인). B-02/B-03/B-04 planned → executing. R-01 executing → verifying → completed(제한 조사). V-01 failed_with_evidence → retry_with_revision → verifying → completed. B-03 executing → verifying → retry_with_revision(저장 PDF UI 검증 중단, 제품 실패로 단정하지 않음). 전체 목표는 미완료.

2026-11-15 후속 저장: B-03 executing → verifying → retry_with_revision(184검사 통과, 실제 PDF/최신 보고 화면 검증 잔여). 구현 커밋 137fa841eedeaa6ef2d2d041744ad10e11c7cd8e; 공개 반영 없음.

## 2026-11-16 재개 — 4회차 자료 연결 검증

- 이전 실행은 progress: 10개 기존 제품에 50개 설명을 추가하고 사진 7개를 새로 연결했다(새 이미지 다운로드 0). 총 36제품·180항목, 서술 제품 중 직접 표시 사진 보유 13제품·고유13자산이다.
- build/check 189/189 통과. 최신 보고판 1440px/1280px에서16:9,390px세로·가로넘침없음. 기아Euro확대,AJBAN사진순환,DSEI/SAHA설명 확인. docs/evidence/REDESIGN_EDITION_EXPANSION.json 참조.
- 전체 목표 미완료. 실제PDF·다른4회차보고·더많은현장사진·전체관련범위 보강이 남는다. 공개push/배포없음.

### 다음 묶음 계획 — 보고 비교와 현장사진 확충

- 목표: 초기 프롬프트에 따라 다른4회차의3주제종합보고를 원문비교로 작성하고, 사용자추가요구대로 현장사진을최대한수집하여 직접표시한다.
- 수정파일: docs/research-v2/redesign-report-*.json, 사진수집증거, assets/photos, 기존 data/research-v1.1 또는 선택적 editorial자료, prepare-redesign-content.mjs, 관련검사와메모리.
- 영향: 기존ID/정적구조/출처원장 보존. 공식보도사진·허용라이선스사진만 회차/형상/권리대조뒤 연결.
- 위험: 다른회차사진·모형·일반제품사진오인, 저작권조건누락, 긴보고문구의넘침. 원문/픽셀/권리/사진중복을검사한다.
- 검증: 원문조사 → 사진픽셀/출처대조 → build → check → 브라우저이미지로딩·제품링크·반응형 → 증거저장. 실제PDF는실파일이없으면미완료로유지.
- 상태: B-04 executing → verifying(10제품자료연결) → executing(보고·사진확장). B-03 retry_with_revision 유지(PDF미검증); 공개반영 B-05 planned.

## 2026-11-16 보고·사진 확대 묶음

- B02: verifying → executing. 40제품·200항목 연결, 전체 내용 조사 완료 아님.
- B03: retry_with_revision → executing → verifying. 5회차 보고 연결, 실제 Chrome PDF 5개 저장, baseline 한 장·한국어·사진·링크 확인. 45mm 사진 최종판 QA 진행.
- B04: executing → verifying(이번 묶음) → executing(다음 자료 확장). 신규 Patria 사진 4장·2제품, i-X/GDAMS 기존 사진 연결. 6제품·30항목 + HAVOC 사진2장 초안은 아직 미통합.
- B05: planned 유지. 완성본 검토 전 공개 갱신 없음.
- 검증: prepare 40/200/5, build pass, check 200/200, 공개문구 0건, 실제 하위경로 브라우저 확인.

다음 계획: docs/research-v2/redesign-narratives-photo-coverage.json을 원문·사진·사용권·형상 대조 후 prepare-redesign-content.mjs로 연결한다. 영향은 기존6제품의 설명과 사진 연결이며 ID·참석상태·지도좌표는 유지한다. T-90MS 해석은 evidence_gap으로 보류한다. 잘못된 형식/다른 회차 사진 혼합과 권리 고지 누락을 주의하고 build → check → 해당 제품 브라우저 순으로 검증한다.

2026-11-16 최종 PDF: B03 verifying → completed(5회차 보고/실제 PDF 검증 범위). 최종5개 각각1쪽·약320×180mm·최소8pt·사진45mm(12개), 페이지밖글자/겹침0. SAHA는 현장사진 미확보 안내 유지. B02/B04 executing, 전체 목표 미완료.

2026-11-16 B02/B04 executing: 6제품 설명·10기존사진 연결 통합 시작. 독립검토에서 evidence_gap 전략이 추론으로 잘못 표시되는 문제를 재현하여 details.js의 분류 우선순위와 화면/인쇄 회귀를 함께 수정한다. 기존 data/photos.json과 research-v1.1/idex.json의 재사용/변환 고지를 대조하여 유지한다. 제품/사진ID·참석상태·아키텍처·자산바이트는 유지한다. 보고 PDF 본문과 이미지는 변경하지 않는다.

2026-11-16 B02/B04 executing → verifying → completed(6제품30항목·10기존사진 연결 묶음) → executing(남은 자료 확장). 총46/230,24제품29사진. 최신build/check201pass,fail0skip0. 실제하위경로1440/390제품6개·확대/새로고침/갤러리·T90근거미확보라벨 확인. 전체조사·전체목표·공개배포미완료.

2026-11-16 로컬 저장: 40제품/5보고/PDF묶음16e7e691f232eeee7951c15ef0ae4ea274aea57d, 46제품/230항목 사진확대묶음 49d846d0b80c6247db7bb3003c1ea008a874c9bd. 공개push·merge·배포 없음. 다음 우선순위는 남은22사진공백·공식지도/명단·전체관련업체의 자료 확대.
