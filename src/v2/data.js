/** Read-only event data. No browser storage is read, migrated, or written here. */
const cache=new Map();
const indexes=new WeakMap();
const array=value=>Array.isArray(value)?value:[];
export const normalizeSearch=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('ko').replace(/\s+/g,' ').trim();
export function safeUrl(value){try{const url=new URL(String(value));return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}}
export function safeAssetPath(value){return typeof value==='string'&&/^assets\/[a-zA-Z0-9_.\/-]+$/.test(value)&&!value.split('/').includes('..')?value:'';}
async function fetchJson(url){const key=String(url);if(!cache.has(key))cache.set(key,fetch(url,{credentials:'same-origin'}).then(response=>{if(!response.ok)throw new Error(`자료를 불러오지 못했습니다 (${response.status})`);return response.json();}).catch(error=>{cache.delete(key);throw error;}));return cache.get(key);}
export async function loadIndex(){return fetchJson(new URL('../../data/v2/app/index.json',import.meta.url));}
export async function loadEvent(eventId){if(!/^[a-z0-9]+-\d{4}$/.test(String(eventId)))throw new Error('유효하지 않은 전시회입니다');const index=await loadIndex();if(!array(index.events).some(event=>event.id===eventId))throw new Error('등록되지 않은 전시회입니다');return fetchJson(new URL(`../../data/v2/app/events/${eventId}.json`,import.meta.url));}
function index(data){if(!indexes.has(data))indexes.set(data,{companies:new Map(array(data.companies).map(c=>[c.id,c])),photos:new Map(array(data.photos).map(p=>[p.id,p])),products:new Map(array(data.products).map(p=>[p.id,p])),booths:new Map(array(data.booths).map(b=>[b.id,b])),editorials:new Map(array(data.editorials).map(e=>[e.id,e]))});return indexes.get(data);}
export function getCompany(data,organizationId){return index(data).companies.get(organizationId)||null;}
export function getCompanyPhotos(data,organizationId){const c=getCompany(data,organizationId);if(!c)return [];const score=photo=>(photo.context==='event'?0:2)+(photo.src?0:1);return c.photoIds.map(id=>index(data).photos.get(id)).filter(Boolean).sort((a,b)=>score(a)-score(b));}
export function getCompanyProducts(data,organizationId){const c=getCompany(data,organizationId);return c?c.productIds.map(id=>index(data).products.get(id)).filter(Boolean):[];}
export function getCompanyEditorial(data,organizationId){const c=getCompany(data,organizationId);return c?.editorialId?index(data).editorials.get(c.editorialId)||null:null;}
export function getBoothCompanies(data,boothId){return array(data.companies).filter(c=>c.boothIds.includes(boothId));}
export function searchCompanies(data,{query='',category='',hall='',mappedOnly=false}={}){
  const terms=normalizeSearch(query).split(' ').filter(Boolean),ix=index(data);
  return array(data.companies).filter(company=>(!category||company.categoryIds.includes(category))&&(!mappedOnly||company.mapBoothIds.length>0)&&(!hall||company.boothIds.some(id=>String(ix.booths.get(id)?.hall)===String(hall)))&&terms.every(term=>normalizeSearch(company.searchText||[company.name,...company.aliases].join(' ')).includes(term))).sort((a,b)=>{
    const q=normalizeSearch(query),score=c=>!q?0:normalizeSearch(c.name)===q?2:normalizeSearch(c.name).startsWith(q)?1:0;
    return score(b)-score(a)||a.name.localeCompare(b.name,'ko',{numeric:true});
  });
}
export function tourCompanies(data,{category='',kind='featured'}={}){const byId=index(data).companies;const featured=array(data.editorials).map(e=>byId.get(e.organizationId)).filter(Boolean);const candidates=kind==='technology'?searchCompanies(data,{category,mappedOnly:true}):featured.filter(c=>c.mapBoothIds.length);return [...new Map(candidates.map(c=>[c.id,c])).values()];}
