const arr = value => Array.isArray(value) ? value : [];
const byId = (rows, id) => arr(rows).find(row => row.id === id);
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function safeExternalUrl(value) {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return ['https:','http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function photoUrl(photo) {
  if (!photo || photo.delivery === 'linked' || ['link_only','link-only'].includes(photo.rights?.status || photo.rightsStatus)) return null;
  const src = photo.src || photo.displayUrl;
  if (typeof src !== 'string') return null;
  if (/^(?:\.\/)?assets\/[a-zA-Z0-9_./%\-]+$/.test(src)) {
    try { const decoded=decodeURIComponent(src); if (!decoded.split('/').includes('..') && !decoded.includes('\\') && new URL(decoded,'https://fieldnote.invalid/').pathname.startsWith('/assets/')) return src; } catch {}
    return null;
  }
  return safeExternalUrl(src);
}
const sourceUrl = photo => safeExternalUrl(photo?.sourceUrl);
const link = (url, label, className = '') => { const href = safeExternalUrl(url); return href ? `<a class="${className}" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>` : `<span class="${className}">${escapeHTML(label)}</span>`; };
const paragraph = text => text ? `<p>${escapeHTML(text)}</p>` : '';
const list = (items, className = '') => arr(items).length ? `<ul class="${className}">${items.map(item => `<li>${escapeHTML(typeof item === 'string' ? item : item.text || item.name || '')}</li>`).join('')}</ul>` : '';
const icon = name => ({close:'<path d="m6 6 12 12M18 6 6 18"/>',expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',left:'<path d="m14 5-7 7 7 7"/>',right:'<path d="m10 5 7 7-7 7"/>',pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',print:'<path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7Z"/>',compare:'<path d="M8 3v18M16 3v18M3 7h18M3 17h18"/>'}[name] || '');
const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icon(name)}</svg>`;

export function getCompanyEditorial(data, company) {
  return byId(data?.editorials, company?.editorialId) || arr(data?.editorials).find(item => item.organizationId === company?.id || item.organizationId === company?.organizationId) || null;
}
export function companyPhotos(data, company) {
  const ids = new Set(arr(company?.photoIds));
  const editorial = getCompanyEditorial(data, company);
  for (const photo of arr(editorial?.photos)) ids.add(typeof photo === 'string' ? photo : photo.id);
  const joined = [...arr(data?.photos).filter(photo => ids.has(photo.id)), ...arr(editorial?.photos).filter(photo => typeof photo === 'object')];
  const seen = new Set();
  return joined.filter(photo => { const identity = photo.id || photo.src || photo.sourceUrl; if (!identity || seen.has(identity)) return false; seen.add(identity); return true; }).sort((a,b) => ((a.context === 'event' ? 0 : 2) + (photoUrl(a) ? 0 : 1)) - ((b.context === 'event' ? 0 : 2) + (photoUrl(b) ? 0 : 1)));
}
export function companyCatalogs(data, company) {
  const ids = new Set(arr(company?.catalogIds));
  const editorial = getCompanyEditorial(data, company);
  const rows = [...arr(data?.catalogs).filter(item => ids.has(item.id)), ...arr(editorial?.catalogs)];
  const seen = new Set();
  return rows.filter(item => { const url = safeExternalUrl(item.url); if (!url || seen.has(url)) return false; seen.add(url); return true; });
}
export function companySources(data, company) {
  const editorial = getCompanyEditorial(data, company);
  const editorialIds=arr(editorial?.sourceIds);
  const companyIds=arr(company?.sourceIds);
  const rows=[...arr(editorial?.sources),...editorialIds.map(id=>byId(data?.sources,id)),...companyIds.map(id=>byId(data?.sources,id))].filter(Boolean);
  const merged=new Map();
  const strings=value=>arr(value).length ? value.filter(item=>typeof item==='string' && item.trim()) : typeof value==='string' && value.trim() ? [value] : [];
  for(const source of rows){
    const url=safeExternalUrl(source.url);if(!url)continue;
    let item=merged.get(url);
    if(!item){item={...source,url,evidenceStatuses:[],notes:[],supports:[]};merged.set(url,item);}
    for(const key of ['title','publisher','publishedAt','date'])if(!item[key] || (key==='title' && item[key]===url))if(source[key])item[key]=source[key];
    for(const value of [...strings(source.note),...strings(source.limitations),...strings(source.notes)])if(!item.notes.includes(value))item.notes.push(value);
    for(const value of [...strings(source.support),...strings(source.supports)])if(!item.supports.includes(value))item.supports.push(value);
    for(const value of [source.evidenceStatus,source.independence,...arr(source.evidenceStatuses)].filter(Boolean))if(!item.evidenceStatuses.includes(value))item.evidenceStatuses.push(value);
  }
  return [...merged.values()];
}
const eventName = data => { const name=data?.event?.name || data?.event?.title || data?.event?.id || ''; const year=data?.event?.year; return year && !String(name).includes(String(year)) ? `${name} ${year}` : name; };
const companyName = (company,data) => getCompanyEditorial(data,company)?.displayName || company?.displayName || arr(company?.aliases).find(name=>/[가-힣]/.test(name)) || company?.name || '업체';
const boothSummary = (data, company) => arr(company?.boothIds).map(id => byId(data?.booths, id)).filter(Boolean).map(booth => [booth.hall ? `홀 ${booth.hall}` : '', booth.code ? `${/announc/i.test(booth.numberEvidence?.note || '') ? '사전 발표 부스' : '부스'} ${booth.code}` : booth.numberEvidence?.status === 'conflicting_sources' ? '번호 자료 상충' : '번호 미확인'].filter(Boolean).join(' · ')).filter((label, i, all) => all.indexOf(label) === i).join(' / ');
const canLocate = (data, company) => arr(data?.mapGeometries).some(geometry => arr(company?.boothIds).includes(geometry.boothId));
const caseReason = (data, company) => getCompanyEditorial(data, company)?.reason || company?.relevanceNote || (company?.sourceLabelStatus === 'needs_review' ? '공식 배치도에 적힌 명칭입니다. 원문 표기 재확인이 필요합니다.' : company?.status === 'listed' ? '참가 자료에 등재된 업체입니다. 이번 회차의 실제 출품품목은 아직 확인하지 못했습니다.' : company?.status === 'planned' ? '업체의 참가 예정 발표가 있습니다. 이번 회차의 실제 출품품목은 아직 확인하지 못했습니다.' : '기존 조사자료에 연결된 업체입니다. 이번 회차 참가·출품 근거는 재확인이 필요합니다.');

function imageMarkup(photo, index, {print = false, hero = false} = {}) {
  const src = photoUrl(photo);
  const caption = photo.caption || '전시 자료 사진';
  const context = photo.context === 'event' ? '해당 회차 현장' : '관련 참고사진';
  const image = src ? `<img src="${escapeHTML(src)}" alt="${escapeHTML(caption)}" loading="${print || hero ? 'eager' : 'lazy'}" decoding="async"${photo.width && photo.height ? ` width="${Number(photo.width)}" height="${Number(photo.height)}"` : ''}>` : print ? '<p class="fn-note">사진 원문 링크</p>' : `<div class="fn-photo-link-only"><span>사진 원문 열람</span><small>사진은 출처에서 확인할 수 있습니다</small></div>`;
  const content = print ? image : `<button type="button" class="fn-photo-open" data-photo-index="${index}" aria-label="${escapeHTML(caption)} 확대">${image}<span class="fn-photo-expand">${svg('expand')}</span></button>`;
  return `<figure class="fn-photo ${hero ? 'fn-photo-hero' : ''}" data-photo-id="${escapeHTML(photo.id)}">${content}<figcaption><span>${escapeHTML(caption)}</span><small>${escapeHTML([context, photo.credit || photo.author, photo.sourceDate].filter(Boolean).join(' · '))}</small>${photo.variantNote ? `<small>${escapeHTML(photo.variantNote)}</small>` : ''}${sourceUrl(photo) ? link(photo.sourceUrl,'사진 원문','fn-source-link') + (print ? `<small class="fn-print-url">${escapeHTML(sourceUrl(photo))}</small>` : '') : ''}</figcaption></figure>`;
}
function galleryMarkup(photos, {print = false} = {}) {
  if (!photos.length) return '<p class="fn-note">이 업체의 해당 회차 사진은 아직 연결하지 못했습니다.</p>';
  const rows=photos.map((photo,index)=>({photo,index}));
  const field=rows.filter(({photo})=>photo.context==='event');
  const shown=field.filter(({photo})=>photoUrl(photo));
  const linked=field.filter(({photo})=>!photoUrl(photo));
  const reference=rows.filter(({photo})=>photo.context!=='event');
  if(print)return `${field.length?'<h4>해당 회차 현장사진</h4>':''}<div class="fn-photo-gallery fn-photo-gallery-print">${field.map(({photo,index})=>imageMarkup(photo,index,{print:true})).join('')}</div>${reference.length?'<h4 class="fn-reference-heading">비교 참고사진 · 다른 회차·훈련 자료</h4><p class="fn-note">아래 사진은 이번 회차 전시 근거와 구분해 읽어야 합니다.</p>':''}<div class="fn-photo-gallery fn-photo-gallery-print">${reference.map(({photo,index})=>imageMarkup(photo,index,{print:true})).join('')}</div>`;
  const thumbnail=({photo,index})=>`<button type="button" class="fn-photo-thumbnail" data-photo-index="${index}" aria-label="${escapeHTML(photo.caption||'사진')} 확대">${photoUrl(photo)?`<img src="${escapeHTML(photoUrl(photo))}" alt="${escapeHTML(photo.caption||'사진')}" loading="lazy" decoding="async">`:'<span class="fn-thumbnail-linked">원문 열람</span>'}<span>${escapeHTML(photo.caption||'사진 자료')}</span></button>`;
  const hero=shown.length?imageMarkup(shown[0].photo,shown[0].index,{hero:true}):'';
  const strip=shown.length>1?`<div class="fn-photo-strip" aria-label="추가 현장사진">${shown.slice(1).map(thumbnail).join('')}</div>`:'';
  const linkedList=linked.length?`<div class="fn-linked-photos"><h4>현장사진 원문 <span>${linked.length}</span></h4><ul>${linked.map(({photo,index})=>`<li><button type="button" data-photo-index="${index}">${escapeHTML(photo.caption||'현장사진 원문')}</button>${sourceUrl(photo)?link(photo.sourceUrl,'원문 열기'):''}</li>`).join('')}</ul></div>`:'';
  const references=reference.length?`<details class="fn-reference-photos"><summary>비교 참고사진 · 다른 회차/훈련 (${reference.length})</summary><p class="fn-note">이번 회차의 출품 근거와 구분해 보관한 사진입니다.</p><div class="fn-photo-strip" aria-label="비교 참고사진">${reference.map(thumbnail).join('')}</div></details>`:'';
  return `<div class="fn-photo-gallery">${hero}${strip}${linkedList}${references}</div>`;
}
function sourcesMarkup(sources, catalogs, {print = false} = {}) {
  const catalogsHTML = catalogs.length ? `<div class="fn-catalogs">${catalogs.map((item,index) => `<article>${link(item.url,item.title || '원문 자료','fn-document-link')}<span class="fn-small-label">${item.scope === 'event' ? '해당 회차 자료' : '일반 제품·회사 자료'}</span>${paragraph(item.note || (item.scope === 'event' ? '' : '이 문서만으로 해당 회차 출품을 판단하지 않습니다.'))}${print ? `<small class="fn-print-url">${escapeHTML(item.url)}</small>` : ''}</article>`).join('')}</div>` : '';
  const sourceHTML = sources.length ? `<ol class="fn-source-list">${sources.map(source => `<li>${link(source.url,source.title || source.publisher || '원문 근거')}<small>${escapeHTML([source.publisher,source.date || source.publishedAt].filter(Boolean).join(' · '))}</small>${arr(source.supports).map(paragraph).join('')}${arr(source.notes).map(note=>`<small>${escapeHTML(note)}</small>`).join('')}${[...new Set(arr(source.evidenceStatuses).map(status=>({single_source:'발행사 단일 근거',primary_single_origin:'발행사 단일 근거',same_origin_republication:'같은 원문 재전재 · 독립 근거로 세지 않음',independent_observation_only:'독립 현장 관찰 · 성능 검증 아님'})[status]).filter(Boolean))].map(label=>`<small>${escapeHTML(label)}</small>`).join('')}${print ? `<small class="fn-print-url">${escapeHTML(source.url)}</small>` : ''}</li>`).join('')}</ol>` : '<p class="fn-note">추가 원문을 확보하고 있습니다.</p>';
  return catalogsHTML + sourceHTML;
}
const section = (title, body, {open = false, print = false} = {}) => print ? `<section class="fn-report-section"><h3>${escapeHTML(title)}</h3>${body}</section>` : `<details class="fn-detail-section"${open ? ' open' : ''}><summary>${escapeHTML(title)}</summary><div class="fn-section-content">${body}</div></details>`;
function editorialSections(data, company, editorial, {print = false} = {}) {
  const exhibit = editorial.exhibit || {};
  const items = arr(exhibit.items);
  const exhibited = paragraph(exhibit.summary) + (items.length ? `<ul class="fn-exhibit-items">${items.map(item => `<li><strong>${escapeHTML(item.name)}</strong>${item.form ? `<span>${escapeHTML(item.form)}</span>` : ''}${item.note ? `<small>${escapeHTML(item.note)}</small>` : ''}${item.status && !['confirmed','onsite_confirmed','exhibit_confirmed','source_confirmed','event_photo_confirmed'].includes(item.status) ? `<small>${escapeHTML(({announced:'제조사 발표',planned:'출품 예정 발표',model:'모형 전시',mockup:'목업 전시',prototype:'시제 전시',exhibitor_event_statement:'전시 구성은 제조사 발표 근거',exhibitor_event_photo_confirmed:'업체 현장사진으로 확인 · 단일 계열 근거'})[item.status] || item.statusLabel || '발표·전시 형태는 원문 근거 참조')}</small>` : ''}</li>`).join('')}</ul>` : '');
  const distinction = editorial.distinction || {};
  const compared = distinction.judgment ? paragraph(distinction.judgment) : '<p>동일 조건의 공개 비교자료가 없어 비교할 수 없습니다.</p>';
  const comparison = compared + (distinction.comparator ? `<dl class="fn-facts"><div><dt>비교 대상</dt><dd>${escapeHTML(distinction.comparator)}</dd></div>${distinction.conditions ? `<div><dt>비교 조건</dt><dd>${escapeHTML(Array.isArray(distinction.conditions) ? distinction.conditions.join(' · ') : distinction.conditions)}</dd></div>` : ''}</dl>` : '');
  const direction = editorial.direction || {};
  const development = paragraph(direction.observation) + (direction.interpretation ? `<p class="fn-interpretation">${escapeHTML(direction.interpretation)}</p>` : '');
  const work = editorial.workConnection || {};
  const connection = paragraph(work.value) + list(work.conditions,'fn-condition-list');
  return section('이번 전시에서 보여준 것',exhibited,{open:true,print}) + section('차별점과 비교 조건',comparison,{print}) + section('개발 방향 해석',development,{print}) + section('당사 체계개발과의 연결',connection,{print}) + section('후속 확인',list(editorial.followUps),{print}) + section('근거와 원문 자료',sourcesMarkup(companySources(data,company),companyCatalogs(data,company),{print}),{print});
}
function basicSections(data, company, {print = false} = {}) {
  const products = arr(data?.products).filter(item => arr(company.productIds).includes(item.id));
  const analyses = arr(data?.analyses).filter(item => arr(company.analysisIds).includes(item.id));
  const categories=arr(data?.taxonomy?.categories || data?.taxonomy).filter(category=>arr(company.categoryIds).includes(category.id)).map(category=>category.label);
  const countries=arr(company.countries || company.countryNames);
  let content = '<p>이번 회차의 실제 출품품목은 아직 확인하지 못했습니다. 일반 제품 자료를 전시품으로 바꾸어 표시하지 않습니다.</p>';
  if(countries.length || categories.length) content += `<dl class="fn-facts">${countries.length ? `<div><dt>국가 표기</dt><dd>${escapeHTML(countries.join(' · '))}</dd></div>` : ''}${categories.length ? `<div><dt>자료 분류</dt><dd>${escapeHTML(categories.join(' · '))}</dd></div>` : ''}</dl>`;
  if (company.relevanceNote) content += paragraph(company.relevanceNote);
  else if(categories.length) content += '<p class="fn-note">공개자료의 분류입니다. 차량 적용성과 실제 출품을 확정하는 표시는 아닙니다.</p>';
  if (products.length) content += `<h4>연결된 기존 제품 자료</h4>${list(products.map(product => product.name))}<p class="fn-note">기존 자료의 연결이며 이번 회차 전시 확인과는 별개입니다.</p>`;
  if (analyses.length) content += analyses.map(analysis => `<article class="fn-legacy-analysis"><h4>${escapeHTML(analysis.title || '기존 검토')}</h4>${paragraph(analysis.summary)}${analysis.interpretationNote ? `<p class="fn-note">${escapeHTML(analysis.interpretationNote)}</p>` : '<p class="fn-note">회차별 출품 근거를 재대조하기 전의 기존 검토입니다.</p>'}</article>`).join('');
  return section('기본정보와 업무 관련성',content,{open:true,print}) + section('근거와 원문 자료',sourcesMarkup(companySources(data,company),companyCatalogs(data,company),{print}),{print});
}

export function companyPanelMarkup(data, company, {print = false} = {}) {
  if (!company) return '<div class="fn-detail-empty"><p>업체를 선택하면 사진과 분석을 볼 수 있습니다.</p></div>';
  const editorial = getCompanyEditorial(data,company);
  const photos = companyPhotos(data,company);
  const booths = boothSummary(data,company);
  const title = companyName(company,data);
  const header = `<header class="fn-detail-head"><div class="fn-detail-kicker">${escapeHTML(eventName(data))}</div><div class="fn-detail-title"><h2>${escapeHTML(title)}</h2>${print ? '' : '<button type="button" class="fn-icon-button" data-detail-action="close" aria-label="업체 패널 닫기">'+svg('close')+'</button>'}</div>${booths ? `<p class="fn-booth-label">${escapeHTML(booths)}</p>` : '<p class="fn-booth-label">지도 좌표 미확인 · 업체 목록에서 탐색</p>'}${company.sourceLabelStatus === 'needs_review' ? '<p class="fn-note">원문 업체명 재확인이 필요합니다</p>' : ''}${!editorial ? '<span class="fn-evidence-status">실제 전시품목 미확인</span>' : ''}<p class="fn-company-judgment">${escapeHTML(caseReason(data,company))}</p>${list(arr(editorial?.highlights),'fn-key-points')}${editorial?.verificationNote ? `<p class="fn-note fn-case-conditions">${escapeHTML(editorial.verificationNote)}</p>` : ''}</header>`;
  const actions = print ? '' : `<div class="fn-detail-actions">${canLocate(data,company) ? `<button type="button" data-detail-action="locate">${svg('pin')}지도에서 보기</button>` : ''}<button type="button" data-detail-action="compare">${svg('compare')}비교에 담기</button><button type="button" data-detail-action="print">${svg('print')}PDF로 저장</button></div>`;
  return `<article class="fn-company-detail" data-company-id="${escapeHTML(company.id)}">${header}${actions}${photos.length ? `<section class="fn-company-photos"><h3>사진 자료 <span>${photos.length}</span></h3><p class="fn-note">해당 회차 ${photos.filter(photo=>photo.context==='event').length}건${photos.some(photo=>photo.context!=='event') ? ` · 비교 참고 ${photos.filter(photo=>photo.context!=='event').length}건` : ''}${photos.some(photo=>!photoUrl(photo)) ? ' · 원문 열람 포함' : ''}</p>${galleryMarkup(photos,{print})}</section>` : '<p class="fn-note fn-photo-empty">연결된 현장사진이 없습니다. 업체 정보는 계속 읽을 수 있습니다.</p>'}<div class="fn-company-body">${editorial ? editorialSections(data,company,editorial,{print}) : basicSections(data,company,{print})}</div>${print ? '' : '<div class="fn-action-feedback" aria-live="polite"></div>'}</article>`;
}
function attachImageFallback(container) {
  const handlers = [];
  for (const img of container.querySelectorAll('img')) {
    const fail = () => { img.hidden = true; const parent = img.parentElement; if (!parent.querySelector('.fn-image-error')) { const message = img.ownerDocument.createElement('span'); message.className='fn-image-error'; message.textContent='이미지를 불러오지 못했습니다. 사진 원문을 확인해 주세요.'; parent.prepend(message); } };
    img.addEventListener('error',fail);handlers.push([img,fail]);
    if (img.complete && !img.naturalWidth) fail();
  }
  return () => handlers.forEach(([img,handler]) => img.removeEventListener('error',handler));
}
export function renderCompanyPanel(container, options = {}) {
  const {data,company,onClose,onLocate,onCompare,onPhoto,onCatalog,onPrint} = options;
  container.innerHTML = companyPanelMarkup(data,company);
  const imagesCleanup = attachImageFallback(container);
  const click = async event => {
    const photoButton = event.target.closest('[data-photo-index]');
    if (photoButton) { const payload={photos:companyPhotos(data,company),index:Number(photoButton.dataset.photoIndex),companyId:company.id}; if (onPhoto) onPhoto(payload); else openPhotoViewer(payload); return; }
    const action = event.target.closest('[data-detail-action]')?.dataset.detailAction;
    if (action === 'close') onClose?.();
    if (action === 'locate') onLocate?.(company);
    if (action === 'compare') onCompare?.(company);
    if (action === 'print') {
      const feedback=container.querySelector('.fn-action-feedback');
      if(feedback)feedback.textContent='사진과 근거를 준비하고 있습니다';
      try { const result=onPrint ? await onPrint(company) : await printCompanyReport({data,companyIds:[company.id]}); if(feedback && !result?.cancelled)feedback.textContent='인쇄 창에서 PDF로 저장을 선택하세요'; }
      catch { if(feedback)feedback.textContent='보고서를 준비하지 못했습니다. 다시 시도해 주세요.'; }
    }
    const catalogAnchor=event.target.closest('.fn-document-link');
    if(catalogAnchor && typeof onCatalog==='function'){
      const catalog=companyCatalogs(data,company).find(item=>safeExternalUrl(item.url)===catalogAnchor.href);
      if(catalog){event.preventDefault();onCatalog(catalog);}
    }
  };
  container.addEventListener('click',click);
  return () => {container.removeEventListener('click',click);imagesCleanup();};
}

export function openPhotoViewer({photos = [],index = 0,onClose,onIndexChange,document:doc = globalThis.document} = {}) {
  if(!doc || !photos.length)return {close(){},destroy(){},updateIndex(){}};
  let current=Math.max(0,Math.min(photos.length-1,Number(index)||0));
  let ended=false;
  const previousFocus=doc.activeElement;
  const dialog=doc.createElement('dialog');dialog.className='fn-photo-dialog';dialog.setAttribute('aria-label','사진 확대');
  doc.body.append(dialog);
  let fallbackCleanup=()=>{};
  const draw=()=>{
    const photo=photos[current],src=photoUrl(photo);
    dialog.innerHTML=`<div class="fn-viewer-toolbar"><span>사진 ${current+1} / ${photos.length}</span><div>${sourceUrl(photo)?link(photo.sourceUrl,'사진 원문'):''}<button type="button" class="fn-icon-button" data-viewer="close" aria-label="사진 닫기">${svg('close')}</button></div></div><div class="fn-viewer-stage">${photos.length>1?`<button type="button" class="fn-viewer-arrow fn-viewer-prev" data-viewer="prev" aria-label="이전 사진"${current===0?' disabled':''}>${svg('left')}</button>`:''}<div class="fn-viewer-image">${src?`<img src="${escapeHTML(src)}" alt="${escapeHTML(photo.caption||'전시 사진')}" decoding="async">`:`<div class="fn-viewer-linked"><h3>사진 원문에서 열람</h3><p>이 사진은 출처 페이지에서 확인할 수 있습니다.</p>${sourceUrl(photo)?link(photo.sourceUrl,'사진 원문 열기','fn-primary-link'):'<p>원문 링크를 확인하고 있습니다.</p>'}</div>`}</div>${photos.length>1?`<button type="button" class="fn-viewer-arrow fn-viewer-next" data-viewer="next" aria-label="다음 사진"${current===photos.length-1?' disabled':''}>${svg('right')}</button>`:''}</div><footer class="fn-viewer-caption"><p>${escapeHTML(photo.caption||'전시 자료 사진')}</p><small>${escapeHTML([photo.context==='event'?'해당 회차 현장':'관련 참고사진',photo.credit,photo.sourceDate].filter(Boolean).join(' · '))}</small>${photo.variantNote?`<small>${escapeHTML(photo.variantNote)}</small>`:''}</footer>`;
    fallbackCleanup();fallbackCleanup=attachImageFallback(dialog);
  };
  const updateIndex=(next,{notify=true}={})=>{const value=Math.max(0,Math.min(photos.length-1,Number(next)||0));if(value===current)return;const focusAction=doc.activeElement?.dataset?.viewer || 'close';current=value;draw();const focusTarget=dialog.querySelector('[data-viewer="'+focusAction+'"]:not([disabled])') || dialog.querySelector('[data-viewer="close"]');focusTarget?.focus();if(notify)onIndexChange?.(current,photos[current]);};
  const finish=(notify=true)=>{if(ended)return;ended=true;fallbackCleanup();dialog.removeEventListener('click',click);dialog.removeEventListener('keydown',key);dialog.removeEventListener('cancel',cancel);dialog.remove();previousFocus?.focus?.();if(notify)onClose?.();};
  const click=event=>{const action=event.target.closest('[data-viewer]')?.dataset.viewer;if(action==='close')finish();if(action==='prev')updateIndex(current-1);if(action==='next')updateIndex(current+1);if(event.target===dialog)finish();};
  const key=event=>{if(event.key==='ArrowLeft'){event.preventDefault();updateIndex(current-1);}if(event.key==='ArrowRight'){event.preventDefault();updateIndex(current+1);}if(event.key==='Escape'){event.preventDefault();finish();}if(event.key==='Tab'){const focusables=[...dialog.querySelectorAll('button:not([disabled]),a[href]')];const first=focusables[0],last=focusables.at(-1);if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first?.focus();}}};
  const cancel=event=>{event.preventDefault();finish();};
  draw();dialog.addEventListener('click',click);dialog.addEventListener('keydown',key);dialog.addEventListener('cancel',cancel);
  if(typeof dialog.showModal==='function')dialog.showModal();else{dialog.setAttribute('open','');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');}
  dialog.querySelector('[data-viewer="close"]')?.focus();
  return {close:()=>finish(),destroy:()=>finish(false),updateIndex};
}

export function comparisonMarkup(data, companyIds = [], {print = false} = {}) {
  const companies=arr(companyIds).map(id=>byId(data?.companies,id)).filter(Boolean);
  if(!companies.length)return '<section class="fn-comparison"><h2>업체 비교</h2><p>업체 상세에서 비교할 업체를 선택하세요.</p></section>';
  const row=(label,read)=>`<tr><th scope="row">${escapeHTML(label)}</th>${companies.map(company=>`<td>${escapeHTML(read(company,getCompanyEditorial(data,company)) || '공개자료로 판단할 수 없습니다')}</td>`).join('')}</tr>`;
  const table=`<table><caption>${escapeHTML(eventName(data))} · 공개 근거에 따른 검토 관점 비교</caption><thead><tr><th scope="col">검토 항목</th>${companies.map(company=>`<th scope="col"><span>${escapeHTML(companyName(company,data))}</span>${print?'':`<div class="fn-compare-company-actions"><button type="button" data-compare-open="${escapeHTML(company.id)}">상세</button><button type="button" data-compare-remove="${escapeHTML(company.id)}" aria-label="${escapeHTML(companyName(company,data))} 비교에서 제외">제외</button></div>`}</th>`).join('')}</tr></thead><tbody>${row('봐야 하는 이유',(company,editorial)=>editorial?.reason || company.relevanceNote)}${row('이번 전시에서 확인',(_,editorial)=>editorial?.exhibit?.summary || '실제 출품품목 미확인')}${row('비교 대상과 조건',(_,editorial)=>editorial?.distinction?.comparator ? [editorial.distinction.comparator,Array.isArray(editorial.distinction.conditions)?editorial.distinction.conditions.join(' · '):editorial.distinction.conditions].filter(Boolean).join(' / ') : '동일 조건의 비교자료 없음')}${row('차별점 판단',(_,editorial)=>editorial?.distinction?.judgment)}${row('당사 검토 가치',(_,editorial)=>editorial?.workConnection?.value)}${row('추가로 확인할 조건',(_,editorial)=>arr(editorial?.followUps).join(' / '))}</tbody></table>`;
  return `<section class="fn-comparison"><header><div><p class="fn-detail-kicker">${escapeHTML(eventName(data))}</p><h2>업체 비교</h2></div>${print?'':`<div class="fn-detail-actions"><button type="button" data-compare-print>${svg('print')}비교 PDF로 저장</button><button type="button" class="fn-icon-button" data-compare-close aria-label="비교 닫기">${svg('close')}</button></div>`}</header><p class="fn-note">업체별 공개 근거와 적용 검토 조건을 비교합니다. 같은 기준의 성능시험 결과가 아닙니다.</p><div class="fn-comparison-scroll" tabindex="0" aria-label="업체 비교표">${table}</div>${print?companies.map(company=>`<section class="fn-report-section"><h3>${escapeHTML(companyName(company,data))} 근거</h3>${sourcesMarkup(companySources(data,company),companyCatalogs(data,company),{print:true})}</section>`).join(''):'<div class="fn-action-feedback" aria-live="polite"></div>'}</section>`;
}
export function renderCompare(container,{data,companyIds=[],onRemove,onOpenCompany,onClose,onPrint}={}) {
  container.innerHTML=comparisonMarkup(data,companyIds);
  const click=async event=>{
    const remove=event.target.closest('[data-compare-remove]');if(remove)onRemove?.(remove.dataset.compareRemove);
    const open=event.target.closest('[data-compare-open]');if(open)onOpenCompany?.(open.dataset.compareOpen);
    if(event.target.closest('[data-compare-close]'))onClose?.();
    const printButton=event.target.closest('[data-compare-print]');
    if(printButton){
      if(printButton.disabled)return;
      const feedback=container.querySelector('.fn-action-feedback');printButton.disabled=true;
      if(feedback)feedback.textContent='사진과 근거를 준비하고 있습니다';
      try {const result=onPrint ? await onPrint() : await printCompanyReport({data,companyIds,comparison:true});if(feedback && !result?.cancelled)feedback.textContent='인쇄 창에서 PDF로 저장을 선택하세요';}
      catch {if(feedback)feedback.textContent='보고서를 준비하지 못했습니다. 다시 시도해 주세요.';}
      finally {printButton.disabled=false;}
    }
  };
  container.addEventListener('click',click);return()=>container.removeEventListener('click',click);
}
export function printReportMarkup(data, companyIds, {comparison = false,title = null} = {}) {
  const companies=arr(companyIds).map(id=>byId(data?.companies,id)).filter(Boolean);
  return `<div class="fn-print-cover"><p>FIELDNOTE v2 · ${escapeHTML(eventName(data))}</p><h1>${escapeHTML(title || (comparison?'업체 비교 보고':'업체 검토 보고'))}</h1><p>자료 기준 ${escapeHTML(data?.dataAsOf || data?.event?.dataAsOf || '연결된 원문 발행일 참조')}</p><p>해당 회차의 공개자료에 근거한 검토 자료입니다. 제조사 발표 수치와 실제 전시 관찰을 구분하며, 공개 근거가 없는 항목은 판단하지 않습니다.</p></div>${comparison?comparisonMarkup(data,companyIds,{print:true}):companies.map(company=>companyPanelMarkup(data,company,{print:true})).join('')}`;
}
function preparationAborted() {
  const error=new Error('보고서 준비가 다른 요청으로 대체되었습니다.');error.name='AbortError';return error;
}
function withPreparationDeadline(promise, timeout, signal) {
  return new Promise((resolve,reject)=>{
    if(signal?.aborted){reject(preparationAborted());return;}
    const abort=()=>finish(reject,preparationAborted());
    const timer=setTimeout(()=>finish(reject,new Error('report preparation timeout')),timeout);
    const finish=(settle,value)=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);settle(value);};
    signal?.addEventListener('abort',abort,{once:true});
    Promise.resolve(promise).then(value=>finish(resolve,value),error=>finish(reject,error));
  });
}
export async function preparePrintImages(container, {timeout = 10000, signal} = {}) {
  const failures=[];
  await Promise.all([...container.querySelectorAll('img')].map(async img=>{
    img.loading='eager';
    let removeListeners=()=>{};
    try {
      if(signal?.aborted)throw preparationAborted();
      const loaded=img.complete ? (img.naturalWidth?Promise.resolve():Promise.reject(new Error('image failed'))) : new Promise((resolve,reject)=>{
        const load=()=>resolve(),error=()=>reject(new Error('image failed'));
        removeListeners=()=>{img.removeEventListener('load',load);img.removeEventListener('error',error);};
        img.addEventListener('load',load,{once:true});img.addEventListener('error',error,{once:true});
      });
      const ready=loaded.then(()=>typeof img.decode==='function'?img.decode():undefined);
      await withPreparationDeadline(ready,timeout,signal);
    } catch(error) {
      if(signal?.aborted)throw error;
      failures.push(img.getAttribute('src'));
      const notice=img.ownerDocument.createElement('p');notice.className='fn-print-image-notice';notice.textContent='이미지를 불러오지 못해 원문 링크로 대체했습니다.';img.replaceWith(notice);
    } finally {removeListeners();}
  }));
  return {failedImages:failures};
}
const printJobs=new WeakMap();
export async function printCompanyReport({data,companyIds=[],comparison=false,title,timeout=10000,document:doc=globalThis.document,window:win=globalThis.window}={}) {
  if(!doc || !win?.print)throw new Error('인쇄 기능을 사용할 수 없습니다.');
  printJobs.get(doc)?.cleanup();
  doc.querySelector('.fn-print-root')?.remove();
  const report=doc.createElement('div');report.className='fn-print-root';report.innerHTML=printReportMarkup(data,companyIds,{comparison,title});doc.body.append(report);
  const controller=new AbortController();
  const job={cleanup:()=>{
    controller.abort();report.remove();win.removeEventListener('afterprint',job.cleanup);
    if(printJobs.get(doc)===job)printJobs.delete(doc);
  }};
  printJobs.set(doc,job);
  try {
    const result=await preparePrintImages(report,{timeout,signal:controller.signal});
    // Font loading must not leave the PDF action pending forever; the browser can use its fallback font.
    if(doc.fonts?.ready)await withPreparationDeadline(doc.fonts.ready,timeout,controller.signal).catch(error=>{if(controller.signal.aborted)throw error;});
    if(controller.signal.aborted)return {...result,cancelled:true,cleanup:job.cleanup};
    win.addEventListener('afterprint',job.cleanup,{once:true});
    win.print();
    return {...result,cleanup:job.cleanup};
  } catch(error) {
    const cancelled=controller.signal.aborted;job.cleanup();
    if(cancelled)return {failedImages:[],cancelled:true,cleanup:job.cleanup};
    throw error;
  }
}
