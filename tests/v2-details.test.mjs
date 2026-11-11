import test from 'node:test';
import assert from 'node:assert/strict';
import {companyPanelMarkup,companyPhotos,companySources,companyCatalogs,comparisonMarkup,printReportMarkup,preparePrintImages,renderCompanyPanel,renderCompare,printCompanyReport,photoUrl,safeExternalUrl} from '../src/v2/details.js';

function fixture(){
 const photos=Array.from({length:8},(_,index)=>({id:'p'+index,src:'assets/photos/angle-'+index+'.jpg',sourceUrl:'https://example.org/photo/'+index,caption:'현장 사진 '+index,context:'event',delivery:'local',credit:'촬영자',rights:{status:'reusable'}}));
 photos.push({id:'linked',src:'https://example.org/restricted.jpg',sourceUrl:'https://example.org/original',caption:'원문 열람 사진',context:'event',delivery:'linked',rights:{status:'link_only'}});
 const company={id:'o1',name:'검토 업체',photoIds:photos.map(x=>x.id),sourceIds:['s1'],productIds:['product'],editorialId:'case',boothIds:['b1'],catalogIds:['c1']};
 const editorial={id:'case',organizationId:'o1',reason:'확인된 30 kW 장치의 전력 연계를 검토할 수 있습니다.',highlights:['실물 전시 확인','비교 조건은 공개자료 범위','차량 인터페이스는 추가 확인'],exhibit:{summary:'제조사가 행사에 장치를 공개했습니다.',items:[{name:'확인 장치',form:'실물',status:'onsite_confirmed'}]},distinction:{comparator:'기존 공개 장치',conditions:'서로 다른 시험조건으로 수치 우열 비교 불가',judgment:'동일 조건 비교자료 없음'},direction:{observation:'전력 모듈과 연결 단자를 함께 전시했습니다.',interpretation:'전원 연계를 확대하는 방향으로 읽힙니다.'},workConnection:{value:'배선 및 냉각 인터페이스 검토에 참고',conditions:['실차 부하조건 확인']},followUps:['입력 전압 범위는?','환경 시험조건은?','정비 절차는?']};
 return {event:{id:'adex-2025',name:'서울 ADEX 2025'},companies:[company,{id:'o2',name:'기본 업체',productIds:['product'],photoIds:[],sourceIds:['s1']}],products:[{id:'product',name:'일반 제품'}],photos,sources:[{id:'s1',url:'https://example.org/evidence',title:'전시 근거',publisher:'원문 발행자',date:'2025-10-20'}],editorials:[editorial],catalogs:[{id:'c1',title:'제품 카탈로그',url:'https://example.org/catalog.pdf',scope:'general',note:'일반 제품 자료이며 해당 회차 출품 근거와 별개'}],booths:[{id:'b1',code:null,hall:'10'}],mapGeometries:[{id:'g1',boothId:'b1'}]};
}

