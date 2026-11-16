# 공식 릴리즈 완료 — v2.0.0

상태 completed. 2026-11-16 사용자 승인으로 FIELDNOTE v2.0.0을 정식 공개했다. [공식 웹앱](https://qkfhvnfrl-ux.github.io/exhibition-intelligence/) · [GitHub 정식 릴리즈](https://github.com/qkfhvnfrl-ux/exhibition-intelligence/releases/tag/v2.0.0) · [최신 버전](https://github.com/qkfhvnfrl-ux/exhibition-intelligence/releases/latest).

main 및 v2.0.0 태그의 앱 커밋은 0091d1df622be33a94333e68975f878cc3877500. GitHub release는 Latest, draft=false, prerelease=false이며 웹앱 ZIP·SHA256SUMS를 첨부했다. 기존 /preview/도 같은 정식 빌드를 제공하며 개발 브랜치의 자동 공개는 종료했다. main 정상 병합 및 원자적 fast-forward push, 이력/이전 태그 보존.

검증: build 성공, check230/230(fail/skip0), 원격 CI 43790594165 및 Pages43790594187 성공. 두 주소의 런타임 파일244건+배포 manifest2건 일치. 공개 지도·업체·PDF자료 카드·사진·종합보고 및 GitHub Latest를 브라우저에서 확인. 빌드 전용 .nojekyll의404 두 건은 원래 감사와 함께 별도 기록했다.

증거: docs/evidence/OFFICIAL_RELEASE_2026-11-16.json. 현재 작업 체크아웃은 exhibition-intelligence-v2-release, 브랜치는 codex/fieldnote-release-v2.0.0. 태그 이후의 문서/증거 저장점은 배포 앱 커밋과 구분한다. 원래 exhibition-intelligence의 미커밋 변경은 보존되어 있다.

이후 수정·자료 보강은 patch, 새 기능은 minor 정식 버전으로 관리한다. 일부 사진/자료 공백·외부 URL 제한·최신 종합보고 PDF 재생성·실제 휴대폰 검증은 남아 있다. 아래 이전 미배포/검토 문구는 당시 기록이다.

---

# FIELDNOTE v2.0.0 공식 릴리즈

상태: planned → executing. 2026-11-16 사용자가 최신 작업본을 GitHub 공식 릴리즈로 관리·공개하도록 명시 승인했다. 이 결정이 기존 preview-only/공개 보류 지침보다 우선한다.

## 실행 계획

- 목표: 검증된 566f4c1 앱을 v2.0.0 정식 버전으로 main과 기본 Pages URL에 공개하고 GitHub의 최신 정식 릴리즈로 게시한다.
- 수정 파일: package.json, README.md, .github/workflows/pages.yml 및 ci.yml, 배포 조립 보조 코드/집중 회귀검사, AGENTS.md와 프로젝트 상태·릴리즈 증거 문서.
- 영향: main 기본 주소가 v2로 전환되고 /preview/는 같은 정식 빌드의 호환 주소로 유지된다. 이후 개발 브랜치 CI가 정식 사이트를 바꾸지 않으며 main은 정식 버전 관리 기준이다.
- 범위: 앱 기능·사진/자료 원천은 566f4c1을 유지한다. 이전 미커밋 변경은 원래 작업공간에 그대로 둔다. 기존 브랜치·태그·이력과 사용자 브라우저 데이터는 보존한다.
- 위험: 원격 main과 개발 이력의 분기, 하위 경로 자산 누락, 외부 사진/자료 URL 변경, 배포와 태그의 커밋 불일치. main 이력을 병합하고 원격 SHA 및 공개 파일 해시를 대조한다. force push는 사용하지 않는다.
- 검증: 격리 작업공간 build → check → diff; 정식/호환 산출물 비교; 원격 CI와 Pages 성공; 익명 HTTP 버전·배포 SHA·파일 대조; 공개 화면 지도/업체/보고 확인; GitHub release draft=false/prerelease=false/latest 확인.
- 버전 정책: v2.0.0부터 정식 SemVer 태그를 사용하며 기능 추가는 minor, 수정·자료 보강은 patch로 관리한다. 이미 공개한 태그는 이동하지 않는다.

공식 웹앱: https://qkfhvnfrl-ux.github.io/exhibition-intelligence/

릴리즈 결과와 남은 제한은 검증 완료 후 기록한다.


2026-11-16 RELEASE-2.0.0 executing → verifying: npm run build 성공, npm run check 230/230 통과(fail/skip 0), git diff --check 통과. 로컬 검증 증거 docs/evidence/OFFICIAL_RELEASE_LOCAL_2026-11-16.json. 공개 CI·Pages·HTTP 검증은 이어서 수행한다.
