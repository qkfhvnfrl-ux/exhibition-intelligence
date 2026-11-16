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
const providerPhotoSource = photo => {
  const source=sourceUrl(photo),src=photoUrl(photo);
  return photo?.rights?.status==='provider-embed' && source && src && new URL(src,'https://fieldnote.invalid').hostname==='live.staticflickr.com' && ['flickr.com','www.flickr.com'].includes(new URL(source).hostname) ? source : null;
};
export function photoWithSourceLink(photo, image) {
  const source=providerPhotoSource(photo);
  return source ? `<a class="fn-photo-provider-link" href="${escapeHTML(source)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(photo.caption||'사진')} Flickr 원문 열기">${image}</a>` : image;
}
export function photoPrintNotice(photo, className = 'fn-photo-print-notice') {
  return photo?.rights?.status === 'provider-embed' ? `<div class="${escapeHTML(className)}"><span>사진 원문 안내</span><small>외부 표시 사진 · 원문에서 열람</small></div>` : null;
}
const link = (url, label, className = '') => { const href = safeExternalUrl(url); return href ? `<a class="${className}" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>` : `<span class="${className}">${escapeHTML(label)}</span>`; };
const photoRightsMarkup = photo => {
  const rights=photo.rights||{},label=rights.license||photo.license;
  return label ? `<small class="fn-photo-rights">${link(rights.licenseUrl||photo.licenseUrl,label)}</small>` : '';
};
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
  const joined = [...ids].map(id => byId(data?.photos,id)).filter(Boolean).concat(arr(editorial?.photos).filter(photo => typeof photo === 'object'));
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
const companyNarrativeProducts = (data,company) => arr(data?.products).filter(product=>arr(company?.productIds).includes(product.id)&&product.narrative?.eventId===data?.event?.id&&arr(product.narrative?.eventEvidenceSourceIds).length);
const caseReason = (data, company) => getCompanyEditorial(data, company)?.reason || company?.relevanceNote || (companyNarrativeProducts(data,company).length ? companyNarrativeProducts(data,company).slice(0,3).map(product=>product.name).join(' · ')+'의 전시 형상과 공개 설명을 살펴봅니다.' : company?.sourceLabelStatus === 'needs_review' ? '공식 배치도에 적힌 명칭입니다. 원문 표기 재확인이 필요합니다.' : company?.status === 'listed' ? '참가 자료에 등재된 업체입니다. 이번 회차의 실제 출품품목은 아직 확인하지 못했습니다.' : company?.status === 'planned' ? '업체의 참가 예정 발표가 있습니다. 이번 회차의 실제 출품품목은 아직 확인하지 못했습니다.' : '기존 조사자료에 연결된 업체입니다. 이번 회차 참가·출품 근거는 재확인이 필요합니다.');

