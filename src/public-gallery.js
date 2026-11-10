import {escapeHtml as esc,safeImage,safeUrl} from './review-state.js';

const list = value => Array.isArray(value) ? value : [];
const unique = values => [...new Set(values.filter(Boolean))];
const sourceLink = (url,title='원문 근거') => safeUrl(url) ? `<a href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(title)} ↗</a>` : '';
export const photoYear = photo => String(photo.sourceDate || '').match(/\b(?:19|20)\d{2}\b/)?.[0] || '미상';

export function galleryCollection(catalog={},data={},reviewPhotos=[]){
  const equipment=new Map(list(catalog.equipment).map(item=>[item.id,{...item,review:false}]));
  for(const item of list(data.cases)){
    const previous=equipment.get(item.id)||{};
    equipment.set(item.id,{...previous,...item,review:true,exhibitions:[...list(previous.exhibitions),...(data.event?.id?[{id:data.event.id,status:item.eventStatus}]:[])]});
  }
  const seenIds=new Set(),seenSources=new Set(),seenHashes=new Set(),photos=[];
  for(const photo of [...list(reviewPhotos),...list(catalog.photos)]){
    if(!photo?.id || !equipment.has(photo.equipmentId) || !safeImage(photo.src) || seenIds.has(photo.id) || seenSources.has(photo.src) || (photo.sha256&&seenHashes.has(photo.sha256)))continue;
    seenIds.add(photo.id);seenSources.add(photo.src);if(photo.sha256)seenHashes.add(photo.sha256);
    photos.push({...photo,year:photoYear(photo)});
  }
  const events=new Map(list(catalog.exhibitions).map(event=>[event.id,{...event,label:`${event.name} ${event.year}`} ]));
  if(data.event?.id)events.set(data.event.id,{...data.event,label:data.event.name});
  return {equipment,photos,events,criteria:list(catalog.criteria)};
}

export function filterGallery(collection,filters={}){
  const query=String(filters.search||'').trim().toLocaleLowerCase();
  return collection.photos.filter(photo=>{
    const item=collection.equipment.get(photo.equipmentId);
    const related=list(item.exhibitions).some(event=>event.id===filters.event);
    if(filters.event && photo.eventId!==filters.event && !related)return false;
    if(filters.context==='event' && (photo.context!=='event' || (filters.event&&photo.eventId!==filters.event)))return false;
    if(filters.context==='reference' && photo.context==='event')return false;
    if(filters.year&&photo.year!==filters.year)return false;
    if(filters.category&&item.category!==filters.category)return false;
    if(filters.manufacturer&&item.manufacturer!==filters.manufacturer)return false;
    if(filters.product&&photo.equipmentId!==filters.product)return false;
    if(filters.topic==='review'&&!list(item.observations).length)return false;
    if(filters.topic&&filters.topic!=='review'&&!list(item.analysis).some(row=>row.criterion===filters.topic))return false;
    return !query || [item.name,item.manufacturer,item.category,...list(item.tags),photo.caption,photo.angle,photo.variantNote].join(' ').toLocaleLowerCase().includes(query);
  });
}