test('detail retains every photo angle and never embeds link-only photographs',()=>{
 const data=fixture(),company=data.companies[0];const html=companyPanelMarkup(data,company);
 assert.equal(companyPhotos(data,company).length,9);
 assert.equal((html.match(/data-photo-index=/g)||[]).length,9);
 assert.equal((html.match(/<img /g)||[]).length,8);
 assert.ok(html.includes('angle-7.jpg'));
 assert.ok(html.includes('https://example.org/original'));
 assert.ok(!html.includes('restricted.jpg'));
 assert.ok(html.includes('번호 미확인'));
});
test('detail distinguishes a listed company and general products from actual exhibition proof',()=>{
 const data=fixture();const html=companyPanelMarkup(data,data.companies[1]);
 assert.match(html,/실제 전시품목 미확인/);
 assert.match(html,/연결된 기존 제품 자료/);
 assert.match(html,/이번 회차 전시 확인과는 별개/);
 assert.doesNotMatch(html,/data-detail-action="locate"/);
});
test('detailed case retains seven requested topics and comparison conditions',()=>{
 const data=fixture();const html=companyPanelMarkup(data,data.companies[0]);
 for(const label of ['확인된 30 kW','이번 전시에서 보여준 것','차별점과 비교 조건','개발 방향 해석','당사 체계개발과의 연결','후속 확인','근거와 원문 자료'])assert.ok(html.includes(label),label);
 assert.match(html,/서로 다른 시험조건/);assert.match(html,/일반 제품·회사 자료/);
 assert.equal(companyCatalogs(data,data.companies[0]).length,1);
 assert.equal(companySources(data,data.companies[0]).length,1);
});
test('detail escapes untrusted copy and prevents executable or traversing media URLs',()=>{
 const data=fixture();data.companies[0].name='<img src=x onerror=alert(1)>';
 data.editorials[0].reason='<script>bad()</script>';
 data.photos[0].src='javascript:alert(1)';data.photos[0].caption='" onerror="bad';
 data.sources[0].url='javascript:bad()';
 const html=companyPanelMarkup(data,data.companies[0]);
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
 assert.ok(!html.includes('href="javascript:'));
 assert.equal(safeExternalUrl('data:text/html,bad'),null);
 assert.equal(photoUrl({src:'assets/%2e%2e/private.jpg'}),null);
 assert.equal(photoUrl({src:'assets/../private.jpg'}),null);
 assert.equal(photoUrl({src:'assets/photos/okay.jpg'}),'assets/photos/okay.jpg');
});
test('comparison uses source conditions and preserves unconfirmed entries',()=>{
 const data=fixture();const html=comparisonMarkup(data,['o1','o2']);
 assert.match(html,/같은 기준의 성능시험 결과가 아닙니다/);
 assert.match(html,/실제 출품품목 미확인/);
 assert.match(html,/동일 조건 비교자료 없음/);
 assert.match(html,/data-compare-remove="o2"/);
});
test('print report expands all analysis sections, all allowed images and source links',()=>{
 const data=fixture();const html=printReportMarkup(data,['o1']);
 assert.equal((html.match(/<img /g)||[]).length,8);
 assert.ok(!html.includes('<details'));
 assert.ok(!html.includes('data-detail-action'));
 assert.ok(html.includes('https://example.org/catalog.pdf'));
 assert.ok(html.includes('https://example.org/evidence'));
 assert.ok(html.includes('이번 전시에서 보여준 것'));
});
test('image preparation waits for ready images and replaces failed ones with an explicit notice',async()=>{
 const decoded=[];const replaced=[];
 const doc={createElement(){return {className:'',textContent:''};}};
 const ready={complete:true,naturalWidth:100,src:'ready',getAttribute(){return 'ready';},decode:async()=>{decoded.push('ready');},ownerDocument:doc};
 const broken={complete:true,naturalWidth:0,getAttribute(){return 'broken';},ownerDocument:doc,replaceWith(node){replaced.push(node.textContent);}};
 const container={querySelectorAll(){return[ready,broken];}};
 const result=await preparePrintImages(container,{timeout:50});
 assert.deepEqual(decoded,['ready']);assert.deepEqual(result.failedImages,['broken']);
 assert.match(replaced[0],/원문 링크로 대체/);
 assert.equal(ready.loading,'eager');
});
test('detail actions pass the selected company/photo and cleanup unregisters callbacks',async()=>{
 const data=fixture(),events=new Map(),calls=[];
 const container={innerHTML:'',querySelectorAll(){return [];},querySelector(){return null;},addEventListener(type,fn){events.set(type,fn);},removeEventListener(type,fn){if(events.get(type)===fn)events.delete(type);}};
 const cleanup=renderCompanyPanel(container,{data,company:data.companies[0],onPhoto:payload=>calls.push(payload),onCompare:company=>calls.push(company.id)});
 await events.get('click')({target:{closest(selector){return selector==='[data-photo-index]'?{dataset:{photoIndex:'7'}}:null;}}});
 assert.equal(calls[0].index,7);assert.equal(calls[0].photos.length,9);assert.equal(calls[0].companyId,'o1');
 await events.get('click')({target:{closest(selector){return selector==='[data-detail-action]'?{dataset:{detailAction:'compare'}}:null;}}});
 assert.equal(calls[1],'o1');cleanup();assert.equal(events.size,0);
});
test('detail preserves first-screen single-issuer limits and conflicting booth-number context',()=>{
 const data=fixture();data.editorials[0].verificationNote='사전 18-20과 현장 게시물 7-C11 표기가 달라 현장번호를 단정하지 않습니다.';
 data.booths[0].code='18-20';data.booths[0].numberEvidence={status:'single_source',note:'One announced range.'};
 data.sources[0].independence='primary_single_origin';
 const html=companyPanelMarkup(data,data.companies[0]);
 assert.match(html,/사전 발표 부스 18-20/);assert.match(html,/현장 게시물 7-C11/);assert.match(html,/발행사 단일 근거/);
 const header=html.slice(0,html.indexOf('</header>'));assert.match(header,/현장번호를 단정하지 않습니다/);
});
test('field image leads while all reference angles remain in a separate collapsible strip',()=>{
 const data=fixture();data.editorials[0].displayName='한글 업체명';data.event={name:'서울 ADEX',year:2025};
 data.photos[0].context='reference';data.photos[0].caption='2013년 다른 행사 참고';
 data.photos[1].delivery='linked';data.photos[1].rights={status:'link_only'};
 const company=data.companies[0],photos=companyPhotos(data,company),html=companyPanelMarkup(data,company);
 assert.equal(photos[0].id,'p2');assert.match(html,/<h2>한글 업체명<\/h2>/);assert.match(html,/서울 ADEX 2025/);
 assert.match(html,/비교 참고사진 · 다른 회차\/훈련 \(1\)/);
 assert.equal((html.match(/data-photo-index=/g)||[]).length,9);
 assert.ok(html.indexOf('angle-2.jpg')<html.indexOf('2013년 다른 행사 참고'));
 assert.doesNotMatch(html,/fn-photo-link-only/);
 const printed=printReportMarkup(data,['o1']);assert.match(printed,/비교 참고사진 · 다른 회차·훈련 자료/);assert.ok(printed.includes('2013년 다른 행사 참고'));
});
test('catalog callback owns navigation once while plain links keep native navigation',async()=>{
 const data=fixture(),events=new Map(),opened=[];
 const container={innerHTML:'',querySelectorAll(){return [];},querySelector(){return null;},addEventListener(type,fn){events.set(type,fn);},removeEventListener(type,fn){if(events.get(type)===fn)events.delete(type);}};
 const anchor={href:'https://example.org/catalog.pdf'};
 const clickEvent=()=>({prevented:0,preventDefault(){this.prevented++;},target:{closest(selector){return selector==='.fn-document-link'?anchor:null;}}});
 let cleanup=renderCompanyPanel(container,{data,company:data.companies[0],onCatalog:catalog=>opened.push(catalog.url)});
 const callbackEvent=clickEvent();await events.get('click')(callbackEvent);
 assert.equal(callbackEvent.prevented,1);assert.deepEqual(opened,['https://example.org/catalog.pdf']);cleanup();
 cleanup=renderCompanyPanel(container,{data,company:data.companies[0]});
 const nativeEvent=clickEvent();await events.get('click')(nativeEvent);
 assert.equal(nativeEvent.prevented,0);assert.equal(opened.length,1);cleanup();
});
test('editorial source metadata wins URL duplicates while all conditions and reprint limits survive',()=>{
 const data=fixture();data.editorials[0].sourceIds=['editorial-primary','reprint'];
 data.sources=[{id:'s1',url:'https://example.org/evidence',title:'https://example.org/evidence',publisher:null,note:'기존 자료의 추가 조건'}, {id:'editorial-primary',url:'https://example.org/evidence',title:'회차별 제조사 원문',publisher:'정확한 발행자',publishedAt:'2025-10-20',note:'성능은 독립 시험 결과가 아닙니다.',evidenceStatus:'single_source'}, {id:'reprint',url:'https://example.org/reprint',title:'배포 원문 재전재',note:'제조사 원문과 같은 계열입니다.',evidenceStatus:'same_origin_republication'}];
 data.companies[0].sourceIds=['s1','editorial-primary','reprint'];
 const sources=companySources(data,data.companies[0]);
 assert.equal(sources.length,2);assert.equal(sources[0].title,'회차별 제조사 원문');assert.equal(sources[0].publisher,'정확한 발행자');
 assert.deepEqual(sources[0].notes,['성능은 독립 시험 결과가 아닙니다.','기존 자료의 추가 조건']);
 const html=companyPanelMarkup(data,data.companies[0]);assert.match(html,/성능은 독립 시험 결과가 아닙니다/);assert.match(html,/기존 자료의 추가 조건/);assert.match(html,/발행사 단일 근거/);assert.match(html,/같은 원문 재전재 · 독립 근거로 세지 않음/);
 const print=printReportMarkup(data,['o1']);assert.match(print,/같은 원문 재전재 · 독립 근거로 세지 않음/);
});