function imageMarkup(photo, index, {print = false, hero = false, currentEvent = photo.context === 'event'} = {}) {
  const src = photoUrl(photo);
  const caption = photo.caption || '전시 자료 사진';
  const context = currentEvent ? '해당 회차 현장' : '관련 참고사진';
  const image = src ? `<img src="${escapeHTML(src)}" alt="${escapeHTML(caption)}" loading="${print || hero ? 'eager' : 'lazy'}" decoding="async"${photo.width && photo.height ? ` width="${Number(photo.width)}" height="${Number(photo.height)}"` : ''}>` : print ? '<p class="fn-note">사진 원문 링크</p>' : `<div class="fn-photo-link-only"><span>사진 원문 열람</span><small>사진은 출처에서 확인할 수 있습니다</small></div>`;
  const content = print ? photoPrintNotice(photo) || image : providerPhotoSource(photo) ? `<div class="fn-photo-open fn-photo-provider">${photoWithSourceLink(photo,image)}<button type="button" class="fn-photo-expand" data-photo-index="${index}" aria-label="${escapeHTML(caption)} 확대">${svg('expand')}</button></div>` : `<button type="button" class="fn-photo-open" data-photo-index="${index}" aria-label="${escapeHTML(caption)} 확대">${image}<span class="fn-photo-expand">${svg('expand')}</span></button>`;
  return `<figure class="fn-photo ${hero ? 'fn-photo-hero' : ''}" data-photo-id="${escapeHTML(photo.id)}">${content}<figcaption><span>${escapeHTML(caption)}</span><small>${escapeHTML([context, photo.credit || photo.author, photo.sourceDate ? `자료 날짜 ${photo.sourceDate}` : null].filter(Boolean).join(' · '))}</small>${photo.variantNote ? `<small>${escapeHTML(photo.variantNote)}</small>` : ''}${sourceUrl(photo) ? link(photo.sourceUrl,'사진 원문','fn-source-link') + (print ? `<small class="fn-print-url">${escapeHTML(sourceUrl(photo))}</small>` : '') : ''}${photoRightsMarkup(photo)}</figcaption></figure>`;
}
const isCurrentEventPhoto = (data, photo) => photo.context === 'event' && (!(photo.eventId || photo.eventEditionId) || (photo.eventId || photo.eventEditionId) === data?.event?.id);
function galleryMarkup(photos, {print = false, allPhotos = photos, data = null} = {}) {
  if (!photos.length) return '<p class="fn-note">이 업체의 해당 회차 사진은 아직 연결하지 못했습니다.</p>';
  const rows=photos.map(photo=>({photo,index:allPhotos.indexOf(photo)}));
  const field=rows.filter(({photo})=>data ? isCurrentEventPhoto(data,photo) : photo.context==='event');
  const shown=field.filter(({photo})=>photoUrl(photo));
  const linked=field.filter(({photo})=>!photoUrl(photo));
  const reference=rows.filter(row=>!field.includes(row));
  if(print)return `${field.length?'<h4>해당 회차 현장사진</h4>':''}<div class="fn-photo-gallery fn-photo-gallery-print">${field.map(({photo,index})=>imageMarkup(photo,index,{print:true})).join('')}</div>${reference.length?'<h4 class="fn-reference-heading">제품 참고사진 · 해당 회차 현장사진 아님</h4><p class="fn-note">아래 사진은 이번 회차 전시 근거와 구분해 읽어야 합니다.</p>':''}<div class="fn-photo-gallery fn-photo-gallery-print">${reference.map(({photo,index})=>imageMarkup(photo,index,{print:true,currentEvent:false})).join('')}</div>`;
  const thumbnail=({photo,index})=>{
    const label=escapeHTML(photo.caption||'사진'),shortLabel=escapeHTML((photo.caption||'사진 자료').split(' — ').at(-1)),image=photoUrl(photo)?`<img src="${escapeHTML(photoUrl(photo))}" alt="${label}" loading="lazy" decoding="async">`:'<span class="fn-thumbnail-linked">원문 열람</span>';
    if(providerPhotoSource(photo))return `<div class="fn-photo-thumbnail fn-photo-thumbnail-provider">${photoWithSourceLink(photo,image)}<button type="button" class="fn-photo-thumbnail-expand" data-photo-index="${index}" aria-label="${label} 확대"><span>${shortLabel}</span><small>확대 보기 ↗</small></button></div>`;
    return `<button type="button" class="fn-photo-thumbnail" data-photo-index="${index}" aria-label="${label} 확대">${image}<span>${shortLabel}</span></button>`;
  };
  const fallback=shown.length?[]:reference.filter(({photo})=>photoUrl(photo));
  const primary=shown.length?shown:fallback;
  const hero=primary.length?`${fallback.length?'<p class="fn-reference-heading">제품 참고사진 · 해당 회차 현장사진 아님</p>':''}${imageMarkup(primary[0].photo,primary[0].index,{hero:true,currentEvent:!fallback.length})}`:'';
  const strip=primary.length>1?`<div class="fn-photo-strip" aria-label="${fallback.length?'추가 제품 참고사진':'추가 현장사진'}">${primary.slice(1).map(thumbnail).join('')}</div>`:'';
  const linkedList=linked.length?`<div class="fn-linked-photos"><h4>현장사진 원문 <span>${linked.length}</span></h4><ul>${linked.map(({photo,index})=>`<li><button type="button" data-photo-index="${index}">${escapeHTML(photo.caption||'현장사진 원문')}</button>${sourceUrl(photo)?link(photo.sourceUrl,'원문 열기'):''}</li>`).join('')}</ul></div>`:'';
  const remaining=reference.filter(row=>!fallback.includes(row));
  const references=remaining.length?`<details class="fn-reference-photos"><summary>비교 참고사진 · 다른 회차/훈련 (${remaining.length})</summary><p class="fn-note">이번 회차의 출품 근거와 구분해 보관한 사진입니다.</p><div class="fn-photo-strip" aria-label="비교 참고사진">${remaining.map(thumbnail).join('')}</div></details>`:'';
  return `<div class="fn-photo-gallery">${hero}${strip}${linkedList}${references}</div>`;
}
function sourcesMarkup(sources, catalogs, {print = false} = {}) {
  const catalogsHTML = catalogs.length ? `<div class="fn-catalogs">${catalogs.map((item,index) => `<article>${link(item.url,item.title || '원문 자료','fn-document-link')}<span class="fn-small-label">${item.scope === 'event' ? '해당 회차 자료' : '일반 제품·회사 자료'}</span>${paragraph(item.note || (item.scope === 'event' ? '' : '이 문서만으로 해당 회차 출품을 판단하지 않습니다.'))}${print ? `<small class="fn-print-url">${escapeHTML(item.url)}</small>` : ''}</article>`).join('')}</div>` : '';
  const sourceHTML = sources.length ? `<ol class="fn-source-list">${sources.map(source => `<li>${source.scopeLabel?`<small class="fn-source-scope">${escapeHTML(source.scopeLabel)}</small>`:''}${link(source.url,source.title || source.publisher || '원문 근거')}<small>${escapeHTML([source.publisher,source.date || source.publishedAt].filter(Boolean).join(' · '))}</small>${arr(source.supports).map(paragraph).join('')}${arr(source.notes).map(note=>`<small>${escapeHTML(note)}</small>`).join('')}${[...new Set(arr(source.evidenceStatuses).map(status=>({single_source:'발행사 단일 근거',primary_single_origin:'발행사 단일 근거',same_origin_republication:'같은 원문 재전재 · 독립 근거로 세지 않음',independent_observation_only:'독립 현장 관찰 · 성능 검증 아님'})[status]).filter(Boolean))].map(label=>`<small>${escapeHTML(label)}</small>`).join('')}${print ? `<small class="fn-print-url">${escapeHTML(source.url)}</small>` : ''}</li>`).join('')}</ol>` : '<p class="fn-note">추가 원문을 확보하고 있습니다.</p>';
  return catalogsHTML + sourceHTML;
}
const section = (title, body, {open = false, print = false} = {}) => print ? `<section class="fn-report-section"><h3>${escapeHTML(title)}</h3>${body}</section>` : `<details class="fn-detail-section"${open ? ' open' : ''}><summary>${escapeHTML(title)}</summary><div class="fn-section-content">${body}</div></details>`;
const readingSection = (title, body) => `<section class="fn-reading-section"><h3>${escapeHTML(title)}</h3>${body}</section>`;
const exhibitStatusLabel = status => ({event_photo_confirmed:'현장사진으로 출품 확인',onsite_confirmed:'현장에서 출품 확인',onsite_report_confirmed:'현장 취재로 출품 확인',event_report_confirmed:'현장 취재로 출품 확인',exhibit_confirmed:'출품 근거 확인',source_confirmed:'원문 출품 근거 확인',exhibitor_event_statement:'제조사의 해당 회차 출품 발표',exhibitor_event_photo_confirmed:'업체 현장사진 · 단일 발행사 근거',model:'모형 전시',mockup:'목업 전시',prototype:'시제 전시',planned:'출품 예정 발표',prescheduled:'사전 출품 예고',source_documented:'출품 관련 원문 기록',announced:'출품 발표',background_reference:'일반 제품자료 · 이번 회차 출품 확인 아님'})[status] || '이번 회차 출품 근거 확인 중';
const narrativeLabels = {overview:'장비명·세부 형상·용도',features:'주요 특징·필요 제원',exhibit:'이번 전시의 구성·변화',development:'개발 방향',interpretation:'전략적 해석'};
function productSources(data, product) {
  const rows=[...arr(product.narrative?.sources),...arr(data?.sources)];
  return rows.map(source=>({...source,id:source.id || source.sourceId,url:source.url || source.exactURL,publisher:source.publisher || source.issuer,date:source.date || source.publishedAt,notes:[...arr(source.notes),...arr(source.limitations),...(source.note?[source.note]:[])],supports:[...arr(source.supports),...(source.support?[source.support]:[])],evidenceStatuses:[...arr(source.evidenceStatuses),source.evidenceStatus,source.independence].filter(Boolean)}));
}
function sourceScopeLabel(data, source, fallback) {
  const currentYear=Number(data?.event?.year || String(data?.event?.id || '').match(/\d{4}/)?.[0]);
  const family=String(data?.event?.id || '').replace(/-\d{4}$/,'').replace(/[^a-z0-9]/gi,'');
  const identity=[source.eventId,source.eventEditionId,source.id,source.title,source.eventOrGeneral].filter(Boolean).join(' ');
  const eventYear=Number(source.eventYear || (family?identity.match(new RegExp(`${family}[- _]?(\\d{4})`,'i'))?.[1]:null));
  const publicationYear=Number(String(source.publishedAt || source.date || '').match(/\d{4}/)?.[0]);
  if(currentYear && eventYear && eventYear<currentYear)return `${currentYear-eventYear===2?'직전':'이전'} 회차 비교 (${eventYear})`;
  if(currentYear && publicationYear>currentYear)return `이후 발표 (${publicationYear})`;
  if(currentYear && eventYear>currentYear)return `다른 회차 자료 (${eventYear})`;
  return fallback;
}
function numberedProductSources(data, sources, ids, eventIds, generalIds) {
  const merged=new Map();
  for(const id of ids){
    const source=sources.find(row=>row.id===id),url=safeExternalUrl(source?.url);if(!url)continue;
    const label=sourceScopeLabel(data,source,eventIds.includes(id)?'출품 근거':generalIds.includes(id)?'일반자료':'설명 근거');
    if(!merged.has(url))merged.set(url,{...source,url,ids:[],scopeLabel:label,citationNumber:merged.size+1,notes:[],supports:[],evidenceStatuses:[]});
    const row=merged.get(url);row.ids.push(id);
    for(const key of ['notes','supports','evidenceStatuses'])row[key]=[...new Set([...row[key],...arr(source[key])])];
  }
  return [...merged.values()];
}
function sourceLinksMarkup(ids, sources) {
  const rows=[...new Set(arr(ids).map(id=>sources.find(source=>source.ids.includes(id))).filter(Boolean))];
  if(!rows.length)return '';
  return `<div class="fn-claim-sources">${rows.map(source=>`<a href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHTML(source.title || source.publisher || '원문 근거')}" data-source-number="${source.citationNumber}">${escapeHTML(source.scopeLabel)} [${source.citationNumber}]</a>`).join('')}</div>`;
}
export function productPhotos(data, company, product, photos=companyPhotos(data,company)) {
  const ids=new Set(arr(product.narrative?.photoIds));
  const field=photos.filter(photo=>isCurrentEventPhoto(data,photo) && (arr(photo.productIds).includes(product.id) || ids.has(photo.id)));
  return field.some(photo=>photoUrl(photo))?field:[...field,...photos.filter(photo=>photo.context==='reference' && arr(photo.productIds).includes(product.id))];
}
function productMarkup(data, company, product, photos, {print=false,productId=null}={}) {
  const narrative=product.narrative || {}, sources=productSources(data,product);
  const gallery=productPhotos(data,company,product,photos);
  const eventIds=arr(narrative.eventEvidenceSourceIds), generalIds=arr(narrative.generalSourceIds);
  const allIds=[...new Set([...eventIds,...generalIds,...arr(product.sourceIds),...arr(narrative.sections).flatMap(item=>arr(item.sourceIds))])];
  const allSources=numberedProductSources(data,sources,allIds,eventIds,generalIds);
  const fallback={overview:'세부 용도는 공개 근거를 추가 확인하고 있습니다.',features:'이 전시 형상에 적용할 특징과 제원은 아직 확인하지 못했습니다.',exhibit:exhibitStatusLabel(product.exhibitStatus),development:'공식 개발 계획을 확인할 자료가 부족합니다.',interpretation:'전시 구성에 대한 해석을 뒷받침할 근거가 부족합니다.'};
  const sections=Object.entries(narrativeLabels).map(([id,label])=>{
    const entry=arr(narrative.sections).find(item=>item.id===id);
    const type=entry?.claimType || '';
    const qualifier=type==='evidence_gap'?'근거 미확보':/interpret|inference|analysis/.test(type)?'관찰 근거에 따른 추론':/official|plan|goal/.test(type)?'공식 발표 · 발표 당시 기준':id==='interpretation' && entry?.text?'관찰 근거에 따른 추론':'';
    const ids=entry?arr(entry.sourceIds):id==='exhibit'?(eventIds.length?eventIds:arr(product.sourceIds)):[];
    return `<section class="fn-product-topic" data-narrative-section="${id}"><h4>${escapeHTML(entry?.label || label)}</h4>${qualifier?`<p class="fn-claim-type">${escapeHTML(qualifier)}</p>`:''}${paragraph(entry?.text || fallback[id])}${sourceLinksMarkup(ids,allSources)}</section>`;
  }).join('');
  const limitations=[...new Set(arr(narrative.limitations))];
  const critical=limitations.filter(text=>/상충|충돌|(?:실차|실물)\s*[/·]\s*모형.*미해결|단일.*근거|근거.*단일/.test(text));
  const otherLimits=limitations.filter(text=>!critical.includes(text));
  const eventSources=allSources.filter(source=>source.ids.some(id=>eventIds.includes(id)));
  if(!critical.some(text=>/단일/.test(text)) && eventSources.length===1 && eventSources[0].evidenceStatuses.some(status=>['single_source','primary_single_origin'].includes(status)))critical.push('출품 설명은 발행사 단일 근거입니다.');
  const detailBody=(otherLimits.length?`<div class="fn-product-limits"><h4>추가 확인 범위</h4>${list(otherLimits)}</div>`:'')+(allSources.length?sourcesMarkup(allSources,[],{print}):'');
  const form=narrative.form || product.form || '전시 형상 미확인';
  return `<article class="fn-product${product.id===productId?' fn-product-selected':''}" id="product-${escapeHTML(product.id)}" data-product-id="${escapeHTML(product.id)}" tabindex="-1"><header class="fn-product-heading"><div><p class="fn-product-form">${escapeHTML(form)}</p><h3>${escapeHTML(product.name)}</h3><p class="fn-product-status">${escapeHTML((!product.exhibitStatus||product.exhibitStatus==='unconfirmed')&&eventIds.length?'해당 회차 출품 관련 원문 확보 · 형상 설명 참조':exhibitStatusLabel(product.exhibitStatus))}</p></div>${print?'':`<button type="button" class="fn-product-permalink" data-product-link="${escapeHTML(product.id)}" aria-label="${escapeHTML(product.name)} 장비 링크 열기">장비 링크 ↗</button>`}</header><div class="fn-product-layout"><div class="fn-product-photos">${gallery.some(photo=>isCurrentEventPhoto(data,photo)&&photoUrl(photo))?'':'<p class="fn-photo-unavailable">이 장비의 해당 회차 표시 가능한 현장사진을 아직 확보하지 못했습니다.</p>'}${gallery.length?galleryMarkup(gallery,{print,allPhotos:photos,data}):''}</div><div class="fn-product-copy">${sections}${critical.length?`<aside class="fn-product-critical" aria-label="주요 확인 범위">${list(critical)}</aside>`:''}${detailBody?section('상세 출처와 확인 범위',detailBody,{print}):''}</div></div></article>`;
}
function editorialSections(data, company, editorial, {print = false} = {}) {
  const exhibit = editorial.exhibit || {};
  const items = arr(exhibit.items);
  const exhibited = paragraph(exhibit.summary) + (items.length ? `<ul class="fn-exhibit-items">${items.map(item => `<li><strong>${escapeHTML(item.name)}</strong>${item.form ? `<span>${escapeHTML(item.form)}</span>` : ''}${item.note ? `<small>${escapeHTML(item.note)}</small>` : ''}${item.status && !['confirmed','onsite_confirmed','exhibit_confirmed','source_confirmed','event_photo_confirmed'].includes(item.status) ? `<small>${escapeHTML(({announced:'제조사 발표',planned:'출품 예정 발표',model:'모형 전시',mockup:'목업 전시',prototype:'시제 전시',background_reference:'일반 제품자료 · 이번 회차 출품 확인 아님',onsite_report_confirmed:'현장 취재로 출품 확인',event_report_confirmed:'현장 취재로 출품 확인',exhibitor_event_statement:'전시 구성은 제조사 발표 근거',exhibitor_event_photo_confirmed:'업체 현장사진으로 확인 · 단일 계열 근거'})[item.status] || item.statusLabel || '발표·전시 형태는 원문 근거 참조')}</small>` : ''}</li>`).join('')}</ul>` : '');
  const distinction = editorial.distinction || {};
  const compared = distinction.judgment ? paragraph(distinction.judgment) : '<p>동일 조건의 공개 비교자료가 없어 비교할 수 없습니다.</p>';
  const comparison = compared + (distinction.comparator ? `<dl class="fn-facts"><div><dt>비교 대상</dt><dd>${escapeHTML(distinction.comparator)}</dd></div>${distinction.conditions ? `<div><dt>비교 조건</dt><dd>${escapeHTML(Array.isArray(distinction.conditions) ? distinction.conditions.join(' · ') : distinction.conditions)}</dd></div>` : ''}</dl>` : '');
  const direction = editorial.direction || {};
  const development = paragraph(direction.observation) + (direction.interpretation ? `<p class="fn-interpretation">${escapeHTML(direction.interpretation)}</p>` : '');
  return readingSection('이번 전시에서 보여준 것',exhibited) + readingSection('차별점과 비교 조건',comparison) + readingSection('개발 방향 해석',development) + (arr(editorial.followUps).length?readingSection('공개자료의 확인 범위',list(editorial.followUps)):'') + section('근거와 원문 자료',sourcesMarkup(companySources(data,company),companyCatalogs(data,company),{print}),{print});
}
function basicSections(data, company, {print = false} = {}) {
  const products = arr(data?.products).filter(item => arr(company.productIds).includes(item.id));
  const analyses = arr(data?.analyses).filter(item => arr(company.analysisIds).includes(item.id));
  const categories=arr(data?.taxonomy?.categories || data?.taxonomy).filter(category=>arr(company.categoryIds).includes(category.id)).map(category=>category.label);
  const countries=arr(company.countries || company.countryNames);
  const reviewed=companyNarrativeProducts(data,company),background=products.filter(product=>!reviewed.includes(product));
  let content = reviewed.length ? '<p>장비별로 출품 발표·사진·개발 계획의 확인 범위를 구분했습니다. 다른 제품군의 자료를 해당 전시 형상의 사양으로 적용하지 않습니다.</p>' : '<p>이번 회차의 실제 출품품목은 아직 확인하지 못했습니다. 일반 제품 자료를 전시품으로 바꾸어 표시하지 않습니다.</p>';
  if(countries.length || categories.length) content += `<dl class="fn-facts">${countries.length ? `<div><dt>국가 표기</dt><dd>${escapeHTML(countries.join(' · '))}</dd></div>` : ''}${categories.length ? `<div><dt>자료 분류</dt><dd>${escapeHTML(categories.join(' · '))}</dd></div>` : ''}</dl>`;
  if (company.relevanceNote) content += paragraph(company.relevanceNote);
  else if(categories.length) content += '<p class="fn-note">공개자료의 분류입니다. 차량 적용성과 실제 출품을 확정하는 표시는 아닙니다.</p>';
  if (background.length) content += `<h4>연결된 기존 제품 자료</h4>${list(background.map(product => product.name))}<p class="fn-note">기존 자료의 연결이며 이번 회차 전시 확인과는 별개입니다.</p>`;
  if (analyses.length) content += analyses.map(analysis => `<article class="fn-legacy-analysis"><h4>${escapeHTML(analysis.title || '기존 검토')}</h4>${paragraph(analysis.summary)}${analysis.interpretationNote ? `<p class="fn-note">${escapeHTML(analysis.interpretationNote)}</p>` : '<p class="fn-note">회차별 출품 근거를 재대조하기 전의 기존 검토입니다.</p>'}</article>`).join('');
  return readingSection('업체와 연결 자료',content) + section('근거와 원문 자료',sourcesMarkup(companySources(data,company),companyCatalogs(data,company),{print}),{print});
}

