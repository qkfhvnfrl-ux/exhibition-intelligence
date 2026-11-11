# FIELDNOTE v2 공통 데이터 구조 · 2단계

기준: 2026-11-12. 이 구조는 공식 모집단 수집, 실제 전시 근거와 업체/부스 관계를 분리합니다. 기존 FIELDNOTE 1.1 화면과 브라우저 저장소는 변경하지 않습니다.

## 원천·생성물·배포 경계

| 파일 | 역할 |
| --- | --- |
| `data/v2/collection/{eventId}.json` | 행사별 공식 원문 URL, 획득일, 회차, 원문 해시, 수집 단위/범위, 명단 원행, 이용 조건, 다음 조사 큐 |
| `data/v2/maps/{eventId}.json` | 지도 문서 메타데이터, 검토한 영역, 원본 좌표, 번호 확인과 위치 확인의 별도 근거 |
| `data/v2/entity-aliases.json` | 선택적·명시적 업체 별칭/관계 병합 근거. 이름이 비슷하다는 이유로 병합하지 않음 |
| `data/catalog.json`, `data/review.json`, `data/review-photos.json`, `data/event-reports.json` | 기존 식별자와 근거를 보존하는 이전 원천. 원본 데이터 변경 없음 |
| `scripts/compile-v2-data.mjs` | 위 원천으로 정규화 데이터를 결정적으로 생성 |
| `scripts/validate-v2-data.mjs` | 관계·회차·좌표·완료 집계·출처 독립성 검증 |
| `data/v2/legacy-mapping.json` | 커밋하는 namespace별 기존 ID → 새 개체 ID 이전 매핑 |
| `data/v2/registry.json` | 정규화된 전체 조사 데이터. 조사 관리용이며 배포하지 않음 |
| `data/v2/public.json` | 향후 화면 구현용 최소 데이터 투영. 수집 진행률·작업 큐·관련성 판정 업무·완료 집계는 제외 |

registry/public은 생성된 실제 파일이지만 Git에는 중복 저장하지 않습니다. 원장·스크립트·기존 자료·이전 ID 매핑을 커밋하고 CI에서 같은 파일을 재생성합니다.

실행은 `npm run compile:v2`, `npm run validate:v2`입니다. 기존 `npm run check`와 `npm run build`에서도 실행합니다. 빌드는 `dist/data/v2/public.json`만 추가하며 수집 원장, 전체 registry, 조사 문서를 배포하지 않습니다. 현재 UI는 이 데이터를 아직 소비하지 않으며 화면 구현은 3단계입니다.

## 정규화 개체와 연결

| 개체 | 주요 필드 / 관계 | 의미 |
| --- | --- | --- |
| `events` | 기존 `id`, `year`, 장소, 출처 | 회차 식별자는 기존 `adex-2025` 등을 그대로 사용 |
| `organizations` | `id`, `name`, `kind`, 별칭, 국가 표기, 출처 | 회사·미확정 조직·공동명칭·국가관·기관 등 구분. 이름만으로 법인 확인 완료를 표시하지 않음 |
| `organizationRelationships` | `fromOrganizationId`, `toOrganizationId`, `type`, 출처 | 브랜드, 계열사, 유통사 관계를 별도 보관. 명시적 근거 없이 생성하지 않음 |
| `participations` | `eventId`, `organizationId`, 참가 상태, 관련성, 분석 상태 | 한 조직의 여러 행사 참가를 분리 |
| `booths` | `eventId`, `code`, 홀, 번호 상태, geometry 목록 | 번호가 없는 공식 지도 영역도 가능. 내부 ID는 공식 부스번호가 아님 |
| `boothOccupancies` | `participationId` ↔ `boothId` | 공동관·복수 부스를 다대다로 연결 |
| `products` | 기존 제품 `id`, 업체들, 명칭/범주 | 제품명·파생형을 행사 참가와 분리 |
| `exhibits` | `productId`, `eventId`, 참가 관계, 실제 전시 상태 | 회사 제품 소개가 특정 행사 출품으로 자동 승격되지 않음 |
| `photos` / `photoLinks` | 사진 식별자·권리·출처 / 제품·회차·전시 연결 | 동일 사진 재사용과 한 제품의 다각도 사진은 업체 수를 늘리지 않음 |
| `catalogs` | 문서 URL, 제품/업체, 문서종류, 권리 | `.pdf`라는 이유만으로 제품 카탈로그로 확정하지 않음 |
| `analyses` | 업체·제품·전시, 고유 판단, 당사 업무 연결, 검토 상태 | 기존 요약과 심층분석 완료를 구분 |
| `assertions` | 대상 개체, `kind`, 주장, 출처, 조건, 검토 | `fact` / `observation` / `interpretation` 분리. 기존 사실 필드는 사실 검증 완료가 아니라 주장 유형 |
| `sources` | 원문 URL, 발행자, 회차, 확보일, 해시, 권리, 출처 계보 | 동일 보도자료 재전재의 독립 검증 오집계를 방지 |
| `mapDocuments` / `mapGeometries` | 원본 문서 / 검증 도형과 원본 연결 | 지도 문서와 업체 도형 분리 |
| `rosterEntries` | 원행 ID, 원문 위치, `organizationIds`, `participationIds` | 공식 명단의 원행을 잃지 않고 중복/공동 표기를 추적 |

