import {cp,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assemblePagesPreview} from './assemble-pages-preview.mjs';

/** Publish one stable build at both addresses; never use a development checkout. */
export async function assemblePagesRelease({buildDir,outputDir,version,commit,runId}){
  if(typeof version!=='string'||!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version))throw new Error('Official Pages deployment requires a stable x.y.z version without prerelease suffixes');
  if(typeof commit!=='string'||!/^[0-9a-f]{40}$/.test(commit))throw new Error('A full source commit SHA is required');
  if(typeof runId!=='string'||!/^[1-9]\d*$/.test(runId))throw new Error('A GitHub Actions run ID is required');
  if(!buildDir||!outputDir)throw new Error('buildDir and outputDir are required');
  const build=JSON.parse(await readFile(path.join(buildDir,'version.json'),'utf8'));
  if(build.version!==version)throw new Error(`Build version ${build.version} does not match package version ${version}`);
  const manifest={version,releaseTag:`v${version}`,productionCommit:commit,previewCommit:commit,runId};
  const temporaryParent=path.resolve(os.tmpdir());
  const temporaryRoot=await mkdtemp(path.join(temporaryParent,'fieldnote-release-'));
  try{
    const compatibleBuild=path.join(temporaryRoot,'compatible-build');
    await cp(buildDir,compatibleBuild,{recursive:true,errorOnExist:true,force:false,preserveTimestamps:true});
    const result=await assemblePagesPreview({productionDir:buildDir,previewDir:compatibleBuild,outputDir});
    const content=JSON.stringify(manifest,null,2)+'\n';
    await writeFile(path.join(outputDir,'deployment.json'),content);
    await writeFile(path.join(outputDir,'preview','deployment.json'),content);
    return {...manifest,outputDir:result.outputDir,productionFiles:result.productionFiles,previewFiles:result.previewFiles};
  }finally{
    const resolved=path.resolve(temporaryRoot);
    if(path.dirname(resolved)!==temporaryParent||!path.basename(resolved).startsWith('fieldnote-release-'))throw new Error('Temporary release directory is outside its expected parent');
    await rm(resolved,{recursive:true,force:true});
  }
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2);
    if(args.length!==4)throw new Error('Usage: node scripts/assemble-pages-release.mjs <dist> <new-output-directory> <commit-sha> <run-id>');
    const [buildDir,outputDir,commit,runId]=args;
    const {version}=JSON.parse(await readFile('package.json','utf8'));
    console.log(JSON.stringify(await assemblePagesRelease({buildDir,outputDir,version,commit,runId})));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
