import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileAppData,normalizePhoto,validateAppEvent} from '../scripts/compile-v2-app.mjs';
import {getBoothCompanies,getCompanyPhotos,getPhotoViewerSelection,searchCompanies,safeAssetPath,safeUrl,tourCompanies,tourSelection} from '../src/v2/data.js';
import {parseState,serializeState,patchState,DEFAULT_STATE} from '../src/v2/state.js';
import {companyPanelMarkup,productPhotos} from '../src/v2/details.js';

const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8').then(JSON.parse);
const [publicData,registry,taxonomy,mapDisplay]=await Promise.all([read('data/v2/public.json'),read('data/v2/registry.json'),read('data/v2/taxonomy.json'),read('data/v2/map-display.json')]);
const output=compileAppData({publicData,registry,taxonomy,mapDisplay});
const adex=output.events['adex-2025'];

test('manual selection keeps the tour position aligned with the visible company or ends the tour',()=>{
  const mapped=adex.companies.filter(company=>company.mapBoothIds.length);
  const data={...adex,editorials:mapped.slice(0,3).map(company=>({organizationId:company.id}))};
  const state={tour:'featured',step:0,category:''};
  assert.deepEqual(tourSelection(data,state,mapped[2].id),{tour:'featured',step:2});
  assert.deepEqual(tourSelection(data,state,mapped[3].id),{tour:'',step:0});
  assert.deepEqual(tourSelection(data,{...state,tour:''},mapped[1].id),{tour:'',step:0});
  const technology=tourCompanies(data,{kind:'technology',category:'complete_vehicle'});
  assert.ok(technology.length);
  assert.deepEqual(tourSelection(data,{tour:'technology',step:3,category:'complete_vehicle'},technology[0].id),{tour:'technology',step:0});
});

test('app shards retain every registered participant and never invent missing booth coordinates',()=>{
  for(const event of publicData.events){
    const shard=output.events[event.id];
    assert.equal(shard.companies.length,publicData.participations.filter(p=>p.eventId===event.id).length);
    assert.equal(shard.mapGeometries.length,publicData.mapGeometries.filter(g=>g.eventId===event.id).length);
    for(const company of shard.companies)for(const id of company.mapBoothIds)assert.ok(shard.mapGeometries.some(g=>g.boothId===id));
  }
  assert.ok(adex.companies.some(c=>!c.mapBoothIds.length));
  assert.equal(searchCompanies(adex,{}).length,adex.companies.length);
});

test('shared booth returns each named organization; multiple booths do not duplicate search results',()=>{
  const hyundai=adex.companies.find(c=>c.name==='Hyundai Rotem');
  assert.ok(hyundai.mapBoothIds.length>=2);
  const shared=getBoothCompanies(adex,hyundai.mapBoothIds[0]);
  assert.ok(shared.some(c=>c.name==='Hyundai WIA'));
  assert.ok(shared.some(c=>c.name==='Kia'));
  assert.equal(searchCompanies(adex,{query:'현대로템'}).filter(c=>c.id===hyundai.id).length,1);
});

test('company search includes products and aliases while hall/category filters are explicit',()=>{
  const vehicle=searchCompanies(adex,{query:'현대로템',category:'complete_vehicle'});
  assert.ok(vehicle.length);
  assert.ok(searchCompanies(adex,{query:'K2PL'}).some(c=>c.name==='Hyundai Rotem'));
  assert.ok(searchCompanies(adex,{hall:'10',mappedOnly:true}).every(c=>c.mapBoothIds.length));
  assert.equal(searchCompanies(adex,{category:'not-a-category'}).length,0);
});

test('official raw categories are mapped without inferring vehicle relevance from company names',()=>{
  const saha=output.events['saha-2026'];
  const optical=saha.companies.find(c=>c.rawCategories.includes('Optical Material and Electro-optic Device Technologies'));
  assert.ok(optical.categoryIds.includes('optics_awareness'));
  const unclassified=saha.companies.find(c=>!c.rawCategories.length&&!c.productIds.length&&!c.relevanceNote);
  if(unclassified)assert.deepEqual(unclassified.categoryIds,[]);
  assert.equal(taxonomy.categories.length,15);
});

