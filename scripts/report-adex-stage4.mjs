import {readFile,writeFile} from 'node:fs/promises';
import {readResearchBundles} from './research-v2.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async p=>JSON.parse(await readFile(path.join(root,p),'utf8'));
const baseline=await read('docs/evidence/EXECUTIVE_V2_STAGE_4_BASELINE.json');
const registry=await read('data/v2/registry.json');
const app=await read('data/v2/app/events/adex-2025.json');
const collection=await read('data/v2/collection/adex-2025.json');
const bundles=(await readResearchBundles(root)).filter(b=>b.eventId==='adex-2025');
const allCases=bundles.flatMap(b=>b.cases);
const unique=xs=>[...new Set(xs)];
const asset=p=>p.originalImageUrl||p.imageUrl||p.localPath||p.src||p.id;
const basePhotos=new Set(baseline.photos.map(p=>p.asset));
const newPhotos=app.photos.filter(p=>p.context==='event'&&!basePhotos.has(asset(p))&&!baseline.photos.some(b=>b.id===p.id));
const items=allCases.flatMap(c=>c.exhibit?.items||[]);
const itemCounts=items.reduce((a,p)=>(a[p.status]=(a[p.status]||0)+1,a),{});
const photoAssets=unique(newPhotos.map(asset));
const result={schemaVersion:1,eventId:'adex-2025',asOf:'2026-11-12',baselineCommit:baseline.commit,
  aggregationScope:'Stage 4 cumulative changes since stage-3 baseline; individual batch deltas recorded separately',
  batch:{newlyReviewedCompanies:allCases.filter(c=>!baseline.editorialCompanyIds.includes(c.organizationId)).length,reconciledExistingCompanies:allCases.filter(c=>baseline.editorialCompanyIds.includes(c.organizationId)).length,newCandidateNames:app.companies.filter(c=>!baseline.companyIds.includes(c.id)).length,
    reviewedProductAndServiceRecords:items.length,eventProductAndServiceRecords:items.filter(p=>p.status!=='background_reference').length,backgroundOnlyRecords:items.filter(p=>p.status==='background_reference').length,
    newProductAndServiceIds:app.products.filter(p=>!baseline.products.some(b=>b.id===p.id)).length,retiredGroupedProductIds:baseline.products.filter(p=>!app.products.some(a=>a.id===p.id)).map(p=>p.id),itemEvidenceCounts:itemCounts,
    uniqueNewOnsitePhotoAssets:photoAssets.length,newOnsitePhotoDisplayable:unique(newPhotos.filter(p=>p.src).map(asset)).length,newOnsitePhotoLinkOnly:unique(newPhotos.filter(p=>!p.src).map(asset)).length,
    reviewedTranscriptionRows:(await read('data/v2/research/adex-2025/population.json')).transcriptionReview.records.length,remainingDenseTranscriptionRows:collection.entries.filter(e=>e.transcriptionStatus==='needs_review').length},
  cumulative:{...registry.metrics.find(m=>m.eventId==='adex-2025'),appCompanyNames:app.companies.length,editorialCompanies:app.editorials.length,appProductAndServiceRecords:app.products.length,appPhotoRecords:app.photos.length,eventContextPhotoRecords:app.photos.filter(p=>p.context==='event').length,verifiedMapRegions:app.mapGeometries.length},
  reviewedCompanies:allCases.map(c=>({id:c.organizationId,name:c.displayName,status:c.review.status,relevance:c.review.relevance,productAndServiceRecords:c.exhibit?.items?.length||0})),
  limitations:['Company candidate names are not a verified full legal-company population.','Analysis complete means source-bounded editorial review, not all product models/performance independently tested.','Product count includes service displays and identified product families; no model count invented for unnamed variants.','Full official 2025 directory and outdoor population remain missing; no completion percentage.','New photo count deduplicates original image assets across company links; no new copied image assets.'],
  nextStart:['Hall 8 / scanned label 024 / SANJU OPTICAL, then remaining 112 dense labels.','Remaining DAPA constituents beyond the six batch-2 additions; 브로던 country/identity and onsite evidence remain open.','Finland pavilion other companies and USA pavilion full 37-name subset; Patria event announcement already registered.'],stageComplete:false};
await writeFile(path.join(root,'docs/evidence/EXECUTIVE_V2_STAGE_4_METRICS.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({batch:result.batch,cumulative:result.cumulative},null,2));