업체 식별 기본값은 Unicode NFKC·대소문자·연속 공백만 정규화한 명칭의 SHA-256 앞 20자리입니다. 법인접미사, 브랜드, 한글/영문 표기를 추측하여 없애거나 합치지 않습니다. 근거가 있는 `entity-aliases.json`의 명시적 ID/별칭만 같은 개체로 묶습니다. 이름 기반 중복 제거는 법인 실사 완료를 의미하지 않으며 `identityStatus`에 이를 남깁니다.

공동명칭을 임의로 쪼개지 않습니다. 원문이 실제 구성 업체를 각각 명시해 원장 `listedOrganizations`에 기록한 경우에만 여러 업체로 연결하며 공동 표기 전체를 추가 회사로 집계하지 않습니다. 단독 국가관/기관은 해당 `entityKindHint`를 보존합니다.

## 상태를 섞지 않는 규칙

- 참가: `listed`(명단/지도 등재), `planned`(참가 예정), `onsite_confirmed`(현장 참가 근거 검토 완료), `imported_unreviewed`(기존 자료 이전).
- 제품 전시: `unverified`, `planned`, `onsite_confirmed`, `imported_unreviewed`. 업체의 명단 등재만으로 제품의 현장 전시를 확인하지 않습니다.
- 부스번호: `confirmed` / `unverified`. 번호가 없으면 `code:null`입니다.
- 지도좌표: `verified` / `unverified`. 번호 확인과 독립적입니다. 정식 번호 없는 지도 블록도 원본 도형·업체 라벨을 대조하면 좌표 검증이 가능합니다.
- 관련성: `pending`(관련성 검토 중), `confirmed`(관련 확인), `excluded`(제외). 판정 이유와 구체적인 차량 적용 연결을 남깁니다. 사진·인지도·규모는 제외 사유가 아닙니다.
- 기본 등록: `registered`는 개체·참가 관계가 생성된 상태입니다. 심층분석 완료를 뜻하지 않습니다.
- 심층분석: 완료에는 검토된 실제 출품 근거, 업체 고유의 판단, 당사 업무 연결, 검토된 근거 링크가 모두 필요합니다. 검증기는 이를 갖추지 않은 `complete`를 거부합니다.

기존 자료의 `confirmed`, `reviewed`, `verified`라는 문자열은 `legacyStatuses`와 원문 위치로 보존하되 새 구조에서 자동 승격하지 않습니다. 이전된 전시 주장과 분석은 `imported_unreviewed` / `not_complete`입니다. 원본 출처 하나뿐인 주장은 `single_source`, 둘 이상인 출처도 계보를 확인하지 않았으면 `not_assessed`입니다. 독립 검증 완료에는 검토된 주장과 서로 다른 `originGroup` 두 개 이상이 필요합니다.

