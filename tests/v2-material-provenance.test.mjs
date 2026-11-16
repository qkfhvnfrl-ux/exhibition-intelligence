import test from 'node:test';
import assert from 'node:assert/strict';
import {compileAppData} from '../scripts/compile-v2-app.mjs';
import {companyMaterials,productMaterials} from '../src/v2/details.js';

test('compiled material cards retain official provenance, PDF endpoint type and blocked-link restrictions',()=>{
  const eventId='dsei-2025',organizationId='maker',sourceId='maker-product',url='https://maker.example/products/vehicle';
  const publicData={schemaVersion:2,dataAsOf:'2026-11-16',events:[{id:eventId,name:'DSEI',year:2025,sourceIds:[]}],organizations:[{id:organizationId,name:'Maker'}],participations:[{id:'participation',eventId,organizationId,status:'listed'}],products:[],sources:[{id:sourceId,url,title:url}],boothOccupancies:[],booths:[],mapGeometries:[],mapDocuments:[],exhibits:[],analyses:[],assertions:[],photos:[],photoLinks:[],catalogs:[]};
  const registry={organizations:[{id:organizationId}],participations:[{id:'participation',sourceIds:[],relevance:{status:'unreviewed'}}],products:[],rosterEntries:[]};
  const source={id:sourceId,url,title:'Vehicle product page',publisher:'Maker',role:'manufacturer',coverageScope:'general_product',editionStatus:'general',accessStatus:'checked'};
  const blocked={id:'blocked',url:'https://maker.example/blocked',title:'Unavailable product page',publisher:'Maker',role:'manufacturer',coverageScope:'general_product',editionStatus:'general',accessStatus:'blocked'};
  publicData.sources.push({...blocked,accessStatus:'checked'});
  const catalog={id:'pdf-endpoint',url:'https://maker.example/download/17',title:'Vehicle brochure',productIds:['vehicle'],documentType:'pdf',publisher:'Maker',publishedAt:'2025-02-01',checkedAt:'2026-11-16',scope:'general',rights:{status:'link_only'}};
  const editorial={id:'case',organizationId,categoryIds:[],reason:'Vehicle reference',highlights:['a','b','c'],followUps:['a','b'],exhibit:{summary:'General product reference',items:[{productId:'vehicle',name:'Vehicle',status:'background_reference',sourceIds:[sourceId,'blocked']}]},distinction:{judgment:'Reference only'},direction:{observation:'Reference only'},sources:[source,blocked,{...blocked,accessStatus:'checked'}],catalogs:[catalog]};
  const data=compileAppData({publicData,registry,taxonomy:{categories:[{id:'complete_vehicle',label:'Vehicle'}]},editorialBundles:[{eventId,cases:[editorial]}]}).events[eventId];
  const compiled=data.sources.find(item=>item.id===sourceId);
  for(const key of ['role','coverageScope','editionStatus','accessStatus'])assert.equal(compiled[key],source[key],key);
  const pdf=data.catalogs.find(item=>item.id===catalog.id);
  for(const key of ['documentType','publisher','publishedAt','checkedAt'])assert.equal(pdf[key],catalog[key],key);
  const company=data.companies[0],product=data.products[0];
  assert.equal(productMaterials(data,company,product).find(item=>item.id===catalog.id).type,'pdf');
  assert.ok(companyMaterials(data,company).some(item=>item.url===url && item.type==='product'));
  assert.ok(!companyMaterials(data,company).some(item=>item.url===blocked.url));
  assert.ok(data.sources.some(item=>item.id==='blocked' && item.accessStatus==='blocked'),'blocked evidence overrides an earlier checked status and survives a duplicate checked record');
});
