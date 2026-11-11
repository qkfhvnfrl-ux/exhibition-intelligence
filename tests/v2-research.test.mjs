import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {compileRegistry,publicProjection} from '../scripts/compile-v2-data.mjs';
import {compileAppData} from '../scripts/compile-v2-app.mjs';
import {readResearchBundles,researchEditorialBundles} from '../scripts/research-v2.mjs';
import {companyPanelMarkup} from '../src/v2/details.js';

const eventId='adex-2025';
const input=()=>({catalog:{exhibitions:[],equipment:[],photos:[]},eventReports:{events:[{id:eventId,name:'Fixture ADEX',year:2025,equipment:[],eventPhotos:[]}]},review:{event:{id:eventId},cases:[]},reviewPhotos:[],ledgers:[{eventId,checkedAt:'2026-11-12',sources:[{id:'directory',url:'https://example.org/2025/list',edition:2025,editionStatus:'confirmed',accessStatus:'accessible',coverageScope:'full_directory'}],collection:{status:'partial',complete:false,populationComplete:false,missingRanges:['not fully acquired'],units:[]},entries:['Alpha','Beta','Gamma'].map((name,i)=>({id:'row-'+i,sourceId:'directory',sourceLocator:'row '+i,rawName:name,boothCodes:[]}))}]});
function fixture(){
  const data=input(),registry=compileRegistry(data),oid=registry.organizations.find(o=>o.name==='Alpha').id;
  const sources=[{id:'alpha-event',url:'https://example.org/alpha/2025/show',title:'Alpha onsite report',role:'independent_event_report',edition:2025,editionStatus:'confirmed',originGroup:'field-report',independence:'independent_observation_only',date:'2025-10-20'},{id:'alpha-country',url:'https://example.org/alpha/company',role:'company_background',originGroup:'alpha-company',independence:'primary_single_origin'}];
  const record={id:'case-alpha',organizationId:oid,displayName:'Alpha',categoryIds:['power'],countries:['대한민국'],countrySourceIds:['alpha-country'],review:{relevance:'confirmed',reason:'차량 전원 연결성',categories:['power'],status:'analysis_complete',reviewedAt:'2026-11-12',sourceIds:['alpha-event']},reason:'차량 전원 배분 검토',highlights:['전원','정비','검증'],exhibit:{summary:'전시품 확인',sourceIds:['alpha-event'],items:[{productId:'alpha-battery',name:'Battery A',status:'event_photo_confirmed',form:'실물',sourceIds:['alpha-event']},{productId:'alpha-connector',name:'Connector B',status:'onsite_report_confirmed',form:'실물',sourceIds:['alpha-event']},{productId:'alpha-background',name:'General C',status:'background_reference',form:'일반 자료',sourceIds:['alpha-country']}]},distinction:{judgment:'구성 비교',sourceIds:['alpha-event']},direction:{interpretation:'전원 다각화',sourceIds:['alpha-event']},workConnection:{value:'차량 전원 요구 검토'},followUps:['전력 조건은?','시험 조건은?'],sources,photos:[{id:'alpha-photo',sourceUrl:'https://example.org/alpha/photo',caption:'Alpha ADEX 2025 booth',credit:'Test Photographer',context:'event',eventId,sourceDate:'2025-10-20',rightsStatus:'link-only',sourceIds:['alpha-event'],productId:'alpha-battery'}],boothClaims:[{code:'7-A1',hall:'7',status:'confirmed',sourceIds:['alpha-event'],note:'번호만 확인'}]};
  data.researchBundles=[{schemaVersion:1,eventId,batchId:'fixture',checkedAt:'2026-11-12',cases:[record]}];
  return {data,record,oid};
}
const taxonomy={categories:[{id:'power',label:'전력',directoryLabels:[],productLabels:[],relevanceLabels:[]}]};