## 공식 원장 수집 범위와 집계

원장의 `units`는 실제 확인한 페이지/알파벳/분류/본문 구간입니다. 원문 위치와 원행 이름을 보관해 인기 업체부터 모은 목록과 구분합니다. 접근 제한은 `blocked`, 부분명단은 `partial`, 아직 수행하지 않은 항목은 `not_started`입니다. `missingRanges`와 작업 큐에는 정확한 나머지 범위·다음 동작을 씁니다.

`collection.complete`는 확보한 디렉터리 페이지 탐색을 끝냈다는 뜻입니다. `populationComplete:true`는 해당 회차 전체 모집단을 확보했음이 별도로 입증된 경우에만 사용합니다. 공식 공개 웹 명단을 끝까지 읽었어도 행사 전체 참가기업 수와 차이가 남으면 전체 모집단 완료가 아닙니다. 국가관/협회/LAB 부분명단은 전체 모집단으로 승격하지 않습니다.

| 집계 | 정의 |
| --- | --- |
| `populationRows` | 확보한 공식/보조 명단 원행 수. 동일 업체의 여러 표기는 아직 여러 원행 |
| `deduplicatedRosterOrganizations` | 원행에서 정확한 명칭·명시적 별칭으로 연결한 조직 수. 공동관/기관 포함 |
| `deduplicatedCompanyCandidateNames` | 위 수에서 공동명칭·국가관·기관·협회·미해결 복합명을 제외한 업체 후보 명칭 수. 법인 확인 완료 수 아님 |
| `confirmedCompanyIdentities` / `unresolvedCompositeIdentities` | 명시적 별칭 근거로 연결한 회사 식별자 / 아직 분해·식별하지 않은 복합 명칭 수 |
| `registeredOrganizations` | 기존 자료와 지도도 포함한 회차별 조직 등록 수. 확보 명단 수와 분리 |
| `relevanceReviewed` / `relevantOrganizations` | 관련성 판정 완료 / 관련 확인 참가 조직 수 |
| `deepAnalysisComplete` | 위 완료 조건을 충족한 회차별 업체 수 |
| `mapLinkedOrganizations` | 검증된 지도 도형과 연결된 조직 수. 부스 개수와 구분 |
| `numberLinkedOrganizations` | 원문에서 확인된 부스번호와 연결된 조직 수 |
| `insufficientData` | 검토 완료된 해당 회차 실제 출품 근거가 없는 등록 조직 수. 현 단계에서는 명단 확보와 심층 조사 준비를 구분하기 위한 지표 |
| `overallCompletionPercent` | `populationComplete:true`가 아니면 항상 `null`. 부분명단을 분모로 전체 완료율을 만들지 않음 |

한 업체의 여러 부스·여러 사진은 위 업체 집계에서 반복해서 세지 않습니다. 공동명칭의 법인 분해/별칭 판정이 미완료인 수량은 확정 법인 수로 보고하지 않습니다.

## 지도 좌표 계약

문서는 행사·연도·개최장소·홀/층/야외구역·페이지·원문 URL·발행/개정일·원본 너비/높이·단위·회전·크롭을 기록합니다. 알 수 없는 값은 null이며 날짜가 파일 메타데이터에서 왔는지 발행 공지에서 왔는지 구분합니다.

좌표는 **회전/크롭 전 문서 페이지의 왼쪽 위 원점** 기준 `normalized_original`입니다. `(x / original.width, y / original.height)`의 `[0,1]` 범위이며 Polygon 꼭짓점은 최소 3개, 면적은 0보다 커야 합니다. 원본 페이지·도형 근거·확대 라벨 확인을 `verification`에 기록합니다. 문자 검출만으로 부스 도형을 생성하지 않습니다. 부스번호만 있으면 `geometry:null`을 유지합니다.

