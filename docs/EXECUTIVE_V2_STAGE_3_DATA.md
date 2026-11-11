# 3단계 화면 데이터 · 읽기 전용 어댑터

`scripts/compile-v2-app.mjs`는 2단계의 `public.json`과 빌드에서만 읽는 `registry.json`, `taxonomy.json`, `map-display.json`, `editorial/*.json`을 전시회별 화면 데이터로 투영합니다. 기존 JSON이나 브라우저 저장소는 변경하지 않습니다.

## 생성과 배포

1. `npm run compile:v2`로 2단계 원장을 재생성합니다.
2. `node scripts/compile-v2-app.mjs` 또는 `compileApp(root)`로 다음을 생성합니다.
   - `data/v2/app/index.json`: 행사 선택과 15개 기술분류, 회차별 파일 주소.
   - `data/v2/app/events/{eventId}.json`: 해당 회차의 업체·부스·지도·제품·사진·문서·분석·출처.
3. `data/v2/app/`만 `dist/data/v2/app/`로 복사합니다. 전체 registry·수집 원장·조사 큐를 브라우저에 배포하지 않습니다.

app 디렉터리는 생성물이므로 Git에서 제외하고 원천·컴파일러·검사를 커밋합니다. 행사 선택 시 해당 회차만 가져오고 모듈 메모리에 캐시합니다. 이미지 바이트는 JSON에 넣지 않으며 화면에서 필요한 이미지만 로딩합니다. 전체 참가자 데이터를 배열에서 자르거나 사진 각도 수를 제한하지 않습니다.

## 화면 계약

`loadIndex()`, `loadEvent(eventId)`는 읽기 전용 fetch입니다. `src/v2/data.js`는 localStorage·IndexedDB를 읽거나 쓰지 않습니다. GitHub Pages의 저장소 하위 경로에서도 모듈 URL 기준으로 데이터 주소를 계산합니다.

| 대상 | 주요 필드 |
| --- | --- |
| 행사 파일 | `event`, `taxonomy`, `companies`, `products`, `photos`, `eventPhotoIds`, `catalogs`, `editorials`, `analyses`, `assertions`, `sources`, `booths`, `mapDocuments`, `mapGeometries`, `boothOccupancies` |
| 업체 | `id`=`organizationId`, `name`, `aliases`, `countries`, `participationId`, `status`, `attendanceStatus`, `sourceLabelStatus`, `boothIds`, `mapBoothIds`, `productIds`, `photoIds`, `analysisIds`, `catalogIds`, `editorialId`, `categoryIds`, `rawCategories`, `sourceIds`, `profileUrls`, `relevanceNote`, `reason`, `highlights`, `exhibitStatus`, `interpretationNote`, `searchText` |
| 사진 | `src`(표시 허용된 경우만), `delivery`(`local`/`remote`/`linked`), `sourceUrl`, `sourceIds`, `width`, `height`, `caption`, `credit`, `rights`, `context`, `variantNote`, `sourceDate` |
| 사례 분석 | 한 문장 `reason`, `highlights` 3개, `exhibit`, `distinction`, `direction`, `workConnection`, `followUps` 2~3개, `sourceIds`, `photoIds`, `catalogIds` |
| 지도 문서 | 기존 문서 조건을 보존하고 확인된 원격 `background`와 `areas`를 추가. 정규화 도형은 기존 `mapGeometries` 그대로 |

`searchCompanies(data,{query,category,hall,mappedOnly})`는 업체명·별칭·제품명과 명시된 기술분류를 검색합니다. 결과를 임의로 제한하지 않습니다. `getBoothCompanies(data,id)`는 공동부스 업체 전체를 반환합니다. `getCompanyPhotos`, `getCompanyProducts`, `getCompanyEditorial`은 같은 행사 파일의 ID 참조를 풉니다. `tourCompanies(data,{category,kind})`는 검증된 위치가 있는 사례 또는 기술분류 업체를 반환하며 통로·최단경로를 만들지 않습니다.

## 사실과 범위 유지

- `mapBoothIds`에는 검증된 도형이 있는 부스만 들어갑니다. 나머지 업체도 목록에 남습니다. 번호가 있다는 이유로 좌표를 생성하지 않습니다.
- 참가 상태, 실제 전시품목 상태, 원문 이름의 전사 불확실성을 분리합니다. 사례가 없는 업체는 `exhibitStatus:'unconfirmed'`입니다. 기존 제품·분석만으로 실제 출품을 확정하지 않습니다.
- 기술분류는 공식 명단의 구체적인 분류, 기존 제품 분류, 근거가 있는 관련성 판정 또는 새 사례의 명시적 분류만 사용합니다. 회사명에 특정 단어가 들어 있다는 이유로 업종을 추정하지 않습니다. 공식 분류만으로 차량 적용 적합성까지 확인한 것은 아닙니다.
- 한영 별칭은 2단계의 안정적인 조직 ID를 사용합니다. 공동관·복수 부스·제품사진이 업체 수를 늘리지 않습니다.
- 다른 회차에만 연결된 사진을 해당 회차 현장사진으로 넣지 않습니다. 회차 미지정 제품 참고사진은 `reference` 및 조건·날짜를 유지합니다. 같은 사진의 중복은 실제 경로나 ID로 합치되 서로 다른 각도는 모두 보존합니다.
- `link-only` 사진은 URL이나 로컬 경로가 있어도 `src:null`로 반환합니다. Flickr는 명시된 provider-embed 상태와 원문/이미지 도메인을 모두 확인합니다. 기존 로컬 사진은 기록된 공개 라이선스 또는 뉴스룸 이용조건을 보존하며 새로운 라이선스를 주장하지 않습니다.
- 제품 카탈로그는 일반 자료와 행사 자료를 `scope`/`note`로 구분합니다. 원문 PDF를 제품 카탈로그로 임의 지정하지 않습니다.
- 원격 지도 PNG는 공식 원문을 직접 표시하며 기존 `rights.link_only`와 별도의 원격 참조 조건을 유지합니다. 도면의 바닥 위치를 실제 부스 높이·외관·통로로 변환하지 않습니다.
- 수집 진행률·누락 페이지·분석 완료 집계는 화면 데이터에 포함하지 않습니다. 단일 근거·전사 미확인·사전 계획·재검증 미완료 등의 해석 조건은 유지합니다.

## 검사

`tests/v2-app-data.test.mjs`는 전 참가 레코드 보존, 없는 좌표 생성 금지, 공동관 다대다, 별칭/제품 검색, 기술분류 근거, 이미지 권리, 사진 각도 보존, 관리 데이터 제외, 사례 연결과 범위 오승격을 검사합니다. 실제 브라우저의 지도·사진·인쇄 동작은 별도 UI 검증 대상입니다.
