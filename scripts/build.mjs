import {mkdir,rm,cp,readFile,writeFile} from 'node:fs/promises';
await import('./compile-data.mjs');
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const p of ['index.html','src','assets'])await cp(p,`dist/${p}`,{recursive:true});
await mkdir('dist/data',{recursive:true});await cp('data/catalog.json','dist/data/catalog.json');
await writeFile('dist/.nojekyll','');
const pkg=JSON.parse(await readFile('package.json','utf8'));
await writeFile('dist/version.json',JSON.stringify({version:pkg.version,build:new Date().toISOString()},null,2));
console.log(`Built v${pkg.version}. No deployment performed.`);
