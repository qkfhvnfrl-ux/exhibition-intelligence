import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {safeAssetPath,safeUrl} from '../src/v2/data.js';

const rootDirectory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const array=value=>Array.isArray(value)?value:[];
const unique=values=>[...new Set(values.filter(value=>value!==undefined&&value!==null&&value!==''))];
const hash=value=>createHash('sha256').update(String(value)).digest('hex').slice(0,20);
const byId=values=>new Map(array(values).map(value=>[value.id,value]));
const check=(condition,message)=>{if(!condition)throw new Error('V2 app data: '+message);};
const safeText=value=>typeof value==='string'?value:null;

/** Keep rights limitations. An available image URL is not permission to display it. */
export function normalizePhoto(photo,sources,{context=photo.context||'reference'}={}){
  const rights=photo.rights||{status:photo.rightsStatus||'link-only',license:photo.license||null,licenseUrl:photo.licenseUrl||null,basis:photo.rightsBasis||photo.rightsNote||null};
  const sourceIds=unique(array(photo.sourceIds));
  const sourceUrl=safeUrl(photo.sourceUrl)||sourceIds.map(id=>safeUrl(sources.get(id)?.url)).find(Boolean)||'';
  const local=safeAssetPath(photo.localPath||photo.src),remote=safeUrl(photo.embedImageUrl||photo.imageUrl);
  const status=rights.status,license=rights.license||'';
  let src=null,delivery='linked',displayBasis=null;
  if(!['link-only','link_only'].includes(status)){
    const recordedOpenLicense=/^(CC BY|CC0|Public domain|OGL|KOGL)/i.test(license);
    const recordedNewsroomNotice=/뉴스룸/.test(license)&&/https:\/\/(?:www\.)?(?:hyundaimotorgroup\.com|hyundai-rotem\.co\.kr|hyundai-wia\.com|newsroom\.hyundai\.com)\//.test(sourceUrl);
    if(local&&(status==='reusable'||recordedOpenLicense||recordedNewsroomNotice)){
      src=local;delivery='local';displayBasis=status==='reusable'?'recorded_reuse_basis':'existing_local_with_recorded_license';
    }else if(remote){
      const image=new URL(remote),source=sourceUrl?new URL(sourceUrl):null;
      if(status==='provider-embed'&&image.hostname==='live.staticflickr.com'&&source&&['flickr.com','www.flickr.com'].includes(source.hostname)&&source.pathname.startsWith('/photos/')){src=remote;delivery='remote';displayBasis='provider_embed';}
      else if(status==='reusable'&&image.hostname==='upload.wikimedia.org'){src=remote;delivery='remote';displayBasis='recorded_reuse_basis';}
    }
  }
  return {id:photo.id,caption:photo.caption||'',src,sourceUrl,sourceIds,width:photo.width||null,height:photo.height||null,credit:photo.credit||photo.author||null,rights,context,variantNote:photo.variantNote||null,sourceDate:photo.sourceDate||photo.date||null,delivery,displayBasis};
}

function sourceRecord(source){return {id:source.id,url:safeUrl(source.url),title:source.title||source.url,publisher:source.publisher||null,publishedAt:source.publishedAt||source.date||null,...(source.limitations?{note:source.limitations}:{}),...(source.independence?{evidenceStatus:source.independence==='primary_single_origin'?'single_source':source.independence}:{})};}
function categoryIds(taxonomy,{rawCategories=[],productCategories=[],relevanceCategories=[],editorialCategories=[]}){
  return taxonomy.categories.filter(category=>editorialCategories.includes(category.id)||array(category.directoryLabels).some(label=>rawCategories.includes(label))||array(category.productLabels).some(label=>productCategories.includes(label))||array(category.relevanceLabels).some(label=>relevanceCategories.includes(label))).map(category=>category.id);
}
function mapDisplayDocument(doc,display){
  if(!display)return doc;
  const background=display.background||{};
  return {...doc,background:{type:background.type||'image',url:safeUrl(background.url||background.imageUrl),imageUrl:safeUrl(background.imageUrl||background.url),sourceUrl:safeUrl(background.sourceUrl),attribution:background.attribution||doc.title,width:background.width||null,height:background.height||null,localPath:background.localPath||null},areas:array(display.areas).map(area=>({id:area.id,label:area.label,kind:area.kind,bounds:area.bounds,outline:area.outline||null,focusPoint:area.focusPoint||null,note:area.note||null})),displayRights:{status:display.rights?.status||null,redistributionPermission:display.rights?.redistributionPermission||null,legalNoticeUrl:display.rights?.legalNoticeUrl||null,notes:display.rights?.notes||null}};
}

