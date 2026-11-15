import {loadIndex,loadEvent,getCompany,getPhotoViewerSelection,getCompanyEditorial,getBoothCompanies,searchCompanies,safeUrl} from './data.js';
import {createMapView} from './map-view.js';
import {renderCompanyPanel,renderCompare,openPhotoViewer,printCompanyReport} from './details.js';
import {renderEventReport} from './report.js';
import {parseState,serializeState,patchState,mappedBooths,companySelection,mapReturn,eventSelection} from './state.js';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=value=>new Intl.NumberFormat('ko-KR').format(value);
const categories=()=>Array.isArray(data?.taxonomy)?data.taxonomy:(data?.taxonomy?.categories||[]);
const eventName=e=>[e.name,e.year].filter(Boolean).join(' ');
let state=parseState(location.hash),index=null,data=null,viewKey='',map=null,panelCleanup=null,reportCleanup=null,compareCleanup=null;
let viewer=null,viewerKey='',renderSerial=0,showCount=60,searchTimer=0,toastTimer=0,compareOpen=false,explicitMapFocus=false,companyKey='',focusKey='';

function toast(message){const box=$('#toast');box.textContent=message;box.classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('is-visible'),3600);}
function remember(method='replace'){const url=serializeState(state);if(location.hash!==url)history[method==='push'?'pushState':'replaceState']({fieldnote:true},'',url);}
function navigate(patch,{replace=false,focusBooth=null,focusArea=null}={}){
 clearTimeout(searchTimer);state=patchState(state,patch);remember(replace?'replace':'push');return render({focusBooth,focusArea});
}
function categoryName(id){return categories().find(c=>c.id===id)?.label||categories().find(c=>c.id===id)?.name||id;}
function titleOf(c){return(c.aliases||[]).find(x=>/[가-힣]/.test(x))||c.name;}
function reasonOf(e){return e?.why||e?.whyItMatters||e?.reason||e?.judgment||e?.oneSentence||e?.summary||'';}
function matchingCompanies(){return searchCompanies(data,{query:state.q,category:state.category,hall:state.route==='explore'&&state.area!=='all'?state.area:''}).sort((a,b)=>state.q?0:Number(Boolean(b.editorialId))-Number(Boolean(a.editorialId))||Number(Boolean(b.mapBoothIds?.length))-Number(Boolean(a.mapBoothIds?.length)));}
function companyRow(c){
 const booths=(c.boothIds||[]).map(id=>data.booths.find(b=>b.id===id)).filter(Boolean),mapped=mappedBooths(data,c),halls=[...new Set(booths.map(b=>b.hall).filter(Boolean))],editorial=getCompanyEditorial(data,c.id);
 const note=editorial?reasonOf(editorial):(c.categoryIds||[]).map(categoryName).join(' · ')||'명단 등재 · 전시품목 미확인';
 return '<button class="company-row" data-company="'+esc(c.id)+'" aria-current="'+(state.company===c.id)+'"><span class="company-name">'+esc(titleOf(c))+'</span><span class="location-label">'+(mapped.length?(halls.length?'홀 '+esc(halls.join('·')):'지도 연결'):'위치 미확인')+'</span><span class="company-note">'+esc(note)+(c.sourceLabelStatus==='needs_review'?' · 원문 명칭 재확인 필요':'')+'</span></button>';
}
function companyListHTML(companies){
 return '<div class="company-list">'+companies.slice(0,showCount).map(companyRow).join('')+'</div>'+(companies.length>showCount?'<button type="button" class="more-button" data-more>업체 더 보기 ('+fmt(showCount)+' / '+fmt(companies.length)+')</button>':'')+(!companies.length?'<p class="empty-note">일치하는 업체가 없습니다. 검색어와 기술분류를 바꿔 보세요.</p>':'');
}
function bindCompanyList(container){
 container.querySelectorAll('[data-company]').forEach(button=>button.addEventListener('click',()=>selectCompany(button.dataset.company)));
 container.querySelector('[data-more]')?.addEventListener('click',()=>{showCount+=60;renderContent();});
}
function selectCompany(id,{boothId='',productId=''}={}){
 const company=getCompany(data,id);if(!company)return;
 navigate(companySelection(state,company,{boothId,productId}));
}
function selectBooth(id){
 const companies=getBoothCompanies(data,id);
 if(companies.length===1)selectCompany(companies[0].id,{boothId:id});
 else navigate({route:'explore',booth:id,company:'',product:'',photo:'',tour:'',step:0});
}
function closeCompany(){navigate(mapReturn(state));}
function locateCompany(company){
 const target=(company.boothIds||[]).includes(state.booth)?state.booth:mappedBooths(data,company)[0];
 if(!target){toast('이 업체의 지도 좌표는 아직 확인되지 않았습니다');return;}
 const area=data.booths.find(b=>b.id===target)?.hall||'all';
 navigate({...mapReturn(state),booth:target,area},{focusBooth:target});
}
function selectProduct(productId){navigate({product:productId}).then(()=>scrollToProduct(productId));}
function scrollToProduct(productId){
 const element=[...document.querySelectorAll('[data-product-id]')].find(el=>el.dataset.productId===productId&&!el.matches('button,a'));
 if(!element)return;
 element.setAttribute('tabindex','-1');element.focus({preventScroll:true});element.scrollIntoView({behavior:'auto',block:'start'});
}
function addCompare(company){
 const ids=state.compare||[];
 if(ids.includes(company.id)){toast('이미 비교에 담은 업체입니다');return;}
 if(ids.length===4){toast('최대 4개 업체를 비교합니다. 기존 선택을 먼저 해제하세요.');openCompare();return;}
 navigate({compare:[...ids,company.id]},{replace:true});toast(titleOf(company)+' · 비교에 담았습니다');
}
function openCompare(){
 compareOpen=true;const layer=$('#compare-layer');layer.hidden=false;compareCleanup?.();
 if(!state.compare.length){
  layer.innerHTML='<section class="compare-intro"><h2>업체 비교</h2><p>업체 상세의 ‘비교에 담기’로 대상을 선택하세요. 같은 회차의 출품 내용과 적용 조건을 나란히 읽습니다.</p><button>업체 탐색으로 돌아가기</button></section>';layer.querySelector('button').addEventListener('click',closeCompare);
 }else compareCleanup=renderCompare(layer,{data,companyIds:state.compare,onRemove:id=>navigate({compare:state.compare.filter(x=>x!==id)},{replace:true}),onOpenCompany:id=>{closeCompare();selectCompany(id);},onClose:closeCompare,onPrint:()=>printCompanyReport({data,companyIds:state.compare,title:eventName(data.event)+' · 업체 비교',comparison:true})});
}
function closeCompare(){compareOpen=false;compareCleanup?.();compareCleanup=null;$('#compare-layer').hidden=true;$('#compare-layer').innerHTML='';}
function openPhoto({photos,index:photoIndex=0,productId=''}){const photo=photos[photoIndex];if(photo)navigate({photo:photo.id,product:productId});}
function syncPhoto(){
 const selection=state.route==='company'&&state.company?getPhotoViewerSelection(data,state):{photos:[],index:-1,productId:''};
 const {photos,index:at,productId}=selection,key=state.photo&&at>=0?[state.event,state.company,productId].join('|'):'';
 if(!key){viewer?.destroy();viewer=null;viewerKey='';return;}
 if(viewer&&viewerKey===key){viewer.updateIndex(at);return;}
 viewer?.destroy();viewerKey=key;viewer=openPhotoViewer({photos,index:at,onClose:()=>navigate({photo:''},{replace:true}),onIndexChange:(_,photo)=>{state=patchState(state,{photo:photo.id});remember('replace');}});
}
function openCatalog(catalog){const url=safeUrl(catalog?.url||catalog?.sourceUrl||catalog);if(url)window.open(url,'_blank','noopener,noreferrer');else toast('원문 주소를 확인할 수 없습니다');}

