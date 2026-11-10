/** Browser-local field records. No network transfer or server synchronization. */
export const FIELD_LIMITS = Object.freeze({fileBytes:10*1024*1024,totalBytes:50*1024*1024,backupBytes:75*1024*1024,records:200,batch:50});
const TYPES = ['image/jpeg','image/png','image/webp'];
const META = ['event','year','manufacturer','product','topic','note','source'];
const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = (v,max) => typeof v==='string'?v.trim().slice(0,max):'';
const safeSource = v => { if(!v)return ''; try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';} };
export function normalizeFieldMeta(raw={}){
 const year=text(raw.year,4);
 if(!/^\d{4}$/.test(year)||Number(year)<1900||Number(year)>2100)throw new Error('자료연도를 1900~2100 사이의 네 자리 숫자로 입력해 주세요.');
 const result={event:text(raw.event,120),year,manufacturer:text(raw.manufacturer,120),product:text(raw.product,120),topic:text(raw.topic,120),note:text(raw.note,4000),source:safeSource(raw.source)};
 if(!result.event||!result.manufacturer||!result.product||!result.topic)throw new Error('전시회·업체·제품·주제를 모두 입력해 주세요.');
 if(raw.source&&!result.source)throw new Error('출처 링크는 http 또는 https 주소를 입력해 주세요.');
 return result;
}
export function imageMimeFromBytes(bytes){
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b))return 'image/png';
 if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
 return '';
}
export function validateFieldBackup(raw){
 if(!raw||raw.application!=='fieldnote-photos'||raw.schemaVersion!==1||!Array.isArray(raw.records)||raw.records.length>FIELD_LIMITS.records)throw new Error('현장 사진 백업 형식이 올바르지 않습니다.');
 let total=0;const ids=new Set();
 return raw.records.map(r=>{
  if(!r||typeof r!=='object'||typeof r.id!=='string'||!/^[a-f0-9]{64}$/.test(r.id)||ids.has(r.id))throw new Error('사진 식별자가 잘못되었거나 중복되었습니다.');
  ids.add(r.id);
  if(!TYPES.includes(r.type)||!Number.isInteger(r.size)||r.size<1||r.size>FIELD_LIMITS.fileBytes)throw new Error('사진 형식 또는 용량 제한을 확인해 주세요.');
  total+=r.size;if(total>FIELD_LIMITS.totalBytes)throw new Error('사진 합계는 50MB 이하여야 합니다.');
  if(typeof r.dataUrl!=='string'||!r.dataUrl.startsWith(`data:${r.type};base64,`))throw new Error('사진 원본이 포함되지 않았습니다.');
  const encoded=r.dataUrl.slice(r.dataUrl.indexOf(',')+1);
  if(encoded.length>Math.ceil(FIELD_LIMITS.fileBytes/3)*4||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded))throw new Error('사진 인코딩이 올바르지 않습니다.');
  return {id:r.id,name:text(r.name,180)||'현장 사진',type:r.type,size:r.size,createdAt:typeof r.createdAt==='string'&&Number.isFinite(Date.parse(r.createdAt))?r.createdAt:new Date().toISOString(),...normalizeFieldMeta(r),dataUrl:r.dataUrl};
 });
}
const hashBytes = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
async function validateImage(blob){
 if(typeof createImageBitmap==='function'){
  const image=await createImageBitmap(blob);const valid=image.width>0&&image.height>0&&image.width*image.height<=100000000;image.close();
  if(!valid)throw new Error('사진은 1억 화소 이하여야 합니다.');
 }
}
export async function decodeFieldBackup(raw){
 const records=validateFieldBackup(raw),decoded=[];
 for(const r of records){
  const binary=atob(r.dataUrl.slice(r.dataUrl.indexOf(',')+1));const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  if(bytes.length!==r.size||imageMimeFromBytes(bytes)!==r.type||await hashBytes(bytes)!==r.id)throw new Error('백업 사진의 용량·형식·해시가 일치하지 않습니다. 기존 사진은 변경되지 않았습니다.');
  const blob=new Blob([bytes],{type:r.type});await validateImage(blob);const {dataUrl,...metadata}=r;decoded.push({...metadata,blob});
 }
 return decoded;
}
function openStore(){return new Promise((resolve,reject)=>{const req=indexedDB.open('fieldnote-field-photos-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('photos',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(new Error('브라우저 사진 저장소를 열지 못했습니다. 브라우저 저장 권한을 확인해 주세요.'));req.onblocked=()=>reject(new Error('다른 탭을 닫은 후 다시 열어 주세요.'));});}
function readAll(db){return new Promise((resolve,reject)=>{const tx=db.transaction('photos','readonly'),r=tx.objectStore('photos').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function writeRecords(db,records,removeId){return new Promise((resolve,reject)=>{const tx=db.transaction('photos','readwrite'),store=tx.objectStore('photos');if(removeId)store.delete(removeId);for(const r of records)store.put(r);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('저장이 중단되었습니다.'));});}
const blobDataUrl = blob => new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});

export async function prepareFieldImagesForPrint(images,{timeoutMs=15000}={}){
 const results=await Promise.allSettled([...images].map(async image=>{
  image.loading='eager';image.decoding='sync';
  let timer,removeListeners=()=>{};
  try{
   const ready=typeof image.decode==='function'?image.decode():new Promise((resolve,reject)=>{
    if(image.complete){image.naturalWidth?resolve():reject(new Error('사진을 불러오지 못했습니다.'));return;}
    const loaded=()=>resolve(),failed=()=>reject(new Error('사진을 불러오지 못했습니다.'));
    image.addEventListener('load',loaded,{once:true});image.addEventListener('error',failed,{once:true});
    removeListeners=()=>{image.removeEventListener('load',loaded);image.removeEventListener('error',failed);};
   });
   await Promise.race([ready,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('사진 불러오기 시간이 초과되었습니다.')),timeoutMs);})]);
   if(!image.naturalWidth)throw new Error('사진을 불러오지 못했습니다.');
  }finally{clearTimeout(timer);removeListeners();}
 }));
 const failed=results.filter(result=>result.status==='rejected').length;
 if(failed)throw new Error(`${failed}장의 사진을 출력할 수 없어 인쇄를 중단했습니다. 사진을 확인한 뒤 다시 시도해 주세요.`);
}

