# FIELDNOTE v2 고정 진행 확인 링크

사용자는 2026-11-12 중간 작업본을 열어볼 링크와 같은 주소의 유지를 요청했다. 이 요청에 따라 별도 진행 확인용 배포를 허용한다. `main` 및 기존 GitHub Pages 공개 사이트는 9단계 전까지 유지한다.

| 항목 | 값 |
| --- | --- |
| 고정 주소 | https://fieldnote-v2-progress.tko-korean.chatgpt.site |
| Site ID | `appgprj_6af50711695881919e5723f1689f8b3b` |
| slug | `fieldnote-v2-progress` |
| 접근 범위 | 소유자 전용 배포 성공. 변경 전 실제 접근 설정 재확인 |
| 구현 원본 | `qkfhvnfrl-ux/exhibition-intelligence` · `work/fieldnote-v2` |
| 배포 작업 디렉터리 | `/workspace/sites/fieldnote-v2-progress` |
| 배포 설정 | `.openai/hosting.json` · static directory `dist` |
| 첫 배포 원본 커밋 | `24181a79a36f7af87104958d6fe2af5e49466419` |
| 첫 배포 스냅샷 커밋 | `6352d99cecb5d9e094093c9d52af5dc8650aa45a` |

소유자 전용 배포 성공을 확인했다. 배포 버전·배포 ID·원본 커밋의 기계 판독 기록은 [EXECUTIVE_V2_PREVIEW.json](EXECUTIVE_V2_PREVIEW.json), 전체 작업 상태는 `EXECUTIVE_V2_STATUS.json`을 기준으로 한다.

## 이후 갱신

1. 구현·조사 원본은 계속 기존 GitHub 작업 브랜치에서 수정·검증·저장한다. 배포 작업 디렉터리는 검증한 `dist`의 정적 스냅샷이며 별도 앱 개발본이나 프로젝트 포크가 아니다.
2. 검증한 작업 묶음마다 같은 Site ID로 `get_site`와 쓰기 자격 증명을 조회하고 기존 소스 작업 도구로 배포 디렉터리를 연다. 새 Site나 slug를 만들지 않는다.
3. 원본의 검증된 빌드 `dist`로 배포 스냅샷을 갱신하되 `.git`과 `.openai/hosting.json`의 동일 Site ID를 보존한다. 원본 커밋을 함께 기록하고 스냅샷을 패키징·push한 뒤 동일 Site에 저장·배포한다.
4. 성공 응답을 확인한 후 STATUS/HANDOFF에 주소·배포 버전·원본 커밋을 갱신한다. 실패 시 기존 링크를 교체하거나 성공으로 보고하지 않는다.

주소 유지 요청은 예약 작업이나 무인 자동 갱신 요청이 아니다. 이후 개발 작업에서 검증한 묶음을 반영하며 같은 주소를 유지한다.
