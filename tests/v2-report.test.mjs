import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {eventReportMarkup,printEventReport,renderEventReport,reportModel} from '../src/v2/report.js';
import {escapeHTML} from '../src/v2/details.js';

const readEvent=id=>readFile(new URL(`../data/v2/app/events/${id}.json`,import.meta.url),'utf8').then(JSON.parse);
const adex=await readEvent('adex-2025');
const laterEvents=await Promise.all(['eurosatory-2026','dsei-2025','idex-2025','saha-2026'].map(readEvent));
function fallbackFixture(data){
 const fixture=structuredClone(data);
 fixture.report=null;
 for(const product of fixture.products)product.exhibitStatus='unconfirmed';
 return fixture;
}

function printEnvironment(imageBatches=[]){
 const nodes=[],classes=new Set(),listeners=new Map(),printed=[];
 const doc={
  createElement(){
   const images=imageBatches.shift()||[];
   const node={className:'',innerHTML:'',removed:false,querySelectorAll:()=>images,remove(){this.removed=true;}};
   nodes.push(node);return node;
  },
  body:{append(){},classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}}
 };
 const win={
  print(){printed.push(nodes.filter(node=>!node.removed).map(node=>node.innerHTML).join(''));},
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
  removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
  dispatch(type){for(const fn of [...(listeners.get(type)||[])])fn();}
 };
 doc.defaultView=win;
 return {doc,win,nodes,classes,listeners,printed};
}
function containerFor(doc){
 const events=new Map();
 return {innerHTML:'',ownerDocument:doc,events,addEventListener(type,fn){events.set(type,fn);},removeEventListener(type,fn){if(events.get(type)===fn)events.delete(type);}};
}
const clickTarget=(selector,element)=>({target:{closest:value=>value===selector?element:null}});

test('every displayed report photo keeps its original and rights links on screen and in print',()=>{
 for(const data of [adex,...laterEvents]){
  const model=reportModel(data),screen=eventReportMarkup(data),printed=eventReportMarkup(data,{print:true});
  for(const theme of model.themes){
   const photo=data.photos.find(photo=>photo.id===theme.photoId);
   if(!photo?.src)continue;
   for(const url of [photo.sourceUrl,photo.rights?.licenseUrl].filter(Boolean)){
    const href='href="'+url.replaceAll('&','&amp;')+'"';
    assert.ok(screen.includes(href),data.event.id+': missing screen photo link '+url);
    assert.ok(printed.includes(href),data.event.id+': missing printed photo link '+url);
   }
  }
  assert.match(printed,/class="report-print-sources"/);
 }
});

test('provider-hosted report photographs link from the screen image and retain a credited source notice in PDF',()=>{
 const data=structuredClone(adex),photo=data.photos.find(photo=>photo.id===data.report.themes[0].photoId);
 photo.src='https://live.staticflickr.com/65535/123_example_b.jpg';photo.sourceUrl='https://www.flickr.com/photos/example/123/';photo.delivery='remote';photo.rights={status:'provider-embed',license:'All Rights Reserved'};
 for(const print of [false,true]){
  const markup=eventReportMarkup(data,{print});
  if(print){
   assert.ok(!markup.includes(photo.src));
   assert.match(markup,/class="report-photo-reference"/);
   assert.match(markup,/사진 원문 안내/);
   assert.ok(markup.includes(escapeHTML(photo.caption)));
   assert.ok(markup.includes(escapeHTML(photo.credit)));
   assert.ok(markup.includes(`href="${photo.sourceUrl}"`));
  }else assert.match(markup,/<a class="fn-photo-provider-link" href="https:\/\/www\.flickr\.com\/photos\/example\/123\/"[^>]*><img/);
  assert.match(markup,/All Rights Reserved/);
 }
});

