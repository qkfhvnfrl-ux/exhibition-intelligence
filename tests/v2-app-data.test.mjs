import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileAppData,normalizePhoto,validateAppEvent} from '../scripts/compile-v2-app.mjs';
import {getBoothCompanies,getCompanyPhotos,searchCompanies,safeAssetPath,safeUrl,tourCompanies} from '../src/v2/data.js';

const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8').then(JSON.parse);
const [publicData,registry,taxonomy,mapDisplay]=await Promise.all([read('data/v2/public.json'),read('data/v2/registry.json'),read('data/v2/taxonomy.json'),read('data/v2/map-display.json')]);
const output=compileAppData({publicData,registry,taxonomy,mapDisplay});
const adex=output.events['adex-2025'];

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
  const example={id:'case-example',organizationId:company.id,categoryIds:['complete_vehicle'],reason:'조건이 있는 사례 판단',highlights:['가','나','다'],exhibit:{items:[{name:'문서로 확인한 사례제품',form:'model',status:'displayed_model',sourceIds:['example-source']}]},distinction:{status:'not_comparable'},direction:{observation:'발표 근거',interpretation:'해석'},workConnection:{value:'적용 조건 확인',conditions:['질량']},followUps:['형상?','운용조건?'],sources:[{id:'example-source',url:'https://example.com/adex-2025',title:'2025 원문'}],photos:[],catalogs:[]};
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
