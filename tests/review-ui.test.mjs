import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as reviewState from '../src/review-state.js';

const reviewData=JSON.parse(await readFile('data/review.json','utf8'));
const reviewPhotos=JSON.parse(await readFile('data/review-photos.json','utf8'));
const reviewCatalog=JSON.parse(await readFile('data/catalog.json','utf8'));
const source=await readFile('src/review.js','utf8');
// Exercise the shipped review renderer and registered handlers. This does not
// claim to verify layout, browser storage quotas, or PDF pagination.
const script=source.replace(/^import[^\n]*\n/gm,'').replace(/\ninit\(\);\s*$/,'');
assert.notEqual(script,source);

function harness(){
  const elements=new Map(),handlers=new Map(),storage=new Map(),mounted=[];
  const controls={failStorage:false,printed:0,cleanups:0,images:[],confirm:true,writes:0};
  const element=selector=>{
    if(!elements.has(selector))elements.set(selector,{
      innerHTML:'',textContent:'',className:'',style:{},isConnected:true,
      classList:{add(){},remove(){},contains(){return false;}},
      querySelector(){return null;},querySelectorAll(){return [];},focus(){},scrollIntoView(){}
    });
    return elements.get(selector);
  };
  const document={
    querySelector:element,getElementById:id=>element('#'+id),
    querySelectorAll(selector){return selector==='.report-pages img'?controls.images:[];},
    addEventListener(name,fn){handlers.set(name,fn);},
    body:{classList:{add(){},remove(){}}},activeElement:null
  };
  const context=vm.createContext({
    ...reviewState,esc:reviewState.escapeHtml,document,URL,structuredClone,Blob,
    location:{hash:'#briefing'},
    window:{addEventListener(){},scrollTo(){},confirm:()=>controls.confirm,print(){controls.printed++;}},
    localStorage:{getItem:key=>storage.get(key)||null,setItem(key,value){if(controls.failStorage)throw new Error('QuotaExceededError');storage.set(key,value);controls.writes++;}},
    setTimeout(){return 1;},clearTimeout(){},crypto:{randomUUID:()=>String(controls.writes+1)},
    FormData:class {constructor(form){this.values=form.values;}get(name){return this.values[name]??null;}},
    mountFieldRecords(node,options){mounted.push({type:'records',node,options});return ()=>controls.cleanups++;},
    mountPublicGallery(node,options){mounted.push({type:'gallery',node,options});return ()=>controls.cleanups++;},
    fixtureData:structuredClone(reviewData),fixturePhotos:structuredClone(reviewPhotos),fixtureCatalog:structuredClone(reviewCatalog)
  });
  const run=code=>vm.runInContext(code,context);
  run(script);
  run('data=fixtureData;photos=fixturePhotos;catalog=fixtureCatalog;workspace=cleanBackup(workspace,data,photos);loadComparison();');
  const change=target=>handlers.get('change')({target:{dataset:{},...target}});
  const click=(action,dataset={})=>{
    const target={dataset:{action,...dataset},classList:{contains(){return false;}}};
    return handlers.get('click')({target:{closest(selector){return selector==='[data-action]'?target:null;}}});
  };
  const submit=values=>handlers.get('submit')({preventDefault(){},target:{id:'annotation-form',values}});
  const beginAnnotation=()=>run('state.modal={type:"annotation",photoId:photos[0].id,caseId:photos[0].equipmentId,x:40,y:60};');
  return {run,context,elements,storage,controls,mounted,change,click,submit,beginAnnotation,handlers};
}

const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('review routes render real evidence and mount then clean up optional panels',()=>{
  const {run,context,elements,mounted,controls}=harness();
  for(const route of ['briefing','exhibition','compare','trend','report',...reviewData.cases.map(c=>'cases/'+c.id)]){
    context.location.hash='#'+route;
    assert.doesNotThrow(()=>run('render()'),route);
    const html=elements.get('#app').innerHTML;
    assert.match(html,/<main id="main">/);
    assert.ok(html.includes('작업 백업'));
    assert.ok(html.includes(reviewData.cases[0].name));
    assert.ok(html.includes('https://'),'Evidence links remain available on '+route);
  }
  context.location.hash='#gallery';run('render()');
  assert.equal(mounted.at(-1).type,'gallery');
  assert.equal(mounted.at(-1).options.catalog.equipment.length,reviewCatalog.equipment.length);
  context.location.hash='#records';run('render()');
  assert.equal(controls.cleanups,1);
  assert.equal(mounted.at(-1).type,'records');
  assert.equal(mounted.at(-1).options.cases.length,reviewData.cases.length);
  context.location.hash='#briefing';run('render()');
  assert.equal(controls.cleanups,2);
});

test('failed writes never report success for notes, task status, restoration or annotations',async()=>{
  const h=harness(),caseId=reviewData.cases[0].id;
  h.handlers.get('input')({target:{id:'case-note',dataset:{case:caseId},value:'보존할 메모'}});
  assert.match(h.elements.get('#note-status').textContent,/저장했습니다/);
  const durable=h.storage.get(reviewState.STORAGE_KEY);
  h.controls.failStorage=true;
  h.handlers.get('input')({target:{id:'case-note',dataset:{case:caseId},value:'저장 실패 메모'}});
  assert.match(h.elements.get('#note-status').textContent,/저장하지 못/);
  assert.equal(h.storage.get(reviewState.STORAGE_KEY),durable);
  assert.equal(h.run('workspace.draft.notes[data.cases[0].id]'),'저장 실패 메모','In-memory work remains available for backup');
  await h.change({id:'task-state',dataset:{case:caseId},value:'review'});
  assert.match(h.elements.get('#toast').textContent,/저장하지 못/);
  const backup=h.run('JSON.stringify(workspace)');
  await h.change({id:'restore',files:[{size:backup.length,text:async()=>backup}]});
  assert.match(h.elements.get('#toast').textContent,/저장하지 못/);
  h.beginAnnotation();h.submit({kind:'사진 관찰',text:'저장 실패 시도',sourceUrl:''});
  assert.match(h.elements.get('#toast').textContent,/저장하지 못/);
  assert.equal(h.run('workspace.draft.annotations.length'),1);
});

