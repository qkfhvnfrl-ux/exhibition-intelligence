import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const args=process.argv.slice(2), arg=(name,fallback)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
const root=path.resolve(arg('--root',process.cwd())), port=Number(arg('--port',process.env.PORT||3000)), host=arg('--host','0.0.0.0');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'};
http.createServer(async(req,res)=>{
 try{
  let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(p.split('/').some(x=>x.startsWith('.')||['node_modules','docs','scripts','tests'].includes(x))){res.writeHead(403);return res.end('Forbidden');}
  let file=path.resolve(root,'.'+p);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end('Forbidden');}
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,host,()=>console.log(`Exhibition Intelligence on http://${host}:${port}`));
