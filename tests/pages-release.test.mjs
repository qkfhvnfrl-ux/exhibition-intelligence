import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {assemblePagesRelease} from '../scripts/assemble-pages-release.mjs';

async function fixture(t){
  const root=await mkdtemp(path.join(os.tmpdir(),'fieldnote-release-test-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const buildDir=path.join(root,'dist'),outputDir=path.join(root,'publish');
  await mkdir(path.join(buildDir,'assets'),{recursive:true});
  await mkdir(path.join(buildDir,'data/v2/app/events'),{recursive:true});
  await writeFile(path.join(buildDir,'index.html'),'<script type="module" src="src/v2/app.js"></script>');
  await writeFile(path.join(buildDir,'assets/photo.bin'),Buffer.from([0,255,128,13,10]));
  await writeFile(path.join(buildDir,'data/v2/app/events/adex-2025.json'),'{"event":"adex-2025"}\n');
  await writeFile(path.join(buildDir,'version.json'),'{"version":"2.0.0","build":"fixed-time"}\n');
  await writeFile(path.join(buildDir,'.nojekyll'),'');
  return {buildDir,outputDir,version:'2.0.0',commit:'a'.repeat(40),runId:'12345'};
}

test('official deployment preserves build bytes at root and old preview deep-link address with identical manifests',async t=>{
  const options=await fixture(t),result=await assemblePagesRelease(options);
  for(const file of ['index.html','assets/photo.bin','data/v2/app/events/adex-2025.json','version.json','.nojekyll']){
    const original=await readFile(path.join(options.buildDir,file));
    assert.deepEqual(await readFile(path.join(options.outputDir,file)),original);
    assert.deepEqual(await readFile(path.join(options.outputDir,'preview',file)),original);
  }
  const rootManifest=await readFile(path.join(options.outputDir,'deployment.json'));
  assert.deepEqual(await readFile(path.join(options.outputDir,'preview/deployment.json')),rootManifest);
  assert.deepEqual(JSON.parse(rootManifest),{version:'2.0.0',releaseTag:'v2.0.0',productionCommit:options.commit,previewCommit:options.commit,runId:'12345'});
  assert.equal(result.productionFiles,result.previewFiles);
  await assert.rejects(readFile(path.join(options.buildDir,'deployment.json')),{code:'ENOENT'});
});

test('official deployment rejects prerelease or mismatched build versions before publishing',async t=>{
  const options=await fixture(t);
  for(const version of ['2.0.0-stage.4','2.0.0-preview.1','2.0','02.0.0','v2.0.0'])await assert.rejects(assemblePagesRelease({...options,version}),/stable x.y.z/);
  await assert.rejects(assemblePagesRelease({...options,version:'2.0.1'}),/does not match/);
  await assert.rejects(readdir(options.outputDir),{code:'ENOENT'});
});

test('official deployment requires traceable source and run metadata and refuses overwrite',async t=>{
  const options=await fixture(t);
  await assert.rejects(assemblePagesRelease({...options,commit:'main'}),/commit SHA/);
  await assert.rejects(assemblePagesRelease({...options,runId:''}),/run ID/);
  await mkdir(options.outputDir);
  await writeFile(path.join(options.outputDir,'keep'),'previous output');
  await assert.rejects(assemblePagesRelease(options),/Output already exists/);
  assert.equal(await readFile(path.join(options.outputDir,'keep'),'utf8'),'previous output');
});
