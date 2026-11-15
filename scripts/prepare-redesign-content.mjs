/** Reproducible editorial projection of the reviewed primary-source research packets. */
import {readFile,writeFile} from 'node:fs/promises';
const read=async file=>JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8'));
const write=async(file,value)=>writeFile(new URL('../'+file,import.meta.url),JSON.stringify(value,null,2)+'\n');
const unique=items=>[...new Set(items.filter(Boolean))];
const ids=['overview','features','exhibit','development','interpretation'];
const labels=['장비·형상·용도','주요 특징','이번 전시 구성','개발 방향','전략적 해석'];
const [rotem,wia,kia]=await Promise.all(['rotem','wia','kia'].map(name=>read('docs/research-v2/redesign-content-'+name+'.json')));
function sources(packet){return packet.sources.map(s=>({id:s.id||s.sourceId,url:s.exactURL,title:s.title,publisher:s.publisher||s.issuerGroup,publishedAt:s.date||null,limitations:Array.isArray(s.limitations)?s.limitations.join(' '):s.condition||s.comparisonLimits||s.limitations||null,independence:s.independent?'independent_observation_only':/reprint|republication/.test(s.sourceType||'')?'same_origin_republication':'primary_single_origin'}));}
function record(packet,organizationId,productId,sections,{photoIds=[],form=null,limitations=[]}={}){
 const all=sources(packet),used=unique(sections.flatMap(s=>s.sourceIds));
 const eventEvidenceSourceIds=used.filter(id=>/adex.?2025|adex-2025/.test(id));
 return {eventId:'adex-2025',organizationId,productId,asOf:'2026-11-15',sections,eventEvidenceSourceIds,generalSourceIds:used.filter(id=>!eventEvidenceSourceIds.includes(id)),photoIds,form,limitations,sources:all.filter(s=>used.includes(s.id))};
}
const narratives=[];
const rotemClaims=new Map(rotem.claims.map(c=>[c.id,c]));
for(const equipment of rotem.equipment){
 const fields=Object.values(equipment.fiveFields);
 const sections=fields.map((field,i)=>{const cs=field.claimIDs.map(id=>rotemClaims.get(id));return {id:ids[i],label:labels[i],text:cs.map(c=>c.text).join(' ')||field.note||'공개 근거 미확보',sourceIds:unique(cs.flatMap(c=>c.sourceIDs)),claimType:i===4?'editorial_inference':field.status==='gap'?'evidence_gap':cs.some(c=>c.scope==='later-update-2026')?'later_update':cs.some(c=>c.scope==='general-product'||c.scope==='current-product-background')?'general_product':'source_documented'};});
 const conditions=unique(fields.flatMap(f=>f.claimIDs.map(id=>rotemClaims.get(id)?.condition)));
 narratives.push(record(rotem,'org-bb5b014b7abb0359c75b',equipment.equipmentId,sections,{photoIds:equipment.equipmentId==='k2pl'?['photo-f27315794918d9b8ddce']:[],form:equipment.equipmentId==='k2pl'?'현장 전시품 확인 · 제조사 ‘실물’/현장기사 ‘실물 모형’ 표현 충돌':null,limitations:conditions}));
}
const wiaMap={'wia-rcws-762':'rcws','wia-rcws-ai-127-40':'adex25-wia-rcws-ai','wia-light-105':'light-105','wia-ads-vehicle':'adex25-wia-ads','wia-ads-all-in-one':'adex25-wia-ads-all-in-one'};
const wiaPhotos={'rcws-event-01':'photo-406026b01ffa0009623a','light-105-event-01':'photo-f07b18031de173091dff'};
for(const equipment of wia.equipment)narratives.push(record(wia,'org-b6b486fa375701e51329',wiaMap[equipment.equipmentId],equipment.sections.map((s,i)=>({...s,label:labels[i]})),{photoIds:equipment.photoIds.map(id=>wiaPhotos[id]),form:equipment.equipmentId==='wia-ads-all-in-one'?'제조사 출품 발표 · 개별 현장사진/실물·모형 구분 미확인':null,limitations:equipment.comparisonLimits}));
const kiaClaims=new Map(kia.claims.map(c=>[c.claimId,c]));
const kiaText={
 'tasman-military':[
  '타스만 픽업에 군용 무전기와 안테나를 더한 지휘 임무용 차량이다.',
  '민수 픽업 기반의 군용 형상이다. 일반 타스만 제원을 전시 지휘차의 확정 사양으로 적용하지 않는다.',
  '제조사는 군용 지휘차 실물 첫 공개로 소개했다. 현장 기자 사진 캡션도 출품을 확인하며, 부스에서는 베어샤시와 함께 전시했다.',
  '2025년 10월 발표는 같은 해 9월 표준 지휘용 픽업 선정과 연내 전력화 계획을 설명했다. 실제 이행 완료는 별도 미확인이다.',
  '완성차와 노출 샤시를 함께 보여 준 구성은 픽업 플랫폼을 여러 군용 임무차로 확장하려는 방향으로 읽힌다. 전시 구성에 따른 해석이다.'
 ],
 'kmtv':[
  'KMTV는 병력·물자 수송을 위한 중형표준차 계열이다. 전시 사진에는 KMTV 표지가 있는 차량 전면이 보인다.',
  '2025년 6월 발표 기준 2.5톤형은 280PS, 5톤형은 330PS이며 8단 자동변속기를 적용한다. 전시차의 세부형이 확인되기 전 한 값을 붙일 수 없다.',
  'ADEX에서는 완성차와 중형 베어샤시를 함께 소개했다. 제조사 연혁상 실물 최초 공개는 KADEX 2024로, 이번 전시가 최초는 아니다.',
  '제조사는 2025년 6월 10일 양산식을 열고 같은 달 첫 군 인도를 예고했다. 양산 발표와 실제 인도 완료 증빙은 구분한다.',
  '완성차와 플랫폼을 나란히 제시한 구성은 수송차량 갱신과 특수목적 파생형 확장을 함께 설명한다. 부품 공통화 효과의 정량 근거는 미확보다.'
 ],
 'adex25-kia-khtv':[
  'KHTV는 대형 물자 수송을 위한 표준차 개발 항목이다. 이번 전시형태는 축소 모형이다.',
  '25톤 이상 적재는 제조사가 제시한 개발 목표이며, 달성 제원이나 전시 실차의 시험 결과가 아니다.',
  '다른 완성차 전시와 달리 모형으로 계획을 설명했다. 실제 차량이 전시된 것으로 분류하지 않는다.',
  '제조사 개발 목표는 확인되지만 이번 근거에서 양산 일정과 전력화 완료는 확인되지 않는다.',
  '소형·중형과 함께 대형 수송의 개발 방향을 제시한 구성으로 읽힌다. 서로 다른 차량의 개발 성숙도를 동일하게 볼 근거는 없다.'
 ]
};
const kiaNames={
 'adex25-kia-tasman-chassis':['타스만 베어샤시','상부 차체를 덜어낸 기반 구조','현장사진에서 TASMAN 표지 옆 노출 샤시를 확인할 수 있다.'],
 'adex25-kia-kmtv-chassis':['중형표준차 베어샤시','중형 차량의 특수목적 차체 적용 기반','제조사 목록은 출품을 명시하지만 개별 사진에서 해당 샤시의 모델명은 확정하지 못했다.'],
 'adex25-kia-kmtv-armored':['방탄 패널 적용 중형전술차','방호를 더한 중형 임무차 형상','중형표준차와 별도 항목으로 소개했다. 방탄 등급과 시험 결과는 확인되지 않았다.'],
 'adex25-kia-kltv-cargo':['KLTV 4인승 카고','인원과 화물을 함께 운송하는 구성','제조사는 4인승 카고의 출품을 명시했다. 세부 적재량과 개별 전시사진은 미확보다.'],
 'adex25-kia-kltv-drone':['KLTV 드론 탑재차','드론 임무를 차량에 결합한 구성','출품 목록에서 드론 탑재차를 확인했다. 탑재 드론의 형식·공급사·운용 성능은 확인되지 않았다.'],
 'adex25-kia-kltv-ai':['KLTV AI 경계차','경계 임무용 장비를 결합한 구성','AI 경계차라는 출품 명칭은 확인됐다. 센서 구성·처리 성능·개별 전시형상은 추가 확인이 필요하다.'],
 'adex25-kia-tasman-fuel':['타스만 유조 파생차량','유류 수송을 위한 특수목적 구성','제조사는 타스만 특수목적 차량군에 포함했다. 탱크 용량·세부형상·개별 사진은 미확보다.'],
 'adex25-kia-tasman-refrigerated':['타스만 냉동·냉장 부식 파생차량','저온 식자재 수송을 위한 특수목적 구성','제조사 출품 목록에 냉동·냉장 부식 차량이 명시됐다. 온도 범위·적재량·개별 사진은 미확보다.'],
 'adex25-kia-tasman-cargo-pair':['타스만 카고 파생차량 2종','화물 수송 임무를 위한 파생형 묶음','원문은 카고 2종을 명시하지만 개별 형식명을 공개하지 않았다. 두 개의 확정 모델명으로 나누지 않았다.']
};
for(const equipment of kia.equipmentDrafts){
 let texts=kiaText[equipment.productId];
 if(!texts){const [name,role,exhibit]=kiaNames[equipment.productId];texts=[`${name}는 ${role}이다.`,exhibit,exhibit,'해당 파생형의 별도 개발 완료일·양산 일정은 이번 공개 근거에서 확인되지 않는다.',equipment.sections[4].editorialText];texts[2]=/chassis/.test(equipment.productId)?'완성차와 기반 샤시를 함께 보여 주는 전시다. 샤시 구조를 공개했다는 사실이 모든 파생형의 완성·인증을 뜻하지는 않는다.':equipment.sections[2].editorialText;}
 const sections=equipment.sections.map((s,i)=>({id:ids[i],label:labels[i],text:texts[i],sourceIds:unique(s.claimIds.map(id=>kiaClaims.get(id).sourceId)),claimType:i===4?'editorial_inference':s.mode==='official_plan_with_time_boundary'?'official_plan':i===3?'evidence_gap':s.mode==='analyst_interpretation'?'editorial_inference':'source_documented'}));
 if(equipment.productId==='kmtv'){sections[1].sourceIds=['kia-kmtv-production-2025'];sections[1].claimType='general_product';sections[2].sourceIds=['kia-adex-2025','kia-military-history-2025'];sections[3].sourceIds=['kia-kmtv-production-2025'];sections[3].claimType='official_plan';}
 if(equipment.productId==='tasman-military')sections[2].sourceIds=['kia-adex-2025','asiatime-adex-2025-field'];
 if(kiaNames[equipment.productId]){
  // These concise paragraphs describe the 2025 exhibit list, not current catalogs.
  sections.forEach(section=>{section.sourceIds=['kia-adex-2025'];});
  sections[0].claimType='source_documented';sections[1].claimType='source_documented';
  sections[2].claimType='editorial_inference';sections[3].claimType='evidence_gap';
 }
 const photoIds=kia.photoEvidence.filter(p=>p.localPath&&p.productIds.includes(equipment.productId)).map(p=>p.photoId);
 narratives.push(record(kia,'org-37268bb0020007468bbc',equipment.productId,sections,{photoIds,form:equipment.productId==='adex25-kia-khtv'?'축소 모형 · 적재량은 개발 목표':equipment.productId==='adex25-kia-tasman-chassis'?'현장사진의 베어샤시 확인':null,limitations:equipment.limitations}));
}
const hanwha=await read('docs/research-v2/redesign-content-hanwha.json');
const hanwhaClaims=new Map(hanwha.claims.map(c=>[c.id,c]));
for(const equipment of hanwha.equipment){
 const sections=Object.values(equipment.fiveFields).map((field,i)=>{const claims=field.claimIDs.map(id=>hanwhaClaims.get(id));return {id:ids[i],label:labels[i],text:claims.map(c=>c.text).join(' '),sourceIds:unique(claims.flatMap(c=>c.sourceIDs)),claimType:i===4?'editorial_inference':i===3?'official_plan':'source_documented'};});
 const narrative=record(hanwha,equipment.companyIds[0],equipment.productId,sections,{form:equipment.productId==='k9a3'?'발전 로드맵 전시 · 완성 실차 확인 아님':'현장 존재 대조 · 실물/모형 구분 미확인',limitations:equipment.limits});
 narrative.eventEvidenceSourceIds=unique(sections[2].sourceIds);
 narrative.generalSourceIds=unique(sections.flatMap(s=>s.sourceIds)).filter(id=>!narrative.eventEvidenceSourceIds.includes(id));
 narratives.push(narrative);
}
await write('data/v2/editorial/product-narratives.json',{asOf:'2026-11-15',narratives});
const report={eventId:'adex-2025',asOf:'2026-11-15',title:'서울 ADEX 2025',message:'플랫폼을 늘리는 전시에서, 임무와 고객 요구를 구체화하는 전시로',scopeNote:'현대로템·현대위아·기아의 확인된 출품 사례 기준',comparisonEvent:'서울 ADEX 2023',comparisonNote:'직전 회차 제조사 발표와 2025 공개자료 비교 · 동일 장비의 성능 향상 비교 아님',themes:[
 {title:'고객별 구성의 구체화',summary:'K2PL은 폴란드 요구에 맞춘 구성을 설명한다. 전시품의 실차·모형 분류에는 자료 간 표현 차이가 남는다.',companyId:'org-bb5b014b7abb0359c75b',productId:'k2pl',photoId:'photo-f27315794918d9b8ddce',before:'K2EX 수출형 소개',after:'폴란드형 K2PL 구성 제시',sourceIds:['rotem-adex2023-official','rotem-adex2025-official','rotem-adex2025-field']},
 {title:'통합과 형상 선택',summary:'RCWS 전시대는 3개 구경을 보여 준다. ADS는 기존 차량형과 새 일체형 소개를 구분해야 한다.',companyId:'org-b6b486fa375701e51329',productId:'adex25-wia-rcws-ai',photoId:'photo-406026b01ffa0009623a',before:'차량형 ADS 이미 전시',after:'일체형 ADS 추가 소개',sourceIds:['wia-adex-2023','wia-adex-2025']},
 {title:'임무별 차량군의 전개',summary:'타스만 지휘차와 샤시, KMTV·KLTV 파생형을 함께 제시했다. KHTV는 개발 목표를 담은 모형이다.',companyId:'org-37268bb0020007468bbc',productId:'tasman-military',photoId:'photo-88508f17c41d264626d0',before:'EV9·수소 콘셉트와 중형 샤시',after:'타스만·중형·소형 임무차량군',sourceIds:['kia-adex-2023','kia-adex-2025']}
],interpretation:'전시 구성에 따른 해석: 확인 사례에서는 새로운 플랫폼의 등장뿐 아니라 고객별 방호·임무 장비·차량 파생형을 구체화하는 방향이 보인다. 회사 전체 전략이나 시장 성과를 뜻하지 않는다.',limitations:['3사 비교 표본이며 전체 행사 조사·증감 통계가 아니다.','제조사 발표가 주된 근거다. 최초 공개·계획은 발표 주체와 당시 시점을 따른다.','사진은 모두 ADEX 2025 현장이다. 가운데 RCWS 사진은 ADS 사진이 아니다.'],sourceIds:[],sources:[]};
report.sourceIds=unique(report.themes.flatMap(t=>t.sourceIds));
report.sources=[...sources(rotem),...sources(wia),...sources(kia)].filter(s=>report.sourceIds.includes(s.id));
await write('data/v2/editorial/event-reports.json',{asOf:'2026-11-15',reports:[report]});
console.log(JSON.stringify({narratives:narratives.length,sections:narratives.reduce((n,p)=>n+p.sections.length,0),reports:1}));
