import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';

const list=value=>Array.isArray(value)?value:[];
const unique=values=>[...new Set(values.filter(Boolean))];
const check=(value,message)=>{if(!value)throw new Error('V2 research: '+message);};

/** Only explicitly reviewed case bundles are compiled. Population notes stay in the ledger. */
export async function readResearchBundles(root){
  const directory=path.join(root,'data/v2/research');
  let events;try{events=await readdir(directory,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return [];throw error;}
  const bundles=[],editorials=new Map();
  let editorialFiles=[];try{editorialFiles=(await readdir(path.join(root,'data/v2/editorial'))).filter(name=>name.endsWith('.json'));}catch(error){if(error.code!=='ENOENT')throw error;}
  for(const filename of editorialFiles){const original=JSON.parse(await readFile(path.join(root,'data/v2/editorial',filename),'utf8'));for(const item of list(original.cases))editorials.set(original.eventId+'|'+item.id,item);}
  for(const event of events.filter(entry=>entry.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))){
    for(const filename of (await readdir(path.join(directory,event.name))).filter(name=>name.endsWith('.json')).sort()){
      const bundle=JSON.parse(await readFile(path.join(directory,event.name,filename),'utf8'));
      if(!Array.isArray(bundle.cases))continue;
      check(bundle.schemaVersion===1&&bundle.eventId===event.name,'bundle version/event directory mismatch '+filename);
      check(bundle.batchId&&bundle.checkedAt,'batch identity and check date required '+filename);
      bundle.cases=bundle.cases.map(item=>{
        if(!item.extendsEditorialId)return item;
        const original=editorials.get(bundle.eventId+'|'+item.extendsEditorialId);check(original,'missing inherited editorial '+item.extendsEditorialId);
        check(!item.id||item.id===original.id,'inherited case changes ID');check(!item.organizationId||item.organizationId===original.organizationId,'inherited case changes organization');
        return {...original,...item,id:original.id,organizationId:original.organizationId};
      });
      bundles.push(bundle);
    }
  }
  return bundles;
}

/** Merge explicit replacements by stable case ID; a new case must not shadow another company case. */
export function researchEditorialBundles(editorialBundles,researchBundles){
  const byEvent=new Map();
  for(const bundle of [...editorialBundles,...researchBundles]){
    if(!byEvent.has(bundle.eventId))byEvent.set(bundle.eventId,new Map());
    const cases=byEvent.get(bundle.eventId);
    for(const item of list(bundle.cases||bundle.editorials)){
      if(!item.reason||!item.exhibit)continue; // Classification-only rows remain in the canonical ledger.
      const previous=cases.get(item.id);
      check(!previous||previous.organizationId===item.organizationId,'case ID changes organization '+item.id);
      const other=[...cases.values()].find(c=>c.organizationId===item.organizationId&&c.id!==item.id);
      check(!other,'multiple editorial case IDs for one organization '+item.organizationId);
      cases.set(item.id,item);
    }
  }
  return [...byEvent].map(([eventId,cases])=>({eventId,cases:[...cases.values()]}));
}

