# SAHA 2026 현장자료 조사 — v1.1 1차

조사일: 2026-11-11. 행사: 2026-05-05~09, Istanbul Expo Center.

## 결과

- 장비 4종, 실제 현장사진 원문 9건을 선별했다. 8건은 공개 미리보기 이미지의 전시장·차량을 육안 확인했다.
- 웹앱에 재배포할 수 있는 공개 라이선스 사진은 이번 조사에서 확보하지 못했다. 따라서 9건 모두 `link-only`이며, 원문 링크만 제공한다. `imageUrl`은 출처 식별용이다.
- 직접 촬영한 기자 이름이 확인되는 사진은 Bob Morrison 2건, Murat Şengül 4건, Tristan Sauer 1건, Muhammed Enes Yıldırım 1건이다. Army Recognition 1건은 취재팀 크레딧이며 탑재부 확대 삽입이 포함된 기사 이미지다.
- 일반 관람객의 Commons/Flickr 재사용 허용 사진을 찾았으나 해당 2026 회차의 일치 자료는 확인하지 못했다. 조사 범위에서 미확보이며 웹상에 존재하지 않는다는 뜻은 아니다.

## 보고용 개발전략 요약

| 전시 장비 | 개발전략 해석 | 확인된 자료 |
|---|---|---|
| TULPAR · KORHAN | 기존 궤도 차체와 자국 포탑 통합으로 국내 수요 대응과 공통 플랫폼 제안 범위를 확장 | Otokar 행사 발표 + Anadolu 현장사진 캡션 |
| COBRA II · DASAL UAV | 기존 장갑차에 임무 모듈을 결합해 제품 가치를 확장 | Otokar 행사 발표 + Army Recognition 현장사진 |
| ALKA–KAPLAN HYBRID Autonomous | 하이브리드 동력과 선택적 유·무인 운용을 하나의 플랫폼에 통합 | FNSS 행사 발표 + Janes 기자사진 |
| PAMİR 4×4 | 비장갑 경량 인원·화물 수송차량으로 지원차량 제품군 확장 | BMC 행사 결과 + Anadolu·Joint Forces 현장사진 |

위 문장은 전시 구성에 근거한 해석이며 제조사의 내부 개발전략 확정 진술이 아니다. 정량 성능이나 운용 전술은 이번 보고에 포함하지 않았다.

## 사진별 확인

PAMİR 6건은 같은 공개 행사에서 촬영됐으나 서로 다른 이미지다. 전면 사선·정면·후면 사선이 포함되며, 두 장은 공개 행사 및 관계자 중심 구도다. Joint Forces 기사 중 `02-BMC-PAMIR-4X4.jpg`는 일반 제품사진이므로 제외했다. 검수용 이미지 8건은 파일 해시가 모두 다르며 사진 식별자·크기·해시는 JSON에 기록했다. TULPAR 1건은 촬영일·장소·제품이 적힌 Anadolu/Reuters 상세 캡션까지 확인했고 이미지를 직접 육안 검수하지 못해 `visualVerified:false`로 표시했다.

## 주요 원문

- 행사 공식 정보: https://www.sahaexpo.com/en/exhibition-information
- Otokar 출품 구성: https://defense.otokar.com.tr/news/otokar-demonstrates-its-global-strength-in-land-systems-at-saha-2026
- FNSS 구성 발표: https://www.fnss.com.tr/en/media/press-releases/alka-kaplan-hybrid-autonomous-optionally-manned-and-autonomous-capabilities-saha-2026
- BMC 행사 결과: https://www.bmc.com.tr/en/news-all/6920
- Bob Morrison 현장 촬영: https://www.joint-forces.com/defence-equipment-news/90888-bmc-pamir-4x4-unveiled-at-saha-2026
- Murat Şengül 현장 촬영: https://www.aa.com.tr/tr/bilim-teknoloji/bmcnin-yeni-araci-pamir-4x4-saha-2026da-vitrine-cikti/3927981
- Janes 현장 촬영: https://www.janes.com/defence-intelligence-insights/defence-news/land/fnss-and-roketsan-unveil-optionally-manned-alper-kaplan-laser-and-ew-vehicle
- Army Recognition 현장 촬영: https://www.armyrecognition.com/news/army-news/2026/otokars-cobra-ii-with-bee-eater-system-offers-nato-a-turkish-vehicle-mounted-aerial-reconnaissance-solution

## 제외·주의

1. https://www.sahaexpo.com/en/photo-gallery 는 사이트 머리말이 2026이지만 본문은 명시적으로 **SAHA EXPO 2024 Event Photos**다. 2026 사진으로 수록하지 않았다. 이용조건도 무단 타 플랫폼 복제를 허용하지 않는다: https://www.sahaexpo.com/en/terms-of-use
2. FNSS의 행사 사전보도에는 기존 촬영 제품사진도 포함된다. 출품 발표에 사진이 있다는 이유만으로 2026 현장사진으로 인정하지 않았다.
3. NurPhoto 갤러리 https://www.nurphoto.com/gallery/631207 는 18장의 현장 원문이 있으나 갤러리 머리말이 업로드일·Gaziantep를 쓰고 개별 캡션은 5월 8일 Istanbul을 쓴다. 개별 사진 기준 검증이 필요하다. 미사일·항공·해양이 혼재하며 여러 사진이 동일한 포괄 캡션을 사용하므로 장비명을 임의로 붙이지 않았다.
4. COBRA II 기사와 제조사 발표의 일부 수치가 다르므로 수치는 보고문에서 제외했다.

## 다음 수집 묶음

SAHA 2026 일반 관람객의 원본 게시물과 명시적 재사용 라이선스 사진을 추가 탐색하고, 저작권 허용이 확인되는 경우에만 원문 이미지와 해당 행사·촬영자·차량 형상을 연결한다. 행사 외 일반 제품사진으로 빈자리를 채우지 않는다.