test('research registers each evidenced product and keeps catalog background out of actual exhibits',()=>{
  const {data,oid}=fixture(),r=compileRegistry(data);
  assert.equal(r.products.length,3);assert.equal(r.exhibits.length,2);assert(r.exhibits.every(e=>e.status==='onsite_confirmed'));
  assert.equal(r.participations.find(p=>p.organizationId===oid).deepAnalysisStatus,'complete');
  assert.equal(r.metrics[0].deepAnalysisComplete,1);assert.equal(r.metrics[0].notStarted,2);assert.equal(r.metrics[0].insufficientData,0);
  assert.equal(r.metrics[0].overallCompletionPercent,null);assert.equal(r.mapGeometries.length,0);assert.equal(r.metrics[0].numberLinkedOrganizations,1);assert.equal(r.metrics[0].mapLinkedOrganizations,0);
  assert.equal(r.sources.find(s=>s.url.endsWith('/2025/show')).lineage.originGroup,'field-report');
});

test('research distinguishes researched insufficient evidence from untouched organizations and rejects manufactured completion',()=>{
  const {data,record}=fixture();record.review.status='insufficient_data';record.exhibit.items.forEach(p=>p.status='exhibitor_event_statement');
  const r=compileRegistry(data);assert.equal(r.metrics[0].insufficientData,1);assert.equal(r.metrics[0].notStarted,2);assert.equal(r.metrics[0].deepAnalysisComplete,0);assert(r.exhibits.every(e=>e.status==='planned'));
  record.review.status='analysis_complete';assert.throws(()=>compileRegistry(data),/requires actual event exhibit/);
});

test('research refuses cross-edition exhibit proof, nonexistent source links and invented map coordinates',()=>{
  let f=fixture();f.record.sources[0].edition=2023;assert.throws(()=>compileRegistry(f.data),/wrong-edition exhibit source/);
  f=fixture();f.record.exhibit.items[0].sourceIds=['missing'];assert.throws(()=>compileRegistry(f.data),/unknown source/);
  f=fixture();f.record.boothClaims[0].coordinates=[[.1,.2]];assert.throws(()=>compileRegistry(f.data),/cannot create geometry/);
  f=fixture();f.record.photos[0].eventId='adex-2023';assert.throws(()=>compileRegistry(f.data),/photo edition mismatch/);
});

test('research app integration exposes cases and all products while retaining link-only photos and private workflow separation',()=>{
  const {data,oid}=fixture(),r=compileRegistry(data),app=compileAppData({publicData:publicProjection(r),registry:r,taxonomy,researchBundles:data.researchBundles}).events[eventId];
  const company=app.companies.find(c=>c.id===oid);assert.equal(company.productIds.length,3);assert.equal(company.editorialId,'case-alpha');assert.equal(company.mapBoothIds.length,0);assert.deepEqual(company.countries,['대한민국']);
  assert(app.products.some(p=>p.id==='alpha-background'&&p.exhibitStatus==='background_reference'));
  assert.equal(app.photos.find(p=>p.id==='alpha-photo').src,null);assert.equal(company.photoIds.length,1);
  assert(app.eventPhotoIds.includes('alpha-photo'));
  const html=companyPanelMarkup(app,company);assert.match(html,/국가 표기 · 대한민국/);assert.match(html,/일반 제품자료 · 이번 회차 출품 확인 아님/);assert.match(html,/현장 취재로 출품 확인/);
  for(const key of ['metrics','workQueue','collections'])assert.equal(app[key],undefined);
  assert.equal(company.researchStatus,undefined);assert.equal(app.analyses[0].completionStatus,undefined);
});

test('research retains product-level photo links and separate image angles from the same article',()=>{
  const {data,record,oid}=fixture();
  record.photos[0].productId=undefined;record.photos[0].productIds=['alpha-battery','alpha-connector'];record.photos[0].originalImageUrl='https://example.org/image-a.jpg';
  record.photos.push({...record.photos[0],id:'alpha-photo-2',originalImageUrl:'https://example.org/image-b.jpg'});
  const r=compileRegistry(data),links=r.photoLinks.filter(p=>p.photoId==='alpha-photo');
  assert.deepEqual(links.map(p=>p.productId).sort(),['alpha-battery','alpha-connector']);
  const app=compileAppData({publicData:publicProjection(r),registry:r,taxonomy,researchBundles:data.researchBundles}).events[eventId];
  assert.equal(app.companies.find(c=>c.id===oid).photoIds.length,2);assert.equal(app.photos.length,2);
  assert.equal(app.photos[0].productIds.length,2);assert.equal(app.eventPhotoIds.length,2);assert(app.photos.every(p=>p.src===null));
});

