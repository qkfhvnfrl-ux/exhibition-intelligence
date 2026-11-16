# 작업 목록과 상태 전이

| ID | 작업 | 상태 | 범위 |
| --- | --- | --- | --- |
| A-01~03 | 감사·3종 로컬 초안 | completed | 이전 a21b781 체크포인트 |
| R-01 | 3사 및 한화 근거 보강 | completed | 4개 조사 packet, 26제품 서술 연결. 사진 완성·전수조사 아님 |
| B-01 | 관람 흐름·장비 링크 | completed | 해당 구현 범위: 지도 동선과 마지막 사진 그룹·하위경로 회귀 확인. 전체 자료 완성 의미 아님 |
| B-02 | 장비별 설명·공개 정리 | executing | 65서술·325항목, 표시사진 공백35제품·미서술66기록 보강 |
| B-03 | 종합보고·인쇄/PDF | retry_with_revision | 최신5보고 화면 검증, 변경DSEI/SAHA PDF2개 재저장 필요; 이전5PDF 보존 |
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

## 2026-11-16 구성품 설명·사진·출처 보강 계획

- 상태: B02/B04 new_task → planned → executing. 직전46제품/201검사 묶음은 실제구현·검증·증거·커밋을 남긴 progress다.
- 목표: 기존 ADEX중소기업/구성품 사례를 장비별5항목에 연결하고 표시가능한같은회차사진을수집한다. FIBERPRO/COTS/HKC/수성최대7제품 원문재대조, 한화필수군과정부공공누리사진대체경로조사.
- 수정파일: 새research narrative/photo packets,기존prepare/content원천및사진메타데이터,필요시assets,compile-v2-app.mjs와details.js,관련검사/증거/메모리.
- 영향: 기존ID·구조·참석상태·지도좌표·사용자데이터유지. 동일URL의서술용출처보강이기존제목/발행자/제약을잃는문제를수정하고 확인된국가표기는별도editorial유무에관계없이상단표시.
- 리스크: 일반제품/다른회차사진오연결,뉴스룸공개와재게시허가혼동,출처제약누락,보고PDF에영향. 단일근거와미확보상태를유지한다.
- 검증: 원문·사진·권리1차/독립대조 → build → check → 영향화면및갤러리브라우저. 보고출력입력전후비교로변경된PDF만재저장/한장검증. 새사진은다운로드/실제표시/기존재연결을구분한다.

## 2026-11-16 구성품 설명·출처 보강 — 검증 결과

- B02/B04 executing → verifying → completed(7제품35항목·출처 보강 묶음) → executing(전체 자료 확장). 이번 실행은 코드·자료·202검사·14개 제품/화면 조합·독립 검토·증거를 확보한 progress이며, 반복 차단으로 분류하지 않는다.
- B03 기존5보고/저장PDF 검증 완료 범위 유지. B05 planned: 완성본 검토 전 push·merge·공개 배포 없음.
- 다음 우선순위: 사진 미확보29제품과 아직 서술하지 않은77제품의 근거 확대, 공식 지도/참가 명단 대조, 한화·SAHA 사진 식별/권리 공백 보강. 신규 다운로드·기존 연결·원문 링크를 구분하고 제품/사진 ID를 유지한다.
- 전체 목표 완료 감사: 53제품/265항목·5보고·202검사·기존5PDF는 검증됐지만 전수 관련업체 조사·전체 사진·실제 휴대폰·완성본 검토/공개는 미완료다. 전체 목표를 completed 또는 blocked로 전환하지 않는다.

2026-11-16 로컬 저장: 구성품53서술·265항목·202검사 묶음 7fa59fa2364ca6b5f08d7eb6b584946bdc0f10ea. 공개 변경 없음. 인계 문서 후속 저장은 구현 커밋과 분리한다.

다음 조사 큐: docs/research-v2/redesign-next-narrative-queue.json. 미서술77제품 중 우선10제품·3회차를 선정했다. 직접 제품 연결 표시사진은0이고 회사사진19장은4제품의 식별 후보일 뿐이다(productIds=[]). 큐선정/참조검증만완료, 새원문조사·본문작성·사진연결은미실행. DTaQ공유원문분량한계도보존한다.

## 2026-11-16 다음10제품·사진 연결 확대 계획