test('link-only image bytes and arbitrary provider URLs are never displayed',()=>{
  const sources=new Map([['s',{url:'https://www.flickr.com/photos/example/123/'}]]);
  const input={id:'p',localPath:'assets/photos/a.jpg',imageUrl:'https://evil.example/a.jpg',sourceIds:['s'],rights:{status:'link-only',license:'CC BY 4.0'}};
  assert.equal(normalizePhoto(input,sources).src,null);
  assert.equal(normalizePhoto({...input,rights:{status:'provider-embed'}},sources).src,null);
  const flickr=normalizePhoto({...input,localPath:null,imageUrl:'https://live.staticflickr.com/1/example.jpg',rights:{status:'provider-embed'}},sources);
  assert.equal(flickr.delivery,'remote');
  assert.equal(normalizePhoto({...input,rights:{status:'reusable'}},sources).delivery,'local');
  assert.equal(safeAssetPath('assets/../secret.jpg'),'');
  assert.equal(safeUrl('javascript:alert(1)'),'');
});

test('all matching image angles remain available and other-edition photos are not promoted',()=>{
  for(const company of adex.companies){
    const photos=getCompanyPhotos(adex,company.id);
    assert.equal(photos.length,company.photoIds.length);
    assert.ok(photos.every(p=>['event','reference'].includes(p.context)));
  }
  assert.ok(adex.photos.some(p=>p.context==='reference'));
});

test('URL-selected equipment galleries exclude other products and references but retain their own linked photos',()=>{
 const data={event:{id:'adex-2025'},companies:[{id:'kia',productIds:['tasman','kmtv'],photoIds:['reference','kmtv-front','tasman-front','tasman-linked','tasman-shared','wrong-edition','narrative-angle']},{id:'other',productIds:['other-product'],photoIds:['foreign']}],products:[{id:'tasman',narrative:{photoIds:['narrative-angle']}},{id:'kmtv'},{id:'other-product'}],photos:[
  {id:'reference',context:'reference',src:'assets/reference.jpg',productIds:['tasman']},
  {id:'kmtv-front',context:'event',src:'assets/kmtv.jpg',productIds:['kmtv']},
  {id:'tasman-front',context:'event',src:'assets/tasman.jpg',productIds:['tasman']},
  {id:'tasman-linked',context:'event',src:null,delivery:'linked',productIds:['tasman']},
  {id:'tasman-shared',context:'event',src:'assets/shared.jpg',productIds:['tasman','kmtv']},
  {id:'wrong-edition',context:'event',eventId:'adex-2023',src:'assets/old.jpg',productIds:['tasman']},
  {id:'narrative-angle',context:'event',src:'assets/narrative.jpg'},
  {id:'foreign',context:'event',src:'assets/foreign.jpg',productIds:['other-product']}
 ]};
 const state=patchState(DEFAULT_STATE,{route:'company',event:'adex-2025',company:'kia',product:'tasman',photo:'tasman-front'});
 const selected=getPhotoViewerSelection(data,state);
 assert.deepEqual(selected.photos.map(p=>p.id),['tasman-front','tasman-shared','narrative-angle','tasman-linked']);
 assert.equal(selected.productId,'tasman');assert.equal(selected.photos[selected.index].id,'tasman-front');
 const next=patchState(state,{photo:'tasman-linked'}),reloaded=getPhotoViewerSelection(data,parseState(serializeState(next)));
 assert.deepEqual(reloaded.photos.map(p=>p.id),selected.photos.map(p=>p.id));assert.equal(reloaded.photos[reloaded.index].id,'tasman-linked');
 const back=getPhotoViewerSelection(data,parseState(serializeState(state)));assert.equal(back.photos[back.index].id,'tasman-front');
 for(const photo of ['reference','wrong-edition','kmtv-front']){
  const outside=getPhotoViewerSelection(data,{...state,photo});assert.equal(outside.productId,'');assert.deepEqual(outside.photos,getCompanyPhotos(data,'kia'));
 }
 const hero=getPhotoViewerSelection(data,{...state,product:''});assert.equal(hero.productId,'');assert.equal(hero.photos.length,7);
 const foreign=getPhotoViewerSelection(data,{...state,product:'other-product',photo:'foreign'});assert.equal(foreign.index,-1);assert.equal(foreign.productId,'');
});

test('data shards omit collection/queue/completion bookkeeping and keep evidence limitations',()=>{
  for(const data of Object.values(output.events)){
    for(const key of ['collections','workQueue','metrics','rosterEntries','migration'])assert.equal(data[key],undefined);
    assert.ok(data.analyses.every(a=>a.interpretationNote));
    assert.ok(data.companies.filter(c=>!c.editorialId).every(c=>c.exhibitStatus==='unconfirmed'));
  }
  assert.ok(adex.companies.some(c=>c.sourceLabelStatus==='needs_review'));
  assert.equal(adex.mapDocuments[0].rights.status,'link_only');
});

