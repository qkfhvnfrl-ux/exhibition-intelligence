import {readFile,writeFile} from 'node:fs/promises';
const d=JSON.parse(await readFile(new URL('../data/v2/app/events/adex-2025.json',import.meta.url),'utf8'));
const keep=(obj,keys)=>Object.fromEntries(keys.filter(k=>obj[k]!==undefined).map(k=>[k,obj[k]]));
const sampleNames=['현대로템','현대위아','기아'];
const samples=d.companies.filter(c=>sampleNames.includes(c.displayName));
const sampleIds=new Set(samples.map(c=>c.id));
const samplePhotoIds=new Set(samples.flatMap(c=>c.photoIds));
const photoMap={
 'k2pl':'photo-f27315794918d9b8ddce',
 'rcws':'photo-406026b01ffa0009623a',
 'light-105':'photo-f07b18031de173091dff',
 'tasman-military':'photo-88508f17c41d264626d0',
 'kmtv':'photo-c9b10caa412b9d19d1ef'
};
const photos=d.photos.filter(p=>samplePhotoIds.has(p.id)&&p.context==='event'&&p.src).map(p=>keep(p,['id','caption','src','sourceUrl','credit','rights','context','variantNote','sourceDate','width','height']));
const result={
 kind:'local-review-draft',asOf:'2026-11-15',sourceDataAsOf:d.dataAsOf,event:d.event,
 companies:d.companies.map(c=>keep(c,['id','name','displayName','aliases','countries','boothIds','mapBoothIds','productIds'])),
 products:d.products.map(p=>keep(p,['id','name','organizationIds','category','form','exhibitStatus','sourceIds'])),
 photos,
 sampleIds:[...sampleIds],
 photoMap,
 photoMappingBasis:'Review-only explicit association using existing event photo captions and variant notes; production photo.productIds remains unchanged. No new independent source verification claimed.',
 editorials:d.editorials.filter(e=>sampleIds.has(e.organizationId)).map(e=>keep(e,['id','organizationId','displayName','reason','highlights','exhibit','distinction','direction','verificationNote','sourceIds'])),
 sources:d.sources.map(s=>keep(s,['id','title','url','publisher','publishedAt','type'])),
 booths:d.booths,mapDocuments:d.mapDocuments,mapGeometries:d.mapGeometries,boothOccupancies:d.boothOccupancies
};
const json=JSON.stringify(result,null,2)+'\n';
for(const forbidden of ['workConnection','relevanceNote','당사','우리 회사','업무 연결성','체계개발 검토'])if(json.includes(forbidden))throw new Error(`Public review data contains forbidden content: ${forbidden}`);
await writeFile(new URL('./data.json',import.meta.url),json);
console.log(`Review data: ${result.companies.length} organization labels, ${photos.length} event photos, ${result.mapGeometries.length} verified regions; explicit public-field allowlist.`);