사전 도면은 `planStatus:'pre_event_plan'`으로 관리합니다. 당일 사진의 업체 참가 확인은 도면 경계 실측·부스번호 확인을 뜻하지 않습니다. `onsiteCrosschecks`는 별도의 관찰 주장으로 이전하며 전체 부스/기업의 현장 참가 상태를 바꾸지 않습니다.

자료를 공개 배포할 권리가 확인된 원본만 `rights.status:'reusable'`과 `localPath`를 함께 사용합니다. 그 외 원본은 `link_only` URL로 연결합니다. `link_only` 문서를 로컬 배포 경로로 지정하면 검증이 실패합니다.

## 기존 ID와 이전 검증

제품은 기존 `id`를 유지합니다. 행사 ID도 변경하지 않습니다. 사진은 파일 해시 또는 기존 이미지 경로/원문 URL을 사용해 중복 개체를 합치지만 모든 기존 ID를 `legacyIds`와 `migration.records`에 보존합니다. 같은 oldId라도 원천 파일·레코드 유형·회차가 다르면 서로 다른 이전 매핑으로 기록합니다. 기존 사진 주석·확정본은 브라우저 저장소에 있으므로 새 컴파일러가 읽거나 덮어쓰지 않습니다.

기존 제원의 값·단위가 들어 있는 원문 문자열, 조건, 출처 URL을 `assertions`로 이전합니다. 기존 분석의 사실·해석·미확인 질문, 사진 관찰, 상위 비교/동향 보고의 원문과 위치도 남깁니다. 자료 이전 성공은 기존 주장의 재검증 완료를 뜻하지 않습니다.

검사는 실제 중복/공동관 사례, 출처 없는 관계, 없는 ID 참조, 2027 지도를 2025에 연결하는 오류, 좌표 범위/면적, 근거 없는 번호·현장참가·심층분석 완료, 부분 모집단 완료율, 동일 원문 재전재의 독립 검증 오집계를 대상으로 합니다. 출처 URL의 실제 현재 접속성은 행사별 조사 기록에서 별도로 확인합니다.

전체 모집단 완료 승격은 `populationProof`에 전체 공식 원장 대조 방법, 모집단 고유 조직 기대 수, 근거 sourceIds와 대조 설명이 있는 경우에만 가능합니다. 검증기는 미완료 페이지나 부분명단에 `populationComplete:true`만 붙이는 것을 거부합니다. 지도 문서를 찾았으나 원본 크기를 아직 확보하지 못했으면 `geometryReady:false`, `original:null`로 보존하고 도형 연결을 금지합니다. 전사 상태 `needs_review`와 원행 유형·참가예정 상태는 별도로 보존합니다.

public 투영에는 업체 관계, 문서 링크, 기존 분석의 제목·요약·업체 고유 판단·업무 연결(미작성은 null), 주장 유형과 출처 링크를 포함합니다. 기존 분석은 재대조가 완료된 결론으로 표시하지 않도록 짧은 해석 조건을 제공합니다. `completionStatus`, `evidenceReviewState`, 수집 진행률·큐·관련성 작업상태는 public에 넣지 않습니다. 실제 표시 위치와 문구는 3단계 UI 지시에 맞춰 조정합니다.

향후 업체 별칭을 추가할 때 기존 `org` ID를 명시적으로 유지하며, 두 기존 ID를 병합해야 하면 종전 ID에서 새 ID로 연결하는 이전 매핑과 근거를 남깁니다. public 주장에는 단일근거/출처관계 미검토를 구분하는 `evidenceStatus`를 유지합니다. 이는 조사 진행률이 아니라 독자가 해석에 필요한 조건입니다.

public 참가에는 `sourceLabelStatus`를 남겨 지도 전사 중인 업체명을 확정 명칭처럼 표시하지 않도록 합니다. `needs_review`이면 3단계 UI에서 원문 라벨 재확인 필요를 작게 표시합니다. public 부스의 `numberEvidence`는 번호 근거의 sourceIds·단일근거 상태·사전 발표 조건을 보존하며, 좌표 검증과 번호 출처를 합쳐 설명하지 않습니다.
