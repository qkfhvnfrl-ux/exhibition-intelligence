import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const catalog=JSON.parse(await readFile('data/catalog.json','utf8'));
const source=await readFile('src/app.js','utf8');
// Exercise the shipped browser functions without making network requests.
// This harness checks rendering and state; browser QA covers layout and focus.
const script=source.replace(/\ninit\(\);\s*$/,'');
assert.notEqual(script,source,'The test harness must remove only the startup call.');

function harness(){
  const elements=new Map();
  const storage=new Map();
  const document={
    querySelector(selector){
      if(!elements.has(selector))elements.set(selector,{
        innerHTML:'',textContent:'',classList:{add(){},remove(){}},
        querySelector(){return null;},focus(){}
      });
      return elements.get(selector);
    },
    querySelectorAll(){return [];},addEventListener(){},
    body:{classList:{add(){},remove(){}}}
  };
  const context=vm.createContext({
    document,location:{hash:'#overview'},
    window:{addEventListener(){},scrollTo(){}},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
    setTimeout(){return 1;},clearTimeout(){},URL,
    catalog:structuredClone(catalog)
  });
  const run=code=>vm.runInContext(code,context);
  run(script);
  run('data=catalog;loadWorkspace();');
  return {run,context,elements,storage};
}

test('main pages, equipment tabs and selected reports render against the catalog',()=>{
  const {run,context,elements}=harness();
  const first=catalog.equipment[0];
  const routes=['overview','exhibitions','library','compare','trends','reports','settings',
    ...catalog.exhibitions.map(e=>'exhibitions/'+e.id),
    ...['overview','photos','specs','analysis','changes','sources'].map(tab=>'equipment/'+first.id+'/'+tab)];
  for(const route of routes){
    context.location.hash='#'+route;
    assert.doesNotThrow(()=>run('render()'),route);
    assert.match(elements.get('#app').innerHTML,/<main\b/,route);
  }
  run('workspace.selected=data.equipment.slice(0,4).map(x=>x.id);workspace.reports=workspace.selected.slice();');
  assert.match(run('compare()'),/comparison-table/);
  assert.match(run('reports()'),/report-document/);
  // Exhibition evidence counts must use the explicit edition, not a stale filter.
  run('state.exhibition="a-filter-that-does-not-match";');
  context.eventId=catalog.exhibitions[0].id;
  const count=catalog.equipment.filter(e=>e.exhibitions.some(x=>x.id===context.eventId&&x.status==='confirmed')).length;
  const stats=run('stats(data.equipment,eventId)');
  assert.ok(stats.includes('전시 근거 확인</span><strong>'+count+'<small>'));
});

test('comparison selection enforces the four-record limit and can be removed',()=>{
  assert.ok(catalog.equipment.length>=5,'Selection-limit test requires at least five records.');
  const {run,elements}=harness();
  run('data.equipment.slice(0,5).forEach(item=>toggleCompare(item.id));');
  assert.equal(run('workspace.selected.length'),4);
  assert.match(elements.get('#toast').textContent,/최대 4개/);
  run('toggleCompare(data.equipment[0].id);toggleCompare("unknown-equipment");');
  assert.equal(run('workspace.selected.length'),3);
  assert.equal(run('workspace.selected.includes(data.equipment[0].id)'),false);
});

test('workspace restore validates schema, bounds text and preserves report choices',()=>{
  const {run,context}=harness();
  const ids=catalog.equipment.slice(0,5).map(x=>x.id);
  const criterion=catalog.criteria[0];
  context.backup={schemaVersion:1,notes:{[ids[0]]:'x'.repeat(21000),unknown:'discard'},
    selected:[...ids,ids[0],'unknown'],reports:[ids[0],ids[1],ids[0],'unknown'],
    criteria:[null,{...criterion,label:'y'.repeat(100),enabled:false},{id:'unknown',label:'discard'}]};
  run('workspace=cleanWorkspace(backup);save();loadWorkspace();');
  assert.equal(run('workspace.selected.length'),4);
  assert.equal(run('workspace.reports.length'),2);
  assert.equal(run('Object.keys(workspace.notes).length'),1);
  assert.equal(run('Object.values(workspace.notes)[0].length'),20000);
  assert.equal(run('workspace.criteria[0].label.length'),80);
  assert.equal(run('workspace.criteria[0].enabled'),false);
  assert.equal(run('workspace.criteria.length'),catalog.criteria.length);
  assert.throws(()=>run('cleanWorkspace({schemaVersion:99})'),/지원하지 않는 백업/);
});

test('imported text is escaped and unsafe source or photo URLs are rejected',()=>{
  const {run,context}=harness();
  const payload='<img src=x onerror="alert(1)"><script>alert(2)</script>';
  context.payload=payload;
  run('workspace.notes[data.equipment[0].id]=payload;workspace.criteria[0].label=payload;');
  const html=run('reportItem(data.equipment[0])+settings()');
  assert.ok(!html.includes(payload));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;img'));
  for(const unsafe of ['javascript:alert(1)','data:text/html,test','file:///etc/passwd','not-a-url']){
    context.unsafe=unsafe;
    assert.equal(run('url(unsafe)'),'#');
  }
  assert.equal(run('url("https://example.com/source")'),'https://example.com/source');
  for(const unsafe of ['https://example.com/photo.jpg','assets/photos/../secret.jpg','data:image/png;base64,AA']){
    context.unsafe=unsafe;
    assert.equal(run('src(unsafe)'),'');
  }
});

test('comparison CSV retains evidence and quotes spreadsheet-formula prefixes',()=>{
  const {run}=harness();
  run(`
    workspace.selected=data.equipment.slice(0,2).map(x=>x.id);
    data.equipment[0].specs=[{label:'=SUM(1,2)',value:'  =1+1',sourceUrl:'https://example.com/spec',note:'variant, reference'}];
    download=(filename,content,mime)=>{globalThis.capturedExport={filename,content,mime};};
    exportCsv();
  `);
  const exported=run('capturedExport');
  assert.equal(exported.filename,'fieldnote-comparison.csv');
  assert.ok(exported.content.startsWith('\uFEFF'));
  assert.ok(exported.content.includes('"\'=SUM(1,2)"'));
  assert.ok(exported.content.includes('"\'  =1+1"'));
  assert.ok(exported.content.includes('https://example.com/spec'));
  assert.ok(exported.content.includes('"variant, reference"'));
});
