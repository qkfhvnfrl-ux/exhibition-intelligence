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
  '타스만 기반 군용 지휘차다. 무전기·안테나를 추가했다.',
  '전시차의 별도 제원은 미확인이다. 일반 타스만 사양을 대신 적용하지 않는다.',
  '제조사의 실물 첫 공개 발표와 현장 기자 사진을 대조했다.',
  '2025년 9월 표준 지휘용 픽업 선정과 연내 전력화 계획을 발표했다. 이행 완료는 미확인이다.',
  '민수 기반 차량을 임무별 군용차로 확장하려는 구성으로 해석한다.'
 ],
 'kmtv':[
  '병력·물자 수송용 중형표준차다. 현장사진의 KMTV 표지를 확인했다.',
  '2025년 6월 발표값은 2.5톤형 280PS·5톤형 330PS, 8단 자동변속기다. 전시차의 세부형은 미확인이다.',
  '완성차와 베어샤시를 제시했다. 실물 최초 공개는 KADEX 2024였다.',
  '2025년 6월 10일 양산식과 같은 달 군 인도 계획을 발표했다. 실제 인도 완료는 미확인이다.',
  '공통 기반에서 수송·특장 선택지를 넓히는 구성으로 읽힌다. 공통화 효과의 정량 근거는 미확보다.'
 ],
 'adex25-kia-khtv':[
  '대형 물자 수송용 표준차 개발 항목으로, 축소 모형을 전시했다.',
  '25톤 이상 적재는 개발 목표다. 달성 제원이나 실차 시험 결과가 아니다.',
  '개발 단계를 구별한다.',
  '양산 일정·전력화 완료는 미확인이다.',
  '수송 범위를 넓히려는 방향으로 해석한다. 모형으로 기술 성숙도를 판단할 수는 없다.'
 ]
};
const kiaNames={
 'adex25-kia-tasman-chassis':['타스만 베어샤시','상부 차체를 덜어낸 특장 기반','현장사진의 TASMAN 표지로 대조했다. 세부 제원은 미확인이다.'],
 'adex25-kia-kmtv-chassis':['중형표준차 베어샤시','중형차의 특장 기반','개별 사진의 모델명·축수·제원은 미확인이다.'],
 'adex25-kia-kmtv-armored':['방탄 패널 적용 중형전술차','방호형 파생차','방탄 등급·추가 중량·시험 결과는 미확인이다.'],
 'adex25-kia-kltv-cargo':['KLTV 4인승 카고','인원·화물 수송형','적재량과 개별 전시사진은 미확인이다.'],
 'adex25-kia-kltv-drone':['KLTV 드론 탑재차','드론 임무형','드론 형식·공급사·운용 성능은 미확인이다.'],
 'adex25-kia-kltv-ai':['KLTV AI 경계차','경계 임무형','센서·처리 성능·개별 전시형상은 미확인이다.'],
 'adex25-kia-tasman-fuel':['타스만 유조 파생차량','유류 수송용','탱크 용량·세부형상·개별 사진은 미확인이다.','은'],
 'adex25-kia-tasman-refrigerated':['타스만 냉동·냉장 부식 파생차량','저온 식자재 수송용','온도 범위·적재량·개별 사진은 미확인이다.','은'],
 'adex25-kia-tasman-cargo-pair':['타스만 카고 파생차량 2종','화물 수송형 묶음','개별 형식명·적재함·적재량은 미확인이다. 두 모델명을 만들지 않는다.','은']
};
const kiaExhibitNotes={
 'adex25-kia-tasman-chassis':'특장 선택지를 살핀다.',
 'adex25-kia-kmtv-chassis':'특장 기반을 보여준다.',
 'adex25-kia-kmtv-armored':'방호 선택지를 제시한다.',
 'adex25-kia-kltv-cargo':'기본 수송형을 비교한다.',
 'adex25-kia-kltv-drone':'드론 운용기반을 제시한다.',
 'adex25-kia-kltv-ai':'이동 경계용으로 제시한다.',
 'adex25-kia-tasman-fuel':'보급 역할을 넓혔다.',
 'adex25-kia-tasman-refrigerated':'보관 조건을 다룬다.',
 'adex25-kia-tasman-cargo-pair':'적재 선택지를 제시한다.'
};
for(const equipment of kia.equipmentDrafts){
 let texts=kiaText[equipment.productId];
 if(!texts){const [name,role,features,topic='는']=kiaNames[equipment.productId];texts=[`${name}${topic} ${role}이다.`,features,kiaExhibitNotes[equipment.productId],/chassis/.test(equipment.productId)?'샤시 공개만으로 파생형 완성·인증을 확정할 수 없다. 개발 완료일·양산 일정은 미확인이다.':'개별 개발 완료일·양산 일정은 미확인이다.',equipment.sections[4].editorialText];}
 const sections=equipment.sections.map((s,i)=>({id:ids[i],label:labels[i],text:texts[i],sourceIds:unique(s.claimIds.map(id=>kiaClaims.get(id).sourceId)),claimType:i===4?'editorial_inference':s.mode==='official_plan_with_time_boundary'?'official_plan':i===3?'evidence_gap':s.mode==='analyst_interpretation'?'editorial_inference':'source_documented'}));
 if(equipment.productId==='kmtv'){sections[1].sourceIds=['kia-kmtv-production-2025'];sections[1].claimType='general_product';sections[2].sourceIds=['kia-adex-2025','kia-military-history-2025'];sections[3].sourceIds=['kia-kmtv-production-2025'];sections[3].claimType='official_plan';}
 if(equipment.productId==='tasman-military'){sections[1].claimType='evidence_gap';sections[2].sourceIds=['kia-adex-2025','asiatime-adex-2025-field'];sections[2].claimType='source_documented';}
 if(equipment.productId==='adex25-kia-khtv')sections[2].claimType='editorial_inference';
 if(kiaNames[equipment.productId]){
  // These concise paragraphs describe the 2025 exhibit list, not current catalogs.
  sections.forEach(section=>{section.sourceIds=['kia-adex-2025'];});
  sections[0].claimType='source_documented';sections[1].claimType=equipment.productId==='adex25-kia-tasman-chassis'?'source_documented':'evidence_gap';
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
for(const file of ['redesign-narratives-eurosatory-saha.json','redesign-narratives-dsei-idex.json','redesign-narratives-patria.json']){
 const supplement=await read('docs/research-v2/'+file);
 if(!Array.isArray(supplement.narratives))throw new Error('Missing narrative list: '+file);
 narratives.push(...supplement.narratives.map(item=>({asOf:supplement.asOf,...item})));
}
await write('data/v2/editorial/product-narratives.json',{asOf:'2026-11-16',narratives});
const report={eventId:'adex-2025',asOf:'2026-11-15',title:'서울 ADEX 2025',message:'플랫폼을 늘리는 전시에서, 임무와 고객 요구를 구체화하는 전시로',scopeNote:'현대로템·현대위아·기아의 확인된 출품 사례 기준',comparisonEvent:'서울 ADEX 2023',comparisonNote:'직전 회차 제조사 발표와 2025 공개자료 비교 · 동일 장비의 성능 향상 비교 아님',themes:[
 {title:'고객별 구성의 구체화',summary:'K2PL은 폴란드 요구에 맞춘 구성을 설명한다. 전시품의 실차·모형 분류에는 자료 간 표현 차이가 남는다.',companyId:'org-bb5b014b7abb0359c75b',productId:'k2pl',photoId:'photo-f27315794918d9b8ddce',before:'K2EX 수출형 소개',after:'폴란드형 K2PL 구성 제시',sourceIds:['rotem-adex2023-official','rotem-adex2025-official','rotem-adex2025-field']},
 {title:'통합과 형상 선택',summary:'RCWS 전시대는 3개 구경을 보여 준다. ADS는 기존 차량형과 새 일체형 소개를 구분해야 한다.',companyId:'org-b6b486fa375701e51329',productId:'adex25-wia-rcws-ai',photoId:'photo-406026b01ffa0009623a',before:'차량형 ADS 이미 전시',after:'일체형 ADS 추가 소개',sourceIds:['wia-adex-2023','wia-adex-2025']},
 {title:'임무별 차량군의 전개',summary:'타스만 지휘차와 샤시, KMTV·KLTV 파생형을 함께 제시했다. KHTV는 개발 목표를 담은 모형이다.',companyId:'org-37268bb0020007468bbc',productId:'tasman-military',photoId:'photo-88508f17c41d264626d0',before:'EV9·수소 콘셉트와 중형 샤시',after:'타스만·중형·소형 임무차량군',sourceIds:['kia-adex-2023','kia-adex-2025']}
],interpretation:'전시 구성에 따른 해석: 확인 사례에서는 새로운 플랫폼의 등장뿐 아니라 고객별 방호·임무 장비·차량 파생형을 구체화하는 방향이 보인다. 회사 전체 전략이나 시장 성과를 뜻하지 않는다.',limitations:['3사 비교 표본이며 전체 행사 조사·증감 통계가 아니다.','제조사 발표가 주된 근거다. 최초 공개·계획은 발표 주체와 당시 시점을 따른다.','사진은 모두 ADEX 2025 현장이다. 가운데 RCWS 사진은 ADS 사진이 아니다.'],sourceIds:[],sources:[]};
report.sourceIds=unique(report.themes.flatMap(t=>t.sourceIds));
report.sources=[...sources(rotem),...sources(wia),...sources(kia)].filter(s=>report.sourceIds.includes(s.id));
const reports=[report];
for(const edition of ['eurosatory','dsei','idex','saha']){
 const {evidence,...supplement}=await read('docs/research-v2/redesign-report-'+edition+'.json');
 reports.push(supplement);
}
await write('data/v2/editorial/event-reports.json',{asOf:'2026-11-16',reports});
console.log(JSON.stringify({narratives:narratives.length,sections:narratives.reduce((n,p)=>n+p.sections.length,0),reports:reports.length}));