function renderMapList(){
 const container=$('#company-panel'),shared=state.booth?getBoothCompanies(data,state.booth):[];
 if(shared.length>1){
  container.innerHTML='<section class="shared-choice"><p class="eyebrow">선택한 지도 영역</p><h2>공동부스 · 업체 선택</h2><p>같은 부스에 표기된 '+shared.length+'개 업체입니다.</p>'+companyListHTML(shared)+'<button class="more-button" data-all-companies>전체 목록으로</button></section>';
  container.querySelector('[data-all-companies]').onclick=()=>navigate({booth:''});
 }else{
  const companies=matchingCompanies();
  container.innerHTML='<div class="sidebar-inner"><div class="sidebar-title"><h2>'+(state.q?'검색 결과':'업체 탐색')+'</h2><span class="count-label">'+fmt(companies.length)+'개 명칭</span></div><p>'+(state.q?'업체를 선택하면 별도 화면에서 전시자료를 읽을 수 있습니다.':'지도에서 부스를 선택하거나 아래 업체 목록을 둘러보세요.')+'</p>'+companyListHTML(companies)+'</div>';
 }
 bindCompanyList(container);
}
function renderCompany({preserveReaderPosition=false}={}){
 const selected=getCompany(data,state.company),container=$('#company-detail'),key=[state.event,state.company,state.booth,state.product].join('|');
 if(preserveReaderPosition){companyKey=key;return;}
 if(companyKey===key)return;panelCleanup?.();panelCleanup=null;companyKey=key;
 if(!selected){container.innerHTML='<p class="empty-note">이 회차에서 해당 업체를 찾지 못했습니다. 업체 목록에서 다시 선택하세요.</p>';return;}
 $('#main h1').textContent=titleOf(selected)+' · 업체·장비';
 const shared=state.booth?getBoothCompanies(data,state.booth):[];
 container.innerHTML='';
 if(shared.length>1){
  const menu=document.createElement('div');menu.className='shared-mini';menu.innerHTML='같은 공동부스 <button type="button">다른 업체 선택 ('+shared.length+')</button>';container.append(menu);
  menu.querySelector('button').onclick=()=>navigate(mapReturn(state));
 }
 const detail=document.createElement('div');container.append(detail);
 panelCleanup=renderCompanyPanel(detail,{data,company:selected,productId:state.product,onClose:closeCompany,onLocate:locateCompany,onCompare:addCompare,onPhoto:openPhoto,onCatalog:openCatalog,onProduct:selectProduct,onReport:()=>navigate({route:'report',photo:''}),onPrint:company=>printCompanyReport({data,companyIds:[company.id],title:eventName(data.event)+' · '+titleOf(company)})});
}
function currentMapDocument(){return data.mapDocuments.find(doc=>data.mapGeometries.some(g=>g.documentId===doc.id))||data.mapDocuments[0]||null;}
function mountExplore(){
 const doc=currentMapDocument(),ready=Boolean(doc&&data.mapGeometries.some(g=>g.documentId===doc.id)),areas=ready?(doc.areas||[]):[];
 $('#main').innerHTML='<div class="explore-layout"><section class="map-column"><div class="map-heading"><div><p class="eyebrow">전시 현장에서 읽는 기술</p><h1>'+esc(eventName(data.event))+'</h1><p class="context-line">'+esc(data.event.venue||'공식 전시자료')+' · '+(ready?'공식 사전 배치도':'업체·출품자료')+'</p></div>'+(areas.length?'<label class="area-control"><span>전시 구역</span><select id="area-select" aria-label="홀·층·야외구역"><option value="all">전체 전시장</option>'+areas.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.label)+'</option>').join('')+'</select></label>':'')+'</div><div id="map-host" class="map-host"></div>'+(ready?'<div class="map-legend"><span><i class="legend-square" aria-hidden="true"></i>부스를 선택하면 업체를 열 수 있습니다</span><span>위치 미확인 업체도 목록에서 탐색</span></div>':'')+'<div class="map-source">'+(doc?'<a href="'+esc(safeUrl(doc.url))+'" target="_blank" rel="noopener noreferrer">'+(ready?'공식 배치도 PDF 원문':'공식 행사 안내도 원문')+'</a><span>'+(ready?'사전 배치도 · '+esc(doc.revisionAt||doc.publishedAt||'개정일 미확인'):'부스 배치용 검증 자료 미확보')+'</span>':'<span>검증된 부스 배치도 미확보</span>')+'</div></section><aside id="company-panel" class="explore-sidebar" aria-label="업체 목록"></aside></div>';
 $('#area-select')?.addEventListener('change',event=>navigate({area:event.target.value,company:'',booth:'',product:'',photo:''},{focusArea:event.target.value}));
 if(ready){
  const labels=Object.fromEntries(data.booths.map(booth=>[booth.id,getBoothCompanies(data,booth.id).map(titleOf).join(' / ')]));
  map=createMapView($('#map-host'),{document:doc,geometries:data.mapGeometries.filter(g=>g.documentId===doc.id),booths:data.booths,occupancies:data.boothOccupancies,labels,areas,background:doc.background||{},activeHall:state.area,mode:'2d',view:state.view,onSelectBooth:selectBooth,onViewChange:(view,meta)=>{
   // The map focuses clicked booths internally. Preserve the reader's return camera.
   if(meta.reason==='booth-focus'&&!explicitMapFocus)return;
   state=patchState(state,{view});if(meta.commit)remember(explicitMapFocus?'replace':'push');else if(meta.reason==='booth-focus'||meta.reason==='area-focus')remember('replace');
  }});
 }else{
  $('#map-host').innerHTML='<div class="empty-map"><p class="eyebrow">지도 자료 미확보</p><h2>업체 목록에서 전시자료를 확인하세요</h2><p>이 회차는 검증된 부스 좌표가 없어 업체를 지도에 배치하지 않았습니다. 확인된 '+fmt(data.companies.length)+'개 업체 명칭은 모두 목록에서 찾을 수 있습니다.</p><button id="browse-list">업체 목록 열기</button></div>';
  $('#browse-list').onclick=()=>navigate({route:'companies',company:'',product:'',photo:''});
 }
}
function mountCatalog(){
 $('#main').innerHTML='<section class="catalog-page"><header class="catalog-heading"><div><p class="eyebrow">'+esc(eventName(data.event))+'</p><h1>업체·장비</h1><p class="context-line">위치가 확인되지 않은 업체도 포함한 전체 명단입니다. 업체를 열어 확인된 사진과 출품자료를 읽으세요.</p></div><span id="catalog-count" class="count-label"></span></header><div id="catalog-list"></div></section>';
}
function mountCompany(){
 const company=getCompany(data,state.company);
 $('#main').innerHTML='<section class="company-page"><div class="company-navigation"><button data-back-map>← 지도로 돌아가기</button><span>'+esc(eventName(data.event))+'</span><button data-company-list>전체 업체</button></div><h1 class="sr-only">'+esc(company?titleOf(company):'업체')+' · 업체·장비</h1><div id="company-detail"></div></section>';
 $('#main').querySelector('[data-back-map]').onclick=closeCompany;
 $('#main').querySelector('[data-company-list]').onclick=()=>navigate({route:'companies',company:'',product:'',photo:''});
}
function mountReport(){
 reportCleanup=renderEventReport($('#main'),{data,onOpenProduct:(companyId,productId)=>selectCompany(companyId,{productId}),onOpenCompany:id=>selectCompany(id),onBack:()=>navigate(mapReturn(state)),onPrintFeedback:toast});
}
function updateFocus({preserveReaderPosition=false}={}){
 const next=[state.route,state.event,state.company,state.product].join('|');
 if(next===focusKey)return;focusKey=next;
 if(state.photo||preserveReaderPosition)return;
 requestAnimationFrame(()=>{
  if(focusKey!==next||state.photo)return;
  if(state.route==='company'&&state.product){scrollToProduct(state.product);return;}
  $('#main').focus({preventScroll:true});$('#main').scrollIntoView({block:'start',behavior:'auto'});
 });
}
function renderContent({focusBooth=null,focusArea=null}={}){
 const key=state.route+'|'+state.event;
 const preserveReaderPosition=state.route==='company'&&Boolean(viewer||state.photo)&&companyKey.split('|').slice(0,3).join('|')===[state.event,state.company,state.booth].join('|');
 if(viewKey!==key){
  map?.destroy();map=null;explicitMapFocus=false;panelCleanup?.();panelCleanup=null;reportCleanup?.();reportCleanup=null;companyKey='';viewKey=key;
  if(state.route==='explore')mountExplore();else if(state.route==='companies')mountCatalog();else if(state.route==='company')mountCompany();else mountReport();
 }
 if(state.route==='explore'){
  const matches=matchingCompanies(),highlighted=new Set(matches.flatMap(c=>mappedBooths(data,c)));
  // A supplied view prevents map.update from refocusing a changed area implicitly.
  map?.update({activeHall:state.area,mode:'2d',selectedBoothId:state.booth,highlightedBoothIds:state.q||state.category?[...highlighted]:[],view:state.view});
  if(focusBooth&&map){explicitMapFocus=true;map.focusBooth(focusBooth,{animate:false});explicitMapFocus=false;}
  if(focusArea&&map){explicitMapFocus=true;if(focusArea==='all')map.fit({animate:false});else map.focusArea(focusArea,{animate:false});explicitMapFocus=false;}
  if($('#area-select'))$('#area-select').value=state.area;renderMapList();
 }else if(state.route==='companies'){
  const companies=matchingCompanies();$('#catalog-count').textContent=fmt(companies.length)+'개 명칭';$('#catalog-list').innerHTML=companyListHTML(companies);bindCompanyList($('#catalog-list'));
 }else if(state.route==='company')renderCompany({preserveReaderPosition});
 syncPhoto();if(compareOpen)openCompare();updateFocus({preserveReaderPosition});
}
function canonicalizeSelection(){
 let patch={};
 // Previous split-screen URLs still open the same company in the separate reader.
 if(state.company&&['explore','companies'].includes(state.route))patch.route='company';
 if(state.company&&!getCompany(data,state.company)){patch={route:'companies',company:'',product:'',photo:'',booth:''};}
 if(state.route==='company'&&!state.company)patch.route='companies';
 if(state.product&&!(getCompany(data,state.company)?.productIds||[]).includes(state.product))patch.product='';
 // Retain parsing compatibility for old URLs; the approved map UI uses 2D.
 if(state.mode!=='2d')patch.mode='2d';
 if(Object.keys(patch).length){state=patchState(state,patch);remember('replace');}
}
async function render(options={}){
 const serial=++renderSerial;
 try{
  if(!index)index=await loadIndex();if(serial!==renderSerial)return;
  if(!index.events.some(event=>event.id===state.event)){state=eventSelection(state,'adex-2025');remember('replace');}
  if(!data||data.event.id!==state.event){
   map?.destroy();map=null;viewer?.destroy();viewer=null;viewKey='';companyKey='';$('#main').innerHTML='<div class="loading-note" role="status">전시 자료를 불러오고 있습니다</div>';
   const loaded=await loadEvent(state.event);if(serial!==renderSerial)return;data=loaded;showCount=60;
  }
  canonicalizeSelection();
  document.querySelectorAll('#filters input,#filters select,#filters button,#compare-toggle').forEach(el=>el.disabled=false);
  $('#event-select').innerHTML=index.events.map(event=>'<option value="'+esc(event.id)+'">'+esc(eventName(event))+'</option>').join('');$('#event-select').value=state.event;
  $('#category-select').innerHTML='<option value="">전체 기술분야</option>'+categories().map(category=>'<option value="'+esc(category.id)+'">'+esc(category.label||category.name)+'</option>').join('');$('#category-select').value=state.category;
  if(document.activeElement!==$('#company-search'))$('#company-search').value=state.q;
  $('#compare-count').textContent=state.compare.length;
  document.querySelectorAll('[data-nav]').forEach(link=>{
   link.setAttribute('href',serializeState(navigationState(link.dataset.nav)));
   if(link.dataset.nav===(state.route==='company'?'companies':state.route))link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
  $('#data-date').textContent=String(index.dataAsOf||'2026-11-12').slice(0,10);
  const official={'adex-2025':'https://adex.bciaerospace.com/','eurosatory-2026':'https://www.eurosatory.com/en/catalogue/','dsei-2025':'https://www.dsei.co.uk/visit/exhibiting-companies','idex-2025':'https://idexuae.ae/','saha-2026':'https://sahaexpo.com/en/exhibitors'};
  $('#page-source').href=official[state.event];document.body.dataset.route=state.route;
  document.title=eventName(data.event)+' · '+(state.route==='explore'?'전시장 지도':state.route==='report'?'전시회 종합보고':'업체·장비')+' | FIELDNOTE';
  renderContent(options);
 }catch(error){
  viewKey='';companyKey='';$('#main').innerHTML='<section class="empty-note"><h1>자료를 열지 못했습니다</h1><p>'+esc(error.message)+'</p><button id="retry-data">다시 불러오기</button></section>';$('#retry-data').onclick=()=>render();
 }
}
function navigationState(route){
 if(route==='explore')return mapReturn(state);
 return patchState(state,{route,company:'',product:'',photo:'',booth:''});
}
function search(){
 showCount=60;
 navigate({q:$('#company-search').value.trim(),area:'all',company:'',booth:'',product:'',photo:'',tour:'',step:0,route:state.route==='explore'?'explore':'companies'});
}
$('#filters').addEventListener('submit',event=>{event.preventDefault();clearTimeout(searchTimer);search();});
$('#company-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(search,260);});
$('#clear-search').onclick=()=>{clearTimeout(searchTimer);$('#company-search').value='';search();$('#company-search').focus();};
$('#event-select').addEventListener('change',event=>{if(event.target.value===state.event)return;closeCompare();navigate(eventSelection(state,event.target.value));});
$('#category-select').addEventListener('change',event=>{showCount=60;navigate({category:event.target.value,company:'',booth:'',product:'',photo:'',tour:'',step:0,route:state.route==='explore'?'explore':'companies'});});
$('#compare-toggle').onclick=openCompare;
document.querySelectorAll('[data-nav]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();navigate(navigationState(link.dataset.nav));}));
$('.skip-link').addEventListener('click',event=>{event.preventDefault();$('#main').focus();$('#main').scrollIntoView({block:'start'});});
$('.brand').addEventListener('click',event=>{event.preventDefault();navigate(mapReturn(state));});
function restoreLocation(){clearTimeout(searchTimer);state=parseState(location.hash);$('#company-search').value=state.q;showCount=60;render();}
window.addEventListener('popstate',restoreLocation);
window.addEventListener('hashchange',()=>{if(serializeState(parseState(location.hash))!==serializeState(state))restoreLocation();});
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&compareOpen)closeCompare();});
remember('replace');render();
