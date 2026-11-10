export const STORAGE_KEY = 'fieldnote.review.adex2025.v1';
// New annotations are limited in the UI; existing saved work is never truncated.
export const MAX_ANNOTATIONS = 150;
export const blankDraft = () => ({notes:{},annotations:[],tasks:{},comparison:{left:'',right:'',leftPhoto:'',rightPhoto:''},revision:1});
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export function safeImage(value){return typeof value==='string' && /^assets\/(review|photos|adex2025)\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/i.test(value||'') && !value.includes('..')?value:'';}
const str=(v,n=4000)=>typeof v==='string'?v.slice(0,n):'';
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const recordList=value=>Array.isArray(value)&&value.every(isRecord);
const hasSourceUrls=value=>Array.isArray(value.sourceUrls)&&value.sourceUrls.every(url=>typeof url==='string');
const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/.test(value);
const coordinate=value=>Number.isFinite(value)&&value>=0&&value<=100;

export function sanitizeDraft(raw,ids,photoIds,photoObjects=null){
  const draft=blankDraft();
  const photoOwners=Array.isArray(photoObjects)?new Map(photoObjects.map(p=>[p.id,p.equipmentId])):null;
  for(const id of ids){draft.notes[id]=str(raw?.notes?.[id]);draft.tasks[id]=['todo','review','done'].includes(raw?.tasks?.[id])?raw.tasks[id]:'todo';}
  draft.revision=Number.isSafeInteger(raw?.revision)&&raw.revision>0?raw.revision:1;
  const left=ids.includes(raw?.comparison?.left)?raw.comparison.left:(ids[0]||'');
  const right=ids.includes(raw?.comparison?.right)&&raw.comparison.right!==left?raw.comparison.right:(ids.find(id=>id!==left)||'');
  const comparisonPhoto=(value,caseId)=>photoIds.includes(value)&&(!photoOwners||photoOwners.get(value)===caseId)?value:'';
  draft.comparison={left,right,leftPhoto:comparisonPhoto(raw?.comparison?.leftPhoto,left),rightPhoto:comparisonPhoto(raw?.comparison?.rightPhoto,right)};
  draft.annotations=(Array.isArray(raw?.annotations)?raw.annotations:[]).filter(a=>a&&ids.includes(a.caseId)&&photoIds.includes(a.photoId)&&(!photoOwners||photoOwners.get(a.photoId)===a.caseId)&&Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>=0&&a.x<=100&&a.y>=0&&a.y<=100).map((a,i)=>({id:str(a.id,100)||`import-${i}`,caseId:a.caseId,photoId:a.photoId,x:a.x,y:a.y,text:str(a.text,1200),kind:['사진 관찰','분석 의견','확인 필요'].includes(a.kind)?a.kind:'확인 필요',sourceUrl:safeUrl(a.sourceUrl)}));
  return draft;
}
export function createSnapshot(draft,data,photos,at=new Date().toISOString()){
 return structuredClone({id:`snapshot-${at}`,createdAt:at,title:`검토 확정본 ${at}`,draft,data,photos});
}
export function cleanBackup(raw,data,photos){
 if(!raw||raw.schemaVersion!==1||raw.application!=='fieldnote-review')throw new Error('전시회 1.0 검토 백업 파일이 아닙니다.');
 const ids=data.cases.map(c=>c.id),photoIds=photos.map(p=>p.id);
 const draft=sanitizeDraft(raw.draft,ids,photoIds,photos);
 const snapshots=(Array.isArray(raw.snapshots)?raw.snapshots:[]).map(s=>{
   if(!isRecord(s)||!isRecord(s.data)||!Array.isArray(s.data.cases)||!Array.isArray(s.photos)||
      typeof s.createdAt!=='string'||!Number.isFinite(Date.parse(s.createdAt))||typeof s.id!=='string'||!s.id)
     throw new Error('확정본의 자료 구조가 올바르지 않습니다.');
   const snapshotIds=s.data.cases.map(c=>c?.id);
   // A snapshot is a historical document. Validate its own identifiers instead of
   // requiring it to match the newest equipment catalog.
   if(snapshotIds.length<2||snapshotIds.some(id=>!validId(id))||new Set(snapshotIds).size!==snapshotIds.length||
      s.data.cases.some(c=>!isRecord(c)||!recordList(c.observations)||
        c.observations.some(o=>!validId(o.id)||!hasSourceUrls(o))||
        new Set(c.observations.map(o=>o.id)).size!==c.observations.length||!recordList(c.sources)||!recordList(c.specs))||
      !recordList(s.data.trend?.items)||!s.data.trend.items.every(t=>hasSourceUrls(t)&&
        (t.caseIds===undefined||(Array.isArray(t.caseIds)&&t.caseIds.every(id=>snapshotIds.includes(id)))))||
      !recordList(s.data.trend?.timeline)||!recordList(s.data.comparison?.rows)||!recordList(s.data.briefing)||
      s.data.briefing.some(b=>b.caseId!==undefined&&!snapshotIds.includes(b.caseId)))
     throw new Error('확정본의 필수 자료가 없습니다.');
   if(s.photos.some(p=>!isRecord(p)||!validId(p.id)||!snapshotIds.includes(p.equipmentId)||!safeImage(p.src))||
      new Set(s.photos.map(p=>p.id)).size!==s.photos.length)
     throw new Error('확정본의 사진 자료가 올바르지 않습니다.');
   const snapshotPhotos=new Map(s.photos.map(p=>[p.id,p]));
   if(s.data.photoObservations!==undefined&&(!recordList(s.data.photoObservations)||s.data.photoObservations.some(b=>
      !coordinate(b.x)||!coordinate(b.y)||snapshotPhotos.get(b.photoId)?.equipmentId!==b.caseId||
      !s.data.cases.find(c=>c.id===b.caseId)?.observations.some(o=>o.id===b.observationId))))
     throw new Error('확정본의 사진 관찰 위치 또는 연결이 올바르지 않습니다.');
   return {id:str(s.id,150),createdAt:str(s.createdAt,50),title:str(s.title,120),draft:sanitizeDraft(s.draft,snapshotIds,s.photos.map(p=>p.id),s.photos),data:structuredClone(s.data),photos:structuredClone(s.photos)};
 });
 if(new Set(snapshots.map(s=>s.id)).size!==snapshots.length)throw new Error('확정본 식별자가 중복되었습니다.');
 return {schemaVersion:1,application:'fieldnote-review',draft,snapshots};
}