/** Deterministic event shards; no browser state or research-management tables are published. */
export function compileAppData({publicData,registry,taxonomy,editorialBundles=[],mapDisplay={documents:[]}}){
  check(publicData?.schemaVersion===2,'missing v2 public projection');
  check(Array.isArray(taxonomy?.categories)&&taxonomy.categories.length>0,'taxonomy missing');
  const publicOrganizations=byId(publicData.organizations),privateOrganizations=byId(registry.organizations),privateParticipations=byId(registry.participations);
  const publicProducts=byId(publicData.products),privateProducts=byId(registry.products),publicPhotos=byId(publicData.photos);
  const sources=byId(publicData.sources.map(sourceRecord));
  const appendSource=source=>{
    check(safeUrl(source.url),'invalid source URL '+source.id);
    const id=source.id||'source-'+hash(source.url);const record=sourceRecord({...source,id});
    if(sources.has(id))check(sources.get(id).url===record.url,'source ID points to two URLs '+id);else sources.set(id,record);
    return id;
  };
  const taxonomyPublic={note:taxonomy.note,categories:taxonomy.categories.map(({id,label})=>({id,label}))};
  const result={index:{schemaVersion:3,dataAsOf:publicData.dataAsOf,defaultEventId:'adex-2025',taxonomy:taxonomyPublic,events:[]},events:{}};
  const eventOrder=['adex-2025','eurosatory-2026','dsei-2025','idex-2025','saha-2026'];
  for(const event of [...publicData.events].sort((a,b)=>eventOrder.indexOf(a.id)-eventOrder.indexOf(b.id))){
    const participations=publicData.participations.filter(p=>p.eventId===event.id),participantIds=new Set(participations.map(p=>p.id));
    const boothOccupancies=publicData.boothOccupancies.filter(o=>participantIds.has(o.participationId)).map(({id,participationId,boothId,sourceIds})=>({id,participationId,boothId,sourceIds}));
    const boothIds=new Set(boothOccupancies.map(o=>o.boothId));
    const booths=publicData.booths.filter(b=>b.eventId===event.id);
    const mapGeometries=publicData.mapGeometries.filter(g=>g.eventId===event.id);
    const mappedBooths=new Set(mapGeometries.map(g=>g.boothId));
    const mapDocuments=publicData.mapDocuments.filter(d=>d.eventId===event.id).map(d=>mapDisplayDocument(d,array(mapDisplay.documents).find(display=>display.documentId===d.id)));
    const eventExhibits=publicData.exhibits.filter(e=>e.eventId===event.id);
    const productIds=new Set(eventExhibits.map(e=>e.productId));
    const products=new Map([...productIds].map(id=>[id,{...publicProducts.get(id),sourceIds:array(privateProducts.get(id)?.sourceIds),form:null,exhibitStatus:'unconfirmed'}]));
    const analyses=publicData.analyses.filter(a=>a.eventId===event.id||(a.eventId===null&&a.productIds.some(id=>productIds.has(id))));
    const assertionIds=new Set(analyses.flatMap(a=>a.assertionIds));
    const assertions=publicData.assertions.filter(a=>assertionIds.has(a.id));
    const photos=new Map(),companyPhotoIds=new Map();
    const assignPhoto=(companyId,photo)=>{photos.set(photo.id,photo);if(!companyPhotoIds.has(companyId))companyPhotoIds.set(companyId,[]);if(!companyPhotoIds.get(companyId).includes(photo.id))companyPhotoIds.get(companyId).push(photo.id);};
    const rawEntries=registry.rosterEntries.filter(r=>r.eventId===event.id);
    const knownPhotoLinks=publicData.photoLinks.filter(link=>link.eventId===event.id||(link.eventId===null&&productIds.has(link.productId)));
    const eventPhotoIds=[];
    for(const link of knownPhotoLinks){
      const original=publicPhotos.get(link.photoId);if(!original)continue;
      const context=link.eventId===event.id&&link.context==='event'?'event':'reference';
      const photo=normalizePhoto(original,sources,{context});photos.set(photo.id,photo);
      const product=publicProducts.get(link.productId);
      if(product)for(const companyId of product.organizationIds)assignPhoto(companyId,photo);
      else if(link.eventId===event.id)eventPhotoIds.push(photo.id);
    }
    const relevantSourceIds=new Set([...event.sourceIds,...boothOccupancies.flatMap(o=>o.sourceIds),...analyses.flatMap(a=>a.sourceIds),...assertions.flatMap(a=>a.sourceIds)]);
    const companyCatalogIds=new Map(),catalogs=new Map();
    const editorials=[];
    const editorialInput=editorialBundles.filter(bundle=>bundle.eventId===event.id).flatMap(bundle=>array(bundle.cases||bundle.editorials));
    for(const item of editorialInput){
      const participant=participations.find(p=>p.organizationId===item.organizationId);
      check(participant,'editorial organization is not registered in edition '+item.organizationId);
      check(array(item.categoryIds).every(id=>taxonomy.categories.some(category=>category.id===id)),'unknown editorial category '+item.id);
      check(item.reason&&array(item.highlights).length===3&&array(item.followUps).length>=2&&array(item.followUps).length<=3,'editorial needs reason, three highlights and two/three follow-ups '+item.id);
      for(const field of ['exhibit','distinction','direction','workConnection'])check(item[field],'editorial missing '+field+' '+item.id);
      const editorialSourceIds=unique(array(item.sources).map(appendSource));check(editorialSourceIds.length,'editorial requires evidence '+item.id);editorialSourceIds.forEach(id=>relevantSourceIds.add(id));
      const editorialPhotoIds=[];
      for(const rawPhoto of array(item.photos)){
        check(rawPhoto.context!=='event'||rawPhoto.eventId===event.id,'editorial photo edition mismatch '+rawPhoto.id);
        const sourceUrl=safeUrl(rawPhoto.sourceUrl);const photoSourceId=sourceUrl?appendSource({url:sourceUrl,title:rawPhoto.caption||'사진 원문',publisher:rawPhoto.author||rawPhoto.credit}):null;
        const p=normalizePhoto({...rawPhoto,id:rawPhoto.id||'photo-'+hash(rawPhoto.src||rawPhoto.imageUrl||sourceUrl+'|'+rawPhoto.caption),sourceIds:unique([...array(rawPhoto.sourceIds),photoSourceId])},sources,{context:rawPhoto.context||'event'});
        const duplicate=[...photos.values()].find(other=>(p.src&&p.src===other.src)||(!p.src&&!other.src&&p.sourceUrl===other.sourceUrl&&p.caption===other.caption));
        if(duplicate){const merged={...duplicate,...p,id:duplicate.id,sourceIds:unique([...duplicate.sourceIds,...p.sourceIds])};assignPhoto(item.organizationId,merged);editorialPhotoIds.push(duplicate.id);}else{assignPhoto(item.organizationId,p);editorialPhotoIds.push(p.id);}
      }
      const editorialCatalogIds=[];
      for(const raw of array(item.catalogs)){
        check(safeUrl(raw.url),'catalog URL invalid '+item.id);
        const id=raw.id||'document-'+hash(raw.url),sourceId=appendSource({url:raw.url,title:raw.title,publisher:raw.publisher});
        const record={id,title:raw.title||'제품 자료',url:safeUrl(raw.url),sourceIds:unique([...array(raw.sourceIds),sourceId]),organizationIds:[item.organizationId],productIds:array(raw.productIds),documentType:raw.scope==='event'?'event_material':'general_product_reference',edition:raw.edition||null,scope:raw.scope||'general',note:raw.note||(raw.scope==='event'?'해당 회차 자료':'일반 제품자료이며 해당 회차 출품 확인을 대신하지 않습니다'),rights:raw.rights||{status:'link_only'}};
        catalogs.set(id,record);editorialCatalogIds.push(id);record.sourceIds.forEach(sid=>relevantSourceIds.add(sid));
      }
      companyCatalogIds.set(item.organizationId,editorialCatalogIds);
      for(const exhibitItem of array(item.exhibit?.items)){
        if(!exhibitItem.name)continue;
        const id=exhibitItem.productId||exhibitItem.id||'product-'+hash(event.id+'|'+item.organizationId+'|'+exhibitItem.name);
        const previous=products.get(id);
        check(!previous||previous.organizationIds.includes(item.organizationId),'editorial product belongs to a different organization '+id);
        products.set(id,{...(previous||{}),id,name:exhibitItem.name,alternativeNames:unique([...array(previous?.alternativeNames),previous?.name]),organizationIds:unique([...(previous?.organizationIds||[]),item.organizationId]),category:previous?.category||null,sourceIds:unique([...array(previous?.sourceIds),...array(exhibitItem.sourceIds)]),form:exhibitItem.form||null,exhibitStatus:exhibitItem.status||'source_documented'});
      }
      const editorial={id:item.id,organizationId:item.organizationId,eventId:event.id,categoryIds:array(item.categoryIds),reason:item.reason,highlights:item.highlights,exhibit:item.exhibit,distinction:item.distinction,direction:item.direction,workConnection:item.workConnection,followUps:item.followUps,sourceIds:editorialSourceIds,photoIds:unique(editorialPhotoIds),catalogIds:editorialCatalogIds};
      for(const key of ['companyName','displayName','interpretationNote','verificationNote','evidenceNote','participationNote','boothNote','boothNumberNote'])if(item[key])editorial[key]=item[key];
      editorial.interpretationNote=item.interpretationNote||item.verificationNote||null;
      editorials.push(editorial);
    }
    const companies=participations.map(p=>{
      const org=publicOrganizations.get(p.organizationId),privateOrg=privateOrganizations.get(p.organizationId),privateP=privateParticipations.get(p.id);
      check(org,'missing organization '+p.organizationId);
      const companyProducts=[...products.values()].filter(product=>product.organizationIds.includes(org.id));
      const companyAnalyses=analyses.filter(a=>a.organizationIds.includes(org.id));
      // An organization's global source bag can contain rosters from other editions.
      // Company screens retain this participation's sources and linked product/analysis evidence only.
      const sourceIds=unique([...array(privateP?.sourceIds),...companyProducts.flatMap(product=>product.sourceIds),...companyAnalyses.flatMap(a=>a.sourceIds)]);
      const rows=rawEntries.filter(r=>r.organizationIds.includes(org.id));
      const rawCategories=unique(rows.flatMap(r=>r.rawCategories));
      const editorial=editorials.find(e=>e.organizationId===org.id);
      const ownBoothIds=unique(boothOccupancies.filter(o=>o.participationId===p.id).map(o=>o.boothId));
      const ownCatalogIds=companyCatalogIds.get(org.id)||[];
      for(const catalog of publicData.catalogs){
        if(catalog.organizationIds.includes(org.id)||catalog.productIds.some(id=>companyProducts.some(product=>product.id===id))||catalog.sourceIds.some(id=>sourceIds.includes(id))){
          if(mapDocuments.some(doc=>doc.url===catalog.url))continue;
          catalogs.set(catalog.id,{...catalog,scope:'unclassified',note:'원문 자료의 회차와 문서 종류를 확인해 사용하십시오'});ownCatalogIds.push(catalog.id);
        }
      }
      const ownSourceIds=unique([...sourceIds,...array(editorial?.sourceIds)]);ownSourceIds.forEach(id=>relevantSourceIds.add(id));
      const category=categoryIds(taxonomy,{rawCategories,productCategories:companyProducts.map(product=>product.category),relevanceCategories:privateP?.relevance.status==='confirmed'?privateP.relevance.categories:[],editorialCategories:array(editorial?.categoryIds)});
      const aliases=unique([...array(org.aliasNames),editorial?.displayName]);
      return {id:org.id,organizationId:org.id,name:org.name,displayName:editorial?.displayName||org.name,aliases,kind:org.kind,countries:array(privateOrg?.countryNames),participationId:p.id,status:p.status,attendanceStatus:p.attendanceStatus,sourceLabelStatus:p.sourceLabelStatus,boothIds:ownBoothIds,mapBoothIds:ownBoothIds.filter(id=>mappedBooths.has(id)),productIds:companyProducts.map(product=>product.id),photoIds:unique(companyPhotoIds.get(org.id)||[]),analysisIds:companyAnalyses.map(a=>a.id),catalogIds:unique(ownCatalogIds),editorialId:editorial?.id||null,categoryIds:category,rawCategories,sourceIds:ownSourceIds,profileUrls:unique(rows.map(row=>safeUrl(row.profileUrl))),relevanceNote:privateP?.relevance.status==='confirmed'?privateP.relevance.reason:null,reason:editorial?.reason||null,highlights:editorial?.highlights||[],exhibitStatus:editorial?'source_documented':'unconfirmed',interpretationNote:editorial?.interpretationNote||(!editorial?'명단 등재와 제품의 실제 전시 확인은 구분합니다. 기존 제품·분석은 원문 조건을 함께 확인하십시오.':null),verificationNote:editorial?.verificationNote||null,searchText:[org.name,...aliases,...companyProducts.flatMap(product=>[product.name,...array(product.alternativeNames)]),...rawCategories,...category.map(id=>taxonomy.categories.find(c=>c.id===id).label)].join(' ')};
    }).sort((a,b)=>a.name.localeCompare(b.name,'ko',{numeric:true}));
    for(const photo of photos.values())photo.sourceIds.forEach(id=>relevantSourceIds.add(id));
    for(const catalog of catalogs.values())catalog.sourceIds.forEach(id=>relevantSourceIds.add(id));
    for(const product of products.values())product.sourceIds.forEach(id=>relevantSourceIds.add(id));
    for(const doc of mapDocuments){const existing=[...sources.values()].find(source=>source.url===doc.url);if(existing)relevantSourceIds.add(existing.id);}
    const sourceSubset=[...relevantSourceIds].map(id=>sources.get(id)).filter(Boolean);
    const shard={schemaVersion:3,dataAsOf:publicData.dataAsOf,event:{id:event.id,name:event.name,year:event.year,venue:event.venue,dates:event.dates,sourceIds:event.sourceIds},taxonomy:taxonomyPublic,companies,products:[...products.values()],photos:[...photos.values()],eventPhotoIds:unique(eventPhotoIds),catalogs:[...catalogs.values()],editorials,analyses,assertions,sources:sourceSubset,booths,mapDocuments,mapGeometries,boothOccupancies};
    validateAppEvent(shard);
    result.events[event.id]=shard;
    result.index.events.push({...shard.event,dataFile:`events/${event.id}.json`,mapAvailable:mapGeometries.length>0,companyCount:companies.length,mappedCompanyCount:companies.filter(c=>c.mapBoothIds.length).length,scopeNote:'수록 명칭·자료 기준이며 전체 참가기업 조사 완료 수가 아닙니다'});
  }
  return result;
}

