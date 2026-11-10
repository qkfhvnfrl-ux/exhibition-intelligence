# Seoul ADEX 2025 지상장비 조사 메모

조사 기준일: 2026-11-10. 공개자료만 사용했습니다. JSON은 장비 4종, 분석 항목 28개입니다. 전시 사실 확인과 해석·미확인 사항을 분리했습니다.

| ID | 전시 확인 수준 | 정량제원 처리 |
|---|---|---|
| `k2pl` | 현대로템 공식 발표의 실물 첫 공개 | K2 기본형 수치를 K2PL에 전용하지 않음 |
| `k808-peru` | 페루형 차륜장갑차 전시 명시 | K808 기본형 참고값에 형상 제한 표시 |
| `k9a3` | K9A3 전시·발전 방향 소개 확인 | 최종 양산형 수치로 확정하지 않음 |
| `themis-k` | 사전 발표와 10월 22일 현장 소개 대조 | THeMIS 기반 플랫폼 값만 참고로 구분 |

## 두 단계 확인

1. 전시 증거: 제조사의 해당 회차 발표를 읽고 정확한 제품·형상 및 전시 형태를 확인했습니다. 업체 참가만으로 전체 카탈로그를 전시품에 넣지 않았습니다.
2. 제원·형상 증거: 제조사 제품 정보와 이전 자료를 대조했습니다. 수치가 다르거나 한국형 적용이 확인되지 않은 경우 임의로 하나를 선택하지 않았습니다.

K2PL은 [2025 행사 발표](https://www.hyundai-rotem.co.kr/ko/company/press/details.do?seq=2521)와 [2023 행사 발표](https://www.hyundai-rotem.co.kr/ko/company/press/details.do?seq=2032)를 비교할 수 있습니다. 확인되는 변화는 K2EX 수출 콘셉트에서 폴란드 맞춤 K2PL 실물로의 전시 메시지 구체화입니다. 두 차량의 동일 차체 여부 또는 성능 증가량은 입증하지 않습니다.

페루형 장갑차가 K808 기반이라는 추가 근거는 [현대로템 KADEX 2024 발표](https://www.hyundai-rotem.co.kr/ko/company/press/details.do?seq=2358)입니다. 이는 별도 행사이며 ADEX 2023의 증거로 사용하지 않았습니다. [현행 K808 제품 페이지](https://www.hyundai-rotem.co.kr/en/business/defense/details.do?productCt03=defense0204)의 20t와 [2019 국방일보 표](https://kookbang.dema.mil.kr/newsWeb/20190513/1/ATCE_CTGR_0080010003/view.do)의 17.5t는 시점·형상 차이가 있을 수 있어 혼합하지 않았습니다. 제품 페이지 값도 페루형의 보증 제원이 아닙니다.

THeMIS는 [2024 제조사 카탈로그](https://d3tr2q1wj7u3d5.cloudfront.net/32284/20240611_MILREM-Product-Catalogue-EN_web.pdf)와 [현행 제품 페이지](https://milremrobotics.com/themis-family/)의 중량·치수가 다릅니다. 한국형 중량을 특정하지 않고, 양 자료에서 일치하는 속도·정격 적재량을 기본 플랫폼 참고값으로만 기록했습니다.

한화 유럽법인 글의 행사 기간 문구는 한국 공식자료와 다릅니다. 전시 품목 교차 확인에만 사용하고 행사 일정 근거에서 제외했습니다. 한화 본사와 그룹 일부 페이지는 검색 색인에서 본문이 조회되지만 직접 열기에서는 간헐적으로 시간이 초과됐습니다. 공개 전 재접속 검증이 필요합니다.

## 사진 원문 후보

아래는 공개 원문 위치입니다. 공개 접근과 재배포 허락은 별개이므로 원본 파일을 저장소에 복사하지 않았습니다. 사진별 저작권·촬영 각도·형상 확인 후 `data/photos.json`에 추가해야 합니다.

| 대상 | 원문 | 활용 가능 내용·주의 |
|---|---|---|
| K2PL·페루형 | [현대로템 ADEX 2025 보도자료](https://www.hyundai-rotem.co.kr/ko/company/press/details.do?seq=2521) | 공식 전시관 사진 4장. 개별 차량의 전면·측면·후면을 실제로 식별한 뒤 각도 태그 지정 |
| K2EX 비교 | [현대로템 ADEX 2023 보도자료](https://www.hyundai-rotem.co.kr/ko/company/press/details.do?seq=2032) | 직전 회차 참고 사진. K2PL 사진으로 표시 금지 |
| 페루형 형상 | [현대로템 KADEX 2024 보도자료](https://www.hyundai-rotem.co.kr/ko/company/press/details.do?seq=2358) | 페루형 모형 공개 배경. ADEX 사진으로 표시 금지 |
| THeMIS-K | [한화 ADEX 2025 현장 소개 2부](https://www.hanwha.co.kr/newsroom/media_center/news/article.do?seq=15194) | MUM-T 구역과 UGV 사진. 촬영 각도별 실제 형상 확인 필요 |
| K9A3·THeMIS-K | [한화 유럽법인 ADEX 자료](https://hanwha-aerospace.eu/adex-2025-2/) | 한화 제공 사진. 발전 로드맵/모형/실물 여부를 구분 |
| THeMIS 기반 | [Milrem THeMIS 제품 페이지](https://milremrobotics.com/themis-family/) | 다각도 뷰와 탑재체 종류. 한국형과 다른 형상은 참고 이미지로만 사용 |
| ADEX 전체 현장 | [한화 공식 영상](https://www.youtube.com/watch?v=r2zo8APhRfU) | 링크로 열람. 영상 프레임 복제·추출은 허가 확인 전 보류 |

우선 확보할 각도는 전방 사선, 좌·우측, 후방, 상부, 실내·정비 접근부입니다. 확보하지 못한 각도는 미확보로 표시하고 동일 사진의 크롭을 별도 촬영 각도로 집계하지 않습니다.

## 후속 보강 항목

- K2PL·페루형·THeMIS-K의 전시 명패와 동일 형상 제원표를 우선 확보합니다.
- K9A3의 완성형 수치보다 전시 형태와 개발 단계의 공식 확인을 우선합니다.
- 2023 회차 비교는 동일 형상과 동일 지표의 근거를 확보한 경우에만 성능 추세로 승격합니다.

## 대략적 규모 보강

K2PL에는 [현대로템 K2 기본형 제품 정보](https://www.hyundai-rotem.co.kr/ko/business/defense/details.do?productNm=K2+%EC%A0%84%EC%B0%A8)의 중량 56t, 출력 1,500hp, 포장도로 최고속도 70km/h를 **기본형 참고 / K2PL 전시형 값 아님**으로 추가했습니다. 제조사 현행 페이지를 직접 다시 열어 표기를 확인했습니다. 익숙한 55t를 관성적으로 넣지 않았습니다.

K9A3에는 [공식 K9 제품 소개](https://hanwha-aerospace.eu/portfolio/k9-sph/)의 기본형 출력 1,000hp를 참고로 추가했습니다. ADEX 발표의 80km 초과 사거리는 **제조사 개발 방향·목표 / 운용 검증값 아님**으로 표기했습니다. 과거 한화 브로슈어 URL은 검색 색인에서는 제원이 보이지만 직접 열기에서 오류가 있어 신규 제원의 출처로 사용하지 않았습니다.
