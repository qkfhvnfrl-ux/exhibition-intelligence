import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseState,serializeState,patchState,DEFAULT_STATE} from '../src/v2/state.js';
import {getCompanyPhotos} from '../src/v2/data.js';
import {companyPhotos,companySources,companyPanelMarkup,printReportMarkup,escapeHTML} from '../src/v2/details.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const json=file=>readFile(path.join(root,file),'utf8').then(JSON.parse);
const appIndex=await json('data/v2/app/index.json');
const events=await Promise.all(appIndex.events.map(event=>json(`data/v2/app/events/${event.id}.json`)));
const adex=events.find(event=>event.event.id==='adex-2025');
const publicData=await json('data/v2/public.json');
async function filesWithin(dir){const rows=await readdir(dir,{withFileTypes:true});return(await Promise.all(rows.map(row=>row.isDirectory()?filesWithin(path.join(dir,row.name)):[path.join(dir,row.name)]))).flat();}

test('direct links roundtrip the selected view, search, company, photograph and tour across all three menus',()=>{
  const original=patchState(DEFAULT_STATE,{event:'adex-2025',q:'현대로템 K2PL',category:'complete_vehicle',area:'10',company:'org-bb5b014b7abb0359c75b',booth:'adex-2025-region-hyundai-south',mode:'3d',view:{x:.324916,y:.733776,z:4.5},photo:'photo-f27315794918d9b8ddce',compare:['org-bb5b014b7abb0359c75b','org-b6b486fa375701e51329'],tour:'featured',step:2});
  for(const route of ['explore','companies','report']){
    const state=patchState(original,{route});
    assert.deepEqual(parseState(serializeState(state)),state);
  }
  const closed=patchState(original,{photo:''});
  assert.deepEqual(closed.view,original.view);
  assert.equal(closed.company,original.company);
  assert.equal(closed.q,original.q);
  assert.equal(parseState(serializeState(original)).photo,original.photo);
});

test('old editing routes and malformed camera parameters cannot revive legacy UI state',()=>{
  for(const route of ['records','cases','briefing','trend','gallery','backup','restore'])assert.equal(parseState(`#${route}?event=adex-2025`).route,'explore');
  const bad=parseState('#explore?event=adex-2025&x=NaN&y=999&z=-2&mode=virtual&step=-8&compare=a,a,b,c,d,e');
  assert.deepEqual(bad.view,{x:.5,y:1.15,z:.75});
  assert.equal(bad.mode,'2d');assert.equal(bad.step,0);assert.deepEqual(bad.compare,['a','b','c','d']);
});

test('runtime module closure stays inside v2 and has no personal storage API or old record keys',async()=>{
  const files=(await filesWithin(path.join(root,'src/v2'))).filter(file=>file.endsWith('.js'));
  for(const file of files){
    const source=await readFile(file,'utf8');
    assert.doesNotMatch(source,/\b(?:localStorage|sessionStorage|indexedDB)\s*(?:\.|\[)/,file);
    for(const key of ['fieldnote.review.adex2025.v1','fieldnote.workspace.v1','fieldnote-field-photos-v1'])assert.ok(!source.includes(key),`${file} touches legacy record ${key}`);
    for(const match of source.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)){
      const resolved=path.resolve(path.dirname(file),match[1]);
      assert.ok(resolved.startsWith(path.join(root,'src/v2')+path.sep),`${file} imports ${match[1]}`);
      assert.ok((await stat(resolved)).isFile());
    }
  }
});

const hasDist=await stat(path.join(root,'dist')).then(s=>s.isDirectory()).catch(()=>false);
test('built app contains only the allowed runtime and no archived editing/data entry points',{skip:!hasDist},async()=>{
  const files=(await filesWithin(path.join(root,'dist'))).map(file=>path.relative(path.join(root,'dist'),file));
  for(const file of files)assert.ok(['index.html','version.json','.nojekyll'].includes(file)||/^(?:src\/v2\/|data\/v2\/app\/|assets\/)/.test(file),`unexpected deploy file: ${file}`);
  for(const file of ['legacy.html','src/app.js','src/review.js','src/review-state.js','src/field-records.js','data/review.json','data/v2/registry.json'])assert.ok(!files.includes(file),file);
  const html=await readFile(path.join(root,'dist/index.html'),'utf8');
  assert.match(html,/src\/v2\/app\.js/);
  assert.doesNotMatch(html,/src\/(?:review|app|field-records|public-gallery|event-reports)\.(?:js|css)/);
});

test('runtime map polygons remain byte-for-value copies of verified source geometry',()=>{
  for(const event of events){
    const expected=publicData.mapGeometries.filter(g=>g.eventId===event.event.id);
    assert.equal(event.mapGeometries.length,expected.length);
    for(const geometry of event.mapGeometries){
      const original=expected.find(g=>g.id===geometry.id);assert.ok(original,geometry.id);
      assert.deepEqual(geometry.coordinates,original.coordinates);
      assert.equal(geometry.coordinateSpace,'normalized_original');
      assert.equal(geometry.documentId,original.documentId);
    }
  }
  assert.equal(adex.mapGeometries.length,32);
});

test('every photograph button can resolve the same stable photo ID in a direct-link viewer',()=>{
  for(const event of events)for(const company of event.companies){
    const viewerPhotos=getCompanyPhotos(event,company.id);
    for(const photo of companyPhotos(event,company)){
      const route=parseState(serializeState(patchState(DEFAULT_STATE,{event:event.event.id,company:company.id,photo:photo.id})));
      const found=viewerPhotos.find(p=>p.id===route.photo);
      assert.ok(found,`${company.name}: missing viewer photo ${photo.id}`);
      assert.equal(found.context,photo.context);
      assert.equal(found.sourceUrl,photo.sourceUrl);
    }
  }
});

test('actual editorial source conditions and issuer/republication status survive screen and print rendering',()=>{
  for(const company of adex.companies.filter(c=>c.editorialId)){
    const editorial=adex.editorials.find(e=>e.id===company.editorialId);
    assert.ok(editorial.sourceIds?.length,`${company.name}: editorial source links missing`);
    const linkedSources=companySources(adex,company);
    const html=companyPanelMarkup(adex,company),printed=printReportMarkup(adex,[company.id]);
    for(const id of editorial.sourceIds||[]){
      const source=adex.sources.find(s=>s.id===id);assert.ok(source,id);
      const displayed=linkedSources.find(s=>s.url===source.url);assert.ok(displayed,id);
      if(source.note){
        assert.ok(html.includes(escapeHTML(source.note)),`${company.name}: screen dropped ${id} condition`);
        assert.ok(printed.includes(escapeHTML(source.note)),`${company.name}: print dropped ${id} condition`);
      }
      if(source.evidenceStatus==='single_source')assert.match(html,/단일 근거/);
      if(source.evidenceStatus==='same_origin_republication')assert.match(html,/재전재|동일 원문|같은 원문|동일 계열/);
    }
  }
});