test('unverified data cannot acquire geometry merely by adding a company map link',()=>{
  const broken=structuredClone(adex);broken.companies[0].mapBoothIds.push('not-a-verified-booth');
  assert.throws(()=>validateAppEvent(broken),/unverified map placement/);
});

test('editorial examples augment their own registered company without changing global completeness',()=>{
  const company=adex.companies.find(c=>c.name==='Hyundai Rotem');
  const example={id:'case-example',organizationId:company.id,categoryIds:['complete_vehicle'],reason:'조건이 있는 사례 판단',highlights:['가','나','다'],exhibit:{items:[{name:'문서로 확인한 사례제품',form:'model',status:'displayed_model',sourceIds:['example-source']}]},distinction:{status:'not_comparable'},direction:{observation:'발표 근거',interpretation:'해석'},followUps:['형상?','운용조건?'],sources:[{id:'example-source',url:'https://example.com/adex-2025',title:'2025 원문'}],photos:[],catalogs:[]};
  const event=compileAppData({publicData,registry,taxonomy,mapDisplay,editorialBundles:[{eventId:'adex-2025',cases:[example]}]}).events['adex-2025'];
  const selected=event.companies.find(c=>c.id===company.id);
  assert.equal(selected.editorialId,'case-example');
  assert.equal(selected.exhibitStatus,'source_documented');
  assert.ok(searchCompanies(event,{query:'문서로 확인한 사례제품'}).some(c=>c.id===company.id));
  assert.equal(tourCompanies(event).length,1);
  assert.equal(event.companies.length,adex.companies.length);
  assert.equal(event.populationComplete,undefined);
  assert.throws(()=>compileAppData({publicData,registry,taxonomy,editorialBundles:[{eventId:'adex-2025',cases:[{...example,organizationId:'org-missing'}]}]}),/not registered/);
  assert.throws(()=>compileAppData({publicData,registry,taxonomy,editorialBundles:[{eventId:'adex-2025',cases:[{...example,photos:[{id:'wrong-edition',eventId:'idex-2025',context:'event',sourceUrl:'https://example.com/photo',rightsStatus:'link-only'}]}]}]}),/photo edition mismatch/);
});

const narrativeFixture=()=>{
  const company=adex.companies.find(company=>company.name==='Hyundai WIA');
  const photo=adex.photos.find(photo=>company.photoIds.includes(photo.id)&&photo.context==='event'&&photo.src==='assets/adex2025/rcws-event-01.jpg');
  assert.ok(photo);
  return {eventId:adex.event.id,organizationId:company.id,productId:'rcws',asOf:'2026-11-15',sections:['overview','features','exhibit','development','interpretation'].map(id=>({id,label:id,text:'제품별 공개 설명',sourceIds:['narrative-event'],claimType:id==='interpretation'?'editorial_inference':'event'})),eventEvidenceSourceIds:['narrative-event'],generalSourceIds:['narrative-general'],photoIds:[photo.id],form:'실물',limitations:['단일 제조사 자료'],sources:[{id:'narrative-event',url:'https://example.org/adex2025',title:'행사 발표',publisher:'Manufacturer',publishedAt:'2025-10-20'},{id:'narrative-general',url:'https://example.org/product',title:'현재 일반제품 소개'}]};
};
const withNarratives=(productNarratives,extra={})=>compileAppData({publicData,registry,taxonomy,mapDisplay,productNarratives,...extra});

test('optional product narratives enrich only an existing product and its own event photo',()=>{
  const narrative=narrativeFixture(),event=withNarratives([narrative]).events[adex.event.id];
  const product=event.products.find(product=>product.id===narrative.productId);
  assert.equal(event.products.length,adex.products.length);
  assert.deepEqual(product.narrative.sections,narrative.sections);
  assert.equal(product.narrative.asOf,'2026-11-15');
  assert.equal(event.dataAsOf,adex.dataAsOf);
  assert.equal(product.form,'실물');
  for(const id of ['narrative-event','narrative-general'])assert.ok(product.sourceIds.includes(id));
  assert.ok(event.companies.find(company=>company.id===narrative.organizationId).sourceIds.includes('narrative-general'));
  assert.ok(event.photos.find(photo=>photo.id===narrative.photoIds[0]).productIds.includes(product.id));
  assert.equal(event.sources.find(source=>source.id==='narrative-event').publishedAt,'2025-10-20');
  for(const [id,shard] of Object.entries(withNarratives([narrative]).events))if(id!==adex.event.id)assert.ok(shard.products.every(product=>!product.narrative));
  assert.ok(adex.products.every(product=>!product.narrative),'compiler must not mutate shared input');
});

