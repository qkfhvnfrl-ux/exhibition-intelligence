import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const catalog=JSON.parse(await readFile('data/catalog.json','utf8'));
const isHttps=v=>{try{return new URL(v).protocol==='https:';}catch{return false;}};
test('five scoped exhibitions and distinct equipment identities',()=>{
 assert.equal(catalog.exhibitions.length,5);
 assert.equal(new Set(catalog.exhibitions.map(e=>e.id)).size,5);
 assert.ok(catalog.equipment.length>0);
 assert.equal(new Set(catalog.equipment.map(e=>e.id)).size,catalog.equipment.length);
 for(const e of catalog.exhibitions)assert.ok(catalog.equipment.some(x=>x.exhibitions.some(y=>y.id===e.id)),`No equipment for ${e.id}`);
});
test('exhibition claims and numerical specs retain exact sources',()=>{
 const events=new Set(catalog.exhibitions.map(e=>e.id));
 for(const e of catalog.equipment){
  assert.ok(e.name&&e.manufacturer&&e.category);
  assert.ok(e.sources.length>=1,e.id);
  for(const s of e.sources)assert.ok(isHttps(s.url),`Invalid source in ${e.id}: ${s.url}`);
  for(const x of e.exhibitions){assert.ok(events.has(x.id));assert.ok(['confirmed','candidate'].includes(x.status));assert.ok(isHttps(x.evidenceUrl));}
  for(const s of e.specs){assert.ok(s.label&&s.value);assert.ok(isHttps(s.sourceUrl),`Spec lacks source ${e.id}/${s.label}`);}
 }
});
test('analysis separates facts, interpretations and unknowns',()=>{
 for(const e of catalog.equipment){
  assert.ok(e.analysis.length>=3,e.id);
  for(const a of e.analysis){assert.ok(a.criterion&&a.title);assert.equal(typeof a.fact,'string');assert.equal(typeof a.interpretation,'string');assert.equal(typeof a.unknown,'string');assert.ok(a.sourceUrls.length>0);a.sourceUrls.forEach(u=>assert.ok(isHttps(u)));}
  for(const c of e.changes){assert.ok(['verified','insufficient'].includes(c.status));assert.ok(c.sourceUrls.length>=1);}
 }
});
test('photos have local files, rights metadata and explicit context',async()=>{
 assert.ok(catalog.photos.length>0);
 const ids=new Set();const equipment=new Set(catalog.equipment.map(x=>x.id));
 for(const p of catalog.photos){
  assert.ok(!ids.has(p.id),`Duplicate photo id ${p.id}`);ids.add(p.id);
  assert.ok(equipment.has(p.equipmentId),`Unknown equipment ${p.equipmentId}`);
  assert.ok(p.src.startsWith('assets/photos/')&&!p.src.includes('..'));
  assert.ok(isHttps(p.sourceUrl)&&p.author&&p.license&&isHttps(p.licenseUrl));
  assert.ok(['reference','event'].includes(p.context));
  if(p.context==='event')assert.ok(p.eventId);
  if(p.context==='reference')assert.ok(p.variantNote,`Reference image needs variant note ${p.id}`);
  assert.ok((await stat(path.resolve(p.src))).size>1000);
 }
});
test('rubric criterion identifiers remain unique and all analysis maps to rubric',()=>{
 const keys=new Set(catalog.criteria.map(x=>x.id));
 assert.equal(keys.size,catalog.criteria.length);
 for(const e of catalog.equipment)for(const a of e.analysis)assert.ok(keys.has(a.criterion),`Unknown criterion ${a.criterion}`);
});
