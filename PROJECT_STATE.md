# 프로젝트 상태

기준일: 2026-11-16 (Asia/Seoul)

- 목적: R&D 연구소장 보고에서 기존 전시회 장표를 대체할 사진·설명·근거·가독성을 갖춘 웹앱.
- 기술: 기존 정적 HTML/CSS/JavaScript ES modules, Node 검사, GitHub Pages. 프레임워크·데이터 ID 유지.
- 승인: 큰 지도 → 별도 업체 메인 → 장비별 설명 → 16:9 종합보고, 모바일 세로 읽기. 첫 공개 대상은 기존 /preview/이며 완성본 검토 전 push·merge·배포하지 않는다.
- Git: 실제 저장소 exhibition-intelligence, 로컬 브랜치 codex/fieldnote-redesign-audit. 보고·사진/PDF 묶음 16e7e69, 6개 장비 확대 묶음 49d846d 로컬 저장 완료. 원격 공개 변경 없음.
- 구현: 독립 업체·제품 주소, 지도 확대/위치 복귀, 제품별 사진 갤러리와 다섯 설명, 5회차 종합보고, 인쇄/PDF의 사진·출처·이용조건 표시.
- 현재 자료: 5회차·업체 명칭 3,685개·제품/서비스 기록 130개 유지. 장비 서술 46개·230항목. 서술 제품 중 24개에 고유 현장사진 29장 직접 연결. 전체 앱의 표시 가능한 event 사진 기록은 53개이며 전수 조사 완료 수가 아니다.
- 이번 추가: Patria DSEI 2025 현장사진 4장 신규 확보, TRACKX·TREMOS 2제품 추가, 기존 6×6 ID 유지. Cockerill i-X와 GDAMS의 기존 사진을 설명/보고에 추가 연결.
- 코드 검증: 최신 npm run build 및 npm run check 201/201 통과, fail/skip 0. 공개 데이터·소스·dist 금지문구 스캔 0건.
- 화면 검증: 1440×1000에서 5보고 모두 1365×767.8125, 1280×900에서 4개 신규 보고 1205×677.8125. 390×844에서 세로 배치·가로 넘침 없음. Patria 사진 4장 로딩, 형상별 캡션, 갤러리 순환, TRACKX 제품 주소 새로고침 확인. 실제 휴대폰 검증과 구분한다.
- PDF: 실제 Chrome 저장 파일 5개 확보. baseline 모두 1페이지·약320×180mm·한글/이미지/링크/잘림 검사 통과. 최종판은 사진 높이를 32→45mm로 키워 output/pdf/final에 저장했으며 5개 최종판 모두 1쪽·한글/링크/임베드폰트·사진45mm·잘림/겹침0으로 검증 완료했다. SAHA는 사진 0개로 placeholder를 유지한다.
- 상태: B03 completed(5회차 보고 화면·실제 PDF 검증 범위), B04 executing(자료 확대). 전체 보고서 대체·전체 관련 업체 조사·공개 배포는 미완료.
- 남은 공백: 서술 46개 중 22개는 직접 표시 사진 미확보. SAHA 보고 3사례 사진 권리·식별 미확보, 공식 지도/명단과 전수 조사 공백, 실제 휴대폰, 사내 참고 장표 미제공.
- 다음: 사진 미확보22제품·해당 회차/업체 조사 큐 보강 → 완성본 검토.

실행 근거: docs/evidence/REDESIGN_REPORT_EXPANSION_2026-11-16.json, REDESIGN_REPORT_BROWSER_2026-11-16.json, REDESIGN_PHOTO_INTAKE_2026-11-16.json, REDESIGN_PDF_VALIDATION_2026-11-16.json.

추가 검증: 기존6제품에 설명30항목·사진8장, HAVOC사진2장 연결(신규다운로드0). 신규6제품 모두1440/390 폭에서 사진로드·가로넘침없음. ACV확대/THeMIS주소새로고침/HAVOC3사진순환/T90미확보·일반자료구분 확인. 근거: REDESIGN_PHOTO_COVERAGE_2026-11-16.json 및 REDESIGN_PHOTO_COVERAGE_BROWSER_2026-11-16.json.