test('product narratives reject invented products, wrong companies, unknown editions and duplicate records',()=>{
  const narrative=narrativeFixture();
  assert.throws(()=>withNarratives([{...narrative,productId:'invented-product'}]),/does not belong/);
  assert.throws(()=>withNarratives([{...narrative,organizationId:adex.companies.find(company=>company.name==='Kia').id}]),/does not belong/);
  assert.throws(()=>withNarratives([{...narrative,eventId:'adex-2023'}]),/event is not registered/);
  assert.throws(()=>withNarratives([narrative,narrative]),/duplicate product narrative/);
});

test('product narrative evidence cannot silently lose sources or borrow another company or edition photo',()=>{
  const narrative=narrativeFixture(),other=adex.companies.find(company=>company.name==='Kia');
  const otherPhoto=adex.photos.find(photo=>other.photoIds.includes(photo.id)&&photo.context==='event');
  const reference=adex.photos.find(photo=>photo.context==='reference'&&adex.companies.find(company=>company.id===narrative.organizationId).photoIds.includes(photo.id));
  assert.throws(()=>withNarratives([{...narrative,generalSourceIds:['missing-source']}]),/dangling source/);
  assert.throws(()=>withNarratives([{...narrative,photoIds:[otherPhoto.id]}]),/another organization/);
  assert.throws(()=>withNarratives([{...narrative,photoIds:[reference.id]}]),/not from this edition/);
  assert.throws(()=>withNarratives([{...narrative,sections:narrative.sections.slice(0,4)}]),/five sections/);
  const event=withNarratives([narrative]).events[adex.event.id];
  event.products.find(product=>product.id===narrative.productId).narrative.sections[0].sourceIds.push('missing-source');
  assert.throws(()=>validateAppEvent(event),/dangling sources/);
});

test('narratives from four other editions preserve registered products and validated photo ownership',async()=>{
  const supplements=await Promise.all(['eurosatory-saha','dsei-idex'].map(name=>read('docs/research-v2/redesign-narratives-'+name+'.json')));
  const narratives=supplements.flatMap(packet=>packet.narratives),compiled=withNarratives(narratives);
  assert.deepEqual([...new Set(narratives.map(n=>n.eventId))].sort(),['dsei-2025','eurosatory-2026','idex-2025','saha-2026']);
  for(const [eventId,event] of Object.entries(compiled.events)){
    assert.deepEqual(event.products.map(p=>p.id),output.events[eventId].products.map(p=>p.id));
    for(const n of narratives.filter(n=>n.eventId===eventId)){
      const p=event.products.find(p=>p.id===n.productId);
      assert.equal(p.narrative.sections.length,5);
      assert.equal(p.exhibitStatus,output.events[eventId].products.find(original=>original.id===p.id).exhibitStatus,'description must not silently promote exhibit verification');
      for(const photoId of n.photoIds){
        const photo=event.photos.find(photo=>photo.id===photoId);
        assert.equal(photo.context,'event');assert.ok(photo.productIds.includes(p.id));
        assert.ok(event.companies.find(company=>company.id===n.organizationId).photoIds.includes(photoId));
      }
    }
  }
});

test('annotated evidence from another edition stays a reference rather than current exhibit proof',()=>{
  const narrative=narrativeFixture();narrative.sources[0].eventEditionId='adex-2023';
  assert.throws(()=>withNarratives([narrative]),/another edition/);
  narrative.eventEvidenceSourceIds=[];narrative.generalSourceIds=['narrative-event','narrative-general'];
  assert.doesNotThrow(()=>withNarratives([narrative]));
  narrative.sources[0].eventEditionId='adex-2025';narrative.eventEvidenceSourceIds=['narrative-event'];
  assert.throws(()=>withNarratives([narrative]),/both event evidence and general/);
});