test('print captions retain readable photo provenance even without clickable PDF links',()=>{
 const data=fixture(),printed=printReportMarkup(data,['o1']);
 for(const photo of data.photos)assert.ok(printed.includes(`<small class="fn-print-url">${photo.sourceUrl}</small>`),photo.id);
 assert.doesNotMatch(companyPanelMarkup(data,data.companies[0]),/class="fn-print-url"/);
});

test('print image deadline covers decoding and removes timed-out image listeners',{timeout:1000},async()=>{
 const replaced=[],listeners=new Map();
 const doc={createElement(){return {className:'',textContent:''};}};
 const base={ownerDocument:doc,getAttribute(){return this.src;},replaceWith(node){replaced.push({src:this.src,text:node.textContent});}};
 const decoding={...base,src:'decode-stalled',complete:true,naturalWidth:100,decode:()=>new Promise(()=>{})};
 const loading={...base,src:'load-stalled',complete:false,addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(type,fn){if(listeners.get(type)===fn)listeners.delete(type);}};
 const result=await preparePrintImages({querySelectorAll:()=>[decoding,loading]},{timeout:20});
 assert.deepEqual(new Set(result.failedImages),new Set(['decode-stalled','load-stalled']));
 assert.equal(replaced.length,2);assert.equal(listeners.size,0);
});

