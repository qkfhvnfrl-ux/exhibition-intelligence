import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  MAX_ANNOTATIONS, blankDraft, escapeHtml, safeUrl, safeImage,
  sanitizeDraft, createSnapshot, cleanBackup
} from '../src/review-state.js';

const reviewData=JSON.parse(await readFile('data/review.json','utf8'));
const cases=reviewData.cases.map(c=>c.id);
const sourcePhotos=JSON.parse(await readFile('data/review-photos.json','utf8'));
// Keep the first photograph for each case at the corresponding case index.
const firstPhotos=cases.map(id=>sourcePhotos.find(p=>p.equipmentId===id));
const photos=[...firstPhotos,...sourcePhotos.filter(p=>!firstPhotos.includes(p))];
const photoIds=photos.map(p=>p.id);
const makeAnnotation=(overrides={})=>({id:'annotation-1',caseId:cases[0],photoId:photoIds[0],x:25,y:60,text:'외부 형상 관찰',kind:'사진 관찰',sourceUrl:'https://example.org/evidence',...overrides});
const makeBackup=(overrides={})=>({schemaVersion:1,application:'fieldnote-review',draft:blankDraft(),snapshots:[],...overrides});

test('review backups reject unrelated, missing, and future schema data',()=>{
  for(const raw of [null,{},[],{schemaVersion:1},{schemaVersion:2,application:'fieldnote-review'},
    {schemaVersion:1,application:'fieldnote.workspace.v1'}, {schemaVersion:'1',application:'fieldnote-review'}]){
    assert.throws(()=>cleanBackup(raw,reviewData,photos),/전시회 1\.0 검토 백업/);
  }
  assert.doesNotThrow(()=>cleanBackup(makeBackup(),reviewData,photos));
});

test('notes and review status survive JSON backup roundtrip without losing Korean or multiline text',()=>{
  const note='첫 번째 관찰\n수정 의견: 전시 형상과 시험 형상을 구분합니다.\n<검토 전> & "원문"';
  const draft={notes:{[cases[0]]:note,[cases[1]]:'후면 사진 추가 확인',unknown:'keep out'},
    tasks:{[cases[0]]:'review',[cases[1]]:'done',[cases[2]]:'arbitrary'},revision:7,
    annotations:[makeAnnotation()]};
  const restored=cleanBackup(JSON.parse(JSON.stringify(makeBackup({draft}))),reviewData,photos);
  assert.equal(restored.draft.notes[cases[0]],note);
  assert.equal(restored.draft.notes[cases[1]],draft.notes[cases[1]]);
  assert.equal(restored.draft.notes[cases[2]],'');
  assert.equal(restored.draft.notes.unknown,undefined);
  assert.equal(restored.draft.tasks[cases[0]],'review');
  assert.equal(restored.draft.tasks[cases[1]],'done');
  assert.equal(restored.draft.tasks[cases[2]],'todo');
  assert.equal(restored.draft.revision,7);
  assert.deepEqual(restored.draft.annotations,draft.annotations);
});

test('backup sanitizer discards invalid coordinates and unknown case or photo references',()=>{
  const valid=[makeAnnotation({id:'upper-left',x:0,y:0}),makeAnnotation({id:'lower-right',x:100,y:100})];
  const invalid=[null,makeAnnotation({x:NaN}),makeAnnotation({y:Infinity}),makeAnnotation({x:-0.01}),
    makeAnnotation({y:100.01}),makeAnnotation({x:'25'}),makeAnnotation({caseId:'unknown-case'}),
    makeAnnotation({photoId:'unknown-photo'})];
  const restored=sanitizeDraft({annotations:[...invalid,...valid]},cases,photoIds);
  assert.deepEqual(restored.annotations,valid);
});

