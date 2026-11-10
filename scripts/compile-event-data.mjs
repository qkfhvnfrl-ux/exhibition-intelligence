import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const readJson=async path=>JSON.parse(await readFile(path,'utf8'));
const catalog=await readJson('data/exhibitions.json');
const order=['adex-2025','idex-2025','dsei-2025','saha-2026','eurosatory-2026'];
const names={'adex-2025':'adex','idex-2025':'idex','dsei-2025':'dsei','saha-2026':'saha','eurosatory-2026':'eurosatory'};
const summaries={
 'adex-2025':'고객별 전시 형상과 상용·군용 플랫폼의 계열화, 무인체계의 제품 전개를 살펴봅니다.',
 'idex-2025':'수출시장을 겨냥한 플랫폼 계열화와 지역 업체의 제품군 확대를 살펴봅니다.',
 'dsei-2025':'공통 플랫폼의 임무 확장과 기존 차량 기반의 특수목적 제품 전개를 살펴봅니다.',
 'saha-2026':'차량·탑재장비·무인체계의 결합과 국내 공급업체 간 통합 제품 제안을 살펴봅니다.',
 'eurosatory-2026':'지상장비의 신규 개념과 기존 플랫폼을 활용한 제품군 확대를 살펴봅니다.'
};
const locations={'adex-2025':'대한민국 고양 · KINTEX','idex-2025':'UAE 아부다비 · ADNEC','dsei-2025':'영국 런던 · ExCeL','saha-2026':'튀르키예 이스탄불 · Istanbul Expo Center','eurosatory-2026':'프랑스 파리 · Paris Nord Villepinte'};
const photoKey=p=>p.sha256||p.src||p.embedImageUrl||p.imageUrl||p.sourceUrl;
const events=[];
for(const id of order){
 const base=catalog.find(e=>e.id===id);
 let research;
 try{research=await readJson(`data/research-v1.1/${names[id]}.json`);}catch(e){if(e.code!=='ENOENT')throw e;research={equipment:[]};}
 if(research.eventId&&research.eventId!==id)throw new Error(`Wrong event data: ${id}`);
 const normalizePhoto=p=>{if(p.context!=='event'||p.eventId!==id)throw new Error(`Out-of-scope photo ${p.id} in ${id}`);return {...p,...(p.src?{src:p.src.replace(/^\.\//,'')}:{})};};
 const equipment=(research.equipment||[]).map(item=>({...item,eventId:id,photos:(item.photos||[]).map(p=>({...normalizePhoto(p),equipmentId:item.id}))}));
 const eventPhotos=(research.eventPhotos||[]).map(normalizePhoto);
 for(const photo of [...eventPhotos,...equipment.flatMap(item=>item.photos)])if(photo.src){if(!/^assets\/[\w./-]+$/.test(photo.src)||photo.src.includes('..'))throw new Error(`Invalid asset path ${photo.id}`);photo.sha256=createHash('sha256').update(await readFile(photo.src)).digest('hex');}
 const unique=[...new Map([...eventPhotos,...equipment.flatMap(c=>c.photos)].map(p=>[photoKey(p),p])).values()];
 const coverage={equipment:equipment.length,localPhotos:unique.filter(p=>p.src&&p.rightsStatus==='reusable').length,externalPhotos:unique.filter(p=>!p.src&&(p.rightsStatus==='provider-embed'&&p.embedImageUrl||p.rightsStatus==='reusable'&&p.imageUrl)).length,sourceLinks:new Set(unique.filter(p=>p.rightsStatus==='link-only').map(p=>p.sourceUrl)).size};
 const sourceGalleries=[...(research.sourceGalleries||[]),...(research.externalGalleries||[]),...(research.collections||[]),...(research.mediaGalleries||[]),...(research.additionalSourceGalleries||[])].filter(g=>g.reviewStatus!=='candidate');
 events.push({...base,name:base.name,location:locations[id],dates:id==='adex-2025'?'2025.10.20–24 · KINTEX 전문관람일':base.dates,summary:research.summary||research.strategySummary||summaries[id],collectionStatus:'1차 수집',coverage,equipment,eventPhotos,sourceGalleries,sourceUrl:research.sourceUrl||base.sourceUrl,collectionNotes:research.collectionNotes||[]});
}
const version=JSON.parse(await readFile('package.json')).version;
const report={version,updatedAt:'2026-11-11',scope:{label:'최근 2년 · 5개 전시회 지상장비',startDate:'2024-11-11',endDate:'2026-11-11',note:'해당 회차의 실제 전시 장비와 현장사진을 대상으로 한 1차 조사입니다. 개발전략 해석은 공개 전시 내용을 요약한 분석 의견이며 업체의 공식 전략 선언과 구분합니다. 다른 행사·훈련·기존형 참고사진은 보고 화면에서 제외했습니다.'},events};
await mkdir('data',{recursive:true});
await writeFile('data/event-reports.json',JSON.stringify(report,null,2)+'\n');
console.log(`Event reports: ${events.length} exhibitions, ${events.reduce((n,e)=>n+e.coverage.equipment,0)} equipment entries.`);
