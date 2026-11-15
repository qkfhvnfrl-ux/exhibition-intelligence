# 작업 목록과 상태 전이

| ID | 작업 | 상태 | 범위 |
| --- | --- | --- | --- |
| A-01~03 | 감사·3종 로컬 초안 | completed | 이전 a21b781 체크포인트 |
| R-01 | 3사 및 한화 근거 보강 | completed | 4개 조사 packet, 26제품 서술 연결. 사진 완성·전수조사 아님 |
| B-01 | 관람 흐름·장비 링크 | verifying | 실제 동선 확인; 마지막 수정 회귀와 하위경로 확인 잔여 |
| B-02 | 장비별 설명·공개 정리 | verifying | 26제품·130항목 및 공개 원천/컴파일러 정리; 자료 공백 명시 |
| B-03 | 종합보고·인쇄/PDF | retry_with_revision | 3사 비교 보고 구현, 실제 PDF 저장 검증 중 도구 중단 |
| B-04 | 전체 관련 범위·다른4회차 | executing | 모든 기존 업체 접근·화면 구조 적용, 심층 자료 확장 미완료 |
| B-05 | 고정 URL 공개 반영 | planned | /preview/만, 완성본 검토 뒤. push/배포 없음 |
| V-01 | Windows 검사 2건 | completed | junction fixture+경로 정규화; 권한 허용 실행에서 실제 검증 성공 |

## 전이

2026-11-15 B-01 needs_human → planned → executing → verifying (사용자 구조 승인). B-02/B-03/B-04 planned → executing. R-01 executing → verifying → completed(제한 조사). V-01 failed_with_evidence → retry_with_revision → verifying → completed. B-03 executing → verifying → retry_with_revision(저장 PDF UI 검증 중단, 제품 실패로 단정하지 않음). 전체 목표는 미완료.