test('hall-only claims remain observations without fabricating a shared null-code booth',()=>{
  const {data,record}=fixture();record.boothClaims[0].code=null;record.boothClaims[0].status='unverified';
  const r=compileRegistry(data);assert.equal(r.booths.length,0);assert(r.assertions.some(a=>a.predicate==='listed_hall'&&a.text==='7'));
});

test('shared pavilion photos keep product ownership and do not imply company staff attendance',()=>{
  const {data,record,oid}=fixture();const betaId=compileRegistry(input()).organizations.find(o=>o.name==='Beta').id;
  record.photos[0].productId=undefined;record.photos[0].productIds=['alpha-battery','beta-sensor'];record.photos[0].originalImageUrl='https://example.org/shared-pavilion.jpg';
  const beta={...structuredClone(record),id:'case-beta',organizationId:betaId,displayName:'Beta',boothClaims:[],exhibit:{summary:'Sensor',sourceIds:['alpha-event'],items:[{productId:'beta-sensor',name:'Sensor B',status:'onsite_report_confirmed',form:'공동관 제품 전시',sourceIds:['alpha-event']}]}};
  beta.photos[0].id='different-local-id-for-same-photo';
  data.researchBundles[0].cases.push(beta);
  const r=compileRegistry(data);const links=r.photoLinks.filter(p=>p.photoId==='alpha-photo');
  assert.equal(links.length,2);assert(links.some(p=>p.organizationId===oid&&p.productId==='alpha-battery'));assert(links.some(p=>p.organizationId===betaId&&p.productId==='beta-sensor'));
  assert.equal(r.photos.filter(p=>p.id==='alpha-photo').length,1);assert.equal(r.participations.find(p=>p.organizationId===betaId).attendanceStatus,undefined);
  assert(r.exhibits.find(e=>e.productId==='beta-sensor').status==='onsite_confirmed');
  const app=compileAppData({publicData:publicProjection(r),registry:r,taxonomy,researchBundles:data.researchBundles}).events[eventId];assert.equal(app.photos.length,1);assert.equal(app.eventPhotoIds.length,1);assert.equal(app.photos[0].productIds.length,2);
});

test('research cannot silently duplicate or replace a different editorial identity',()=>{
  const {record}=fixture();const base=[{eventId,cases:[record]}];
  assert.equal(researchEditorialBundles(base,[{eventId,cases:[{...record,reason:'Updated'}]}])[0].cases.length,1);
  assert.throws(()=>researchEditorialBundles(base,[{eventId,cases:[{...record,id:'another'}]}]),/multiple editorial/);
  assert.throws(()=>researchEditorialBundles(base,[{eventId,cases:[{...record,organizationId:'wrong'}]}]),/changes organization/);
});

test('research loader resolves explicit stage3 inheritance and ignores population notes without cases',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'fieldnote-research-'));
  try{
    await mkdir(path.join(root,'data/v2/research/adex-2025'),{recursive:true});await mkdir(path.join(root,'data/v2/editorial'),{recursive:true});
    const {record}=fixture();await writeFile(path.join(root,'data/v2/editorial/adex-2025.json'),JSON.stringify({eventId,cases:[record]}));
    await writeFile(path.join(root,'data/v2/research/adex-2025/population.json'),JSON.stringify({populationComplete:false}));
    await writeFile(path.join(root,'data/v2/research/adex-2025/reconcile.json'),JSON.stringify({schemaVersion:1,eventId,batchId:'reconcile',checkedAt:'2026-11-12',cases:[{extendsEditorialId:record.id,review:{...record.review,status:'insufficient_data'}}]}));
    const bundles=await readResearchBundles(root);assert.equal(bundles.length,1);assert.equal(bundles[0].cases[0].id,record.id);assert.equal(bundles[0].cases[0].exhibit.items.length,3);assert.equal(bundles[0].cases[0].review.status,'insufficient_data');
  }finally{await rm(root,{recursive:true,force:true});}
});