test('a report reference fallback requires the same company and product and never becomes event evidence',()=>{
 const data=structuredClone(adex),theme=data.report.themes[0],company=data.companies.find(row=>row.id===theme.companyId);
 theme.photoId='';
 const reference={id:'reference-photo',src:'assets/photos/product-reference.jpg',context:'reference',productIds:[theme.productId],caption:'2024 제품 참고사진',credit:'촬영자',sourceUrl:'https://example.org/reference',sourceIds:['reference-only'],rights:{status:'reusable',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/'}};
 data.photos.push(reference);data.sources.push({id:'reference-only',url:reference.sourceUrl,title:'일반 제품사진 근거'});
 for(const print of [false,true])assert.ok(!eventReportMarkup(data,{print}).includes(reference.src),'another company photograph must not fill the gap');
 company.photoIds.push(reference.id);
 const before=structuredClone(data);
 for(const print of [false,true]){
  const html=eventReportMarkup(data,{print});
  assert.ok(html.includes(reference.src));assert.match(html,/제품 참고사진 · 해당 회차 현장사진 아님/);
  assert.ok(html.includes(`href="${reference.sourceUrl}"`));assert.match(html,/CC BY 4.0/);
 }
 const container=containerFor();renderEventReport(container,{data})();assert.match(container.innerHTML,/일반 제품사진 근거/);
 assert.deepEqual(data,before);
 reference.productIds=['unrelated'];assert.ok(!eventReportMarkup(data).includes(reference.src));
});

test('photo-only source IDs join report evidence and duplicate URLs receive one compact citation',()=>{
 const data=structuredClone(adex),photo=data.photos.find(photo=>photo.id===data.report.themes[0].photoId);
 const url='https://example.org/photo-evidence?event=2025&view=original',title='사진에만 연결된 현장 원문';
 data.sources.push({id:'photo-only-source',url,title,publisher:'촬영기관',publishedAt:'2025-10-20'});
 data.sources.push({id:'same-photo-origin',url,title:'동일 원문'});
 photo.sourceIds.push('photo-only-source','same-photo-origin');
 const container=containerFor();const cleanup=renderEventReport(container,{data});
 const details=container.innerHTML.match(/<details class="report-sources">[\s\S]*?<\/details>/)[0];
 assert.ok(details.includes(title));
 assert.equal(details.split('href="'+url.replaceAll('&','&amp;')+'"').length-1,1);
 const printed=eventReportMarkup(data,{print:true}),citations=printed.match(/<p class="report-print-sources">[\s\S]*?<\/p>/)[0];
 assert.ok(citations.includes('href="'+url.replaceAll('&','&amp;')+'"'));
 assert.equal(citations.split('href="'+url.replaceAll('&','&amp;')+'"').length-1,1);
 cleanup();
});

test('unsafe photo references and rights URLs cannot become screen or PDF links',()=>{
 const data=structuredClone(adex),photo=data.photos.find(photo=>photo.id===data.report.themes[0].photoId);
 photo.sourceUrl='javascript:alert(1)';photo.rights.licenseUrl='data:text/html,unsafe';
 photo.rights.license='<img src=x onerror="alert(1)">';
 for(const print of [false,true]){
  const html=eventReportMarkup(data,{print});
  assert.doesNotMatch(html,/href="(?:javascript:|data:)|<img src=x/);
  assert.match(html,/사진 원문·이용조건 주소 미확인/);
 }
});

test('long captions and limitations remain complete in compact print markup',()=>{
 const data=structuredClone(adex),photo=data.photos.find(photo=>photo.id===data.report.themes[0].photoId);
 const caption='현장사진의 구성과 확인 한계를 설명하는 긴 문장입니다. '.repeat(12)+'캡션 마지막 문장';
 const limitation='비교 근거와 적용 조건을 모두 검토해야 합니다. '.repeat(8)+'한계 마지막 문장';
 photo.caption=caption;data.report.limitations=[limitation];
 const html=eventReportMarkup(data,{print:true});
 assert.ok(html.includes(caption));assert.ok(html.includes(limitation));
});


for(const data of [adex,...laterEvents])test(`${data.event.id} keeps three reviewed themes with owned products, event photos and evidence links`,()=>{
 assert.ok(data.report,'this edition must have an authored report, not a fallback');
 const model=reportModel(data),html=eventReportMarkup(data),printed=eventReportMarkup(data,{print:true});
 assert.equal(model,data.report);
 assert.equal(model.eventId,data.event.id);
 assert.equal(model.themes.length,3);
 assert.equal(new Set(model.themes.map(theme=>theme.productId)).size,3);
 assert.equal((html.match(/class="report-theme"/g)||[]).length,3);
 assert.equal((html.match(/class="report-case-link"/g)||[]).length,3);
 const sourceIds=new Set(model.sourceIds);
 let photoCount=0;
 for(const theme of model.themes){
  const company=data.companies.find(company=>company.id===theme.companyId);
  const product=data.products.find(product=>product.id===theme.productId);
  assert.ok(company,`missing company for ${theme.title}`);
  assert.ok(product,`missing product for ${theme.title}`);
  assert.ok(company.productIds.includes(product.id),`${company.id} does not own ${product.id}`);
  assert.ok(product.organizationIds.includes(company.id),`${product.id} does not link back to ${company.id}`);
  assert.ok(theme.sourceIds.length,`${theme.title} has no evidence`);
  for(const id of theme.sourceIds)sourceIds.add(id);
  for(const field of ['title','summary','before','after']){
   assert.ok(theme[field]?.trim(),`${theme.title} is missing ${field}`);
   assert.ok(html.includes(escapeHTML(theme[field])));
   assert.ok(printed.includes(escapeHTML(theme[field])));
  }
  assert.ok(html.includes(`data-report-case="${company.id}" data-product="${product.id}"`));
  assert.ok(printed.includes(escapeHTML(product.name)));
  if(!theme.photoId){
   const reference=data.photos.find(photo=>photo.context==='reference'&&company.photoIds.includes(photo.id)&&photo.productIds.includes(product.id)&&photo.src);
   if(reference){
    for(const markup of [html,printed]){assert.ok(markup.includes(`src="${escapeHTML(reference.src)}"`));assert.match(markup,/제품 참고사진 · 해당 회차 현장사진 아님/);}
    for(const id of reference.sourceIds)sourceIds.add(id);
    photoCount++;
   }
   continue;
  }
  const photo=data.photos.find(photo=>photo.id===theme.photoId);
  assert.ok(photo,`missing photo ${theme.photoId}`);
  assert.ok(company.photoIds.includes(photo.id),`${company.id} does not own ${photo.id}`);
  assert.ok(photo.productIds.includes(product.id),`${photo.id} does not depict ${product.id}`);
  assert.equal(photo.context,'event');
  assert.ok(photo.sourceIds.length,`${photo.id} has no evidence`);
  for(const id of photo.sourceIds)sourceIds.add(id);
  assert.ok(photo.src,`${photo.id} has no display asset`);
  assert.ok(html.includes(`src="${escapeHTML(photo.src)}"`));
  assert.equal(printed.includes(`src="${escapeHTML(photo.src)}"`),photo.rights?.status!=='provider-embed');
  photoCount++;
 }
 for(const markup of [html,printed]){
  const referenceCount=markup===printed?model.themes.filter(theme=>data.photos.find(photo=>photo.id===theme.photoId)?.rights?.status==='provider-embed').length:0;
  assert.equal((markup.match(/<img\s/g)||[]).length,photoCount-referenceCount);
  assert.equal((markup.match(/class="report-photo-reference"/g)||[]).length,referenceCount);
  assert.equal((markup.match(/class="report-photo-missing"/g)||[]).length,3-photoCount,'missing theme photos must remain explicit gaps');
 }
 assert.doesNotMatch(printed,/data-report-case=/);
 const container=containerFor();
 const cleanup=renderEventReport(container,{data});
 assert.ok(sourceIds.size);
 for(const id of sourceIds){
  const source=data.sources.find(source=>source.id===id);
  assert.ok(source,`unresolved evidence ${id}`);
  assert.ok(source.title?.trim(),`${id} has no source title`);
  const url=new URL(source.url);
  assert.ok(['https:','http:'].includes(url.protocol),`${id} has an unsafe URL`);
  const href=`href="${escapeHTML(url.href)}"`;
  assert.ok(container.innerHTML.includes(href),`screen is missing evidence ${id}`);
  assert.ok(printed.includes(href),`print is missing evidence ${id}`);
 }
 assert.match(container.innerHTML,/rel="noopener noreferrer"/);
 cleanup();
});

test('editions without an authored report use company-only cases without promoting exhibit status',()=>{
 for(const edition of laterEvents){
  const data=fallbackFixture(edition),before=structuredClone(data);
  const model=reportModel(data),html=eventReportMarkup(data),printed=eventReportMarkup(data,{print:true});
  assert.equal(model.message,'수록된 업체 자료와 확인 범위');
  assert.match(model.scopeNote,/출품은 확인 중/);
  assert.ok(model.themes.every(theme=>theme.productId===''));
  assert.doesNotMatch(html,/확인된 출품 사례|확인된 제품·서비스 자료/);
  assert.equal((printed.match(/ · 업체 자료<\/p>/g)||[]).length,model.themes.length);
  assert.deepEqual(data,before,'fallback rendering must not change product status or source data');
 }
});

test('a fallback company booth photo is never assigned to its unrelated unconfirmed product',()=>{
 const data={
  event:{id:'fallback-2026',name:'Fallback fixture',year:2026},dataAsOf:'2026-11-16',report:null,
  companies:[{id:'company',name:'Fixture company',productIds:['unconfirmed-product'],photoIds:['booth-photo'],sourceIds:[]}],
  products:[{id:'unconfirmed-product',name:'경량화 105mm 자주포',exhibitStatus:'unconfirmed'}],
  photos:[{id:'booth-photo',caption:'업체 부스의 RCWS 전시대',src:'assets/fallback-booth.jpg',context:'event',productIds:[]}],sources:[]
 };
 const model=reportModel(data),printed=eventReportMarkup(data,{print:true});
 assert.equal(model.themes[0].productId,'');
 assert.equal(model.themes[0].photoId,'booth-photo');
 assert.match(printed,/업체 부스의 RCWS 전시대/);
 assert.doesNotMatch(printed,/경량화 105mm 자주포/);
 assert.equal(data.products[0].exhibitStatus,'unconfirmed');
});

test('all three IDEX report photos visibly credit CC BY 4.0 and WebP changes on screen and in print',()=>{
 const data=laterEvents.find(event=>event.event.id==='idex-2025');
 const changeNotices={
  'havoc-8x8':'웹 표시용 축소·WebP 변환본',
  'ajban-family':'웹 표시용 축소·WebP 변환본',
  'cockerill-ix':'웹 표시용 WebP 변환본'
 };
 for(const print of [false,true]){
  const figures=eventReportMarkup(data,{print}).match(/<figure>[\s\S]*?<\/figure>/g)||[];
  assert.equal(figures.length,3);
  for(const theme of data.report.themes){
   const photo=data.photos.find(photo=>photo.id===theme.photoId);
   const figure=figures.find(markup=>markup.includes(`src="${escapeHTML(photo.src)}"`));
   assert.ok(figure,`missing ${theme.productId} figure`);
   assert.equal(photo.rights.license,'CC BY 4.0');
   assert.match(figure,/>CC BY 4\.0<\/a>/,'the license must be visible, not only a link title');
   assert.ok(figure.includes(escapeHTML(photo.credit)),`missing ${theme.productId} photographer credit`);
   assert.ok(figure.includes(changeNotices[theme.productId]),`missing ${theme.productId} conversion notice`);
  }
 }
});

test('report case navigation opens companies for fallback cases and products for reviewed cases',async()=>{
 const container=containerFor(),companyCalls=[],productCalls=[];
 const cleanup=renderEventReport(container,{data:adex,onOpenCompany:id=>companyCalls.push(id),onOpenProduct:(company,product)=>productCalls.push([company,product])});
 await container.events.get('click')(clickTarget('[data-report-case]',{dataset:{reportCase:'company-a',product:''}}));
 await container.events.get('click')(clickTarget('[data-report-case]',{dataset:{reportCase:'company-b',product:'product-b'}}));
 assert.deepEqual(companyCalls,['company-a']);assert.deepEqual(productCalls,[['company-b','product-b']]);cleanup();
});

test('report text, attributes and source URLs cannot inject markup or executable URLs',()=>{
 const data=structuredClone(adex),payload='<img src=x onerror="alert(1)">';
 Object.assign(data.report,{title:payload,message:payload,scopeNote:payload,comparisonEvent:payload,comparisonNote:payload,interpretation:payload,limitations:[payload]});
 data.report.themes[0].title=payload;data.report.themes[0].summary=payload;data.report.themes[0].before=payload;data.report.themes[0].after=payload;
 data.photos.find(photo=>photo.id===data.report.themes[0].photoId).caption=payload;
 data.sources.push({id:'unsafe',url:'javascript:alert(1)',title:payload});data.report.sourceIds.push('unsafe');
 const container=containerFor();const cleanup=renderEventReport(container,{data});
 assert.doesNotMatch(container.innerHTML,/<img src=x|href="javascript:/);
 assert.match(container.innerHTML,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
 const print=eventReportMarkup(data,{print:true});assert.doesNotMatch(print,/<img src=x/);cleanup();
});

test('disposing the report cancels pending image preparation without printing or late feedback',{timeout:1000},async()=>{
 let finishDecode;
 const image={complete:true,naturalWidth:100,decode:()=>new Promise(resolve=>{finishDecode=resolve;})};
 const env=printEnvironment([[image]]),container=containerFor(env.doc),feedback=[],button={disabled:false,textContent:''};
 const cleanup=renderEventReport(container,{data:adex,onPrintFeedback:text=>feedback.push(text)});
 const pending=container.events.get('click')(clickTarget('[data-report-print]',button));
 await Promise.resolve();cleanup();await pending;
 finishDecode();await Promise.resolve();
 assert.equal(env.printed.length,0);assert.ok(env.nodes.every(node=>node.removed));
 assert.equal(env.classes.has('printing-event-report'),false);assert.equal(container.events.size,0);
 assert.deepEqual(feedback,[]);assert.equal(button.disabled,false);
});

test('a newer report print request cancels the old job without clearing the new print layout',{timeout:1000},async()=>{
 let finishDecode;
 const image={complete:true,naturalWidth:100,decode:()=>new Promise(resolve=>{finishDecode=resolve;})};
 const env=printEnvironment([[image],[]]);
 const first=printEventReport({data:adex,document:env.doc,window:env.win});await Promise.resolve();
 const second=printEventReport({data:fallbackFixture(laterEvents[0]),document:env.doc,window:env.win});
 const [cancelled,ready]=await Promise.all([first,second]);
 assert.equal(cancelled.cancelled,true);assert.equal(ready.cancelled,undefined);
 assert.equal(env.printed.length,1);assert.match(env.printed[0],/수록된 업체 자료와 확인 범위/);
 assert.ok(!env.printed[0].includes(escapeHTML(adex.report.message)),'the cancelled report must not enter the new print layout');
 assert.equal(env.classes.has('printing-event-report'),true);
 assert.equal(env.nodes[0].removed,true);assert.equal(env.nodes[1].removed,false);
 finishDecode();await Promise.resolve();assert.equal(env.printed.length,1);
 env.win.dispatch('afterprint');assert.ok(env.nodes.every(node=>node.removed));
 assert.equal(env.classes.has('printing-event-report'),false);assert.equal(env.listeners.get('afterprint').size,0);
});

test('an external abort stops font preparation and a pre-aborted request creates no print root',{timeout:1000},async()=>{
 const env=printEnvironment(),controller=new AbortController();env.doc.fonts={ready:new Promise(()=>{})};
 const pending=printEventReport({data:adex,document:env.doc,window:env.win,signal:controller.signal});
 await Promise.resolve();await Promise.resolve();controller.abort();
 const result=await pending;assert.equal(result.cancelled,true);assert.equal(env.printed.length,0);assert.ok(env.nodes.every(node=>node.removed));
 const empty=printEnvironment();assert.equal((await printEventReport({data:adex,document:empty.doc,window:empty.win,signal:controller.signal})).cancelled,true);assert.equal(empty.nodes.length,0);
});

test('ready fonts clear their deadline timer before print returns',async t=>{
 const env=printEnvironment();env.doc.fonts={ready:Promise.resolve()};
 const nativeSetTimeout=globalThis.setTimeout,nativeClearTimeout=globalThis.clearTimeout,timers=new Set();
 t.mock.method(globalThis,'setTimeout',(callback,delay,...args)=>{const timer=nativeSetTimeout(callback,delay,...args);if(delay===12345)timers.add(timer);return timer;});
 t.mock.method(globalThis,'clearTimeout',timer=>{timers.delete(timer);return nativeClearTimeout(timer);});
 const ready=await printEventReport({data:adex,document:env.doc,window:env.win,timeout:12345});
 assert.equal(env.printed.length,1);assert.equal(timers.size,0);ready.cleanup();
});

test('failed image loads and thrown print calls clean up and show retry feedback',{timeout:1000},async()=>{
 const env=printEnvironment(),image={complete:true,naturalWidth:0,ownerDocument:env.doc,getAttribute:()=>'/missing.jpg',replaceWith(){}};
 const originalCreate=env.doc.createElement;let first=true;
 env.doc.createElement=()=>{const node=originalCreate();if(first){first=false;node.querySelectorAll=()=>[image];}return node;};
 const container=containerFor(env.doc),feedback=[],button={disabled:false,textContent:''};
 const cleanup=renderEventReport(container,{data:adex,onPrintFeedback:text=>feedback.push(text)});
 await container.events.get('click')(clickTarget('[data-report-print]',button));
 assert.equal(env.printed.length,0);assert.match(feedback[0],/사진을 불러오지 못했습니다/);assert.equal(button.disabled,false);assert.equal(env.classes.size,0);cleanup();
 const thrown=printEnvironment();thrown.win.print=()=>{throw new Error('print blocked');};
 await assert.rejects(printEventReport({data:adex,document:thrown.doc,window:thrown.win}),/print blocked/);
 assert.ok(thrown.nodes.every(node=>node.removed));assert.equal(thrown.classes.size,0);assert.equal(thrown.listeners.get('afterprint').size,0);
});