- 이전 goal turn: progress. 구현7fa59fa·인계7b13b9d, 53/265,202검사·브라우저·독립보존감사증거를확보했다. 전체목표는미완료다.
- 목표: 우선큐10제품(DSEI2·Euro2·ADEX6)의실제회차근거와고수준5항목설명을추가하고, 회사사진후보19장을개별장비와대조한다. 신규허용현장사진도찾아확보한다. 사진다운로드/기존연결/외부임베드를분리집계한다.
- 수정파일: docs/research-v2/redesign-narratives-{dsei,eurosatory,adex}-next.json, prepare-redesign-content.mjs, product-narratives.json,검증된기존사진원장,필요시assets,details.css,검사·증거·상태문서.
- 영향: 기존ID·참석/출품상태·지도·자료원장보존. 같은회차/제품식별이된사진만연결. 고수준전시설명과공개발표/추론/미확인분리.
- 리스크: Flickr ARR를CC재배포로오인,여러사진의다른형상혼합,발표내용을실제출품확인으로승격,공유DTaQ원문분량초과. 현재권리·공식임베드조건·픽셀·회차를대조한다.
- 검증: 원문/픽셀/권리및독립검토 → 생성 → build → check → 실제하위경로데스크톱/모바일·사진로딩·갤러리·주소·한글줄바꿈 → 보고출력전후/PDF영향판정 → 증거/커밋. 설명과연결되지않은회사사진을확보실적으로세지않는다.
- 상태: B02/B04 executing → planned → executing(승인된자료확대). B03기존범위completed,B05planned(완성본검토전공개보류).

추가 발견: 기존 IDEX 참가업체 Diehl의 LIBELLE 현장사진1장을 CC BY4.0·촬영자·촬영일·픽셀로확인했다. 기존업체ID에제품1개와원본사진1장(무변환)을추가하는계획이다. 일반제품/과거차량탑재소개와2025단품전시를분리하고참가상태·지도는유지한다. data/v2/research/idex-2025/libelle-photo.json 및 대응narrative패킷을기존컴파일경로로통합·검증한다.

검증발견수정: EO 부스라는기존Motoya사진은MBDA임을원본픽셀로확인해EO연결에서제외하고 originalRecord를 excludedPhotos에보존한다. 본문업체언급과독립제품사진을구분한다. Flickr공식안내의원문복귀링크를사진자체에도적용하고별도확대버튼·갤러리는유지한다. 관련 details/report 코드와회귀검사, DSEI실제PDF 재저장검증이추가영향범위다.

2026-11-16 계획 보완: 원격 표시만 확인한 Flickr ARR 사진은 웹에서 원문 직접 링크와 별도 확대를 제공하고, 인쇄/PDF에는 캡션·촬영자·원문 링크 안내를 남긴다. DSEI PDF의 외부 사진 1장을 안내로 바꾸고 실제 저장 파일을 다시 검증한다. 사용자 목표 갱신에 따라 현장사진이 없는 장비는 웹의 일반 제품사진 대체 후보를 조사하고 모델·권리 확인 후 해당 회차 현장사진과 명시적으로 구분해 연결한다. 목표/기존 구조/공개 전 검토 경계는 유지한다.

2026-11-16 제품사진 대체 계획: 기존 reference 사진 구조·productIds를 그대로 활용한다. 제품에 표시 가능한 해당 회차 사진이 없을 때만 제품ID가 일치하는 참고사진을 앞에 보여주고 촬영 맥락·날짜·출처 및 현장사진 미확보를 함께 표시한다. 보고에서도 같은 업체/제품의 참고사진만 대체하며 현장사진으로 표시하지 않는다. 회사사진을 장비에 임의 귀속하지 않고 원래 회차 확인·상태·서술 photoIds의 현장 전용 계약을 유지한다. src/v2/details.js/report.js, 관련 회귀 검사와 허용 사진 원천만 수정하며 SAHA PDF 영향도 재검증한다.

2026-11-16 화면 검증 추가: SAHA 보고의 PARS ALPHA 연결 페이지에 5항목 서술이 없어 generic 안내만 보이는 점을 확인했다. 기존 공식 2024예고/2026회고와 일반제품 자료를 분리한 1개 narrative를 추가한다(제품/사진ID·참가상태 불변). 참고사진은 narrative.photoIds의 회차사진으로 승격하지 않는다. 사진 썸네일에는 전체 반복 제목 대신 촬영각도를 짧게 표시하며 전체 접근성 이름·확대 캡션을 유지한다.