export function validateAppEvent(data){
  for(const key of ['collections','workQueue','metrics','rosterEntries','migration','legacyCriteria'])check(!(key in data),'private table published '+key);
  const collections=['companies','products','photos','catalogs','editorials','sources','booths','mapDocuments','mapGeometries','analyses','assertions'];
  const tables={};for(const key of collections){tables[key]=byId(data[key]);check(tables[key].size===array(data[key]).length,'duplicate '+key+' IDs');}
  const ref=(table,id)=>check(tables[table].has(id),'dangling '+table+' '+id);
  for(const company of data.companies){for(const key of ['photoIds','productIds','catalogIds','analysisIds','sourceIds'])for(const id of company[key])ref(({photoIds:'photos',productIds:'products',catalogIds:'catalogs',analysisIds:'analyses',sourceIds:'sources'})[key],id);for(const id of company.boothIds)ref('booths',id);if(company.editorialId)ref('editorials',company.editorialId);for(const id of company.mapBoothIds)check(data.mapGeometries.some(g=>g.boothId===id),'unverified map placement '+id);}
  for(const source of data.sources)check(safeUrl(source.url),'unsafe source URL');
  for(const photo of data.photos){for(const id of photo.sourceIds)ref('sources',id);check(!['link-only','link_only'].includes(photo.rights.status)||photo.src===null,'link-only photo displayed');if(photo.src)check(safeAssetPath(photo.src)||safeUrl(photo.src),'unsafe image URL');}
  for(const product of data.products)for(const id of product.sourceIds)ref('sources',id);
  for(const catalog of data.catalogs)for(const id of catalog.sourceIds)ref('sources',id);
  for(const editorial of data.editorials){
    for(const id of editorial.sourceIds)ref('sources',id);for(const id of editorial.photoIds)ref('photos',id);for(const id of editorial.catalogIds)ref('catalogs',id);
    const validateEvidence=value=>{if(!value||typeof value!=='object')return;if(Array.isArray(value.sourceIds))for(const id of value.sourceIds)ref('sources',id);for(const child of Object.values(value))if(child&&typeof child==='object')Array.isArray(child)?child.forEach(validateEvidence):validateEvidence(child);};
    validateEvidence(editorial);
  }
  for(const geometry of data.mapGeometries){ref('booths',geometry.boothId);ref('mapDocuments',geometry.documentId);check(geometry.eventId===data.event.id,'wrong-event geometry');}
  return true;
}

