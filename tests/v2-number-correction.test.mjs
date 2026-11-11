import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileRegistry,publicProjection} from '../scripts/compile-v2-data.mjs';
import {validateRegistry} from '../scripts/validate-v2-data.mjs';

const load=async relative=>JSON.parse(await readFile(new URL(relative,import.meta.url),'utf8'));
const [ledger,bundle,correction]=await Promise.all(['../data/v2/collection/adex-2025.json','../data/v2/maps/adex-2025.json','../data/v2/corrections/adex-2025-pei-number.json'].map(load));
const compile=()=>compileRegistry({catalog:{exhibitions:[],equipment:[],photos:[]},eventReports:{events:[{id:'adex-2025',name:'Seoul ADEX 2025',year:2025,equipment:[],eventPhotos:[]}]},review:{event:{id:'adex-2025'},cases:[]},reviewPhotos:[],ledgers:[ledger],mapBundles:[bundle]});

test('PEI conflicting issuer announcements do not become a current booth number',()=>{
  const raw=ledger.entries.find(e=>e.id===correction.rosterEntryId);
  assert.deepEqual(raw.boothCodes,[]);
  assert.equal(raw.boothNumberStatus,'conflicting_sources');
  assert.deepEqual(raw.numberClaims.map(c=>c.code),['18-20','7-C11']);
  const d=compile(),b=d.booths.find(b=>b.id===correction.stableBoothId);
  assert(b,'The previous stable booth ID must survive the withdrawn number');
  assert.equal(b.code,null);assert.equal(b.numberStatus,'unverified');
  assert(!d.assertions.some(a=>a.subjectId===b.id&&a.predicate==='booth_number'));
  assert.equal(d.metrics[0].numberLinkedOrganizations,0);
  assert.equal(d.booths.filter(x=>x.regionIds?.includes(correction.regionId)).length,1);
});

test('PEI correction preserves the verified source-plan polygon and region identity',()=>{
  const d=compile(),b=d.booths.find(b=>b.id===correction.stableBoothId);
  assert.deepEqual(b.regionIds,['adex-2025-region-pei-genesis']);
  assert.equal(b.geometryStatus,'verified');
  assert.equal(d.mapGeometries.length,32);
  assert.deepEqual(d.mapGeometries.find(g=>g.boothId===b.id).coordinates,[[.25390585,.28050168],[.26801732,.28050168],[.26801732,.29047891],[.25390585,.29047891],[.25390585,.28050168]]);
});

test('PEI public number condition exposes both source claims without inventing publication dates',()=>{
  const d=compile(),p=publicProjection(d),b=p.booths.find(b=>b.id===correction.stableBoothId);
  assert.equal(b.numberEvidence.status,'conflicting_sources');
  assert.equal(b.numberEvidence.sourceIds.length,2);
  assert.equal(b.numberEvidence.note,correction.note);
  const claims=b.numberEvidence.claims;
  assert.equal(claims.find(c=>c.code==='18-20').publishedAt,'2025-10-02');
  assert.equal(claims.find(c=>c.code==='7-C11').publishedAt,null);
  assert.deepEqual(claims.map(c=>p.sources.find(s=>s.id===c.sourceIds[0]).url),correction.claims.map(c=>c.sourceUrl));
  assert.deepEqual(new Set(b.numberEvidence.sourceIds.map(id=>d.sources.find(s=>s.id===id).lineage.originGroup)),new Set(['pei-official-adex2025']));
});

test('v2 rejects silently promoting a conflicted booth number or removing a conflict source',()=>{
  let d=compile(),b=d.booths.find(b=>b.id===correction.stableBoothId);
  b.code='7-C11';b.numberStatus='confirmed';
  assert.throws(()=>validateRegistry(d),/conflicting booth numbers/);
  d=compile();b=d.booths.find(b=>b.id===correction.stableBoothId);
  b.numberVerification.claims[0].sourceIds=[];
  assert.throws(()=>validateRegistry(d),/number conflict claim needs evidence/);
});