## 2026-11-16 사진·서술 확대 — 검증 결과와 다음 계획

- B02/B04 executing → verifying → completed(이번 12서술·사진/출처/UI 묶음) → executing(남은 자료 확대). 총65서술·325항목·131제품기록·5보고, build/check209통과. 전체 조사 완료로 보지 않는다.
- B03 completed(이전 저장판) → executing(인쇄 사진 권리/참고사진 변경) → verifying → retry_with_revision. DSEI·SAHA의 새 PDF 저장0개. Windows 인쇄창 입력이 적용되지 않아 사용자가 취소했고 웹앱 복귀 확인. 이전5PDF와 영향2PDF 역사본 보존.
- B05 planned 유지. 완성본 검토 전 push·merge·workflow·공개 배포 없음.
- 목표/수정파일: 현장사진이 없는 제품에 검증한 참고사진을 연결한다. 다음 참고사진 조사 packet, data/photos.json·catalog.json·관련 서술/증거/상태문서만 필요 범위에서 갱신한다. 기존 제품ID·참석상태·지도·사용자기록 유지.
- 리스크: BOXER/Leopard/TULPAR/K2 등의 파생형 오인, 과거 전시를 현재 회차로 승격, 라이선스/날짜 충돌. 독립 픽셀·원문·권리 대조 후 정확한 제품만 연결한다.
- 검증: 원문/사진 독립 검토 → build → check → 영향을 받은 제품의 로딩/갤러리/새로고침·모바일 → 보고/PDF 영향 판단. 미통합 조사 후보는 구현 실적으로 세지 않는다.
- 현재 공백: 서술65 중 현장사진 없음36, 참고사진 포함 표시사진 없음35. 미서술 제품기록66. 공식 명단·지도 및 전체 관련 업체 조사 큐 유지.

2026-11-16 구현 저장점: d3c4580091f0c83b580cacfad847ea2d6dcc4b5b. 50파일의65서술/325항목/209검사·사진/화면 변경을 로컬 저장했다. 후속 인계문서는 별도 커밋. 다음 참고사진 큐는5제품16장 검토·후보13/제외3·미통합이며16자산 해시 재대조PASS. 신규사진0/운영연결0, 전체목표진행·공개변경없음.

## 2026-11-16 참고사진 연결·기존 장비 설명 보강 계획

- 이전 goal turn 분류: progress. d3c4580 구현·090fbad 인계, 65서술325항목209검사·브라우저·독립감사 증거를 확보했다. 전체 목표는 미완료.
- 목표: 검토한16참고사진 중 정확한13장만4제품에 연결하고, 나머지3장의 파생형 불일치를 명확히 표시한다. BOXER MIV/Leopard 2A8/일반TULPAR의5항목 설명을 공식원문과 회차근거로 보강한다. 기존5회차·ID·지도·사진바이트는 보존한다.
- 수정 파일: data/photos.json, data/catalog.json, docs/research-v2/redesign-narratives-reference-{boxer,leopard,tulpar}.json 및 조사packet, prepare-redesign-content.mjs, 생성editorial, 필요한검사·증거·메모리. UI수정은 관찰된 문제에 한정한다.
- 영향 범위: 제품 참고사진과 설명. Patria현장2장·K2PL현장1장 우선순위 유지, TULPAR MIZRAK30을KORHAN에 연결하지 않음. 업체의참가/제품출품상태와 지도좌표 유지.
- 리스크: 시제차·파생형·국가별구성 혼동, 출처사진날짜/라이선스버전상충, 일반제품설명을실제출품근거로승격. 원문·픽셀·독립검토로근거범위를보존한다.
- 검증: 기존runtime·보고screen/print·자산 snapshot → 원문/사진검토 → build → check → 제품사진로딩/확대/주소새로고침/1440·390화면 → 보고영향확인 → 증거/로컬커밋. 신규다운로드와기존사진연결을구분한다.
- 상태: B02/B04 executing → planned → executing(기존승인된사진·자료확대). B03 retry_with_revision 유지(이전변경PDF2개저장미완료). B05 planned,공개push/배포없음. 인쇄창을다시열지않는다.

## 2026-11-16 1차 공개 계획 — 사용자 직접 승인