test('optional event reports retain their own date, evidence and existing product/photo relations',()=>{
  const narrative=narrativeFixture();
  const report={eventId:adex.event.id,asOf:'2026-11-15',title:'관찰 보고',message:'확인된 사례만 비교',scopeNote:'전체 행사 결론 아님',comparisonEvent:'ADEX 2023',comparisonNote:'제조사 원문 대조',themes:[{title:'계열 구성',summary:'공개 내용의 비교',companyId:narrative.organizationId,productId:narrative.productId,photoId:narrative.photoIds[0],before:'이전 설명',after:'이번 설명',sourceIds:['report-source']}],interpretation:'관찰에 한정',limitations:['독립 확인 필요'],sourceIds:['report-source'],sources:[{id:'report-source',url:'https://example.org/adex2023',title:'직전 회차 자료',publishedAt:'2023-10-17'}]};
  const result=withNarratives([narrative],{reportContents:[report]}),event=result.events[adex.event.id];
  assert.equal(event.report.asOf,'2026-11-15');
  assert.equal(event.dataAsOf,adex.dataAsOf);
  assert.deepEqual(event.report.themes,report.themes);
  assert.ok(event.sources.some(source=>source.id==='report-source'));
  assert.equal(result.events['idex-2025'].report,null);
  assert.throws(()=>withNarratives([narrative],{reportContents:[{...report,themes:[{...report.themes[0],companyId:'missing-company'}]}]}),/report company/);
  assert.throws(()=>withNarratives([narrative],{reportContents:[{...report,themes:[{...report.themes[0],productId:'missing-product'}]}]}),/report product/);
  assert.throws(()=>withNarratives([narrative],{reportContents:[{...report,sourceIds:['missing-source']}]}),/report dangling source/);
  const broken=structuredClone(event);broken.report.themes[0].photoId=adex.photos.find(photo=>photo.context==='reference').id;
  assert.throws(()=>validateAppEvent(broken),/report company\/photo mismatch/);
});

const [patriaResearch,patriaNarratives,patriaReport,dseiNarratives]=await Promise.all([
  read('data/v2/research/dsei-2025/patria-photos.json'),
  read('docs/research-v2/redesign-narratives-patria.json'),
  read('docs/research-v2/redesign-report-dsei.json'),
  read('docs/research-v2/redesign-narratives-dsei-idex.json')
]);
const patriaOrganizationId='org-b2e821937e2348e31631';
const patriaCompilation=withNarratives([...dseiNarratives.narratives.filter(item=>item.eventId==='dsei-2025'),...patriaNarratives.narratives],{researchBundles:[patriaResearch],reportContents:[patriaReport]});
const patriaEvent=patriaCompilation.events['dsei-2025'];
const patriaCompany=patriaEvent.companies.find(company=>company.id===patriaOrganizationId);
const patriaPhotoGroups={
  'patria-6x6':['dsei25-patria-6x6-cavs','dsei25-patria-6x6-c4'],
  'dsei25-patria-trackx':['dsei25-patria-trackx'],
  'dsei25-patria-tremos':['dsei25-patria-tremos']
};

test('Patria enrichment retains the legacy 6x6 identity and adds two separately addressable DSEI products',()=>{
  assert.deepEqual([...patriaCompany.productIds].sort(),Object.keys(patriaPhotoGroups).sort());
  const legacy=registry.products.find(product=>product.id==='patria-6x6');
  assert.ok(legacy.legacyRefs.some(ref=>ref.namespace==='data/catalog.json'&&ref.oldId==='patria-6x6'));
  for(const id of Object.keys(patriaPhotoGroups)){
    const products=patriaEvent.products.filter(product=>product.id===id);
    assert.equal(products.length,1,id+' must remain a single product');
    assert.deepEqual(products[0].organizationIds,[patriaOrganizationId]);
    assert.equal(products[0].narrative.sections.length,5);
  }
  for(const [eventId,event] of Object.entries(patriaCompilation.events))if(eventId!=='dsei-2025'){
    assert.ok(event.products.every(product=>!['dsei25-patria-trackx','dsei25-patria-tremos'].includes(product.id)),eventId);
  }
});

