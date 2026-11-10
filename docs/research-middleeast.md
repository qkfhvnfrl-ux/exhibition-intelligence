# 중동·튀르키예 지상장비 조사 메모

검토일: 2026-11-10. 데이터: `data/research/middleeast.json`.

5개 장비, 총 35개 분석 항목을 작성했습니다. IDEX 2025에는 3개, SAHA 2026에는 4개 장비를 연결했습니다. 동일 장비가 여러 행사에 연결되므로 전시 연결 수와 장비 수는 다릅니다. 본 조사 표본을 전시회 전체 비율 또는 시장점유율로 해석하지 않습니다.

## 전시 확인 기준

| 장비 ID | IDEX 2025 | SAHA 2026 | 확인 근거 |
|---|---|---|---|
| arma-ii | 30mm MIZRAK | 연결 안 함 | Otokar 2025-02-17 행사일 발표 본문에 전시 명시 |
| tulpar | HITFACT MkII 120mm | ASELSAN KORHAN | Otokar 각 행사일 발표에 전시형 명시 |
| cobra-ii | KESKİN 12.7mm RCWS | DASAL UAV 스테이션 | Otokar 각 행사일 발표에 전시형 명시 |
| pars-alpha | 이번 범위에서 연결 안 함 | TEBER-II 30/40 | FNSS 행사 사전 발표 + Q2 2026 행사 후 뉴스레터 |
| kaplan-hybrid | 연결 안 함 | ALKA 통합·선택적 유인/자율 | FNSS 행사 사전 발표 + Q2 2026 행사 후 뉴스레터 |

confirmed는 제조사가 해당 모델·형상을 그 행사에 전시했다고 명시한 공개자료가 있다는 뜻입니다. 독립 현장 계측, 실차 주행 확인 또는 모든 기능의 실증 완료라는 뜻이 아닙니다. Otokar의 행사일 본문은 `exhibits`, `displays`, `is being showcased`를 사용합니다. FNSS는 사후 뉴스레터의 `were on display`, `was at SAHA 2026`로 사전 계획을 한 번 더 확인했습니다.

주요 전시 근거:

