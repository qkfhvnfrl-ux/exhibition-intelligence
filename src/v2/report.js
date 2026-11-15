import {escapeHTML,photoUrl,preparePrintImages} from './details.js';
import {safeUrl} from './data.js';
const esc=escapeHTML;
const arr=value=>Array.isArray(value)?value:[];
const nameOf=company=>company?.displayName||company?.name||'';
const eventName=data=>`${data.event.name} ${data.event.year||''}`.trim();
function availableCases(data){
 return data.companies.filter(c=>c.productIds.length||c.photoIds.length).map(company=>({company,photo:arr(data.photos).find(p=>company.photoIds.includes(p.id)&&p.context==='event'&&photoUrl(p))})).sort((a,b)=>Number(Boolean(b.photo))-Number(Boolean(a.photo))||b.company.productIds.length-a.company.productIds.length);
}
export function reportModel(data){
 if(data.report)return data.report;
 const cases=availableCases(data).slice(0,3);
 return {eventId:data.event.id,asOf:data.dataAsOf,title:eventName(data),message:'수록된 업체 자료와 확인 범위',scopeNote:'현재 수록된 업체 자료 기준 · 개별 제품 출품은 확인 중 · 행사 전체 조사 아님',comparisonEvent:null,comparisonNote:'직전 개최 회차의 자료 대조가 끝나지 않아 변화 판단을 보류합니다.',themes:cases.map(({company,photo})=>({title:nameOf(company),summary:company.reason||company.interpretationNote||'해당 회차 출품 근거와 사진의 확인 범위를 업체 화면에서 읽을 수 있습니다.',companyId:company.id,productId:'',photoId:photo?.id||'',before:'비교 자료 미확보',after:company.productIds.length?'제품·서비스 참고자료 · 출품 확인 중':'사진·명단 자료',sourceIds:company.sourceIds})),interpretation:'전시회 전체의 개발 방향은 비교 가능한 표본과 직전 회차 근거를 더 확보한 뒤 판단합니다.',limitations:['대표사진은 업체 자료이며 특정 장비의 출품사진으로 연결하지 않습니다.','제조사 일반 제품과 해당 회차 출품은 구분합니다.','사진이 없거나 이용조건이 미확정인 사례도 업체 목록에서 확인할 수 있습니다.'],sourceIds:[]};
}
function photoMarkup(data,theme,{print=false}={}){
 const photo=data.photos.find(p=>p.id===theme.photoId&&p.context==='event');
 const src=photo&&photoUrl(photo);
 if(!src)return '<div class="report-photo-missing"><span>현장사진 미확보</span><small>해당 회차에서 식별·표시 가능한 사진이 필요합니다.</small></div>';
 const original=safeUrl(photo.sourceUrl),rights=safeUrl(photo.rights?.licenseUrl)||original;
 const license=photo.rights?.license||'',rightsLabel=/^CC(?:0| BY)/.test(license)?license:'이용조건';
 const changes=photo.variantNote?.match(/웹 표시용 [^.!?\n]*?본/)?.[0]||'';
 const links=[original?`<a href="${esc(original)}" target="_blank" rel="noopener noreferrer">사진 원문</a>`:'',rights?`<a href="${esc(rights)}" target="_blank" rel="noopener noreferrer" title="${esc(license||'원문 이용 안내 확인')}">${esc(rightsLabel)}</a>`:''].filter(Boolean).join('<span aria-hidden="true"> · </span>');
 return `<figure><img src="${esc(src)}" alt="${esc(photo.caption)}" loading="${print?'eager':'lazy'}" decoding="async"><figcaption>${esc(photo.caption)}<small>${esc(photo.credit||'제공기관 미확인')} · ${esc(data.event.year)} 현장사진</small><span class="report-photo-links">${links||'사진 원문·이용조건 주소 미확인'}${changes?` · ${esc(changes)}`:''}</span></figcaption></figure>`;
}
function reportSources(data,model){
 const photoIds=model.themes.map(theme=>theme.photoId).filter(Boolean);
 const photoSources=arr(data.photos).filter(photo=>photoIds.includes(photo.id)).flatMap(photo=>arr(photo.sourceIds));
 const ids=new Set([...arr(model.sourceIds),...model.themes.flatMap(theme=>arr(theme.sourceIds)),...photoSources]);
 const byId=new Map(arr(data.sources).map(source=>[source.id,source])),urls=new Set();
 return [...ids].map(id=>byId.get(id)).filter(source=>{const url=source&&safeUrl(source.url);if(!url||urls.has(url))return false;urls.add(url);return true;});
}
function printSourcesMarkup(data,model){
 const sources=reportSources(data,model);
 return sources.length?`<p class="report-print-sources"><span>보고 근거</span> ${sources.map((source,i)=>`<a href="${esc(safeUrl(source.url))}" target="_blank" rel="noopener noreferrer" title="${esc([source.title,source.publisher,source.publishedAt].filter(Boolean).join(' · '))}">[${i+1}] ${esc(source.publisher||'원문')} ${esc(String(source.publishedAt||'').slice(0,4))}</a>`).join(' · ')}</p>`:'<p class="report-print-sources">보고 근거 원문 미확보</p>';
}
export function eventReportMarkup(data,{print=false}={}){
 const model=reportModel(data);
 return `<article class="event-report-sheet" aria-label="${esc(model.title)} 종합보고"><header class="report-sheet-heading"><p class="report-eyebrow">FIELDNOTE · ${esc(model.title)}</p><h1>${esc(model.message)}</h1><p class="report-scope">${esc(model.scopeNote)}</p></header><div class="report-theme-grid">${model.themes.map((theme,i)=>`<section class="report-theme"><div class="report-theme-heading"><span aria-hidden="true">0${i+1}</span><h2>${esc(theme.title)}</h2></div>${photoMarkup(data,theme,{print})}<p class="report-theme-summary">${esc(theme.summary)}</p>${print?`<p class="report-case-name">${esc(nameOf(data.companies.find(c=>c.id===theme.companyId)))} · ${esc(data.products.find(p=>p.id===theme.productId)?.name||'업체 자료')}</p>`:`<button class="report-case-link" data-report-case="${esc(theme.companyId)}" data-product="${esc(theme.productId||'')}">사례와 근거 읽기 <span aria-hidden="true">↗</span></button>`}</section>`).join('')}</div><section class="report-comparison"><h2>${model.comparisonEvent?`${esc(model.comparisonEvent)} → ${esc(model.title)}`:'직전 회차 대비 변화'}</h2><div class="report-change-grid">${model.themes.map(theme=>`<div><p><span>이전</span>${esc(theme.before)}</p><p><span>이번</span>${esc(theme.after)}</p></div>`).join('')}</div><p class="report-comparison-note">${esc(model.comparisonNote)}</p></section><footer class="report-sheet-footer"><p class="report-interpretation">${esc(model.interpretation)}</p><p class="report-limits">${arr(model.limitations).map(esc).join(' · ')}<br>자료 기준 ${esc(model.asOf||data.dataAsOf||'원문 발행일 참조')}</p>${print?printSourcesMarkup(data,model):''}</footer></article>`;
}
function sourcesMarkup(data,model){
 const sources=reportSources(data,model);
 return `<details class="report-sources"><summary>판단 근거와 비교 원문</summary><ol>${sources.map(s=>`<li><a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><small>${esc([s.publisher,s.publishedAt].filter(Boolean).join(' · '))}</small>${s.note?`<p>${esc(s.note)}</p>`:''}</li>`).join('')}</ol></details>`;
}
const printJobs=new WeakMap();
function waitForFonts(ready,{timeout,signal}){
 return new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(settle,value)=>{if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',abort);settle(value);};
  const abort=()=>finish(reject,new Error('보고서 준비가 취소되었습니다.'));
  const timer=setTimeout(()=>finish(resolve),timeout);
  signal.addEventListener('abort',abort,{once:true});
  if(signal.aborted){abort();return;}
  Promise.resolve(ready).then(()=>finish(resolve),error=>finish(reject,error));
 });
}
export async function printEventReport({data,document:doc=globalThis.document,window:win=globalThis.window,timeout=10000,signal}={}){
 if(!doc||!win?.print)throw new Error('인쇄 기능을 사용할 수 없습니다.');
 if(signal?.aborted)return {cancelled:true};
 printJobs.get(doc)?.();
 const root=doc.createElement('div');root.className='event-report-print-root';root.innerHTML=eventReportMarkup(data,{print:true});doc.body.append(root);doc.body.classList.add('printing-event-report');
 const controller=new AbortController();
 let cleaned=false;
 const cleanup=()=>{
  if(cleaned)return;cleaned=true;
  controller.abort();root.remove();win.removeEventListener('afterprint',cleanup);signal?.removeEventListener('abort',cleanup);
  if(printJobs.get(doc)===cleanup){doc.body.classList.remove('printing-event-report');printJobs.delete(doc);}
 };
 printJobs.set(doc,cleanup);
 signal?.addEventListener('abort',cleanup,{once:true});
 try{
  const result=await preparePrintImages(root,{timeout,signal:controller.signal});
  if(result.failedImages.length)throw new Error('보고서 사진을 불러오지 못했습니다. 사진을 다시 확인한 뒤 저장하세요.');
  if(doc.fonts?.ready)await waitForFonts(doc.fonts.ready,{timeout,signal:controller.signal});
  if(controller.signal.aborted)return {cancelled:true};
  win.addEventListener('afterprint',cleanup,{once:true});win.print();return {...result,cleanup};
 }catch(error){const cancelled=controller.signal.aborted;cleanup();if(cancelled)return {cancelled:true};throw error;}
}
export function renderEventReport(container,{data,onOpenProduct,onOpenCompany,onBack,onPrintFeedback}={}){
 const model=reportModel(data);
 const controller=new AbortController();
 container.innerHTML=`<section class="event-report-page"><div class="report-toolbar"><button data-report-back>← 지도로 돌아가기</button><div><button data-report-fullscreen>전체화면 보고</button><button data-report-print class="primary-button">한 장 PDF로 저장</button></div></div>${eventReportMarkup(data)}${sourcesMarkup(data,model)}<section class="report-more"><h2>다른 업체도 살펴보기</h2><p>보고의 대표 사례는 전체 참가기업을 뜻하지 않습니다.</p><div>${availableCases(data).map(({company})=>`<button data-report-company="${esc(company.id)}">${esc(nameOf(company))}</button>`).join('')}</div></section></section>`;
 const click=async event=>{
  if(controller.signal.aborted)return;
  const caseLink=event.target.closest('[data-report-case]');if(caseLink){if(caseLink.dataset.product)onOpenProduct?.(caseLink.dataset.reportCase,caseLink.dataset.product);else onOpenCompany?.(caseLink.dataset.reportCase);return;}
  const companyLink=event.target.closest('[data-report-company]');if(companyLink){onOpenCompany?.(companyLink.dataset.reportCompany);return;}
  if(event.target.closest('[data-report-back]'))onBack?.();
  const full=event.target.closest('[data-report-fullscreen]');
  if(full){try{const sheet=container.querySelector('.event-report-sheet');if(container.ownerDocument.fullscreenElement)await container.ownerDocument.exitFullscreen();else if(sheet.requestFullscreen)await sheet.requestFullscreen();else throw new Error('unavailable');}catch{onPrintFeedback?.('이 브라우저에서는 전체화면 전환을 지원하지 않습니다.');}}
  const print=event.target.closest('[data-report-print]');
  if(print&&!print.disabled){print.disabled=true;print.textContent='사진·보고서 준비 중';try{const result=await printEventReport({data,document:container.ownerDocument||globalThis.document,window:container.ownerDocument?.defaultView||globalThis.window,signal:controller.signal});if(!result.cancelled)onPrintFeedback?.('인쇄 창에서 PDF로 저장을 선택하세요.');}catch(error){if(!controller.signal.aborted)onPrintFeedback?.(error.message);}finally{print.disabled=false;print.textContent='한 장 PDF로 저장';}}
 };
 container.addEventListener('click',click);return()=>{controller.abort();container.removeEventListener('click',click);};
}
