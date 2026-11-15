# 작업 목록과 상태 전이

| ID | 작업 | 상태 | 범위 |
| --- | --- | --- | --- |
| A-01~03 | 감사·3종 로컬 초안 | completed | 이전 a21b781 체크포인트 |
| R-01 | 3사 및 한화 근거 보강 | completed | 4개 조사 packet, 26제품 서술 연결. 사진 완성·전수조사 아님 |
| B-01 | 관람 흐름·장비 링크 | completed | 해당 구현 범위: 지도 동선과 마지막 사진 그룹·하위경로 회귀 확인. 전체 자료 완성 의미 아님 |
| B-02 | 장비별 설명·공개 정리 | verifying | 26제품·130항목 및 공개 원천/컴파일러 정리; 자료 공백 명시 |
| B-03 | 종합보고·인쇄/PDF | retry_with_revision | 16:9 화면 확인. 사진 원문 링크·인쇄 글자 크기 보완 중. 실제 PDF 검증은 Windows URL 확인 실패로 중단 |
| B-04 | 전체 관련 범위·다른4회차 | executing | 모든 기존 업체 접근·화면 구조 적용, 심층 자료 확장 미완료 |
| B-05 | 고정 URL 공개 반영 | planned | /preview/만, 완성본 검토 뒤. push/배포 없음 |
| V-01 | Windows 검사 2건 | completed | junction fixture+경로 정규화; 권한 허용 실행에서 실제 검증 성공 |

## 후속 검증 계획 — 2026-11-15

- 목표: 마지막 사진 뷰어 수정과 실제 공개와 같은 하위 경로를 브라우저에서 확인하고 한 장 PDF의 저장·렌더 증거를 확보한다. 다른 4회차 자료는 독립 조사 packet으로 보강한다.
- 수정 파일: 검증 결과에 따라 src/v2/report.css, report.js, details.js, app.js와 관련 검사; docs/evidence, docs/research-v2, 프로젝트 상태 문서. 조사 결과는 출처 검토 후 기존 원천에 연결한다.
- 영향: 기존 회사·제품 ID, 지도 위치, 사용자 저장소와 공개 배포는 유지하며 승인된 화면·인쇄 흐름만 보완한다.
- 위험: 브라우저 인쇄 UI 접근 제한, 긴 한국어의 페이지 넘침, 현장사진과 일반 제품사진 혼동.
- 검증: 변경 시 build → check → diff 검사, 실제 하위 경로·제품 사진 순환·새로고침, PDF 페이지수/16:9/한국어/이미지 렌더 확인. 미확인 결과는 완료로 처리하지 않는다.

## 전이

2026-11-15 후속: B-01 verifying → completed(승인된 탐색 구현·하위경로 범위). B-03 retry_with_revision → executing(출처/인쇄 가독성 보완), PDF UI 검증은 동일 환경 제한이 재발하여 미완료. B-04 executing 유지(다른 4회차 제한 조사, 아직 화면 데이터 미연결).

2026-11-15 B-01 needs_human → planned → executing → verifying (사용자 구조 승인). B-02/B-03/B-04 planned → executing. R-01 executing → verifying → completed(제한 조사). V-01 failed_with_evidence → retry_with_revision → verifying → completed. B-03 executing → verifying → retry_with_revision(저장 PDF UI 검증 중단, 제품 실패로 단정하지 않음). 전체 목표는 미완료.

2026-11-15 후속 저장: B-03 executing → verifying → retry_with_revision(184검사 통과, 실제 PDF/최신 보고 화면 검증 잔여). 구현 커밋 137fa841eedeaa6ef2d2d041744ad10e11c7cd8e; 공개 반영 없음.
