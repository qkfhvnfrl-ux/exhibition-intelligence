import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {eventReportMarkup,printEventReport,renderEventReport,reportModel} from '../src/v2/report.js';

const readEvent=id=>readFile(new URL(`../data/v2/app/events/${id}.json`,import.meta.url),'utf8').then(JSON.parse);
const adex=await readEvent('adex-2025');
const laterEvents=await Promise.all(['eurosatory-2026','dsei-2025','idex-2025','saha-2026'].map(readEvent));

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

test('the reviewed report keeps its three company/product/photo links and source links',()=>{
 const model=reportModel(adex),html=eventReportMarkup(adex),printed=eventReportMarkup(adex,{print:true});
 assert.equal(model.themes.length,3);
 assert.equal((html.match(/<img\s/g)||[]).length,3);
 assert.equal((html.match(/class="report-case-link"/g)||[]).length,3);
 for(const theme of model.themes){
  const company=adex.companies.find(company=>company.id===theme.companyId);
  const product=adex.products.find(product=>product.id===theme.productId);
  const photo=adex.photos.find(photo=>photo.id===theme.photoId);
  assert.ok(company.productIds.includes(product.id));
  assert.ok(company.photoIds.includes(photo.id));
  assert.ok(photo.productIds.includes(product.id));
  assert.equal(photo.context,'event');
  assert.ok(html.includes(`data-report-case="${company.id}" data-product="${product.id}"`));
  assert.ok(html.includes(`src="${photo.src}"`));
  assert.ok(printed.includes(product.name));
 }
 assert.doesNotMatch(printed,/data-report-case=/);
 const container=containerFor();
 const cleanup=renderEventReport(container,{data:adex});
 for(const id of model.sourceIds){const source=adex.sources.find(source=>source.id===id);assert.ok(container.innerHTML.includes(source.url.replaceAll('&','&amp;')));}
 assert.match(container.innerHTML,/rel="noopener noreferrer"/);
 cleanup();
});

test('the four unreviewed editions use company-only report cases without promoting exhibit status',()=>{
 for(const data of laterEvents){
  assert.ok(data.products.every(product=>product.exhibitStatus==='unconfirmed'));
  const model=reportModel(data),html=eventReportMarkup(data),printed=eventReportMarkup(data,{print:true});
  assert.equal(model.message,'수록된 업체 자료와 확인 범위');
  assert.match(model.scopeNote,/출품은 확인 중/);
  assert.ok(model.themes.every(theme=>theme.productId===''));
  assert.doesNotMatch(html,/확인된 출품 사례|확인된 제품·서비스 자료/);
  assert.equal((printed.match(/ · 업체 자료<\/p>/g)||[]).length,model.themes.length);
 }
 const eurosatory=laterEvents[0],wia=reportModel(eurosatory).themes.find(theme=>eurosatory.companies.find(company=>company.id===theme.companyId).name==='Hyundai WIA');
 assert.equal(wia.productId,'');
 assert.match(eurosatory.photos.find(photo=>photo.id===wia.photoId).caption,/RCWS/);
 assert.doesNotMatch(eventReportMarkup(eurosatory,{print:true}),/경량화 105mm 자주포/);
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
 const second=printEventReport({data:laterEvents[0],document:env.doc,window:env.win});
 const [cancelled,ready]=await Promise.all([first,second]);
 assert.equal(cancelled.cancelled,true);assert.equal(ready.cancelled,undefined);
 assert.equal(env.printed.length,1);assert.match(env.printed[0],/수록된 업체 자료와 확인 범위/);
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