async function readJson(file,fallback){try{return JSON.parse(await readFile(file,'utf8'));}catch(error){if(error.code==='ENOENT'&&fallback!==undefined)return fallback;throw error;}}
export async function compileApp(root=rootDirectory){
  let editorialFiles=[];try{editorialFiles=(await readdir(path.join(root,'data/v2/editorial'))).filter(file=>file.endsWith('.json')).sort();}catch(error){if(error.code!=='ENOENT')throw error;}
  const [publicData,registry,taxonomy,mapDisplay,editorialBundles]=await Promise.all([readJson(path.join(root,'data/v2/public.json')),readJson(path.join(root,'data/v2/registry.json')),readJson(path.join(root,'data/v2/taxonomy.json')),readJson(path.join(root,'data/v2/map-display.json'),{documents:[]}),Promise.all(editorialFiles.map(file=>readJson(path.join(root,'data/v2/editorial',file))))]);
  const output=compileAppData({publicData,registry,taxonomy,mapDisplay,editorialBundles});
  await mkdir(path.join(root,'data/v2/app/events'),{recursive:true});
  await writeFile(path.join(root,'data/v2/app/index.json'),JSON.stringify(output.index)+'\n');
  for(const [id,event] of Object.entries(output.events))await writeFile(path.join(root,`data/v2/app/events/${id}.json`),JSON.stringify(event)+'\n');
  console.log('V2 app shards: '+Object.entries(output.events).map(([id,event])=>`${id} ${event.companies.length} organizations / ${event.editorials.length} cases`).join('; '));return output;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await compileApp();
