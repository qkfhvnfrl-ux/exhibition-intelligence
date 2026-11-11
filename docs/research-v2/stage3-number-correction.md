# ADEX 2025 PEI-GENESIS 부스번호 정정

확보·재검토: 2026-11-12 07:49:59 +09:00. 단계 2의 기록은 당시 확인 상태로 보존하고, 현재 데이터에는 아래 조건을 적용했습니다.

| 원문 | 확인한 내용 | 날짜·독립성 조건 |
| --- | --- | --- |
| [PEI-Genesis 사전 발표](https://www.prnewswire.com/apac/news-releases/pei-genesis-to-exhibit-at-seoul-adex-2025-in-korea-302572565.html) | Seoul ADEX 2025, Hall 7, Booth 18-20, 참가 예정 | 2025-10-02 발행. PEI가 제공한 발표 |
| [PEI-Genesis 공식 현장 게시물](https://www.linkedin.com/posts/pei-genesis_connectors-backshells-cables-activity-7386215858634833920-QgTU) | LIVE Seoul ADEX 2025, Booth 7-C11; 커넥터·백셸·케이블 등 소개 | 정확 게시일은 확인하지 못해 `null`. 상대 날짜·Edited 표시는 정확 발행일로 변환하지 않음 |
| [공식 사전 배치도](https://adex.bciaerospace.com/images/pdf/SEOUL_ADEX_FLOOR_PLAN_EN.pdf) | PEI-GENESIS 명칭과 해당 사각형 위치 | 원본 SHA-256 및 확대 검토로 확인된 사전 위치. 현장 실측 위치·변경 번호와의 일치 미확인 |

사전 발표와 현장 게시물 본문을 각각 다시 열어 대조했습니다. 별도의 현장 사진 검토에서도 번호는 판독되지 않았습니다. 두 번호 출처의 발행 주체가 같으므로 독립 검증 2건으로 집계하지 않습니다.

## 데이터 반영

- `data/v2/corrections/adex-2025-pei-number.json`에 두 번호·서로 다른 주장 상태·원문 URL·발행일 조건을 보존했습니다.
- 최신 수집 원장의 `boothCodes`는 빈 배열, `boothNumberStatus`는 `conflicting_sources`입니다. 과거 발표 내용은 원문별 근거로 남깁니다.
- 최신 지도·정규화 데이터의 현재 번호는 `code: null`, `numberStatus: unverified`입니다. `7-C11`을 사전 지도 사각형에 붙이지 않았습니다.
- 기존 부스 ID `booth-c27e5705a13bd788443d`, 영역 ID `adex-2025-region-pei-genesis`, 도형 ID의 생성 기준 및 좌표를 보존했습니다. 전체 32개 지도 도형도 동일합니다.
- 공개 데이터는 작은 번호 조건 문구와 양쪽 근거를 제공합니다. 일반 화면의 확인된 부스번호로 어느 쪽도 노출하지 않습니다. ADEX의 확인 번호 연결 수는 0, 좌표 연결 범위는 그대로입니다.
- 수집 스크립트 두 개가 같은 보정 파일을 적용하므로 재수집으로 과거 번호가 되살아나지 않습니다. 미해결 번호를 확인 완료로 바꾸거나 한쪽 근거를 제거하면 유효성 검사가 실패합니다.

## 실행 검증

- `node --test tests/v2-data.test.mjs tests/v2-number-correction.test.mjs`: 기존 22개 및 신규 4개, 총 26개 통과.
- `PYTHONDONTWRITEBYTECODE=1 python scripts/collect-adex-2025.py --check`: 저장 원장과 일치, 362개 행.
- 원본 PDF를 사용해 지도 수집 결과와 저장 JSON을 비교: 일치. 단계 2 기준 Git 데이터의 32개 영역 ID·좌표와도 동일.
- 보정 함수를 같은 데이터에 반복 적용해도 결과가 변하지 않음.

## 다음 확인

4단계 ADEX 조사에서 공식 현장 수정 배치도, 주최사 부스번호 명단 또는 번호가 읽히는 PEI 현장 사진을 확보해 사전 지도 위치와 대조합니다. 그 전에는 두 발표 번호의 관계나 변경 시점을 단정하지 않습니다. 전체 참가업체 조사 완료로 집계하지 않습니다.
