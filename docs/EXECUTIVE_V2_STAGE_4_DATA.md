# 4~8단계 공통 조사 묶음 데이터

공통 조사 절차는 [EXHIBITION_RESEARCH_PROTOCOL.md](EXHIBITION_RESEARCH_PROTOCOL.md)를 따릅니다. 이 문서는 3단계 화면을 그대로 사용하면서 검토된 조사 묶음을 정식 원장과 연결하는 입력 계약입니다.

## 원천과 재생성

- 공식 명단 원천: `data/v2/collection/{eventId}.json`.
- 실제 조사 묶음: `data/v2/research/{eventId}/*.json`.
- 기존 3단계 사례: `data/v2/editorial/{eventId}.json`.
- 컴파일: `npm run compile:v2` → `npm run compile:v2:app`; `npm run build`도 두 단계를 실행합니다.
- `registry.json`, `public.json`, `data/v2/app/`, `dist/`는 생성물입니다. 원천을 수정하고 재생성합니다.

조사 디렉터리의 JSON 중 `cases` 배열이 없는 모집단 조사 메모는 컴파일 대상이 아닙니다. 모집단 확보 여부는 공식 수집 원장의 검증 조건으로만 변경합니다. 조사 사례가 늘어났다는 이유로 모집단 완료나 전체 조사율을 계산하지 않습니다.

## 묶음과 사례

```json
{
  "schemaVersion": 1,
  "eventId": "adex-2025",
  "batchId": "adex-2025-batch-01",
  "checkedAt": "2026-11-12",
  "cases": [{
    "id": "case-adex-2025-example",
    "organizationId": "기존 원장의 안정 ID",
    "review": {
      "relevance": "confirmed",
      "reason": "실제 검토한 차량체계 업무 연결성 및 한계",
      "categories": ["electrical"],
      "status": "insufficient_data",
      "reviewedAt": "2026-11-12",
      "sourceIds": ["해당 사례의 출처 ID"]
    },
    "countries": ["대한민국"],
    "countrySourceIds": ["국가 확인 출처 ID"],
    "boothClaims": [],
    "sources": [],
    "photos": []
  }]
}
```

위는 구조 설명용이며 제품·기업 근거를 생략한 예시입니다. 실제 입력은 출처가 없으면 실패합니다. `categoryIds`와 `review.categories`는 기존 `taxonomy.json`의 분류 ID를 사용합니다. 회사명에서 업종이나 국가를 추측하지 않습니다.

상세 화면을 제공하는 사례에는 3단계와 같은 `reason`, `highlights` 3개, `exhibit`, `distinction`, `direction`, `workConnection`, `followUps` 2~3개를 넣습니다. `exhibit.items`에 확인한 제품을 각각 등록합니다. 분류만 끝낸 행은 상세 구조를 생략할 수 있지만 `analysis_complete`로 표시할 수 없습니다.

기존 사례는 `{ "extendsEditorialId": "기존 사례 ID", "review": {...} }`로 상속할 수 있습니다. ID와 조직은 바꾸지 않습니다. 명시한 필드가 기존 필드를 대체하는 얕은 병합이므로 `exhibit`를 바꾸면 `summary`, `sourceIds`, `items` 전체를 제공합니다. 기존 파일은 수정하지 않아도 됩니다. 화면은 동일 사례 ID를 한 번만 표시합니다. 같은 기업을 다른 사례 ID로 중복 등록하면 검사가 실패합니다.

기존 완료기업에 새 근거가 생기면 기존 조사 사례의 원천 파일을 수정하고 변경 이유·출처를 기록합니다. 같은 기업의 중복 조사 행을 여러 묶음에 넣으면 컴파일이 거부됩니다. Git 이력이 기존 판단을 보존합니다.

## 실제 출품과 배경자료

각 제품 항목은 `productId`, `name`, `status`, `form`, `sourceIds`를 갖습니다. 같은 부스에서 식별된 부품도 각 제품으로 등록합니다. 이름을 식별하지 못한 샘플을 임의의 모델명으로 만들지 않습니다.

| `status` | 원장 처리 | 의미 |
| --- | --- | --- |
| `event_photo_confirmed` | `onsite_confirmed` | 해당 행사 사진으로 제품 확인 |
| `onsite_report_confirmed` | `onsite_confirmed` | 해당 행사 현장 취재로 확인 |
| `event_report_confirmed` | `onsite_confirmed` | 기존 사례의 현장 취재 상태 이름 |
| `exhibitor_event_photo_confirmed` | `onsite_confirmed` | 제조사 현장사진으로 확인; 독립 검증 아님 |
| `exhibitor_event_statement` | `planned` | 제조사의 회차별 전시 구성 발표; 실물 확인으로 승격하지 않음 |
| `background_reference` | 제품만 등록; 행사 출품 생성 안 함 | 회사 일반 카탈로그·일반 제품자료 |

