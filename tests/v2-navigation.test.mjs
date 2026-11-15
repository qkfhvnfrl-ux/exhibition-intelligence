import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_STATE,parseState,serializeState,patchState,companySelection,mapReturn,eventSelection} from '../src/v2/state.js';

const company={id:'org-rotem',boothIds:['shared-south','shared-north'],mapBoothIds:['shared-south','shared-north']};
const original=patchState(DEFAULT_STATE,{event:'adex-2025',q:'현대 K2PL',category:'complete_vehicle',area:'10',booth:'shared-north',view:{x:.324916,y:.733776,z:4.5},compare:['org-rotem','org-kia']});

test('separate company and product links preserve map position, area and search through refresh',()=>{
 const selected=companySelection(original,company,{productId:'k2pl'});
 const restored=parseState(serializeState(selected));
 assert.equal(restored.route,'company');
 assert.equal(restored.company,company.id);
 assert.equal(restored.product,'k2pl');
 assert.equal(restored.booth,'shared-north');
 assert.deepEqual(restored.view,original.view);
 assert.equal(restored.area,original.area);
 assert.equal(restored.q,original.q);
 assert.equal(restored.category,original.category);
 assert.deepEqual(restored.compare,original.compare);
 const returned=parseState(serializeState(mapReturn(restored)));
 assert.equal(returned.route,'explore');
 assert.equal(returned.company,'');
 assert.equal(returned.product,'');
 assert.deepEqual(returned.view,original.view);
 assert.equal(returned.area,original.area);
 assert.equal(returned.q,original.q);
 assert.equal(returned.booth,original.booth);
});

test('browser history entries can restore both selected product and the prior map without an extra focus command',()=>{
 const history=[serializeState(original)];
 const selected=companySelection(original,company,{productId:'수소 차륜형/모델&2025'});
 history.push(serializeState(selected));
 history.push(serializeState(patchState(selected,{route:'report',photo:''})));
 const backToProduct=parseState(history[1]);
 assert.equal(backToProduct.product,'수소 차륜형/모델&2025');
 assert.deepEqual(backToProduct.view,original.view);
 assert.deepEqual(parseState(history[0]),original);
 assert.deepEqual(parseState(history[2]).view,original.view);
});

test('shared-booth choice retains the clicked booth without changing filters or the map camera',()=>{
 const selected=companySelection(original,company,{boothId:'shared-south'});
 assert.equal(selected.booth,'shared-south');
 assert.deepEqual(selected.view,original.view);
 assert.equal(selected.area,'10');
 assert.equal(selected.q,'현대 K2PL');
 const unmapped=companySelection(original,{id:'unmapped',boothIds:[],mapBoothIds:[]});
 assert.equal(unmapped.booth,'');
 assert.equal(unmapped.route,'company');
 assert.deepEqual(unmapped.view,original.view);
 const invalid=companySelection(original,company,{boothId:'foreign-booth'});
 assert.equal(invalid.booth,'shared-north');
});

test('old split-screen links keep company/photo identifiers and new product URLs remain bounded',()=>{
 const old=parseState('#explore?event=adex-2025&company=org-rotem&photo=photo-1&x=.3&y=.7&z=4&q=현대로템');
 assert.equal(old.company,'org-rotem');
 assert.equal(old.photo,'photo-1');
 assert.deepEqual(old.view,{x:.3,y:.7,z:4});
 assert.equal(parseState(serializeState({...old,route:'company',product:'k2pl'})).product,'k2pl');
 assert.equal(parseState('#company?product='+encodeURIComponent('x'.repeat(200))).product.length,160);
});

test('switching any registered edition starts from its map and clears edition-specific selections',()=>{
 for(const event of ['adex-2025','eurosatory-2026','dsei-2025','idex-2025','saha-2026']){
  const changed=eventSelection(companySelection(original,company,{productId:'k2pl'}),event);
  assert.equal(changed.event,event);
  assert.equal(changed.route,'explore');
  for(const field of ['company','booth','photo','product','q','category'])assert.equal(changed[field],'');
  assert.equal(changed.area,'all');
  assert.deepEqual(changed.compare,[]);
  assert.deepEqual(changed.view,DEFAULT_STATE.view);
  assert.deepEqual(parseState(serializeState(changed)),changed);
 }
});