test('annotation entry enforces the limit without changing existing notes',()=>{
  const h=harness();
  h.run('workspace.draft.annotations=Array.from({length:MAX_ANNOTATIONS},(_,i)=>({id:"note-"+i,caseId:photos[0].equipmentId,photoId:photos[0].id,x:1,y:2,kind:"사진 관찰",text:"기존 "+i,sourceUrl:""}));');
  const original=h.run('JSON.stringify(workspace.draft.annotations)');
  h.beginAnnotation();h.submit({kind:'사진 관찰',text:'초과 주석',sourceUrl:''});
  assert.equal(h.run('JSON.stringify(workspace.draft.annotations)'),original);
  assert.equal(h.controls.writes,0);
  assert.match(h.elements.get('#toast').textContent,new RegExp('최대 '+reviewState.MAX_ANNOTATIONS));
  h.run('workspace.draft.annotations.pop();');
  h.beginAnnotation();h.submit({kind:'사진 관찰',text:'추가 허용 주석',sourceUrl:'https://example.org/evidence'});
  assert.equal(h.run('workspace.draft.annotations.length'),reviewState.MAX_ANNOTATIONS);
  assert.equal(h.run('workspace.draft.annotations.at(-1).text'),'추가 허용 주석');
  assert.equal(h.controls.writes,1);
});

test('selected comparison photos follow side swaps, persistence and frozen reports',async()=>{
  const h=harness();
  h.run('photos.push({...photos.find(p=>p.equipmentId===state.left),id:"test-secondary",src:"assets/adex2025/test-secondary.webp",caption:"다른 각도"});');
  await h.change({dataset:{comparePhoto:'left'},value:'test-secondary'});
  assert.equal(h.run('workspace.draft.comparison.leftPhoto'),'test-secondary');
  h.click('swap');
  assert.equal(h.run('workspace.draft.comparison.rightPhoto'),'test-secondary');
  assert.equal(h.run('workspace.draft.comparison.right'),reviewData.cases[0].id);
  assert.ok(h.run('report()').includes('assets/adex2025/test-secondary.webp'));
  assert.equal(JSON.parse(h.storage.get(reviewState.STORAGE_KEY)).draft.comparison.rightPhoto,'test-secondary');
  h.click('snapshot');
  const snapshotId=h.run('state.reportId');
  await h.change({dataset:{comparePhoto:'right'},value:reviewPhotos.find(p=>p.equipmentId===reviewData.cases[0].id).id});
  assert.equal(h.run('state.reportId'),snapshotId);
  assert.ok(h.run('report()').includes('assets/adex2025/test-secondary.webp'),'Confirmed report preserves selected photo');
  await h.change({id:'report-version',value:'draft'});
  assert.ok(!h.run('report()').includes('assets/adex2025/test-secondary.webp'),'Draft reflects the new selected photo');
  await h.change({id:'compare-left',value:reviewData.cases[0].id});
  assert.notEqual(h.run('state.left'),h.run('state.right'),'Selecting the same case swaps the other side');
});

test('invalid backup never replaces current work and unsafe annotation links are rejected',async()=>{
  const h=harness();
  h.run('workspace.draft.notes[data.cases[0].id]="보존할 작업";');
  const original=h.run('JSON.stringify(workspace)');
  await h.change({id:'restore',files:[{size:2,text:async()=>'{}'}]});
  assert.equal(h.run('JSON.stringify(workspace)'),original);
  assert.match(h.elements.get('#toast').textContent,/백업 파일이 아닙니다/);
  h.beginAnnotation();h.submit({kind:'사진 관찰',text:'관찰',sourceUrl:'javascript:alert(1)'});
  assert.equal(h.run('workspace.draft.annotations.length'),0);
  assert.match(h.elements.get('#toast').textContent,/http 또는 https/);
  const payload='<img src=x onerror="alert(1)">';
  h.context.payload=payload;h.run('workspace.draft.notes[data.cases[0].id]=payload;');
  assert.ok(!h.run('report()').includes(payload));
  assert.ok(h.run('report()').includes('&lt;img'));
});

test('report printing waits for decoded photographs and stops on image failure',async()=>{
  const h=harness();
  let finish;
  h.controls.images=[{loading:'lazy',decode:()=>new Promise(resolve=>{finish=resolve;})}];
  h.click('print');
  assert.equal(h.controls.printed,0);
  assert.equal(h.controls.images[0].loading,'eager');
  finish();await tick();
  assert.equal(h.controls.printed,1);
  h.controls.images=[{loading:'lazy',decode:()=>Promise.reject(new Error('failed image'))}];
  h.click('print');await tick();
  assert.equal(h.controls.printed,1);
  assert.match(h.elements.get('#toast').textContent,/사진을 모두 불러오지 못/);
});