test('Patria product galleries expose exactly their four verified event photos without borrowing another product',()=>{
  for(const [productId,photoIds] of Object.entries(patriaPhotoGroups)){
    const product=patriaEvent.products.find(product=>product.id===productId);
    const photos=productPhotos(patriaEvent,patriaCompany,product);
    assert.deepEqual(photos.map(photo=>photo.id).sort(),[...photoIds].sort(),productId);
    for(const photo of photos){
      assert.equal(photo.context,'event');
      assert.deepEqual(photo.productIds,[productId]);
      assert.ok(patriaCompany.photoIds.includes(photo.id));
      assert.ok(photo.src?.startsWith('assets/photos/dsei2025-patria-'));
      assert.equal(photo.rights.status,'reusable');
      assert.match(photo.rights.license,/비상업/);
      assert.equal(photo.credit,'Photo: Patria');
      assert.ok(photo.sourceIds.every(id=>patriaEvent.sources.some(source=>source.id===id)));
    }
  }
  const selected=getPhotoViewerSelection(patriaEvent,{company:patriaOrganizationId,product:'patria-6x6',photo:'dsei25-patria-6x6-c4'});
  assert.equal(selected.productId,'patria-6x6');
  assert.deepEqual(selected.photos.map(photo=>photo.id).sort(),[...patriaPhotoGroups['patria-6x6']].sort());
  assert.equal(selected.photos[selected.index].id,'dsei25-patria-6x6-c4');
});

test('the two Patria 6x6 photos retain distinct Babcock and C4 captions and the C2/C4 evidence limitation',()=>{
  const [cavs,c4]=patriaPhotoGroups['patria-6x6'].map(id=>patriaEvent.photos.find(photo=>photo.id===id));
  assert.notEqual(cavs.src,c4.src);
  assert.notEqual(cavs.originalImageUrl,c4.originalImageUrl);
  assert.match(cavs.caption,/Babcock/);
  assert.match(c4.caption,/C4 Concept Vehicle/);
  assert.match(cavs.variantNote,/다른 전시 형상/);
  assert.match(c4.variantNote,/C2/);
  const html=companyPanelMarkup(patriaEvent,patriaCompany,{productId:'patria-6x6'});
  assert.ok(html.includes(cavs.caption));
  assert.ok(html.includes(c4.caption));
  assert.match(html,/같은 차량의 다른 각도로 묶지 않는다/);
  assert.match(html,/C4 표지와 사전 안내의 C2 표현을 구분/);
});

test('Patria event photos do not promote existing references, attendance or research completion',()=>{
  const baseline=output.events['dsei-2025'];
  const previous=baseline.companies.find(company=>company.id===patriaOrganizationId);
  assert.equal(patriaCompany.attendanceStatus,previous.attendanceStatus);
  assert.equal(patriaCompany.attendanceStatus,'unverified');
  assert.equal(patriaCompany.status,previous.status);
  const participation=registry.participations.find(item=>item.id===patriaCompany.participationId);
  assert.equal(patriaResearch.cases[0].review.status,'insufficient_data');
  assert.equal(participation.researchStatus,'insufficient_data');
  assert.equal(participation.deepAnalysisStatus,'not_complete');
  assert.equal(patriaResearch.cases[0].attendanceStatus,undefined);
  const references=baseline.photos.filter(photo=>previous.photoIds.includes(photo.id)&&photo.context==='reference');
  assert.ok(references.length>=5,'pre-existing general Patria photos must remain available');
  for(const reference of references){
    assert.ok(patriaCompany.photoIds.includes(reference.id));
    assert.equal(patriaEvent.photos.find(photo=>photo.id===reference.id).context,'reference');
    for(const productId of Object.keys(patriaPhotoGroups)){
      const product=patriaEvent.products.find(product=>product.id===productId);
      assert.ok(productPhotos(patriaEvent,patriaCompany,product).every(photo=>photo.id!==reference.id));
    }
  }
  for(const productId of Object.keys(patriaPhotoGroups)){
    assert.equal(patriaEvent.products.find(product=>product.id===productId).exhibitStatus,'exhibitor_event_photo_confirmed');
    const exhibit=registry.exhibits.find(item=>item.eventId==='dsei-2025'&&item.productId===productId);
    assert.equal(exhibit.evidenceStatus,'exhibitor_event_photo_confirmed');
  }
});

test('Patria source limitations and report-only notes survive compilation into the public evidence panel',()=>{
  for(const source of patriaResearch.cases[0].sources){
    const compiled=patriaEvent.sources.find(item=>item.id===source.id);
    assert.equal(compiled.note,source.limitations);
    assert.equal(compiled.evidenceStatus,'single_source');
  }
  for(const id of ['dsei23-patria-report','dsei25-patria-teaming-report']){
    const source=patriaReport.sources.find(item=>item.id===id);
    assert.ok(source.note);
    assert.equal(patriaEvent.sources.find(item=>item.id===id).note,source.note);
  }
  const html=companyPanelMarkup(patriaEvent,patriaCompany);
  for(const source of patriaResearch.cases[0].sources)assert.ok(html.includes(source.limitations),source.id);
});