export function mountPublicGallery(container,{catalog={},data={},photos=[]}={}){
  const collection=galleryCollection(catalog,data,photos),controller=new AbortController();
  const filters={event:'',context:'',year:'',category:'',manufacturer:'',product:'',topic:'',search:''};
  let selected=[],destroyed=false;
  container.classList.add('public-gallery');
  const byId=id=>collection.photos.find(photo=>photo.id===id);
  const contextLabel=photo=>photo.context==='event' ? `현장사진 · ${collection.events.get(photo.eventId)?.label||photo.eventId||'행사 확인'}` : '참고사진 · 전시형과 구분';
  const image=photo=>`<img src="${esc(photo.src)}" alt="${esc(photo.caption||'공개 장비 사진')}" loading="lazy" decoding="async">`;
  const credit=photo=>`<p class="pg-credit">${esc(photo.author||'저작자 미상')} · ${esc(photo.license||'이용조건 확인')} ${sourceLink(photo.sourceUrl,'사진 출처')} ${sourceLink(photo.licenseUrl,'이용조건')}</p>`;
  const select=(name,title,choices)=>`<label>${title}<select data-gallery-filter="${name}"><option value="">전체</option>${choices.map(([id,label])=>`<option value="${esc(id)}"${filters[name]===id?' selected':''}>${esc(label)}</option>`).join('')}</select></label>`;
  const records=[...collection.equipment.values()];
  const analysisFor=item=>filters.topic==='review'?list(item.observations):filters.topic?list(item.analysis).filter(row=>row.criterion===filters.topic):[...list(item.observations),...list(item.analysis)];
  function changes(item){
    const rows=list(item.changes).filter(row=>list(row.sourceUrls).some(safeUrl));
    if(!rows.length)return '';
    return `<section class="pg-changes"><h3>${esc(item.name)} · 자료연도별 확인 내용</h3><p>전시 구성과 공개 설명의 차이입니다. 동일 형상의 성능 개선을 입증하지 않습니다.</p>${rows.map(row=>`<article><span>${esc(row.from)} → ${esc(row.to)}</span><h4>${esc(row.title)}</h4><p>${esc(row.detail)}</p><div class="pg-links">${list(row.sourceUrls).map((url,i)=>sourceLink(url,`전후 근거 ${i+1}`)).join('')}</div></article>`).join('')}</section>`;
  }
  function render(){
    if(destroyed)return;
    const visible=filterGallery(collection,filters),eventCount=visible.filter(photo=>photo.context==='event').length;
    const active=document.activeElement?.matches('[data-gallery-search]'),position=active?document.activeElement.selectionStart:null;
    container.innerHTML=`<div class="pg-heading"><div><p class="eyebrow">PUBLIC PHOTO ARCHIVE</p><h2>공개 사진 모음</h2><p>전시 현장과 참고 형상을 함께 찾고, 선택한 두 사진의 출처·자료시점·관찰을 비교합니다.</p></div><span class="pg-total">${collection.photos.length}<small>공개 사진</small></span></div>
      <div class="pg-filters"><label class="pg-search">사진·장비 검색<input data-gallery-search type="search" placeholder="장비명, 업체, 촬영각, 형상 설명" value="${esc(filters.search)}"></label>
      ${select('event','관련 전시회',[...collection.events.values()].map(event=>[event.id,event.label]))}
      ${select('year','사진 자료연도',unique(collection.photos.map(photo=>photo.year)).sort().reverse().map(year=>[year,year==='미상'?'시점 미상':year+'년']))}
      ${select('context','사진 구분',[['event','행사 현장사진'],['reference','참고 형상 사진']])}
      ${select('category','장비 분류',unique(records.map(item=>item.category)).map(value=>[value,value]))}
      ${select('manufacturer','업체',unique(records.map(item=>item.manufacturer)).map(value=>[value,value]))}
      ${select('product','제품',records.map(item=>[item.id,item.name]))}
      ${select('topic','분석 주제',[['review','ADEX 2025 전시 관찰'],...collection.criteria.map(item=>[item.id,item.label])])}
      <button class="button quiet" data-gallery-action="reset">필터 초기화</button></div>
      <p class="pg-filter-note">‘관련 전시회’에는 해당 장비의 참고사진도 포함됩니다. 해당 회차의 실제 사진만 보려면 ‘행사 현장사진’을 선택하세요. 분석 주제는 장비에 연결된 근거의 분류이며, 사진 속 부품 식별 결과가 아닙니다.</p>
      <div class="pg-toolbar"><p><strong>${visible.length}장</strong> · 현장 ${eventCount} / 참고 ${visible.length-eventCount}</p><div><span>${selected.length}/2 선택</span><button class="button primary" data-gallery-action="compare" ${selected.length===2?'':'disabled'}>선택 사진 비교</button><button class="button quiet" data-gallery-action="clear" ${selected.length?'':'disabled'}>선택 해제</button></div></div>
      ${selected.length?`<div class="pg-selected" aria-label="비교 선택 사진">${selected.map(id=>{const photo=byId(id);return `<button data-gallery-action="toggle" data-gallery-id="${esc(id)}" title="비교 선택 해제">${image(photo)}<span>${esc(collection.equipment.get(photo.equipmentId).name)} · ${esc(photo.angle||'공개사진')} ×</span></button>`;}).join('')}</div>`:''}
      ${filters.product?changes(collection.equipment.get(filters.product)):''}
      ${visible.length?`<div class="pg-grid">${visible.map(photo=>{const item=collection.equipment.get(photo.equipmentId);return `<article class="pg-card ${selected.includes(photo.id)?'selected':''}"><button class="pg-photo" data-gallery-action="open" data-gallery-id="${esc(photo.id)}" aria-label="${esc(photo.caption)} 확대">${image(photo)}<span>확대 · 분석 ↗</span></button><div class="pg-card-body"><p class="pg-context ${photo.context==='event'?'event':''}">${esc(contextLabel(photo))}</p><div class="pg-card-title"><h2>${esc(item.name)}</h2><span>${esc(photo.year==='미상'?'시점 미상':photo.year)}</span></div><p class="pg-caption">${esc(photo.caption)}</p><p class="pg-variant">${esc(photo.variantNote)}</p>${credit(photo)}<button class="button pg-select" data-gallery-action="toggle" data-gallery-id="${esc(photo.id)}" aria-pressed="${selected.includes(photo.id)}">${selected.includes(photo.id)?'선택됨 · 해제':'＋ 비교에 추가'}</button></div></article>`;}).join('')}</div>`:`<div class="empty"><h2>조건에 맞는 사진이 없습니다.</h2><p>필터를 줄이거나 시점 미상 자료를 함께 확인하세요.</p><button class="button" data-gallery-action="reset">필터 초기화</button></div>`}
      <p class="pg-feedback" role="status" aria-live="polite"></p><dialog class="pg-dialog" aria-label="공개 사진과 근거 비교"></dialog>`;
    if(active){const input=container.querySelector('[data-gallery-search]');input.focus();input.setSelectionRange(position,position);}
  }
  function modalPhoto(photo){const item=collection.equipment.get(photo.equipmentId);return `<section class="pg-modal-photo"><h2>${esc(item.name)}</h2>${image(photo)}<p class="pg-context ${photo.context==='event'?'event':''}">${esc(contextLabel(photo))}</p><p><strong>${esc(photo.caption)}</strong></p><p class="pg-date">사진 자료시점 · ${esc(photo.sourceDate||'미상')} / ${esc(photo.angle||'촬영각 미표기')}</p><p class="pg-variant">${esc(photo.variantNote)}</p>${credit(photo)}</section>`;}
  function open(ids){
    const dialog=container.querySelector('dialog'),items=ids.map(byId).filter(Boolean),pair=items.length===2;
    dialog.innerHTML=`<div class="pg-dialog-head"><h2>${pair?'선택한 두 사진 비교':'사진과 분석 근거'}</h2><button class="button" data-gallery-action="close">닫기 ×</button></div><div class="pg-dialog-body"><p class="pg-warning">${pair?'촬영각·시점·계열형이 다를 수 있습니다. 사진상의 차이와 동일 모델의 설계변경을 구분하세요.':'사진에서 확인되는 외형과 공개 문헌의 기술 설명을 구분해서 읽으세요.'}</p><div class="pg-modal-grid ${pair?'pair':''}">${items.map(modalPhoto).join('')}</div><div class="pg-analysis-grid ${pair?'pair':''}">${items.map(photo=>{const item=collection.equipment.get(photo.equipmentId),analysis=analysisFor(item);return `<section><h3>${esc(item.name)} · 연결된 분석</h3><p>${esc(item.summary||item.description||'')}</p>${analysis.length?analysis.map(row=>`<article class="pg-analysis"><h4>${esc(row.title)}</h4><p><b>공개 사실</b>${esc(row.fact)}</p><p><b>분석 의견</b>${esc(row.interpretation)}</p><p><b>확인 과제</b>${esc(row.question||row.unknown)}</p><div class="pg-links">${list(row.sourceUrls).map((url,i)=>sourceLink(url,`근거 ${i+1}`)).join('')}</div></article>`).join(''):'<p>이 조건에 연결된 분석이 없습니다.</p>'}${changes(item)}<a class="button" href="${item.review?'#cases/'+esc(item.id):'./legacy.html#equipment/'+esc(item.id)+'/overview'}">장비 상세 열기 →</a></section>`;}).join('')}</div></div>`;
    dialog.querySelectorAll('img').forEach(image=>image.loading='eager');
    dialog.showModal();dialog.querySelector('button').focus();
  }
  container.addEventListener('click',event=>{
    const target=event.target.closest('[data-gallery-action]');if(!target)return;
    const action=target.dataset.galleryAction,id=target.dataset.galleryId;
    if(action==='reset'){Object.keys(filters).forEach(key=>filters[key]='');render();}
    if(action==='clear'){selected=[];render();}
    if(action==='toggle'){
      if(selected.includes(id))selected=selected.filter(value=>value!==id);
      else if(selected.length<2&&byId(id))selected.push(id);
      else{container.querySelector('.pg-feedback').textContent='사진은 2장까지 비교할 수 있습니다. 기존 선택을 해제해 주세요.';return;}
      render();
    }
    if(action==='open')open([id]);
    if(action==='compare'&&selected.length===2)open(selected);
    if(action==='close')container.querySelector('dialog').close();
  },{signal:controller.signal});
  container.addEventListener('change',event=>{const key=event.target.dataset.galleryFilter;if(key in filters){filters[key]=event.target.value;render();}},{signal:controller.signal});
  container.addEventListener('input',event=>{if(event.target.matches('[data-gallery-search]')){filters.search=event.target.value;render();}},{signal:controller.signal});
  render();
  return ()=>{destroyed=true;controller.abort();container.querySelector('dialog')?.close();container.classList.remove('public-gallery');};
}
