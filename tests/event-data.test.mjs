import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const data=JSON.parse(await readFile('data/event-reports.json','utf8'));
const url=value=>{try{return new URL(value).protocol==='https:';}catch{return false;}};
test('five current exhibition editions stay inside the declared two-year scope',()=>{
 assert.equal(data.scope.startDate,'2024-11-11');assert.equal(data.scope.endDate,'2026-11-11');
 assert.deepEqual(data.events.map(e=>e.id).sort(),['adex-2025','dsei-2025','eurosatory-2026','idex-2025','saha-2026']);
 for(const event of data.events){assert.ok(event.equipment.length>0,event.id);assert.ok(url(event.sourceUrl));assert.ok([2025,2026].includes(event.year));}
});
test('report entries use short strategic interpretation and exact event photo provenance',()=>{
 for(const event of data.events){
  assert.equal(new Set(event.equipment.map(e=>e.id)).size,event.equipment.length);
  for(const item of event.equipment){
   assert.ok(item.strategySummary?.length>20&&item.strategySummary.length<=500,item.id);
   assert.ok(item.sourceUrls?.length&&item.sourceUrls.every(url),item.id);
   assert.ok(Array.isArray(item.photos),item.id);
   for(const p of item.photos){assert.equal(p.eventId,event.id,p.id);assert.equal(p.context,'event',p.id);assert.ok(url(p.sourceUrl),p.id);assert.ok(p.author&&p.license&&p.verificationNote,p.id);assert.ok(['reusable','provider-embed','link-only'].includes(p.rightsStatus),p.id);}
  }
 }
});
test('local photo bytes and externally displayed permissions are traceable',async()=>{
 for(const p of data.events.flatMap(e=>[...(e.eventPhotos||[]),...e.equipment.flatMap(c=>c.photos)])){
  if(p.src){assert.equal(p.rightsStatus,'reusable');assert.ok(p.licenseUrl&&url(p.licenseUrl));assert.equal(createHash('sha256').update(await readFile(p.src)).digest('hex'),p.sha256,p.id);}
  else if(p.rightsStatus==='provider-embed'){assert.equal(p.embedProvider,'flickr');assert.equal(new URL(p.embedImageUrl).hostname,'live.staticflickr.com');assert.ok(url(p.embedEvidenceUrl));assert.ok(new URL(p.sourceUrl).hostname.endsWith('flickr.com'));}
  else if(p.rightsStatus==='reusable'&&p.imageUrl){assert.equal(new URL(p.imageUrl).hostname,'upload.wikimedia.org');assert.ok(url(p.licenseUrl));}
  if(p.rightsStatus==='link-only'){assert.equal(p.src,undefined);assert.equal(p.embedImageUrl,undefined);}
 }
});
test('coverage counts deduplicate images and separate original-link records',()=>{
 for(const event of data.events){
  const unique=[...new Map([...(event.eventPhotos||[]),...event.equipment.flatMap(e=>e.photos)].map(p=>[p.sha256||p.src||p.embedImageUrl||p.imageUrl||p.sourceUrl,p])).values()];
  const displayed=unique.filter(p=>p.rightsStatus==='reusable'&&(p.src||p.imageUrl)||p.rightsStatus==='provider-embed'&&p.embedImageUrl).length;
  assert.equal(event.coverage.equipment,event.equipment.length);
  assert.equal(event.coverage.localPhotos+event.coverage.externalPhotos,displayed,event.id);
  assert.equal(event.coverage.sourceLinks,new Set(unique.filter(p=>p.rightsStatus==='link-only').map(p=>p.sourceUrl)).size,event.id);
 }
});
