import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEventReports,eventPhotos,photoCoverage,filterEventPhotos,renderEventReports,prepareReportImages} from '../src/event-reports.js';
const p=(id,overrides={})=>({id,eventId:'adex-2025',equipmentId:'k2pl',context:'event',rightsStatus:'reusable',src:`assets/photos/${id}.jpg`,sourceUrl:`https://example.org/${id}`,caption:id,author:'Photographer',license:'CC BY 4.0',...overrides});
const fixture=photos=>({version:'1.1.0',scope:{startDate:'2024-11-11',endDate:'2026-11-11'},events:[{id:'adex-2025',name:'서울 ADEX',year:2025,summary:'전시 요약',equipment:[{id:'k2pl',name:'K2PL',manufacturer:'현대로템',strategySummary:'고객형 제품 구성을 구체화하는 전략으로 해석됩니다.',sourceUrls:['https://example.org/exhibit'],photos}]}]});

test('only matching event and equipment photographs enter the report collection',()=>{
  const data=normalizeEventReports(fixture([p('onsite'),p('old',{eventId:'adex-2023'}),p('generic',{context:'reference'}),p('other',{equipmentId:'k2'}),p('unsafe',{sourceUrl:'javascript:alert(1)'})]));
  assert.deepEqual(eventPhotos(data.events[0]).map(p=>p.id),['onsite']);
  const html=renderEventReports(data,'#event-print/all');
  assert.match(html,/개발전략 해석/);assert.doesNotMatch(html,/generic\.jpg|old\.jpg|other\.jpg/);
  assert.doesNotMatch(html,/<b>사실<|<b>확인</);
});

test('link-only photos are never hotlinked even when an image URL or local path is supplied',()=>{
  const data=normalizeEventReports(fixture([p('private',{rightsStatus:'link-only',imageUrl:'https://example.org/private.jpg'})]));
  assert.equal(eventPhotos(data.events[0])[0].src,'');
  const html=renderEventReports(data,'#event-equipment/adex-2025/k2pl');
  assert.doesNotMatch(html,/<img/);assert.match(html,/현장사진 원문 열기/);
  assert.equal(photoCoverage(data.events).linked,1);
});

test('external image sources require explicit rights status and exact trusted provider domains',()=>{
  const data=normalizeEventReports(fixture([
    p('cc',{src:'',imageUrl:'https://upload.wikimedia.org/wikipedia/commons/a/a1/photo.jpg'}),
    p('bad-host',{src:'',imageUrl:'https://upload.wikimedia.org.attacker.example/p.jpg'}),
    p('flickr',{src:'',rightsStatus:'provider-embed',embedProvider:'flickr',embedImageUrl:'https://live.staticflickr.com/65535/abc.jpg',sourceUrl:'https://www.flickr.com/photos/author/123/'}),
    p('wrong-source',{src:'',rightsStatus:'provider-embed',embedProvider:'flickr',embedImageUrl:'https://live.staticflickr.com/65535/def.jpg',sourceUrl:'https://example.org/123/'})
  ]));
  const ps=eventPhotos(data.events[0]);assert.equal(ps[0].delivery,'remote');assert.equal(ps[1].src,'');assert.equal(ps[2].delivery,'remote');assert.equal(ps[3].src,'');
  const html=renderEventReports(data,'#event-equipment/adex-2025/k2pl');
  assert.match(html,/<a class="event-photo-open" href="https:\/\/www\.flickr\.com\/photos\/author\/123\/"/);
  assert.match(html,/외부 연동/);
});

test('coverage counts unique displayed photographs separately from original source links and venue images',()=>{
  const raw=fixture([p('a'),p('duplicate',{src:'assets/photos/a.jpg'}),p('link1',{rightsStatus:'link-only',sourceUrl:'https://example.org/album'}),p('link2',{rightsStatus:'link-only',sourceUrl:'https://example.org/album'})]);
  raw.events[0].eventPhotos=[p('venue',{equipmentId:'',src:'assets/photos/venue.jpg'})];
  const data=normalizeEventReports(raw),coverage=photoCoverage(data.events);
  assert.equal(coverage.equipment,1);assert.equal(coverage.embedded,2);assert.equal(coverage.local,2);assert.equal(coverage.linked,1);
});

test('gallery search and source filters use the selected event data',()=>{
  const raw=fixture([p('visitor',{sourceType:'visitor'}),p('official',{sourceType:'manufacturer'})]);
  const data=normalizeEventReports(raw);
  assert.equal(filterEventPhotos(data.events,{event:'adex-2025',query:'현대로템',type:'visitor'}).length,1);
  assert.equal(filterEventPhotos(data.events,{event:'idex-2025'}).length,0);
});

test('reports exclude nonrecommended near-duplicates and escape source text',()=>{
  const raw=fixture([p('first'),p('burst',{reportRecommended:false})]);raw.events[0].equipment[0].strategySummary='<img onerror=alert(1)>';
  const data=normalizeEventReports(raw);
  const report=renderEventReports(data,'#event-print/all'),detail=renderEventReports(data,'#event-equipment/adex-2025/k2pl');
  assert.match(report,/first\.jpg/);assert.doesNotMatch(report,/burst\.jpg/);assert.match(detail,/burst\.jpg/);
  assert.match(report,/&lt;img onerror=alert\(1\)&gt;/);assert.doesNotMatch(report,/<img onerror/);
});


test('printing can replace unavailable or timed-out external images with their source links',async()=>{
  const loaded={dataset:{delivery:'local'},naturalWidth:800,decode:()=>Promise.resolve()};
  const failed={dataset:{delivery:'remote'},naturalWidth:0,decode:()=>Promise.reject(new Error('network'))};
  const timeout={dataset:{delivery:'remote'},naturalWidth:0,decode:()=>new Promise(()=>{})};
  assert.deepEqual(await prepareReportImages([loaded,failed,timeout],5),[failed,timeout]);
  assert.equal(loaded.loading,'eager');
});

test('printing does not silently omit broken bundled photos',async()=>{
  const failed={dataset:{delivery:'local'},naturalWidth:0,decode:()=>Promise.reject(new Error('broken file'))};
  await assert.rejects(prepareReportImages([failed],5),/broken file/);
});
