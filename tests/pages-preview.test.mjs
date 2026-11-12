import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {assemblePagesPreview} from '../scripts/assemble-pages-preview.mjs';

async function fixture(t){
  const root=await mkdtemp(path.join(os.tmpdir(),'fieldnote-pages-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const productionDir=path.join(root,'production'),previewDir=path.join(root,'work'),outputDir=path.join(root,'publish');
  for(const dir of [productionDir,previewDir])await mkdir(path.join(dir,'assets'),{recursive:true});
  await writeFile(path.join(productionDir,'index.html'),Buffer.from('<html>published v1.1\r\n</html>'));
  await writeFile(path.join(productionDir,'assets','same-name.bin'),Buffer.from([0,255,1,128]));
  await writeFile(path.join(productionDir,'.nojekyll'),'');
  await writeFile(path.join(previewDir,'index.html'),'<html>work in progress</html>');
  await writeFile(path.join(previewDir,'assets','same-name.bin'),Buffer.from([9,8,7]));
  return {productionDir,previewDir,outputDir};
}

test('Pages composition preserves production bytes and isolates the preview subtree',async t=>{
  const dirs=await fixture(t);
  const result=await assemblePagesPreview(dirs);
  for(const file of ['index.html','assets/same-name.bin','.nojekyll'])assert.deepEqual(await readFile(path.join(dirs.outputDir,file)),await readFile(path.join(dirs.productionDir,file)));
  for(const file of ['index.html','assets/same-name.bin'])assert.deepEqual(await readFile(path.join(dirs.outputDir,'preview',file)),await readFile(path.join(dirs.previewDir,file)));
  assert.deepEqual((await readdir(dirs.productionDir)).sort(),['.nojekyll','assets','index.html']);
  assert.equal(result.productionFiles,3);assert.equal(result.previewFiles,2);
});

test('Pages composition rejects a reserved production preview path without touching sources',async t=>{
  const dirs=await fixture(t);
  await writeFile(path.join(dirs.productionDir,'preview'),'existing production content');
  await assert.rejects(assemblePagesPreview(dirs),/reserved preview path/);
  assert.equal(await readFile(path.join(dirs.productionDir,'preview'),'utf8'),'existing production content');
  await assert.rejects(readdir(dirs.outputDir),{code:'ENOENT'});
});

test('Pages composition refuses source overwrite, nested output and existing output',async t=>{
  const dirs=await fixture(t);
  for(const outputDir of [dirs.productionDir,dirs.previewDir,path.join(dirs.productionDir,'publish'),path.dirname(dirs.productionDir)])await assert.rejects(assemblePagesPreview({...dirs,outputDir}),/overlap/);
  await mkdir(dirs.outputDir);await writeFile(path.join(dirs.outputDir,'keep'),'keep');
  await assert.rejects(assemblePagesPreview(dirs),/Output already exists/);
  assert.equal(await readFile(path.join(dirs.outputDir,'keep'),'utf8'),'keep');
});

test('Pages composition rejects symlink assets and source aliases',async t=>{
  const dirs=await fixture(t);
  await symlink(path.join(dirs.productionDir,'index.html'),path.join(dirs.previewDir,'assets','linked.html'));
  await assert.rejects(assemblePagesPreview(dirs),/Symlinks are not allowed/);
  const alias=path.join(path.dirname(dirs.productionDir),'alias');await symlink(dirs.productionDir,alias);
  await assert.rejects(assemblePagesPreview({...dirs,productionDir:alias}),/Symlinks are not allowed/);
  await assert.rejects(readdir(dirs.outputDir),{code:'ENOENT'});
});

test('Pages composition requires an index for each source before creating output',async t=>{
  const dirs=await fixture(t);await rm(path.join(dirs.previewDir,'index.html'));
  await assert.rejects(assemblePagesPreview(dirs),/requires a regular index.html/);
  await assert.rejects(readdir(dirs.outputDir),{code:'ENOENT'});
});
