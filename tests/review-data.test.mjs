import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {safeImage,safeUrl} from '../src/review-state.js';
const data=JSON.parse(await readFile('data/review.json'));
const photos=JSON.parse(await readFile('data/review-photos.json'));
test('review bundle preserves three cases, a comparison, a trend and an executive brief',()=>{
 assert.deepEqual(data.cases.map(c=>c.id),['k2pl','light-105','rcws']);
 assert.equal(data.event.id,'adex-2025');
 assert.ok(data.cases.every(c=>c.eventStatus==='confirmed'));
 assert.equal(data.briefing.length,3);assert.ok(data.comparison.rows.length>=3);assert.ok(data.trend.items.length>=1);
 for(const c of data.cases){assert.ok(c.observations.length>=3);assert.ok(c.sources.length>=2);for(const o of c.observations){assert.ok(o.fact&&o.interpretation&&o.question);assert.ok(o.sourceUrls.every(safeUrl));}}
});
test('review photos have verified local bytes, credits, rights and honest exhibition context',async()=>{
 assert.equal(new Set(photos.map(p=>p.id)).size,photos.length);
 assert.ok(photos.length>=3);
 assert.ok(photos.filter(p=>p.context==='event'&&p.eventId==='adex-2025').length>=3);
 for(const p of photos){assert.ok(safeImage(p.src));assert.ok(safeUrl(p.sourceUrl));assert.ok(p.author&&p.license&&p.variantNote);assert.ok(['event','reference'].includes(p.context));if(p.context==='event')assert.ok(p.eventId);else assert.ok(p.variantNote);const bytes=await readFile(p.src);assert.equal(createHash('sha256').update(bytes).digest('hex'),p.sha256,p.id);}
});
test('photo pins map to the intended case, photograph and analysis with bounded coordinates',()=>{
 assert.equal(data.photoObservations.length,9);
 for(const pin of data.photoObservations){const c=data.cases.find(c=>c.id===pin.caseId),p=photos.find(p=>p.id===pin.photoId);assert.ok(c&&p);assert.equal(p.equipmentId,c.id);assert.ok(c.observations.some(o=>o.id===pin.observationId));assert.ok(pin.x>=0&&pin.x<=100&&pin.y>=0&&pin.y<=100);assert.ok(pin.visualObservation);}
});
