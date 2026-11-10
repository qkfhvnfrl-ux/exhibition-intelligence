import {readFile,readdir,writeFile} from 'node:fs/promises';
const equipment=[];
for(const file of (await readdir('data/research')).filter(x=>x.endsWith('.json')).sort()){
 const rows=JSON.parse(await readFile(`data/research/${file}`,'utf8'));
 if(!Array.isArray(rows))throw new Error(`${file} must be an array`);
 equipment.push(...rows);
}
const exhibitions=JSON.parse(await readFile('data/exhibitions.json','utf8'));
let photos=[];try{photos=JSON.parse(await readFile('data/photos.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const criteria=JSON.parse(await readFile('data/criteria.json','utf8'));
const pkg=JSON.parse(await readFile('package.json','utf8'));
const catalog={version:pkg.version,updatedAt:'2026-11-10',exhibitions,equipment,photos,criteria};
await writeFile('data/catalog.json',JSON.stringify(catalog,null,2)+'\n');
console.log(`Catalog: ${equipment.length} equipment, ${photos.length} photographs, ${exhibitions.length} exhibitions.`);
const review=JSON.parse(await readFile('data/review.json','utf8'));
const reviewPhotos=JSON.parse(await readFile('data/review-photos.json','utf8'));
review.photoObservations=JSON.parse(await readFile('data/review-photo-observations.json','utf8'));
for(const item of review.cases){
 item.photoIds=reviewPhotos.filter(p=>p.equipmentId===item.id).map(p=>p.id);
 item.heroPhotoId=item.photoIds[0]||null;
}
await writeFile('data/review.json',JSON.stringify(review,null,2)+'\n');
console.log(`Review bundle: ${review.cases.length} cases, ${reviewPhotos.length} photographs, ${review.photoObservations.length} visual observations.`);