function printEnvironment(imageBatches=[]){
 const nodes=[],listeners=new Map(),printed=[];
 const doc={
  createElement(){const images=imageBatches.shift()||[];return {className:'',innerHTML:'',removed:false,querySelectorAll(){return images;},remove(){this.removed=true;}};},
  body:{append(node){nodes.push(node);}},
  querySelector(){return nodes.find(node=>!node.removed)||null;}
 };
 const win={
  print(){printed.push(nodes.filter(node=>!node.removed).map(node=>node.innerHTML).join(''));},
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
  removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
  dispatch(type){for(const fn of [...(listeners.get(type)||[])])fn();}
 };
 return {doc,win,nodes,listeners,printed};
}

test('a newer PDF request cancels pending preparation and only prints its own company',{timeout:1000},async()=>{
 let finishDecode;const decoding={complete:true,naturalWidth:100,decode:()=>new Promise(resolve=>{finishDecode=resolve;})};
 const env=printEnvironment([[decoding],[]]),data=fixture();
 const first=printCompanyReport({data,companyIds:['o1'],document:env.doc,window:env.win});
 await Promise.resolve();
 const second=printCompanyReport({data,companyIds:['o2'],document:env.doc,window:env.win});
 const [cancelled,ready]=await Promise.all([first,second]);
 assert.equal(cancelled.cancelled,true);assert.equal(ready.cancelled,undefined);
 assert.equal(env.printed.length,1);assert.match(env.printed[0],/data-company-id="o2"/);assert.doesNotMatch(env.printed[0],/data-company-id="o1"/);
 finishDecode();await Promise.resolve();assert.equal(env.printed.length,1);
 env.win.dispatch('afterprint');assert.ok(env.nodes.every(node=>node.removed));assert.equal(env.listeners.get('afterprint').size,0);
});

test('a stalled font load does not block PDF preparation and thrown print calls clean up',{timeout:1000},async()=>{
 const data=fixture(),env=printEnvironment();env.doc.fonts={ready:new Promise(()=>{})};
 const result=await printCompanyReport({data,companyIds:['o2'],document:env.doc,window:env.win,timeout:20});
 assert.equal(env.printed.length,1);result.cleanup();assert.ok(env.nodes.every(node=>node.removed));
 const failed=printEnvironment();failed.win.print=()=>{throw new Error('printing unavailable');};
 await assert.rejects(printCompanyReport({data,companyIds:['o2'],document:failed.doc,window:failed.win}),/printing unavailable/);
 assert.ok(failed.nodes.every(node=>node.removed));assert.equal(failed.listeners.get('afterprint').size,0);
});

test('comparison print failures show feedback and reenable the action',async()=>{
 const events=new Map(),feedback={textContent:''},button={disabled:false};
 const container={innerHTML:'',querySelector(){return feedback;},addEventListener(type,fn){events.set(type,fn);},removeEventListener(type,fn){if(events.get(type)===fn)events.delete(type);}};
 const cleanup=renderCompare(container,{data:fixture(),companyIds:['o1'],onPrint:async()=>{assert.equal(button.disabled,true);throw new Error('printing blocked');}});
 await events.get('click')({target:{closest(selector){return selector==='[data-compare-print]'?button:null;}}});
 assert.match(feedback.textContent,/준비하지 못했습니다/);assert.equal(button.disabled,false);cleanup();
});