- [Otokar IDEX 2025 행사일 발표](https://defense.otokar.com.tr/news/otokar-is-mission-ready-for-new-cooperation-opportunities)
- [Otokar SAHA 2026 행사일 발표](https://defense.otokar.com.tr/news/otokar-demonstrates-its-global-strength-in-land-systems-at-saha-2026)
- [FNSS SAHA 2026 사전 발표](https://www.fnss.com.tr/en/media/news/fnss-showcase-pars-alpha-8x8-zaha-pars-scout-6x6-command-post-vehicle-and-roketsan-alka-dews-fnss-kaplan-hybrid-autonomous-saha-2026-1986)
- [FNSS Focus Q2 2026 사후 뉴스레터](https://www.fnss.com.tr/en/newsletter/fnss-focus-q2-2026-newsletter)

## 이전 회차 비교

- COBRA II: SAHA 2024 KESKİN RCWS와 SAHA 2026 DASAL UAV 스테이션의 전시 구성을 확인했습니다. 차체의 임무 확장 사례이며 UAV 전시 비중 증가를 입증하는 통계는 아닙니다.
- PARS ALPHA: SAHA 2024와 2026 모두 TEBER-II 30/40 계열 탑재형이 명시되어 있습니다. 외형 변화보다 전시 구성의 연속성을 보여주는 자료입니다.
- ARMA II, TULPAR, ALKA-KAPLAN: 동일 전시회의 직전 회차에서 동형 실물을 비교할 근거가 부족하여 `insufficient`를 유지했습니다.
- IDEX 2025 TULPAR와 SAHA 2026 TULPAR는 다른 행사·임무형 비교입니다. 연도별 일방적 성능 향상으로 집계하지 않습니다.

## 제원 재확인에서 반영한 구분

1. ARMA II 40 t는 최대 총중량이며 적재량이 아닙니다. SAHA 2026 목록의 일반 ARMA 8×8을 ARMA II로 바꾸어 적지 않았습니다.
2. TULPAR 28–45 t 및 700–1,100 hp는 제품군 범위입니다. 특정 전시차의 확정 중량·엔진으로 표시하지 않았습니다.
3. COBRA II 14.5 t, 360 hp, 최대 11명은 2025 제조사 브로슈어 수치입니다. COBRA II MRAP와 구분합니다.
4. PARS ALPHA의 12명은 원격포탑 IFV 구성 기준입니다. STANAG 4569 등급은 공식 브로슈어에서 비공개이므로 등급을 만들어 넣지 않았습니다.
5. KAPLAN HYBRID 17.5 t, 치수, 배터리는 기본 차대 사양입니다. ALKA 통합형의 확정 제원으로 간주하지 않았습니다. 기본형 영문 제원표의 속도 단위 오기 의심 항목은 사용하지 않았습니다.

각 항목은 사실·해석·미확인을 나누었습니다. 제원과 전시형을 1차 문서에서 검토하고, 별도 제품 문서·다른 공식 발표 또는 사후 뉴스레터로 다시 확인했습니다. FNSS 일부 원문 열람은 시간 초과가 발생하여 공식 검색 색인에서 확인한 내용이 포함되어 있습니다. 따라서 전체 `researchStatus`는 후속 사진·형상 확인을 남긴 `partial`입니다.

## 사진 수집 출발점

아래는 사진을 찾아 검토할 원문 페이지입니다. 라이선스가 확인되지 않은 제조사 이미지는 저장소에 복사하지 않았습니다. 같은 모델의 다른 행사 사진은 참고 사진으로만 표기하고 행사 사진으로 재명명하지 않습니다.

| 장비 | 원문 | 우선 확보할 각도·형상 |
|---|---|---|
| ARMA II | [IDEX 제조사 발표](https://defense.otokar.com.tr/news/otokar-is-mission-ready-for-new-cooperation-opportunities) | 30mm MIZRAK 장착 전방 사선·측면·후방, 일반 ARMA와 식별 |
| TULPAR | [제품 갤러리](https://defense.otokar.com.tr/tracked-armored/tulpar-armored) | 차체 측면·후방·내부. HITFACT/KORHAN 분리 |
| COBRA II | [공식 2025 브로슈어](https://defense.otokar.com.tr/OtokarSavunma/media/Otokar-Savunma/brochure/cobra-ii-en-az77eg-25.pdf) | 기본차 전방·측면, UAV 스테이션은 행사 발표 페이지에서 별도 수집 |
| PARS ALPHA | [공식 제품 페이지](https://www.fnss.com.tr/en/products/pars-alpha-8x8-new-generation-afv) | 전방 동력실, 측면·후방, 차장/조종수 배치, TEBER-II 형상 |
| ALKA-KAPLAN | [공식 SAHA 2026 소개](https://www.fnss.com.tr/en/media/press-releases/alka-kaplan-hybrid-autonomous-optionally-manned-and-autonomous-capabilities-saha-2026) | 전방·측면·후방, 센서·상부 임무장비. 기본 KAPLAN 사진과 구분 |

## 후속 수집 항목

- 행사·형상·촬영각도가 확인되는 공개 라이선스 사진 또는 사용 허가.
- 실제 전시형의 중량·내부 배치·정비 접근성 자료.
- 동일 전시회 직전 회차의 공식 부스 사진과 확정 장비 목록.

## 데이터 검사

JSON 구문, 필수 필드, 장비당 7개 분석 항목, 3–6개 제원, 제원/분석 출처 URL의 source 목록 포함 여부를 검사했습니다. 5개 장비 모두 통과했습니다. 소스와 미확인 항목은 내용 업데이트 시 함께 변경해야 합니다.