- 상태: RELEASE-01 new_task → planned → executing. B05의1차 검토본 공개만진행, 전체자료확대목표는일시정지 유지.
- 목표: 검증완료090fbad를 기존GitHub Pages /preview/에 공개하고 사용자에게 실제접속링크 제공.
- 수정파일: 승인·상태·증거·인계/릴리즈기록 문서만. 앱코드·자료는090fbad와동일.
- 작업공간: 별도 exhibition-intelligence-release-1 worktree, codex/fieldnote-preview-release-1. 원본작업공간의미검증후속변경보존.
- 영향: work/fieldnote-v2를fast-forward push하면 Validate and build 성공후main소유Pages workflow가stable루트와새preview를조립한다. main ref/app변경없음. force push/이력재작성없음.
- 리스크: 원격분기추가변경·CI실패·공개캐시·하위경로/사진누락·미완료PDF의완료오인.
- 검증: remote ancestor확인 → 격리worktree build/check → 현재공개산출물검사 → 정상push → CI/Pages실제성공 → 익명deployment.json의preview/mainSHA와이미지·자료HTTP → 실제브라우저지도/업체/사진/보고 확인 → 증거저장.
- 잔여: 변경DSEI/SAHA2PDF실제저장미완료,사진35제품·미서술66기록등자료공백을1차공개한계로명시한다.

## 2026-11-16 RELEASE-01 — 1차 공개 완료

- 상태: executing → verifying → completed. 완료 범위는 기존 /preview/의 1차 공개이며 전체 목표는 일시정지 유지.
- 공개: https://qkfhvnfrl-ux.github.io/exhibition-intelligence/preview/
- 릴리즈: https://github.com/qkfhvnfrl-ux/exhibition-intelligence/releases/tag/v2.0.0-preview.1, 커밋 ca195ab60d60265bba73c49fce6779513a316763.
- 검증: 격리 worktree npm run build 성공, npm run check 209/209 통과. CI 43782581288·Pages 43782617358 성공, 익명 105파일/87자산 검증과 공개 데스크톱·모바일 폭 화면 확인.
- 보존: main a633a9728fdbb1599c0dff5904b2fc4f9ea7a9a7, 원래 작업공간의 미검증 13사진 연결·BOXER/TULPAR 초안.
- 남은 범위: DSEI/SAHA 새 PDF 2개 저장, 사진 공백 35개 서술 제품, 미서술 66기록, 전체 조사와 실제 휴대폰.

## 2026-11-16 PHOTO-01 — 사진 우선 탐색·핵심 업체 사진 확대

- 사용자 승인: 직전 제안 프롬프트대로 로컬 구현·검증 진행. new_task → planned → executing.
- 목표: 사진 보유 업체 우선 정렬/상태 표시, Eurosatory 핵심 업체부터 대표 사진 5곳 목표로 연결 후 다른 회차 확대.
- 수정 파일: src/v2 업체 목록·사진 선택 관련 모듈, 관련 회귀검사, data/photos.json·catalog.json·기존 생성 데이터, 사진 자산, 증거 및 상태 문서.
- 영향: 업체 검색·필터의 안정 정렬, 사진 상태와 제품별 사진 표시. 기존 ID·지도·사용자 변경 보존.
- 위험: 다른 회차/파생형 오연결, 표시 권리·외부 이미지 실패, 회사 사진과 제품 사진의 집계 혼동.
- 검증: build → check → diff → 1440/390 화면의 정렬·상태·실사진 로드·갤러리 → 전후 집계와 로컬 미리보기 링크.
- 범위: 이번 공개 배포는 별도 요청 시 진행. 전체 업체 조사·장비 설명 대량 작성·PDF 재생성 제외.

## 2026-11-16 PHOTO-01

2026-11-16 PHOTO-01 로컬 1차 사진 묶음 완료. 사진 상태 표시·안정 정렬과 정확한 제품 대표사진 우선 선택을 적용했다. 기존 DSEI 업체 5곳에 참고사진을 추가하여 회차별 사진 보유 업체 합계 32→37, 사진 연결 제품 31→40. 신규 다운로드 4장, SETAS 기존 자산 1장 재사용, 이전 후보 13건 연결. 현장사진 신규 0장. build/check 213개 통과, PC1440/모바일390·사진 확대/새로고침·필터·검색 확인. 로컬 http://127.0.0.1:4177/#companies?event=dsei-2025 를 제공한다. 공개 반영은 별도 요청 범위다.

상태 executing → verifying → completed (이번 로컬 1차 사진 묶음).