export function mountFieldRecords(container,{cases=[]}={}){
 let disposed=false,db=null,records=[],urls=new Map(),busy=false,editing=null,dialog=null;
 const filters={search:'',event:'',year:'',topic:''};
 const initial={event:'서울 ADEX',year:'2025',manufacturer:cases[0]?.manufacturer||'',product:cases[0]?.name||'',topic:'외관·배치',note:'',source:''};
 let batchMeta={...initial};
 const status=(message,error=false)=>{container.querySelectorAll('[data-fr-status]').forEach(e=>{e.textContent=message;e.classList.toggle('fr-error',error);});};
 const url=r=>{if(!urls.has(r.id))urls.set(r.id,URL.createObjectURL(r.blob));return urls.get(r.id);};
 const filtered=()=>records.filter(r=>(!filters.event||r.event===filters.event)&&(!filters.year||r.year===filters.year)&&(!filters.topic||r.topic===filters.topic)&&(!filters.search||[r.name,...META.map(k=>r[k])].join(' ').toLowerCase().includes(filters.search.toLowerCase())));
 const formFields=(r,prefix)=>`<div class="fr-fields">${[['event','전시회'],['year','자료연도'],['manufacturer','업체'],['product','제품'],['topic','주제']].map(([key,label])=>`<label>${label}<input name="${key}" id="${prefix}-${key}" value="${esc(r[key])}" required maxlength="${key==='year'?4:120}" ${key==='year'?'inputmode="numeric" pattern="[0-9]{4}"':key==='product'?'list="fr-products"':''}></label>`).join('')}<label>출처 링크 <span>(선택)</span><input name="source" type="url" value="${esc(r.source)}" maxlength="2000" placeholder="https://"></label><label class="fr-wide">관찰 메모 <span>(선택)</span><textarea name="note" maxlength="4000" rows="3" placeholder="사진에서 확인한 점과 추가 확인할 사항을 기록하세요.">${esc(r.note)}</textarea></label></div>`;
 function options(key){return `<option value="">전체 ${key==='event'?'전시회':key==='year'?'연도':'주제'}</option>`+[...new Set(records.map(r=>r[key]))].sort().map(v=>`<option value="${esc(v)}" ${filters[key]===v?'selected':''}>${esc(v)}</option>`).join('');}
 function cards(){const shown=filtered();return shown.length?shown.map(r=>`<article class="fr-card"><button class="fr-image" data-fr-action="view" data-id="${r.id}" aria-label="${esc(r.product)} · ${esc(r.name)} 사진 확대"><img src="${url(r)}" alt="${esc(r.product+' · '+r.name)}" loading="lazy"></button><div class="fr-card-body"><p class="fr-kicker">${esc(r.event)} ${esc(r.year)} · ${esc(r.topic)}</p><h3>${esc(r.product)}</h3><p>${esc(r.manufacturer)} · ${esc(r.name)}</p>${r.note?`<p class="fr-note">${esc(r.note)}</p>`:''}${r.source?`<a href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">출처 원문 ↗</a>`:''}<div class="fr-card-actions"><button data-fr-action="edit" data-id="${r.id}">분류·메모 수정</button><button data-fr-action="delete" data-id="${r.id}">삭제</button></div></div></article>`).join(''):`<div class="fr-empty">${records.length?'선택한 조건과 일치하는 사진이 없습니다.':'현장 사진을 선택하고 전시회·업체·제품을 묶음 지정해 등록하세요.'}</div>`;}
 function refreshCards(){container.querySelector('[data-fr-grid]').innerHTML=cards();container.querySelector('[data-fr-count]').textContent=`${filtered().length} / ${records.length}장 · ${(records.reduce((s,r)=>s+r.size,0)/1024/1024).toFixed(1)}MB / 50MB`;}
 function render(message=''){
  if(disposed)return;
  container.innerHTML=`<section class="field-records"><div class="fr-local">이 브라우저에만 저장됩니다. 서버로 전송하거나 다른 사용자와 공유하지 않습니다. 사진 포함 백업으로 보관·이동할 수 있습니다.</div><div class="fr-toolbar"><button data-fr-action="export">사진 포함 백업</button><label class="fr-file-button">사진 백업 가져오기<input type="file" accept="application/json,.json" data-fr-import></label><button data-fr-action="print">현재 결과 보고서 / PDF</button></div><p data-fr-status role="status" aria-live="polite">${esc(message)}</p><details class="fr-register" open><summary>새 사진 묶음 등록</summary><form data-fr-register>${formFields(batchMeta,'fr-batch')}<label class="fr-file-label">사진 선택 <span>JPEG · PNG · WebP / 장당 10MB / 한 번에 50장</span><input type="file" name="photos" data-fr-photos accept="image/jpeg,image/png,image/webp" multiple required></label><button type="submit" class="fr-primary">선택한 사진 등록</button><p class="fr-hint">같은 원본 사진은 중복 등록하지 않습니다. 사진의 분류와 메모는 등록 후 수정할 수 있습니다.</p></form></details><datalist id="fr-products">${cases.map(c=>`<option value="${esc(c.name)}"></option>`).join('')}</datalist><section class="fr-collection"><div class="fr-collection-heading"><h2>현장 사진 기록</h2><span data-fr-count></span></div><div class="fr-filters"><label>검색<input data-fr-search value="${esc(filters.search)}" placeholder="업체·제품·파일명·메모"></label>${['event','year','topic'].map(key=>`<label>${{event:'전시회',year:'자료연도',topic:'주제'}[key]}<select data-fr-filter="${key}">${options(key)}</select></label>`).join('')}<button data-fr-action="reset">초기화</button></div><p class="fr-print-context">자료 구분: 사용자 현장 기록 · 사진 관찰과 작성자 메모이며 성능 검증 결과가 아닙니다. ${new Date().toLocaleDateString('ko-KR')} 출력</p><div class="fr-grid" data-fr-grid></div></section></section>`;
  refreshCards();
 }
 const formMeta=form=>normalizeFieldMeta(Object.fromEntries(new FormData(form)));
 async function run(operation){if(busy)return;busy=true;container.setAttribute('aria-busy','true');container.querySelectorAll('button,input,select,textarea').forEach(el=>el.disabled=true);try{await operation();}catch(e){status(e?.message||'작업을 완료하지 못했습니다. 다시 시도해 주세요.',true);}finally{busy=false;container.removeAttribute('aria-busy');container.querySelectorAll('button,input,select,textarea').forEach(el=>el.disabled=false);}}
 function closeDialog(){if(!dialog)return;const closing=dialog;dialog=null;editing=null;closing.close();closing.remove();}
 function openDialog(content){closeDialog();dialog=document.createElement('dialog');dialog.className='fr-dialog';dialog.setAttribute('aria-labelledby','fr-dialog-title');dialog.innerHTML=content+'<p data-fr-status role="status" aria-live="polite"></p>';container.append(dialog);const opened=dialog;opened.addEventListener('close',()=>{opened.remove();if(dialog===opened){dialog=null;editing=null;}});opened.showModal();}
 function editDialog(r){openDialog(`<div class="fr-dialog-head"><h2 id="fr-dialog-title">분류·메모 수정</h2><button data-fr-action="close" aria-label="닫기">닫기</button></div><form data-fr-edit>${formFields(r,'fr-edit')}<button type="submit" class="fr-primary">수정 저장</button></form>`);editing=r.id;}
 async function onSubmit(e){
  const form=e.target;if(!form.matches('[data-fr-register],[data-fr-edit]'))return;e.preventDefault();
  // Read enabled controls before entering the busy state; disabled controls are absent from FormData.
  let meta;try{meta=formMeta(form);}catch(err){status(err.message,true);return;}
  const files=[...(form.querySelector('[data-fr-photos]')?.files||[])],editId=editing;
  await run(async()=>{
   if(editId){const old=records.find(r=>r.id===editId);if(!old)throw new Error('수정할 사진을 찾지 못했습니다.');const updated={...old,...meta};await writeRecords(db,[updated]);records=records.map(r=>r.id===editId?updated:r);closeDialog();render('분류와 메모를 저장했습니다.');return;}
   batchMeta=meta;if(!files.length)throw new Error('사진을 선택해 주세요.');if(files.length>FIELD_LIMITS.batch)throw new Error('한 번에 최대 50장까지 선택할 수 있습니다.');
   const known=new Set(records.map(r=>r.id)),added=[],failed=[];let skipped=0,total=records.reduce((s,r)=>s+r.size,0);
   for(const file of files){try{
    if(!file.size||file.size>FIELD_LIMITS.fileBytes)throw new Error('장당 10MB 제한');
    const bytes=new Uint8Array(await file.arrayBuffer()),type=imageMimeFromBytes(bytes);if(!type)throw new Error('JPEG·PNG·WebP 파일만 지원');
    const id=await hashBytes(bytes);if(known.has(id)){skipped++;continue;}
    if(total+file.size>FIELD_LIMITS.totalBytes||records.length+added.length>=FIELD_LIMITS.records)throw new Error('전체 50MB·200장 제한');
    const blob=new Blob([bytes],{type});await validateImage(blob);added.push({id,name:file.name.slice(0,180),type,size:file.size,createdAt:new Date().toISOString(),...meta,blob});known.add(id);total+=file.size;
   }catch(err){failed.push(`${file.name}: ${err.message}`);}}
   if(added.length){await writeRecords(db,added);records=[...records,...added];}
   render(`${added.length}장 저장 · 중복 ${skipped}장 제외${failed.length?' · 실패 '+failed.length+'장: '+failed.join(' / '):''}`);
  });
 }
 async function onChange(e){
  if(e.target.matches('[data-fr-filter]')){filters[e.target.dataset.frFilter]=e.target.value;refreshCards();return;}
  if(!e.target.matches('[data-fr-import]')||!e.target.files[0])return;const file=e.target.files[0];
  await run(async()=>{
   if(file.size>FIELD_LIMITS.backupBytes)throw new Error('백업 파일은 75MB 이하여야 합니다.');status('백업 사진을 검사하고 있습니다.');
   let raw;try{raw=JSON.parse(await file.text());}catch{throw new Error('JSON 백업 파일을 읽지 못했습니다.');}
   const imported=await decodeFieldBackup(raw);const known=new Set(records.map(r=>r.id)),add=imported.filter(r=>!known.has(r.id));
   if(records.length+add.length>FIELD_LIMITS.records||[...records,...add].reduce((s,r)=>s+r.size,0)>FIELD_LIMITS.totalBytes)throw new Error('가져오면 전체 50MB·200장 제한을 넘습니다. 기존 사진은 변경되지 않았습니다.');
   await writeRecords(db,add);records=[...records,...add];render(`${add.length}장 가져오기 완료 · 기존 사진 ${imported.length-add.length}장은 그대로 유지했습니다.`);
  });e.target.value='';
 }
 function onInput(e){if(e.target.matches('[data-fr-search]')){filters.search=e.target.value;refreshCards();}}
 async function onClick(e){
  const target=e.target.closest('[data-fr-action]');if(!target||busy)return;const action=target.dataset.frAction,r=records.find(r=>r.id===target.dataset.id);
  if(action==='close'){closeDialog();return;}
  if(action==='reset'){Object.keys(filters).forEach(k=>filters[k]='');render();return;}
  if(action==='view'&&r){openDialog(`<div class="fr-dialog-head"><h2 id="fr-dialog-title">${esc(r.product)} · ${esc(r.name)}</h2><button data-fr-action="close">닫기</button></div><img class="fr-full-image" src="${url(r)}" alt="${esc(r.product+' · '+r.name)}"><p>${esc(r.event)} ${esc(r.year)} · ${esc(r.manufacturer)} · ${esc(r.topic)}</p><p class="fr-note">${esc(r.note)}</p>`);return;}
  if(action==='edit'&&r){editDialog(r);return;}
  if(action==='delete'&&r){openDialog(`<div class="fr-dialog-head"><h2 id="fr-dialog-title">이 사진을 삭제하시겠습니까?</h2></div><p>${esc(r.name)} · ${esc(r.product)}</p><p>현재 브라우저의 사진과 분류 기록이 삭제됩니다. 원본 파일에는 영향이 없습니다.</p><div class="fr-toolbar"><button data-fr-action="close">취소</button><button data-fr-action="confirm-delete" data-id="${r.id}">사진 삭제</button></div>`);return;}
  if(action==='confirm-delete'&&r){await run(async()=>{await writeRecords(db,[],r.id);records=records.filter(v=>v.id!==r.id);URL.revokeObjectURL(urls.get(r.id));urls.delete(r.id);closeDialog();render('사진을 삭제했습니다.');});return;}
  if(action==='print'){
   if(!filtered().length){status('출력할 사진이 없습니다.',true);return;}
   await run(async()=>{status('보고서에 들어갈 사진을 불러오고 있습니다.');await prepareFieldImagesForPrint(container.querySelectorAll('[data-fr-grid] img'));if(disposed)return;status('사진 준비를 완료했습니다. 인쇄 대화상자에서 PDF로 저장할 수 있습니다.');document.body.classList.add('field-records-report');window.print();});return;
  }
  if(action==='export')await run(async()=>{
   if(!records.length)throw new Error('백업할 사진이 없습니다.');status('사진 원본을 포함한 백업을 준비하고 있습니다.');
   const output=[];for(const record of records){const {blob,...meta}=record;output.push({...meta,dataUrl:await blobDataUrl(blob)});}
   const blob=new Blob([JSON.stringify({application:'fieldnote-photos',schemaVersion:1,createdAt:new Date().toISOString(),records:output})],{type:'application/json'});
   const objectUrl=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=objectUrl;anchor.download=`fieldnote-photos-${new Date().toISOString().slice(0,10)}.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);status('사진 포함 백업 파일을 내려받았습니다.');
  });
 }
 const afterPrint=()=>document.body.classList.remove('field-records-report');
 container.addEventListener('submit',onSubmit);container.addEventListener('change',onChange);container.addEventListener('input',onInput);container.addEventListener('click',onClick);window.addEventListener('afterprint',afterPrint);
 container.innerHTML='<p role="status">현장 사진 저장소를 열고 있습니다.</p>';
 openStore().then(async store=>{if(disposed){store.close();return;}db=store;records=await readAll(db);if(!disposed)render();}).catch(e=>{if(!disposed)container.innerHTML=`<div class="fr-error" role="alert">${esc(e.message)}</div>`;});
 return ()=>{disposed=true;closeDialog();for(const value of urls.values())URL.revokeObjectURL(value);urls.clear();db?.close();afterPrint();container.removeEventListener('submit',onSubmit);container.removeEventListener('change',onChange);container.removeEventListener('input',onInput);container.removeEventListener('click',onClick);window.removeEventListener('afterprint',afterPrint);};
}
