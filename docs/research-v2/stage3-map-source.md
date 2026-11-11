# ADEX 2025 지도 배경 · 3단계 확인

확인일: 2026-11-12 (Asia/Seoul). 담당 범위는 공식 원본 접근·현재 바이트/좌표 정합·홀 범위·표시 메타데이터입니다. UI와 브라우저 렌더 검증은 이 기록에 포함하지 않습니다.

## 확보 및 대조

- 공식 BtoB 홈페이지: https://adex.bciaerospace.com/
- 공식 PDF: https://adex.bciaerospace.com/images/pdf/SEOUL_ADEX_FLOOR_PLAN_EN.pdf
- 홈페이지 Floor Plan 영역에서 실제 사용 중인 공식 이미지: https://adex.bciaerospace.com/images/pdf/SEOUL_ADEX_FLOOR_PLAN_EN.png
- PDF HTTP 200, 5,490,107 bytes, SHA-256 `fd0bcbaa88705c683f28b8e2effe94fd749fa12fd654f11287b17025db688dde`. 2단계 원본과 바이트 동일.
- PNG HTTP 200, 328,639 bytes, 1653 × 1169 px RGBA, SHA-256 `0b283933dfcf86e971d9c1103ab3882388db100686d2f205f00a3fa60199cc30`.
- PDF는 1쪽, 1190.52001953125 × 841.9199829101562 pt, 회전 0. 문서 제목은 `25.10.11_SEOUL ADEX FLOOR PLAN_EN`; 내부 작성/수정 일시 2025-10-11 22:35:42 +09:00. HTTP Last-Modified는 PDF 2025-10-13 12:17:56 GMT, PNG 12:18:40 GMT로 문서 자체의 개정일과 구별한다.
- 현재 PDF의 각 drawing index를 다시 열어 32개 부스 영역의 `originalBoundsPt`와 최대 1e-5 pt 이내 일치를 검사했다. 원본 SHA가 같으므로 이전 확대 라벨 검토의 원본도 그대로다.
- 공식 PNG와 같은 크기로 렌더한 PDF를 각각 열어 제목, 홀 외곽, 업체 블록, 출입문, 페이지 여백의 정렬을 대조했다. 전체 페이지, 회전/크롭 없음. 색상은 PNG 출력과 PDF 렌더 색공간 때문에 차이가 있으나 배치와 좌표는 같은 원본이다.

## 실제 배경 표시 방식

`data/v2/map-display.json`의 해당 문서 `background.imageUrl` 또는 `background.url`을 원격 `<img>` 또는 SVG `<image>`로 직접 참조한다. 작은 329 KB 원본 한 장만 행사 선택 시 불러오고, 5.49 MB PDF는 원문 열람 시에만 연다. 이미지를 로컬로 복제/배포하지 않는다.

응답에서 `Access-Control-Allow-Origin`은 확인되지 않았다. 따라서 `crossorigin` 속성을 추가하거나 원격 PDF를 fetch하여 PDF.js로 렌더하는 방식을 기본값으로 쓰지 않는다. 이미지 요소의 직접 표시는 CORS 바이트 읽기를 요구하지 않지만, 실제 브라우저에서 별도 검증해야 한다. 캔버스 readback/export를 전제로 하지 않는다. 인쇄는 기존 이미지가 로드된 DOM을 사용하거나 출처 링크를 남긴다. 원본 이미지 오류 시 공식 배경이 로드됐다고 표시하지 않고, 검증된 위치의 단순 표현/업체 목록과 원문 새 창을 제공한다.

## 홀과 층/야외 구분

| 홀 | PDF 외곽 drawing | 확인된 범위 |
| --- | ---: | --- |
| 7 | 0 | 7·8홀을 함께 감싼 공동 직사각형 |
| 8 | 0 | 7·8홀을 함께 감싼 공동 직사각형. 별도 실내 분할선 없음 |
| 9 | 104 | 분홍색 채색 영역의 6변 외곽 |
| 10 | 103 | 파란색 채색 영역의 6변 외곽 |

`areas[].bounds`는 위 실제 채색 외곽의 정규화 bbox다. Hall 7/8에 존재하지 않는 중간 경계를 만들지 않는다. `focusPoint`는 각 공식 홀 제목 사각형의 가로 중심과 외곽의 세로 중심을 조합한 **카메라 이동 기준**이다. 이는 새 부스 좌표나 실측 홀 경계가 아니다. H8에 클릭 가능한 업체 도형이 없어도 원본의 H8 제목 쪽으로 시점을 옮길 수 있다. 필요하면 `boundaryScope`와 짧은 설명을 유지한다. 이 PDF에 확인되지 않은 층 또는 야외 영역은 선택 옵션/좌표로 만들지 않는다.

## 이용 조건 확인

홈페이지에서 연결한 법무 페이지는 https://advbe.com/index.php/en/legals-en 이며, 본문은 적용 사이트를 `http://www.advbe.com`으로 명시한다. 해당 페이지는 재현·복제 제한과 별도 창의 링크 방식을 기술하고, “the opening of our pages by frame, for example, is strictly forbidden.”라고 적는다. 이 기록은 advbe.com 조건이 ADEX 이미지에 적용되는 범위를 법적으로 판정하거나 별도 허가를 얻었다는 뜻이 아니다. 구현은 주최사 페이지 iframe을 사용하지 않고 공개된 공식 이미지 파일을 직접 참조하며 PDF는 별도 원문 창으로 연결한다. 원본 `link_only`와 재배포 허가 미확인 상태를 유지하고, 오픈 라이선스/재호스팅 권한으로 승격하지 않는다.

## 파일과 검증 범위

- 커밋 대상: `data/v2/map-display.json`, 이 조사 기록.
- 원본 PDF/PNG는 검증용 임시 경로에서만 확인하며 Git/배포 assets에 넣지 않았다.
- JSON 파싱, 문서 ID 기존 지도와 일치, 4개 hall ID, bbox/outline/focus 좌표 범위, 32개 현재 PDF 벡터 정합을 검사했다.
- 기존 `data/v2/maps/adex-2025.json`의 권리·좌표·번호·회차 상태는 수정하지 않았다.
- 아직 필요한 확인: 브라우저 실제 원격 이미지 로딩, 확대·이동·도형 겹침, H7/H8 시점 전환, 모바일 동작과 인쇄. 담당 UI 검증에서 확인한다.