export function companyPanelMarkup(data, company, {print = false, productId = null} = {}) {
  if (!company) return '<div class="fn-detail-empty"><p>업체를 선택하면 사진과 분석을 볼 수 있습니다.</p></div>';
  const editorial = getCompanyEditorial(data,company);
  const photos = companyPhotos(data,company);
  const products = arr(company.productIds).map(id=>byId(data?.products,id)).filter(Boolean).sort((a,b)=>Number(productPhotos(data,company,b,photos).some(photo=>photoUrl(photo)))-Number(productPhotos(data,company,a,photos).some(photo=>photoUrl(photo))));
  const assignedPhotos = new Set(products.flatMap(product=>productPhotos(data,company,product,photos)));
  const fieldPhotos = photos.filter(photo=>isCurrentEventPhoto(data,photo));
  const overviewPhoto = fieldPhotos.find(photo=>photoUrl(photo) && /(?:부스|전시|전시장|차량군|공동관).*(?:전경|전체)|(?:전경|booth overview)/i.test(photo.caption || '')) || fieldPhotos.find(photo=>photoUrl(photo) && !assignedPhotos.has(photo)) || fieldPhotos.find(photo=>photoUrl(photo));
  const companyGallery = [...new Set([overviewPhoto,...photos.filter(photo=>!assignedPhotos.has(photo))].filter(Boolean))];
  const booths = boothSummary(data,company);
  const title = companyName(company,data);
  const countries=arr(company.countries || company.countryNames);
  const header = `<header class="fn-detail-head"><div class="fn-detail-kicker">${escapeHTML(eventName(data))}</div><div class="fn-detail-title"><h2>${escapeHTML(title)}</h2>${print ? '' : '<button type="button" class="fn-icon-button" data-detail-action="close" aria-label="업체 패널 닫기">'+svg('close')+'</button>'}</div>${booths ? `<p class="fn-booth-label">${escapeHTML(booths)}</p>` : '<p class="fn-booth-label">지도 좌표 미확인 · 업체 목록에서 탐색</p>'}${countries.length ? `<p class="fn-note fn-company-country">국가 표기 · ${escapeHTML(countries.join(' · '))}</p>` : ''}${company.sourceLabelStatus === 'needs_review' ? '<p class="fn-note">원문 업체명 재확인이 필요합니다</p>' : ''}${!editorial&&!companyNarrativeProducts(data,company).length ? '<span class="fn-evidence-status">실제 전시품목 미확인</span>' : ''}<p class="fn-company-judgment">${escapeHTML(caseReason(data,company))}</p>${list(arr(editorial?.highlights),'fn-key-points')}${editorial?.verificationNote ? `<p class="fn-note fn-case-conditions">${escapeHTML(editorial.verificationNote)}</p>` : ''}</header>`;
  const actions = print ? '' : `<div class="fn-detail-actions">${canLocate(data,company) ? `<button type="button" data-detail-action="locate">${svg('pin')}지도에서 보기</button>` : ''}<button type="button" data-detail-action="report">전시회 종합보고 ↗</button><button type="button" data-detail-action="compare">${svg('compare')}비교에 담기</button><button type="button" data-detail-action="print">${svg('print')}상세 PDF로 저장</button></div>`;
  const navigation = !print && products.length ? `<nav class="fn-product-nav" aria-label="장비 바로가기">${products.map(product=>`<button type="button" data-product-link="${escapeHTML(product.id)}"${product.id===productId?' aria-current="location"':''}>${escapeHTML(product.name)}</button>`).join('')}</nav>` : '';
  const gallery = `<section class="fn-company-photos"><h3>전시 현장</h3>${overviewPhoto?'':'<p class="fn-photo-unavailable">이 업체의 해당 회차 표시 가능한 현장사진을 아직 확보하지 못했습니다.</p>'}${companyGallery.length?galleryMarkup(companyGallery,{print,allPhotos:photos,data}):''}</section>`;
  const equipment = `<section class="fn-equipment-section"><header class="fn-equipment-heading"><h3>장비 사진과 설명</h3><p>해당 회차 출품 형상과 공개자료를 함께 확인합니다.</p></header>${navigation}${products.length?products.map(product=>productMarkup(data,company,product,photos,{print,productId})).join(''):'<p class="fn-note">연결된 장비별 출품자료가 아직 없습니다. 업체 정보와 원문 자료는 계속 확인할 수 있습니다.</p>'}</section>`;
  return `<article class="fn-company-detail" data-company-id="${escapeHTML(company.id)}">${header}${actions}${gallery}${equipment}<div class="fn-company-body">${editorial ? editorialSections(data,company,editorial,{print}) : basicSections(data,company,{print})}</div>${print ? '' : '<div class="fn-action-feedback" aria-live="polite"></div>'}</article>`;
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
  const {data,company,productId,onClose,onLocate,onCompare,onPhoto,onCatalog,onPrint,onReport,onProduct} = options;
  container.innerHTML = companyPanelMarkup(data,company,{productId});
  const imagesCleanup = attachImageFallback(container);
  const focusProduct = id => { const target=[...container.querySelectorAll('[data-product-id]')].find(node=>node.dataset.productId===id);target?.scrollIntoView?.({block:'start'});target?.focus?.({preventScroll:true}); };
  if(productId)focusProduct(productId);
  const click = async event => {
    const photoButton = event.target.closest('[data-photo-index]');
    if (photoButton) {
      const photos=companyPhotos(data,company),index=Number(photoButton.dataset.photoIndex),productId=event.target.closest('[data-product-id]')?.dataset.productId || '';
      const payload={photos,index,companyId:company.id,productId};
      if(onPhoto)onPhoto(payload);
      else {const product=byId(data?.products,productId),group=product?productPhotos(data,company,product,photos):photos;openPhotoViewer({...payload,photos:group,index:group.findIndex(photo=>photo.id===photos[index]?.id)});}
      return;
    }
    const productLink=event.target.closest('[data-product-link]');
    if(productLink){event.preventDefault?.();const id=productLink.dataset.productLink;if(onProduct)onProduct(id);else focusProduct(id);return;}
    const action = event.target.closest('[data-detail-action]')?.dataset.detailAction;
    if (action === 'close') onClose?.();
    if (action === 'locate') onLocate?.(company);
    if (action === 'compare') onCompare?.(company);
    if (action === 'report') onReport?.(company);
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
    dialog.innerHTML=`<div class="fn-viewer-toolbar"><span>사진 ${current+1} / ${photos.length}</span><div>${sourceUrl(photo)?link(photo.sourceUrl,'사진 원문'):''}<button type="button" class="fn-icon-button" data-viewer="close" aria-label="사진 닫기">${svg('close')}</button></div></div><div class="fn-viewer-stage">${photos.length>1?`<button type="button" class="fn-viewer-arrow fn-viewer-prev" data-viewer="prev" aria-label="이전 사진"${current===0?' disabled':''}>${svg('left')}</button>`:''}<div class="fn-viewer-image">${src?photoWithSourceLink(photo,`<img src="${escapeHTML(src)}" alt="${escapeHTML(photo.caption||'전시 사진')}" decoding="async">`):`<div class="fn-viewer-linked"><h3>사진 원문에서 열람</h3><p>이 사진은 출처 페이지에서 확인할 수 있습니다.</p>${sourceUrl(photo)?link(photo.sourceUrl,'사진 원문 열기','fn-primary-link'):'<p>원문 링크를 확인하고 있습니다.</p>'}</div>`}</div>${photos.length>1?`<button type="button" class="fn-viewer-arrow fn-viewer-next" data-viewer="next" aria-label="다음 사진"${current===photos.length-1?' disabled':''}>${svg('right')}</button>`:''}</div><footer class="fn-viewer-caption"><p>${escapeHTML(photo.caption||'전시 자료 사진')}</p><small>${escapeHTML([photo.context==='event'?'해당 회차 현장':'관련 참고사진',photo.credit,photo.sourceDate ? `자료 날짜 ${photo.sourceDate}` : null].filter(Boolean).join(' · '))}</small>${photo.variantNote?`<small>${escapeHTML(photo.variantNote)}</small>`:''}${photoRightsMarkup(photo)}</footer>`;
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
  const table=`<table><caption>${escapeHTML(eventName(data))} · 공개 근거에 따른 검토 관점 비교</caption><thead><tr><th scope="col">검토 항목</th>${companies.map(company=>`<th scope="col"><span>${escapeHTML(companyName(company,data))}</span>${print?'':`<div class="fn-compare-company-actions"><button type="button" data-compare-open="${escapeHTML(company.id)}">상세</button><button type="button" data-compare-remove="${escapeHTML(company.id)}" aria-label="${escapeHTML(companyName(company,data))} 비교에서 제외">제외</button></div>`}</th>`).join('')}</tr></thead><tbody>${row('봐야 하는 이유',(company,editorial)=>editorial?.reason || company.relevanceNote)}${row('이번 전시에서 확인',(_,editorial)=>editorial?.exhibit?.summary || '실제 출품품목 미확인')}${row('비교 대상과 조건',(_,editorial)=>editorial?.distinction?.comparator ? [editorial.distinction.comparator,Array.isArray(editorial.distinction.conditions)?editorial.distinction.conditions.join(' · '):editorial.distinction.conditions].filter(Boolean).join(' / ') : '동일 조건의 비교자료 없음')}${row('차별점 판단',(_,editorial)=>editorial?.distinction?.judgment)}${row('추가로 확인할 조건',(_,editorial)=>arr(editorial?.followUps).join(' / '))}</tbody></table>`;
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
