# ADEX 2025 현장자료 수집 · 2026-11-11

## 결과와 사용 범위

- 자료 파일: `data/research-v1.1/adex.json`.
- 장비 8종의 간결한 개발전략 해석. 각 해석은 전시 구성에 대한 분석이며 제조사의 공식 전략 선언으로 단정하지 않는다.
- 바로 게재 가능한 장비 사진 6장: 기존 ADEX 현장사진 3장 + 신규 기아 현장사진 3장.
- 신규 부스 전경 1장: 개별 장비 사진 수와 분리.
- 기사·사진가의 개별 현장사진 참조 6건과 원문 갤러리/취재/영상 출처 7곳. 중복 원문·사진 참조는 실제 사진 장수로 합산하지 않는다.
- 이번 수집에서 재사용 허용이 확인된 일반 관람객의 지상장비 사진은 0장이다. 사진가/취재 사진은 원문으로 연결한다.
- 다른 전시회, 군 행사, 훈련, 제품 일반 홍보사진은 제외했다.

## 신규 이미지 검증

| 파일 | 공식 다운로드 식별자 | 실제 내용 |
|---|---|---|
| `assets/photos/adex2025-new-tasman-front.jpg` | FIL00000000000290007 | 타스만 지휘차·베어샤시 전면 |
| `assets/photos/adex2025-new-kmtv-front.jpg` | FIL00000000000290008 | KMTV 전면, 뒤편 소형차량·K2PL |
| `assets/photos/adex2025-new-kia-family.jpg` | FIL00000000000290009 | 기아 타스만과 차량군 부스 사선 |
| `assets/photos/adex2025-new-rotem-booth.jpg` | FIL00000000000290038 | 현대로템 통합관 외곽·관람객 |

첫 3장은 [기아 ADEX 2025 보도자료](https://www.hyundaimotorgroup.com/ko/news/CONT0000000000190141), 마지막은 [현대로템 ADEX 2025 보도자료](https://www.hyundaimotorgroup.com/ko/news/CONT0000000000190160)에서 제공하는 원본이다. 해당 뉴스룸의 기사·이미지 자유 이용 안내와 제3자 제공자료 예외 문구를 확인했으며, 다운로드된 제조사 사진에는 별도 제한 표시가 없었다. 긴 변 1800px 이하 JPEG 압축만 수행했다. 각각 이미지 디코딩, 실제 해상도, SHA-256, 연락시트 육안 검토를 완료했다. 좌우 반전·크롭·AI 보완·합성 없음.

기존 `k2pl-event-01`, `light-105-event-01`, `rcws-event-01`은 원본 메타데이터를 재사용했다. 실제 ADEX 2025 사진만 편입했고 이전 K2·WDS·Eurosatory 사진은 이 행사 자료에서 제외했다.

## 사진가·취재 자료

- [MAphotoSG / Hanson Seah](https://www.maphotosg.com/seoul-adex-2025/): KINTEX 실내·야외 갤러리가 명확히 구분되고 장비별 캡션이 있다. K2 계열, 일반 K808, THeMIS-K, K-NIFV, K9A1, K10, K21, K600, 타스만 등. 재사용 허락 미확인으로 원문 연결. 일반 K808을 K808-PE로 표시하지 않는다.
- [CEO스코어데일리 / 박주선](https://www.ceoscoredaily.com/page/view/2025102017192308138): 2025-10-20 현장 취재. K2PL과 K9 전시 로드맵. 무단전재·재배포 금지 명시.
- [아시아타임즈 / 조광현](https://www.asiatime.co.kr/article/20251023500386): 2025-10-23 현장 취재. 타스만 군용 지휘차·무인체계. 무단전재·재배포 금지 명시.
- [헤럴드경제 / 김성우](https://v.daum.net/v/20251025092544935): 2025-10-24 현장사진. 105mm 자주포 제조사를 현대로템이라고 쓴 캡션은 공식 현대위아 자료와 대조해 수정하여 안내한다.
- [블로터 / 김덕호](https://v.daum.net/v/ZbfuJ4ZvXr): THeMIS-K 전시사진. 원문 링크.
- [乗りものニュース / 布留川 司](https://trafficnews.jp/photo/600488): 검색 캡션에 ADEX2025 K2PL 현장 촬영 명시. 원문 403으로 직접 그림·이용조건 확인 미완료이며 candidate로 남김.
- [현대로템 현장 스케치](https://blog.hyundai-rotem.co.kr/1130): 영상 링크. 정지사진 수에 포함하지 않음.

공공누리 출처가 있더라도 사진 이용권을 일괄 추정하지 않았다. [정책브리핑 ADEX 개막식](https://www.korea.kr/multi/policyPhotoView.do?bbsKey=67570&pWise=sub&pWiseSub=J2)은 텍스트만 공공누리 대상이며 사진은 별도 허락 대상이라고 명시해 복제하지 않았다.

## 다음 수집 묶음

1. K2PL·K808-PE·THeMIS-K의 관람객 원본 다각도 사진과 명시적 이용조건 확보.
2. MAphotoSG의 개별 이미지 식별자·촬영자 권한을 확인하여 현재 갤러리 연결을 사진 단위로 정리.
3. 일반 K808과 페루형, 실제 차량과 모형을 사진 내 명패 및 현장자료로 구분하여 추가.

## 기술정보 근거

제조사 행사 발표를 우선 사용했다: 현대자동차그룹의 현대로템·현대위아·기아 발표, [한화에어로스페이스 ADEX2025 발표](https://www.hanwhaaerospace.com/eng/media/newsroom/view.do?seq=575), [한화 현장 MUM-T 소개](https://www.hanwha.co.kr/newsroom/media_center/news/article.do?seq=15194). 사진가·취재기사는 행사 식별과 사진 출처 확인용으로 사용했다. 공개 제원의 우열, 성능 완성도, 전력화 상태를 사진만으로 판단하지 않았다.