/** Reviewed source facts enrich stable identities. No geometry is created here. */
export function applyResearch({out,maps,put,addSource,participation,assertion,booth,occupy,hash,append},bundles){
  // Shared pavilion photographs may identify products belonging to more than one reviewed company.
  const declaredProducts=new Map();
  for(const bundle of bundles){if(!declaredProducts.has(bundle.eventId))declaredProducts.set(bundle.eventId,new Set());for(const item of list(bundle.cases))for(const product of list(item.exhibit?.items))declaredProducts.get(bundle.eventId).add(product.productId||product.id);}
  for(const bundle of bundles){
    const event=maps.events.get(bundle.eventId);check(event,'unknown event '+bundle.eventId);
    for(const item of list(bundle.cases)){
      const organization=maps.organizations.get(item.organizationId);
      check(organization,'unknown organization '+item.organizationId);
      const p=out.participations.find(row=>row.eventId===bundle.eventId&&row.organizationId===item.organizationId);
      check(p,'organization not in event '+item.organizationId);
      const review=item.review;check(review,'explicit review missing '+item.id);
      check(['confirmed','pending','excluded'].includes(review.relevance),'invalid relevance '+item.id);
      check(['analysis_complete','insufficient_data','not_started'].includes(review.status),'invalid review status '+item.id);
      check(review.reason&&review.reviewedAt,'review reason/date required '+item.id);
      check(!(p.researchReview&&p.researchReview.batchId!==bundle.batchId),'duplicate research review for organization '+item.organizationId);
      const sourceLookup=new Map();
      for(const source of [...list(bundle.sources),...list(item.sources)]){
        check(source.id&&source.url,'source id/url required '+item.id);
        const sid=addSource(source.url,source);check(sid,'invalid source URL '+source.id);
        check(!sourceLookup.has(source.id)||sourceLookup.get(source.id)===sid,'source ID collision '+source.id);
        sourceLookup.set(source.id,sid);
        const record=maps.sources.get(sid);
        for(const key of ['title','publisher','role','edition','editionStatus','accessStatus','coverageScope'])if(source[key]!==undefined)record[key]=source[key];
        if(source.date||source.publishedAt)record.publishedAt=source.publishedAt||source.date;
        if(source.originGroup)record.lineage={originGroup:source.originGroup,independence:source.independence||'not_assessed'};
        if(source.limitations)record.notes=source.limitations;
        if(source.checkedAt&&!record.acquiredAt)record.acquiredAt=source.checkedAt;
      }
      const evidence=(ids,label)=>unique(list(ids).map(id=>{
        const sid=sourceLookup.get(id)||(maps.sources.has(id)?id:null);
        check(sid,'unknown source '+id+' for '+label);return sid;
      }));
      const reviewedSourceIds=evidence(review.sourceIds,item.id);check(reviewedSourceIds.length,'review evidence missing '+item.id);
      append(p.sourceIds,reviewedSourceIds);append(organization.sourceIds,reviewedSourceIds);
      p.relevance={status:review.relevance,reason:review.reason,categories:list(review.categories||item.categoryIds),evidenceIds:[assertion('participations',p.id,'interpretation','vehicle_system_relevance',review.reason,reviewedSourceIds,{reviewState:'reviewed',independentVerification:'not_assessed'})]};
      p.researchStatus=review.status;
      p.researchReview={batchId:bundle.batchId,caseId:item.id,reviewedAt:review.reviewedAt,reason:review.reason,sourceIds:reviewedSourceIds};
      if(review.attendanceStatus){
        check(['planned','onsite_confirmed','unverified'].includes(review.attendanceStatus),'invalid explicit attendance state '+item.id);
        const attendanceSources=evidence(review.attendanceSourceIds,item.id+' attendance');check(attendanceSources.length,'explicit attendance needs evidence '+item.id);
        p.attendanceStatus=review.attendanceStatus;
        if(review.attendanceStatus==='onsite_confirmed')assertion('participations',p.id,'observation','onsite_attendance',review.attendanceNote||'해당 업체의 현장 참가 근거 확인',attendanceSources,{reviewState:'reviewed',independentVerification:'not_assessed'});
      }
      if(list(item.countries).length){
        const countrySources=evidence(item.countrySourceIds,item.id+' country');check(countrySources.length,'country requires source '+item.id);
        append(organization.countryNames,item.countries);append(organization.sourceIds,countrySources);
        assertion('organizations',organization.id,'fact','country',item.countries.join(' / '),countrySources,{reviewState:'reviewed'});
      }
      for(const claim of list(item.boothClaims)){
        check(!claim.geometry&&!claim.coordinates,'booth claim cannot create geometry '+item.id);
        check(['confirmed','unverified'].includes(claim.status),'invalid booth claim state '+item.id);
        const sourceIds=evidence(claim.sourceIds,item.id+' booth');check(sourceIds.length,'booth source missing '+item.id);
        if(!claim.code){check(claim.status==='unverified','confirmed booth number cannot be empty '+item.id);if(claim.hall)assertion('participations',p.id,'fact','listed_hall',claim.hall,sourceIds,{reviewState:'reviewed',qualifier:claim.note||null});continue;}
        // A previously recorded conflict needs its dedicated correction workflow, not a new overlay number.
        const conflicting=out.boothOccupancies.filter(o=>o.participationId===p.id).map(o=>maps.booths.get(o.boothId)).find(b=>b.numberVerification?.status==='conflicting_sources');
        check(!conflicting||claim.status!=='confirmed','unresolved booth-number conflict '+item.id);
        const b=booth(bundle.eventId,claim.code,{hall:claim.hall||null,sourceIds,numberStatus:claim.status});occupy(p,b,sourceIds);
        if(claim.status==='confirmed')assertion('booths',b.id,'fact','booth_number',claim.code,sourceIds,{reviewState:'reviewed',qualifier:claim.note||null});
      }
      const productIds=[],exhibitIds=[];
      for(const entry of list(item.exhibit?.items)){
        const productId=entry.productId||entry.id;check(productId&&entry.name,'product id/name missing '+item.id);
        const sourceIds=evidence(entry.sourceIds,productId);check(sourceIds.length,'product evidence missing '+productId);
        check(['event_photo_confirmed','onsite_report_confirmed','event_report_confirmed','exhibitor_event_photo_confirmed','exhibitor_event_statement','background_reference'].includes(entry.status),'unknown exhibit proof '+productId);
        const existing=maps.products.get(productId);check(!existing||existing.organizationIds.includes(organization.id),'product organization mismatch '+productId);
        const product=put('products',{id:productId,name:entry.name,alternativeNames:[],organizationIds:[organization.id],category:entry.category||null,legacyRefs:[],sourceIds:[]});
        append(product.sourceIds,sourceIds);append(product.alternativeNames,[entry.name]);append(productIds,[productId]);
        product.researchScope=entry.status==='background_reference'?'background':'event';
        if(entry.status==='background_reference')continue;
        for(const sid of sourceIds){const source=maps.sources.get(sid);check(source.editionStatus!=='mismatch'&&(source.edition==null||Number(source.edition)===event.year),'wrong-edition exhibit source '+productId);}
        const onsite=['event_photo_confirmed','onsite_report_confirmed','event_report_confirmed','exhibitor_event_photo_confirmed'].includes(entry.status);
        const exhibit=put('exhibits',{id:'exhibit-'+hash(bundle.eventId+'|'+productId),eventId:bundle.eventId,productId,participationIds:[],sourceIds:[],status:'planned',legacyStatuses:[]});
        append(exhibit.participationIds,[p.id]);append(exhibit.sourceIds,sourceIds);append(exhibitIds,[exhibit.id]);
        exhibit.status=onsite?'onsite_confirmed':'planned';exhibit.evidenceStatus=entry.status;exhibit.form=entry.form||null;
        assertion('exhibits',exhibit.id,'fact',onsite?'actual_exhibit':'exhibitor_event_statement',entry.name,sourceIds,{reviewState:'reviewed',qualifier:entry.form||null,independentVerification:'not_assessed'});
      }
      const analysisId='research-analysis-'+hash(bundle.eventId+'|'+organization.id);
      if(item.reason&&item.exhibit){
        check(item.distinction&&item.direction&&item.workConnection&&list(item.highlights).length===3&&list(item.followUps).length>=2&&list(item.followUps).length<=3,'analysis structure incomplete '+item.id);
        const a=put('analyses',{id:analysisId,title:item.displayName||organization.name,summary:item.reason,eventId:bundle.eventId,organizationIds:[organization.id],productIds,exhibitIds,assertionIds:[],companySpecificJudgment:item.reason,workConnection:item.workConnection.value||null,evidenceReviewState:'reviewed',completionStatus:review.status==='analysis_complete'?'complete':'not_complete',researchReview:p.researchReview,interpretationNote:item.interpretationNote||item.verificationNote||null});
        for(const [predicate,kind,text,ids] of [
          ['company_judgment','interpretation',item.reason,review.sourceIds],
          ['exhibition_characteristics','observation',item.exhibit.summary,item.exhibit.sourceIds||review.sourceIds],
          ['distinction','interpretation',item.distinction.judgment,item.distinction.sourceIds||review.sourceIds],
          ['strategy_interpretation','interpretation',item.direction.interpretation,item.direction.sourceIds||review.sourceIds],
          ['work_connection','interpretation',item.workConnection.value,item.workConnection.sourceIds||review.sourceIds],
          ['follow_up','observation',list(item.followUps).join('\n'),review.sourceIds]
        ])if(text)a.assertionIds.push(assertion('analyses',analysisId,kind,predicate,text,evidence(ids,item.id),{reviewState:'reviewed',independentVerification:'not_assessed'}));
        if(review.status==='analysis_complete'){check(exhibitIds.some(id=>maps.exhibits.get(id).status==='onsite_confirmed'),'complete analysis requires actual event exhibit '+item.id);p.deepAnalysisStatus='complete';}
      }else check(review.status!=='analysis_complete','complete analysis requires six-part editorial '+item.id);
      for(const photo of list(item.photos)){
        check(photo.id&&photo.sourceUrl&&photo.credit,'photo id/original/credit required '+item.id);
        check(photo.context!=='event'||photo.eventId===bundle.eventId,'photo edition mismatch '+photo.id);
        const photoSource=addSource(photo.sourceUrl,{role:'research_photo',publisher:photo.credit});
        const sourceIds=unique([...evidence(photo.sourceIds,photo.id),photoSource]);
        const linkedProductIds=unique([photo.productId,...list(photo.productIds)]);
        for(const pid of linkedProductIds)check(declaredProducts.get(bundle.eventId).has(pid),'photo product outside reviewed event '+photo.id);
        const originalImageUrl=photo.originalImageUrl||photo.assetUrl||photo.imageUrl||photo.embedImageUrl||null;
        const sameAsset=out.photos.find(other=>(photo.src&&photo.src===other.localPath)||(originalImageUrl&&originalImageUrl===(other.originalImageUrl||other.imageUrl)));
        const existingId=maps.photos.get(photo.id);check(!existingId||!sameAsset||existingId.id===sameAsset.id,'photo ID and image asset identify different records '+photo.id);
        const reviewedPhoto={id:sameAsset?.id||photo.id,caption:photo.caption||'',sourceUrl:photo.sourceUrl,localPath:photo.src||null,imageUrl:photo.embedImageUrl||photo.imageUrl||null,originalImageUrl,productIds:linkedProductIds,sourceIds:[],sha256:photo.sha256||null,width:photo.width||null,height:photo.height||null,credit:photo.credit,rights:photo.rights||{status:photo.rightsStatus||'link-only',license:photo.license||null,licenseUrl:photo.licenseUrl||null,basis:photo.rightsBasis||photo.rightsNote||null},context:photo.context||'reference',variantNote:photo.variantNote||null,sourceDate:photo.sourceDate||photo.date||null,verificationStatus:'reviewed',legacyIds:[]};
        const ph=put('photos',reviewedPhoto),previousSources=ph.sourceIds,previousLegacyIds=ph.legacyIds,previousProducts=list(ph.productIds);
        Object.assign(ph,reviewedPhoto,{sourceIds:previousSources,legacyIds:previousLegacyIds,productIds:unique([...previousProducts,...linkedProductIds])});append(ph.sourceIds,sourceIds);append(ph.legacyIds,[photo.id]);
        // Keep a direct company link even when the photo shows a whole booth rather than one product.
        const ownPhotoProducts=linkedProductIds.filter(pid=>productIds.includes(pid));
        for(const pid of ownPhotoProducts.length?ownPhotoProducts:[null])put('photoLinks',{id:'photo-link-'+hash(ph.id+'|'+bundle.eventId+'|'+organization.id+'|'+(pid||'')),photoId:ph.id,eventId:bundle.eventId,productId:pid,exhibitId:pid&&exhibitIds.find(id=>maps.exhibits.get(id).productId===pid)||null,organizationId:organization.id,context:photo.context||'reference'});
      }
    }
  }
}
