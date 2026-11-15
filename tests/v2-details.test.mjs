import test from 'node:test';
import assert from 'node:assert/strict';
import {companyPanelMarkup,companyPhotos,productPhotos,companySources,companyCatalogs,comparisonMarkup,printReportMarkup,preparePrintImages,renderCompanyPanel,renderCompare,printCompanyReport,photoUrl,safeExternalUrl} from '../src/v2/details.js';

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
test('detail keeps public exhibition analysis and removes internal work connections',()=>{
 const data=fixture();const html=companyPanelMarkup(data,data.companies[0]);
 for(const label of ['확인된 30 kW','이번 전시에서 보여준 것','차별점과 비교 조건','개발 방향 해석','공개자료의 확인 범위','근거와 원문 자료'])assert.ok(html.includes(label),label);
 assert.doesNotMatch(html,/당사 체계개발|배선 및 냉각 인터페이스 검토/);
 assert.doesNotMatch(comparisonMarkup(data,['o1']),/당사 검토 가치|배선 및 냉각 인터페이스 검토/);
 assert.doesNotMatch(printReportMarkup(data,['o1']),/당사 체계개발|배선 및 냉각 인터페이스 검토/);
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

function equipmentFixture(){
 const data=fixture();
 data.photos[0].caption='업체 부스 전경';
 data.photos[1].productIds=['product'];
 data.photos[2].productIds=['product'];data.photos[2].context='reference';
 data.photos[3].productIds=['product'];data.photos[3].eventId='adex-2023';
 data.photos[4].delivery='linked';data.photos[4].rights={status:'link_only'};data.photos[4].productIds=['product'];
 data.products[0]={id:'product',name:'확인 장비',form:'실물',exhibitStatus:'exhibitor_event_statement',sourceIds:['s1'],narrative:{form:'실물·모형 자료 상충',eventEvidenceSourceIds:['s1'],generalSourceIds:['s2'],photoIds:['p6'],sections:[
  {id:'overview',label:'장비명·세부 형상·용도',text:'수송을 위한 시험 형상입니다.',sourceIds:['s1'],claimType:'event_observation'},
  {id:'features',label:'주요 특징·필요 제원',text:'일반 카탈로그 제원은 전시 형상과 구분합니다.',sourceIds:['s2'],claimType:'general_product_spec'},
  {id:'exhibit',label:'이번 전시의 구성·변화',text:'전시 명판과 원문에 서로 다른 형상이 적혔습니다.',sourceIds:['s1'],claimType:'event_observation'},
  {id:'development',label:'개발 방향',text:'발표 당시 계획이며 이행 완료는 미확인입니다.',sourceIds:['s1'],claimType:'official_plan'},
  {id:'interpretation',label:'전략적 해석',text:'여러 임무에 대응하는 구성으로 읽힙니다.',sourceIds:['s1'],claimType:'analyst_interpretation'}
 ],limitations:['형상별 제원과 실제 인도 여부는 미확인입니다.']}};
 data.sources.push({id:'s2',url:'https://example.org/general',title:'일반 제품 카탈로그',date:'2026-11-15',note:'2025년 전시 제원을 소급 확정하지 않습니다.'});
 data.products.push({id:'missing',name:'자료 보강 중 장비',form:'축소 모형',exhibitStatus:'exhibitor_event_statement',sourceIds:['s1']});
 data.companies[0].productIds.push('missing');
 return data;
}

test('equipment keeps five sections visible and marks official plans, interpretation and source scope',()=>{
 const data=equipmentFixture(),html=companyPanelMarkup(data,data.companies[0],{productId:'product'});
 const product=html.slice(html.indexOf('id="product-product"'),html.indexOf('id="product-missing"'));
 assert.equal((product.match(/data-narrative-section=/g)||[]).length,5);
 for(const id of ['overview','features','exhibit','development','interpretation'])assert.match(product,new RegExp('data-narrative-section="'+id+'"'));
 assert.ok(product.indexOf('전략적 해석')<product.indexOf('<details'));
 assert.match(product,/공식 발표 · 발표 당시 기준/);assert.match(product,/관찰 근거에 따른 추론/);
 assert.match(product,/실물·모형 자료 상충/);assert.match(product,/형상별 제원과 실제 인도 여부는 미확인/);
 assert.match(product,/출품 근거 \[1\]/);assert.match(product,/이후 발표 \(2026\) \[2\]/);
 assert.match(product,/https:\/\/example.org\/general/);assert.match(product,/2025년 전시 제원을 소급 확정하지 않습니다/);
 assert.match(html,/aria-current="location"/);assert.match(html,/fn-product-selected/);
 const print=printReportMarkup(data,['o1']);assert.doesNotMatch(print,/<details/);assert.match(print,/전략적 해석/);assert.match(print,/https:\/\/example.org\/general/);
});

test('an unsupported strategy remains an evidence gap on screen and in print',()=>{
 const data=equipmentFixture(),entry=data.products[0].narrative.sections.find(section=>section.id==='interpretation');
 entry.claimType='evidence_gap';entry.sourceIds=[];entry.text='사진만으로 개발 방향이나 시장 전략을 판단할 근거가 부족해 해석을 보류한다.';
 for(const html of [companyPanelMarkup(data,data.companies[0]),printReportMarkup(data,['o1'])]){
  const topic=html.match(/data-narrative-section="interpretation">([\s\S]*?)<\/section>/)?.[1];
  assert.ok(topic);assert.match(topic,/근거 미확보/);assert.ok(topic.includes(entry.text));
  assert.doesNotMatch(topic,/관찰 근거에 따른 추론|fn-source-link|href=/);
  assert.match(html,/공식 발표 · 발표 당시 기준/);
 }
});

test('equipment galleries require product association and current event while viewer indices stay global',()=>{
 const data=equipmentFixture(),company=data.companies[0],photos=companyPhotos(data,company);
 assert.deepEqual(productPhotos(data,company,data.products[0],photos).map(p=>p.id),['p1','p6','p4']);
 const html=companyPanelMarkup(data,company);
 const product=html.slice(html.indexOf('id="product-product"'),html.indexOf('id="product-missing"'));
 assert.ok(product.includes('angle-1.jpg'));assert.ok(product.includes('angle-6.jpg'));
 assert.doesNotMatch(product,/angle-2.jpg|angle-3.jpg|angle-4.jpg/);
 for(const id of ['p1','p6','p4'])assert.ok(product.includes(`data-photo-index="${photos.findIndex(photo=>photo.id===id)}"`),id);
 assert.match(html,/비교 참고사진 · 다른 회차\/훈련 \(2\)/);
 assert.ok(html.indexOf('업체 부스 전경')<html.indexOf('id="product-product"'));
 assert.equal((html.match(/data-product-id="product"/g)||[]).length,1);
});

test('unexplained products remain with known form, evidence and truthful photograph gaps',()=>{
 const data=equipmentFixture(),html=companyPanelMarkup(data,data.companies[0]);
 const missing=html.slice(html.indexOf('id="product-missing"'));
 assert.match(missing,/자료 보강 중 장비/);assert.match(missing,/축소 모형/);
 assert.match(missing,/제조사의 해당 회차 출품 발표/);
 assert.match(missing,/해당 회차 표시 가능한 현장사진을 아직 확보하지 못했습니다/);
 assert.match(missing,/공식 개발 계획을 확인할 자료가 부족합니다/);
 assert.match(missing,/https:\/\/example.org\/evidence/);
 assert.equal((html.match(/data-product-id=/g)||[]).length,2);
});

test('product and report actions preserve callback API and selected product focus',async()=>{
 const data=equipmentFixture(),events=new Map(),calls=[];
 const target={dataset:{productId:'product'},scrollIntoView(){calls.push('scroll');},focus(){calls.push('focus');}};
 const container={innerHTML:'',querySelectorAll(selector){return selector==='[data-product-id]'?[target]:[];},querySelector(){return null;},addEventListener(type,fn){events.set(type,fn);},removeEventListener(type,fn){if(events.get(type)===fn)events.delete(type);}};
 const cleanup=renderCompanyPanel(container,{data,company:data.companies[0],productId:'product',onProduct:id=>calls.push(id),onReport:company=>calls.push('report:'+company.id)});
 assert.deepEqual(calls,['scroll','focus']);
 await events.get('click')({target:{closest(selector){return selector==='[data-product-link]'?{dataset:{productLink:'missing'}}:null;}}});
 await events.get('click')({target:{closest(selector){return selector==='[data-detail-action]'?{dataset:{detailAction:'report'}}:null;}}});
 assert.deepEqual(calls,['scroll','focus','missing','report:o1']);cleanup();assert.equal(events.size,0);
});

test('numbered equipment references distinguish prior editions and later publications without repeating long titles',()=>{
 const data=equipmentFixture(),p=data.products[0];
 data.sources.push({id:'maker-adex2023',url:'https://example.org/2023',title:'서울 ADEX 2023의 긴 원문 제목',publishedAt:'2023-10-17'},
  {id:'catalog-current',url:'https://example.org/current',title:'발행일 미상의 현재 제품 카탈로그',publishedAt:null},
  {id:'duplicate-event',url:'https://example.org/evidence',title:'동일 원문의 중복 연결',note:'중복 출처의 추가 조건'});
 p.narrative.generalSourceIds.push('maker-adex2023','catalog-current');p.sourceIds.push('duplicate-event');
 p.narrative.sections[1].sourceIds=['s2','maker-adex2023','catalog-current','duplicate-event'];
 const html=companyPanelMarkup(data,data.companies[0]);
 const product=html.slice(html.indexOf('id="product-product"'),html.indexOf('id="product-missing"'));
 const core=product.slice(0,product.indexOf('<details'));
 assert.match(core,/직전 회차 비교 \(2023\) \[3\]/);
 assert.match(core,/이후 발표 \(2026\) \[2\]/);assert.match(core,/일반자료 \[4\]/);
 assert.match(core,/title="서울 ADEX 2023의 긴 원문 제목"/);
 const visible=core.replace(/<[^>]+>/g,'');
 assert.doesNotMatch(visible,/서울 ADEX 2023의 긴 원문 제목|발행일 미상의 현재 제품 카탈로그|동일 원문의 중복 연결/);
 assert.equal((product.match(/>전시 근거<\/a>/g)||[]).length,1);
 assert.equal((product.match(/<summary>상세 출처와 확인 범위<\/summary>/g)||[]).length,1);
 assert.match(product,/중복 출처의 추가 조건/);assert.doesNotMatch(core,/data-source-number="5"/);
 const printed=printReportMarkup(data,['o1']);assert.doesNotMatch(printed,/<details/);assert.match(printed,/서울 ADEX 2023의 긴 원문 제목/);assert.match(printed,/https:\/\/example.org\/2023/);
});

test('critical form conflicts and single-issuer limits remain visible while extended limitations collapse',()=>{
 const data=equipmentFixture(),p=data.products[0];
 data.sources[0].evidenceStatus='single_source';
 p.narrative.limitations.push('현장 존재는 확인되지만 실차/모형 분류는 미해결이다.');
 const html=companyPanelMarkup(data,data.companies[0]);
 const product=html.slice(html.indexOf('id="product-product"'),html.indexOf('id="product-missing"'));
 const core=product.slice(0,product.indexOf('<details'));
 assert.match(core,/실차\/모형 분류는 미해결/);assert.match(core,/출품 설명은 발행사 단일 근거/);
 assert.doesNotMatch(core,/형상별 제원과 실제 인도 여부는 미확인/);
 assert.match(product.slice(product.indexOf('<details')),/형상별 제원과 실제 인도 여부는 미확인/);
 assert.ok(core.includes('data-narrative-section="interpretation"'));
});

test('displayable equipment comes first without mutating product IDs, data order or viewer indexes',()=>{
 const data=equipmentFixture(),company=data.companies[0];company.productIds.reverse();
 const originalIds=[...company.productIds],originalProducts=data.products.map(p=>p.id),photos=companyPhotos(data,company).map(p=>p.id);
 const html=companyPanelMarkup(data,company),printed=printReportMarkup(data,['o1']);
 assert.ok(html.indexOf('id="product-product"')<html.indexOf('id="product-missing"'));
 assert.ok(printed.indexOf('id="product-product"')<printed.indexOf('id="product-missing"'));
 assert.deepEqual(company.productIds,originalIds);assert.deepEqual(data.products.map(p=>p.id),originalProducts);
 assert.deepEqual(companyPhotos(data,company).map(p=>p.id),photos);
});

test('photo callbacks identify the clicked product while preserving the existing company-wide index contract',async()=>{
 const data=equipmentFixture(),events=new Map(),calls=[],photos=companyPhotos(data,data.companies[0]);
 const container={innerHTML:'',querySelectorAll(){return [];},querySelector(){return null;},addEventListener(type,fn){events.set(type,fn);},removeEventListener(type,fn){if(events.get(type)===fn)events.delete(type);}};
 const cleanup=renderCompanyPanel(container,{data,company:data.companies[0],onPhoto:payload=>calls.push(payload)});
 const index=photos.findIndex(p=>p.id==='p1');
 await events.get('click')({target:{closest(selector){return selector==='[data-photo-index]'?{dataset:{photoIndex:String(index)}}:selector==='[data-product-id]'?{dataset:{productId:'product'}}:null;}}});
 assert.equal(calls[0].productId,'product');assert.equal(calls[0].index,index);assert.equal(calls[0].photos.length,photos.length);assert.equal(calls[0].photos[calls[0].index].id,'p1');
 await events.get('click')({target:{closest(selector){return selector==='[data-photo-index]'?{dataset:{photoIndex:'0'}}:null;}}});
 assert.equal(calls[1].productId,'');assert.equal(calls[1].photos.length,photos.length);cleanup();
});


test('photo attribution keeps its license link and transformation note in the reader and detailed print',()=>{
 const data=fixture();
 data.photos[0].rights={status:'reusable',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/'};
 data.photos[0].variantNote='웹 표시용 축소·WebP 변환본';
 for(const html of [companyPanelMarkup(data,data.companies[0]),printReportMarkup(data,['o1'])]){
  assert.ok(html.includes('href="https://creativecommons.org/licenses/by/4.0/"'));
  assert.match(html,/CC BY 4.0/);assert.match(html,/웹 표시용 축소·WebP 변환본/);
 }
});

test('a narrative evidence label does not present an unconfirmed exhibition as visually verified',()=>{
 const data=fixture();data.products[0].exhibitStatus='unconfirmed';
 data.products[0].narrative={eventEvidenceSourceIds:['s1'],generalSourceIds:[],sections:[],photoIds:[],limitations:[]};
 const html=companyPanelMarkup(data,data.companies[0]);
 assert.match(html,/해당 회차 출품 관련 원문 확보 · 형상 설명 참조/);
 assert.equal(data.products[0].exhibitStatus,'unconfirmed');
});

test('company copy recognizes current product evidence without treating remaining catalogs as exhibits',()=>{
 const data=fixture();data.editorials=[];delete data.companies[0].editorialId;
 data.products[0].narrative={eventId:data.event.id,eventEvidenceSourceIds:['s1'],sections:[],photoIds:[],limitations:[]};
 const html=companyPanelMarkup(data,data.companies[0]);
 assert.doesNotMatch(html,/실제 전시품목 미확인|이번 회차의 실제 출품품목은 아직 확인하지 못했습니다/);
 assert.match(html,/출품 발표·사진·개발 계획의 확인 범위/);
 const stale=structuredClone(data);stale.products[0].narrative.eventId='adex-2023';
 assert.match(companyPanelMarkup(stale,stale.companies[0]),/실제 전시품목 미확인/);
});