사진·취재로 현장 출품을 확인한 상태는 제품 성능의 독립 검증을 뜻하지 않습니다. 공동관에 제품이 있다는 사실로 회사 직원의 현장 참가를 자동 확인하지도 않습니다. 회사 현장 참가는 별도 `review.attendanceStatus`, `attendanceSourceIds`, `attendanceNote`로 근거를 입력한 경우에만 변경합니다. 명시적 다른 회차 출처는 출품 근거로 받아들이지 않습니다. 출처의 `originGroup`과 `independence`를 보존하며, 출처 URL 개수로 독립 검증을 자동 선언하지 않습니다.

`review.status: analysis_complete`는 분석 구조가 채워지고 해당 업체의 현장 출품 제품이 최소 한 개 있으며 검토된 출처 연결이 있어야 통과합니다. 이 상태는 공개자료에 근거한 업체 분석 묶음 완료이며 모든 제품 발견이나 모집단 전수조사 완료가 아닙니다. 사전 발표만 있거나 제품 식별이 부족하면 `insufficient_data`로 남깁니다.

## 사진·부스

사진은 `id`, `sourceUrl`, `credit`, `context`, `sourceDate`, `sourceIds`를 기록합니다. `context: event`이면 정확한 `eventId`가 필요합니다. 제품이 특정되면 `productId` 또는 `productIds`로 연결하고, 부스 전경은 제품을 추측하지 않고 업체에 직접 연결합니다. 공동관 사진의 제품 ID는 같은 행사에서 등록된 제품이어야 하며 각 회사의 연결 행에는 해당 회사 소유 제품만 연결됩니다. 여러 업체에 연결된 같은 사진은 `originalImageUrl`(또는 `assetUrl`, `imageUrl`)로 중복을 합치고, 같은 기사 안의 서로 다른 이미지 각도는 보존합니다. `eventPhotoIds`에는 중복 제거한 모든 해당 회차 현장사진 ID가 포함됩니다. 배경자료는 `context: reference`를 사용합니다. `rightsStatus: link-only`는 이미지 주소가 있더라도 원문 링크만 출력합니다. 제조사·매체·촬영자 공개 사진에 새 라이선스를 부여하지 않습니다.

부스는 `boothClaims: [{code,hall,status,sourceIds,note}]`로 번호 근거를 등록합니다. `status`는 `confirmed` 또는 `unverified`입니다. 홀만 확인한 경우 `code:null/status:unverified`로 홀 근거만 기록하며 부스를 생성하지 않습니다. 번호만 확인한 업체는 목록과 상세에 연결되며 지도 좌표를 만들지 않습니다. 좌표는 기존 `data/v2/maps`의 별도 검증된 도형만 사용합니다. PEI와 같은 미해결 번호 충돌을 조사 덧붙임으로 덮어쓸 수 없습니다.

## 집계

| 원장 지표 | 정의 |
| --- | --- |
| `registeredOrganizations` | 해당 회차에 등록된 고유 명칭 ID; 법적 회사 전수 확인 수가 아님 |
| `relevantOrganizations` | `relevance.status: confirmed` |
| `underReviewOrganizations` | `relevance.status: pending`; 미착수도 포함하는 관련성 상태 |
| `excludedOrganizations` | 근거·사유를 남긴 `excluded` |
| `deepAnalysisComplete` | 검증 조건을 통과한 명시적 `analysis_complete` |
| `insufficientData` | 조사했으나 명시적으로 `insufficient_data`인 업체 |
| `notStarted` | 조사 상태가 없거나 `not_started`인 업체 |
| `withoutVerifiedExhibitEvidence` | 현장 출품 근거가 아직 없는 모든 업체; 기존 광범위 자료부족 정의 보존용 |
| `mapLinkedOrganizations` | 검증된 지도 도형에 연결된 고유 업체 |
| `numberLinkedOrganizations` | 번호별 근거가 확인된 고유 업체; 지도 연결 수와 다름 |

`insufficientData`의 정의가 이전 단계의 “현장 출품 근거 없는 모든 업체”에서 바뀌었습니다. 과거 스냅샷과 단순 증감 비교하지 않습니다. 미착수와 실제 조사 후 자료부족을 구분하려는 변경입니다. 원장 집계·큐·완료 상태는 일반 화면에 배포하지 않습니다.

검사: `tests/v2-research.test.mjs`는 제품별 등록, 배경자료 분리, 자료부족/미착수 분리, 가짜 완료 거부, 다른 회차·출처 누락·좌표 삽입 거부, 사진 권리, 화면 연결, 사례 상속과 중복 방지를 확인합니다.