test('imported annotation content is bounded, unsupported types are downgraded, and executable links are removed',()=>{
  const raw={notes:{[cases[0]]:'가'.repeat(4500)},annotations:[makeAnnotation({
    id:'a'.repeat(150),text:'나'.repeat(1400),kind:'검증 완료',sourceUrl:'javascript:alert(1)'
  })],revision:-4};
  const draft=sanitizeDraft(raw,cases,photoIds);
  assert.equal(draft.notes[cases[0]].length,4000);
  assert.equal(draft.annotations[0].id.length,100);
  assert.equal(draft.annotations[0].text.length,1200);
  assert.equal(draft.annotations[0].kind,'확인 필요');
  assert.equal(draft.annotations[0].sourceUrl,'');
  assert.equal(draft.revision,1);
  const legacyWork=sanitizeDraft({annotations:Array.from({length:175},(_,i)=>makeAnnotation({id:`note-${i}`}))},cases,photoIds);
  assert.equal(MAX_ANNOTATIONS,150);
  assert.equal(legacyWork.annotations.length,175,'Existing work above the new-entry limit must remain recoverable');
});

test('rendering helpers neutralize markup and allow only web evidence and local image paths',()=>{
  const attack='<img src=x onerror="alert(1)"> & \'<script>alert(2)</script>\'';
  const escaped=escapeHtml(attack);
  assert.ok(!escaped.includes('<'));
  assert.ok(!escaped.includes('>'));
  assert.match(escaped,/&lt;img/);
  assert.match(escaped,/&quot;/);
  assert.match(escaped,/&#39;/);
  assert.equal(escapeHtml(null),'');
  for(const link of ['javascript:alert(1)','data:text/html,<svg onload=alert(1)>','file:///etc/passwd','/relative','//example.org','not a URL']){
    assert.equal(safeUrl(link),'',link);
  }
  assert.equal(safeUrl('https://example.org/evidence?edition=2024'),'https://example.org/evidence?edition=2024');
  for(const path of ['https://example.org/photo.jpg','assets/review/../../secret.png','assets/review/a.webp?query=1',
    'assets/review/a.svg','assets/review/sub/a.png','assets/review/..hidden.png','data:image/png;base64,AA']){
    assert.equal(safeImage(path),'',path);
  }
  assert.equal(safeImage('assets/review/atlas-01.webp'),'assets/review/atlas-01.webp');
  assert.equal(safeImage('assets/photos/example.JPG'),'assets/photos/example.JPG');
});

test('confirmed snapshots preserve deeply nested notes, annotations, evidence, and photo metadata independently of the draft',()=>{
  const draft=sanitizeDraft({notes:{[cases[0]]:'확정 당시 메모'},annotations:[makeAnnotation()]},cases,photoIds);
  const source=structuredClone(reviewData),images=structuredClone(photos);
  const fixedTime='2026-11-10T13:00:00.000Z';
  const snapshot=createSnapshot(draft,source,images,fixedTime);
  const saved=JSON.stringify(snapshot);
  draft.notes[cases[0]]='수정된 메모';
  draft.annotations[0].text='수정된 주석';
  source.cases[0].observations[0].fact='변경된 공개 사실';
  source.cases[0].sources[0].url='https://example.org/changed';
  images[0].caption='변경된 사진 설명';
  assert.equal(JSON.stringify(snapshot),saved);
  assert.equal(snapshot.createdAt,fixedTime);
  snapshot.draft.notes[cases[1]]='확정본 객체 독립성 점검';
  assert.equal(draft.notes[cases[1]],'');
  assert.notEqual(snapshot.data.cases,source.cases);
  assert.notEqual(snapshot.photos,images);
});

test('restored snapshots retain their saved content when the current research dataset changes',()=>{
  const snap=createSnapshot(sanitizeDraft({notes:{[cases[0]]:'이전 검토'}},cases,photoIds),reviewData,photos,'2026-11-10T14:00:00.000Z');
  const raw=JSON.parse(JSON.stringify(makeBackup({snapshots:[snap]})));
  const current=structuredClone(reviewData);
  current.cases[0].summary='후속 버전에서 변경된 설명';
  const restored=cleanBackup(raw,current,photos);
  assert.equal(restored.snapshots.length,1);
  assert.equal(restored.snapshots[0].draft.notes[cases[0]],'이전 검토');
  assert.equal(restored.snapshots[0].data.cases[0].summary,reviewData.cases[0].summary);
  assert.notEqual(restored.snapshots[0].data.cases[0].summary,current.cases[0].summary);
});

test('malformed snapshot payloads fail restoration instead of silently replacing personal work',()=>{
  const snap=createSnapshot(blankDraft(),reviewData,photos,'2026-11-10T15:00:00.000Z');
  for(const broken of [null,{...snap,createdAt:''},{...snap,photos:null},{...snap,data:{cases:[]}},
    {...snap,data:{...reviewData,cases:reviewData.cases.slice(0,2)}},
    {...snap,data:{...reviewData,cases:reviewData.cases.map((c,i)=>i?c:{...c,observations:null})}}]){
    assert.throws(()=>cleanBackup(makeBackup({snapshots:[broken]}),reviewData,photos),/확정본/);
  }
});

test('draft and snapshot annotations cannot attach one case to another case’s photo',()=>{
  const valid=makeAnnotation();
  const mismatched=makeAnnotation({id:'wrong-owner',caseId:cases[1]});
  const draft={...blankDraft(),annotations:[valid,mismatched]};
  const snapshot=createSnapshot(draft,reviewData,photos,'2026-11-10T16:00:00.000Z');
  const restored=cleanBackup(makeBackup({draft,snapshots:[snapshot]}),reviewData,photos);
  assert.deepEqual(restored.draft.annotations,[valid]);
  assert.deepEqual(restored.snapshots[0].draft.annotations,[valid]);
});

test('snapshots require unique self-consistent cases and the complete report collections',()=>{
  const snapshot=createSnapshot(blankDraft(),reviewData,photos,'2026-11-10T17:00:00.000Z');
  const brokenData=[
    {...reviewData,cases:[reviewData.cases[0],reviewData.cases[0],reviewData.cases[0]]},
    {...reviewData,cases:[null,...reviewData.cases.slice(1)]},
    {...reviewData,cases:reviewData.cases.map((c,i)=>i?c:{...c,id:'unknown-case'})},
    {...reviewData,trend:{...reviewData.trend,items:null}},
    {...reviewData,trend:{...reviewData.trend,timeline:null}},
    {...reviewData,comparison:{...reviewData.comparison,rows:null}},
    {...reviewData,briefing:null}
  ];
  for(const data of brokenData){
    assert.throws(()=>cleanBackup(makeBackup({snapshots:[{...snapshot,data}]}),reviewData,photos),/확정본/);
  }
  const reordered={...reviewData,cases:[...reviewData.cases].reverse()};
  assert.doesNotThrow(()=>cleanBackup(makeBackup({snapshots:[{...snapshot,data:reordered}]}),reviewData,photos));
});

test('restored snapshot objects are independent of the parsed backup input',()=>{
  const raw=makeBackup({snapshots:[createSnapshot(blankDraft(),reviewData,photos,'2026-11-10T18:00:00.000Z')]});
  const restored=cleanBackup(raw,reviewData,photos);
  const original=restored.snapshots[0].data.cases[0].summary;
  raw.snapshots[0].data.cases[0].summary='외부 객체 변경';
  raw.snapshots[0].photos[0].caption='외부 사진 설명 변경';
  assert.equal(restored.snapshots[0].data.cases[0].summary,original);
  assert.notEqual(restored.snapshots[0].photos[0].caption,'외부 사진 설명 변경');
  assert.equal(safeImage({toString:()=>photos[0].src}),'');
});

test('null and primitive report collection entries are rejected before restoring snapshots',()=>{
  const paths=[
    ['cases',0,'observations'],['cases',0,'specs'],['cases',0,'sources'],
    ['briefing'],['trend','items'],['trend','timeline'],['comparison','rows']
  ];
  for(const path of paths){
    for(const badEntry of [null,[],7,'invalid entry']){
      const snapshot=createSnapshot(blankDraft(),reviewData,photos,'2026-11-10T19:00:00.000Z');
      let parent=snapshot.data;
      for(const key of path.slice(0,-1))parent=parent[key];
      parent[path.at(-1)]=[badEntry];
      assert.throws(()=>cleanBackup(makeBackup({snapshots:[snapshot]}),reviewData,photos),/확정본/,`${path.join('.')}: ${JSON.stringify(badEntry)}`);
    }
  }
});

test('nested observation and trend references must use arrays while optional case links can be omitted',()=>{
  for(const invalid of [null,{},'https://example.org/source',undefined]){
    const snapshot=createSnapshot(blankDraft(),reviewData,photos,'2026-11-10T20:00:00.000Z');
    snapshot.data.cases[0].observations[0].sourceUrls=invalid;
    assert.throws(()=>cleanBackup(makeBackup({snapshots:[snapshot]}),reviewData,photos),/확정본/);
    const trendSnapshot=createSnapshot(blankDraft(),reviewData,photos,'2026-11-10T20:01:00.000Z');
    trendSnapshot.data.trend.items[0].sourceUrls=invalid;
    assert.throws(()=>cleanBackup(makeBackup({snapshots:[trendSnapshot]}),reviewData,photos),/확정본/);
  }
  const snapshot=createSnapshot(blankDraft(),reviewData,photos,'2026-11-10T20:02:00.000Z');
  snapshot.data.trend.items[0].caseIds=null;
  assert.throws(()=>cleanBackup(makeBackup({snapshots:[snapshot]}),reviewData,photos),/확정본/);
  delete snapshot.data.trend.items[0].caseIds;
  assert.doesNotThrow(()=>cleanBackup(makeBackup({snapshots:[snapshot]}),reviewData,photos));
});

test('comparison selections restore safely, support older backups, and remain fixed in snapshots',()=>{
  const legacy=makeBackup({draft:{notes:{},annotations:[],tasks:{},revision:2}});
  const defaultPair=cleanBackup(legacy,reviewData,photos).draft.comparison;
  assert.deepEqual(defaultPair,{left:cases[0],right:cases[1],leftPhoto:'',rightPhoto:''});
  const comparison={left:cases[2],right:cases[1],leftPhoto:photoIds[2],rightPhoto:photoIds[1]};
  const draft=sanitizeDraft({...blankDraft(),comparison},cases,photoIds,photos);
  const snapshot=createSnapshot(draft,reviewData,photos,'2026-11-10T21:00:00.000Z');
  draft.comparison.left=cases[0];
  draft.comparison.leftPhoto=photoIds[0];
  assert.deepEqual(snapshot.draft.comparison,comparison);
  const restored=cleanBackup(JSON.parse(JSON.stringify(makeBackup({draft,snapshots:[snapshot]}))),reviewData,photos);
  assert.equal(restored.draft.comparison.left,cases[0]);
  assert.deepEqual(restored.snapshots[0].draft.comparison,comparison);
  const invalid=sanitizeDraft({comparison:{left:'unknown',right:cases[0],leftPhoto:photoIds[2],rightPhoto:'missing'}},cases,photoIds,photos);
  assert.deepEqual(invalid.comparison,defaultPair);
  const mismatched=sanitizeDraft({comparison:{...comparison,rightPhoto:photoIds[0]}},cases,photoIds,photos);
  assert.equal(mismatched.comparison.rightPhoto,'');
  assert.equal(mismatched.comparison.leftPhoto,photoIds[2]);
});


test('historical snapshots survive catalog expansion, removal and reordered cases',()=>{
  const snapshot=createSnapshot(sanitizeDraft({notes:{[cases[0]]:'과거 검토 내용'}},cases,photoIds),reviewData,photos,'2026-11-11T01:00:00.000Z');
  const expanded=structuredClone(reviewData);
  expanded.cases.push({...structuredClone(reviewData.cases[0]),id:'new-exhibition-case'});
  const extendedPhotos=[...photos,{...photos[0],id:'new-exhibition-photo',equipmentId:'new-exhibition-case'}];
  const raw=makeBackup({snapshots:[snapshot]});
  const restored=cleanBackup(raw,expanded,extendedPhotos);
  assert.equal(restored.snapshots[0].data.cases.length,3);
  assert.equal(restored.snapshots[0].draft.notes[cases[0]],'과거 검토 내용');
  const removed={...reviewData,cases:reviewData.cases.slice(1).reverse()};
  assert.doesNotThrow(()=>cleanBackup(raw,removed,photos.filter(p=>p.equipmentId!==cases[0])));
  assert.deepEqual(restored.snapshots[0].data,reviewData);
});

test('self-contained two-case historical snapshots remain readable',()=>{
  const historical=structuredClone(reviewData),kept=cases.slice(0,2);
  historical.cases=historical.cases.filter(c=>kept.includes(c.id));
  historical.briefing=historical.briefing.filter(b=>kept.includes(b.caseId));
  historical.trend.items=historical.trend.items.map(t=>({...t,caseIds:t.caseIds.filter(id=>kept.includes(id))}));
  historical.photoObservations=historical.photoObservations.filter(b=>kept.includes(b.caseId));
  const images=photos.filter(p=>kept.includes(p.equipmentId));
  const snapshot=createSnapshot(blankDraft(),historical,images,'2026-11-11T01:01:00.000Z');
  const restored=cleanBackup(makeBackup({snapshots:[snapshot]}),reviewData,photos);
  assert.deepEqual(restored.snapshots[0].data.cases.map(c=>c.id),kept);
});

test('all existing annotations survive reload and backup even above the new-entry limit',()=>{
  const annotations=Array.from({length:MAX_ANNOTATIONS+2},(_,i)=>makeAnnotation({id:`legacy-${i}`,text:`주석 ${i}`}));
  const draft={...blankDraft(),annotations};
  const restored=cleanBackup(JSON.parse(JSON.stringify(makeBackup({draft}))),reviewData,photos);
  assert.deepEqual(restored.draft.annotations,annotations);
});

test('snapshot photo bindings reject malformed entries, unsafe coordinates and invalid relationships',()=>{
  const valid=reviewData.photoObservations[0];
  for(const entry of [null,7,[],{...valid,x:'10'}, {...valid,x:'0;display:none'}, {...valid,y:101},
    {...valid,photoId:'missing'}, {...valid,caseId:cases[1]}, {...valid,observationId:'missing'}]){
    const snapshot=createSnapshot(blankDraft(),reviewData,photos,'2026-11-11T01:02:00.000Z');
    snapshot.data.photoObservations=[entry];
    assert.throws(()=>cleanBackup(makeBackup({snapshots:[snapshot]}),reviewData,photos),/확정본/);
  }
  const snapshot=createSnapshot(blankDraft(),reviewData,photos,'2026-11-11T01:03:00.000Z');
  delete snapshot.data.photoObservations;
  assert.doesNotThrow(()=>cleanBackup(makeBackup({snapshots:[snapshot]}),reviewData,photos));
});

test('snapshot dates, photograph identity and local paths are validated before restore',()=>{
  const original=createSnapshot(blankDraft(),reviewData,photos,'2026-11-11T01:04:00.000Z');
  for(const mutate of [s=>{s.createdAt='not a date';},s=>{s.id='';},
    s=>{s.photos.push(structuredClone(s.photos[0]));},s=>{s.photos[0].src='https://example.org/unsafe.jpg';},
    s=>{s.photos[0].equipmentId='unknown';},s=>{s.data.cases[0].id='<img>';},
    s=>{s.data.cases[0].observations[0].sourceUrls=[null];},
    s=>{s.data.trend.items[0].caseIds=['unknown'];},s=>{s.data.briefing[0].caseId='unknown';}]){
    const snapshot=structuredClone(original);mutate(snapshot);
    assert.throws(()=>cleanBackup(makeBackup({snapshots:[snapshot]}),reviewData,photos),/확정본/);
  }
  assert.throws(()=>cleanBackup(makeBackup({snapshots:[original,structuredClone(original)]}),reviewData,photos),/중복/);
});
