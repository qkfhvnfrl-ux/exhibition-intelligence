# FIELDNOTE v2 고정 진행 확인 링크

사용자는 2026-11-12 중간 작업본의 주소 유지를 요청한 뒤, 로그인 없는 GitHub 링크로 열도록 지시했다.

- 진행본: https://qkfhvnfrl-ux.github.io/exhibition-intelligence/preview/
- 기존 공개 사이트: https://qkfhvnfrl-ux.github.io/exhibition-intelligence/
- 소스: `qkfhvnfrl-ux/exhibition-intelligence` / `work/fieldnote-v2`.
- 현재 배포 결과·원본 SHA: [EXECUTIVE_V2_PREVIEW.json](EXECUTIVE_V2_PREVIEW.json).

## 이후 갱신

기존 브랜치에서 검증한 작업 묶음을 커밋하면 `Validate and build`가 실행된다. 성공한 동일 저장소·개발 브랜치 push만 main의 Pages 워크플로를 시작한다. main을 루트용으로, 해당 검증 커밋을 진행본용으로 각각 체크아웃해 빌드·검사한다. main push/수동 실행은 개발 브랜치 최신 HEAD를 빌드·검사한다.

`assemble-pages-preview.mjs`가 별도 `publish` 디렉터리를 만들고 main 빌드를 루트에, 개발 빌드를 `preview/`에 복사한다. 앱 원본이나 두 dist를 섞어 수정하지 않는다. 배포 문맥과 환경은 main만 허용한다. 이는 사용자 요청에 따른 진행본 공개를 위한 배포 인프라 수정이며, 9단계 전 기존 메인 앱을 v2로 교체하는 것이 아니다.

실행 성공 후 `/preview/deployment.json`의 previewCommit과 실제 실행 커밋을 대조한다. 루트 index가 main 빌드와 같은지 확인한다. 사이트 오류나 CI 실패 시 성공으로 보고하지 않는다. 같은 `/preview/` 주소를 유지하며 별도 저장소를 만들지 않는다.

이전 소유자 전용 Sites 링크와 프로젝트 ID는 JSON의 legacySites에 보존한다. GitHub가 사용자에게 안내하는 주 진행본이며, 별도 요청 없이 Sites를 삭제하거나 접근 범위를 변경하지 않는다.
