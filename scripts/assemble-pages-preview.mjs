import {cp,lstat,mkdir,readdir,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const inside=(candidate,parent)=>candidate===parent||candidate.startsWith(parent+path.sep);
const exists=async file=>lstat(file).then(()=>true).catch(error=>{
  if(error.code==='ENOENT')return false;
  throw error;
});

async function rejectSymlinkPath(file){
  const absolute=path.resolve(file);
  let current=path.parse(absolute).root;
  for(const part of absolute.slice(current.length).split(path.sep).filter(Boolean)){
    current=path.join(current,part);
    let info;
    try{info=await lstat(current);}catch(error){
      if(error.code==='ENOENT')return;
      throw error;
    }
    if(info.isSymbolicLink())throw new Error(`Symlinks are not allowed: ${current}`);
  }
}

async function inspectTree(directory){
  let files=0;
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const file=path.join(directory,entry.name);
    if(entry.isSymbolicLink())throw new Error(`Symlinks are not allowed: ${file}`);
    if(entry.isDirectory())files+=await inspectTree(file);
    else if(entry.isFile())files++;
    else throw new Error(`Only regular files and directories are allowed: ${file}`);
  }
  return files;
}

/** Compose already validated builds. Never rebuild, modify, or delete either source. */
export async function assemblePagesPreview({productionDir,previewDir,outputDir}){
  if(!productionDir||!previewDir||!outputDir)throw new Error('productionDir, previewDir and outputDir are required');
  const paths=[productionDir,previewDir,outputDir].map(file=>path.resolve(file));
  for(const file of paths)await rejectSymlinkPath(file);
  const [production,preview]=await Promise.all(paths.slice(0,2).map(file=>realpath(file)));
  const output=paths[2];
  if(inside(production,preview)||inside(preview,production))throw new Error('Source directories must be separate and non-overlapping');
  for(const source of [production,preview]){
    if(inside(output,source)||inside(source,output))throw new Error('Output must not overlap a source directory');
    if(!(await lstat(source)).isDirectory())throw new Error(`Source is not a directory: ${source}`);
    const index=path.join(source,'index.html');
    if(!await exists(index)||!(await lstat(index)).isFile())throw new Error(`Source requires a regular index.html: ${source}`);
  }
  if(await exists(path.join(production,'preview')))throw new Error('Production already contains reserved preview path');
  if(await exists(output))throw new Error('Output already exists; use a new publish directory');
  const [productionFiles,previewFiles]=await Promise.all([inspectTree(production),inspectTree(preview)]);
  await mkdir(path.dirname(output),{recursive:true});
  await cp(production,output,{recursive:true,errorOnExist:true,force:false,preserveTimestamps:true});
  await cp(preview,path.join(output,'preview'),{recursive:true,errorOnExist:true,force:false,preserveTimestamps:true});
  return {productionDir:production,previewDir:preview,outputDir:output,productionFiles,previewFiles};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2),options={};
    const keys={'--production':'productionDir','--preview':'previewDir','--output':'outputDir'};
    if(args.length===3&&args.every(arg=>!arg.startsWith('--'))){
      [options.productionDir,options.previewDir,options.outputDir]=args;
    }else{
      for(let i=0;i<args.length;i+=2){
        const key=keys[args[i]];
        if(!key||!args[i+1]||args[i+1].startsWith('--')||options[key])throw new Error('Usage: node scripts/assemble-pages-preview.mjs <production-dist> <preview-dist> <new-output-directory>');
        options[key]=args[i+1];
      }
    }
    console.log(JSON.stringify(await assemblePagesPreview(options)));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
