import {mkdir,rm,cp,readFile,writeFile} from 'node:fs/promises';
await import('./compile-data.mjs');
await import('./compile-event-data.mjs');
const {compileV2}=await import('./compile-v2-data.mjs');
const {compileApp}=await import('./compile-v2-app.mjs');
await compileV2();await compileApp();
await rm('dist',{recursive:true,force:true});await mkdir('dist/src',{recursive:true});
// Explicit runtime allowlist. Historical editing/storage modules remain in Git only.
await cp('index.html','dist/index.html');
await cp('src/v2','dist/src/v2',{recursive:true});
await cp('assets','dist/assets',{recursive:true});
await mkdir('dist/data/v2',{recursive:true});
await cp('data/v2/app','dist/data/v2/app',{recursive:true});
await writeFile('dist/.nojekyll','');
const pkg=JSON.parse(await readFile('package.json','utf8'));
await writeFile('dist/version.json',JSON.stringify({version:pkg.version,build:new Date().toISOString()},null,2));
console.log(`Built FIELDNOTE ${pkg.version}. No deployment performed.`);
