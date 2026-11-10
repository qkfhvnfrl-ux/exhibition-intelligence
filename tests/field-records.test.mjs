import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {normalizeFieldMeta,imageMimeFromBytes,validateFieldBackup,decodeFieldBackup,prepareFieldImagesForPrint,FIELD_LIMITS} from '../src/field-records.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const meta={event:'서울 ADEX',year:'2025',manufacturer:'공개 업체',product:'공개 제품',topic:'외관',note:'사진 관찰',source:'https://example.com/photo'};
const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlS8AAAAASUVORK5CYII=','base64');
const photo=()=>({id:createHash('sha256').update(bytes).digest('hex'),name:'sample.png',type:'image/png',size:bytes.length,createdAt:'2026-11-11T00:00:00Z',...meta,dataUrl:`data:image/png;base64,${bytes.toString('base64')}`});
const backup=(records=[photo()])=>({application:'fieldnote-photos',schemaVersion:1,records});

test('field photo classification requires event/year/company/product/topic and valid links',()=>{
 assert.equal(normalizeFieldMeta(meta).year,'2025');
 for(const key of ['event','manufacturer','product','topic'])assert.throws(()=>normalizeFieldMeta({...meta,[key]:''}));
 for(const year of ['25','202x','1899','2101',''])assert.throws(()=>normalizeFieldMeta({...meta,year}));
 assert.throws(()=>normalizeFieldMeta({...meta,source:'javascript:alert(1)'}));
 assert.equal(normalizeFieldMeta({...meta,note:'a'.repeat(5000)}).note.length,4000);
});
test('photo type is detected from bytes rather than an extension or supplied MIME',()=>{
 assert.equal(imageMimeFromBytes(bytes),'image/png');
 assert.equal(imageMimeFromBytes(new Uint8Array([255,216,255,0])),'image/jpeg');
 assert.equal(imageMimeFromBytes(Buffer.from('RIFF0000WEBP')),'image/webp');
 assert.equal(imageMimeFromBytes(Buffer.from('<svg onload="alert(1)">')),'');
});
test('backup schema rejects other applications, excess size, duplicate ids and unsupported images',()=>{
 assert.equal(validateFieldBackup(backup()).length,1);
 assert.throws(()=>validateFieldBackup({...backup(),application:'fieldnote-review'}));
 assert.throws(()=>validateFieldBackup(backup([photo(),photo()])));
 assert.throws(()=>validateFieldBackup(backup([{...photo(),size:FIELD_LIMITS.fileBytes+1}])));
 assert.throws(()=>validateFieldBackup(backup([{...photo(),type:'image/svg+xml'}])));
 assert.throws(()=>validateFieldBackup(backup([{...photo(),dataUrl:'https://example.com/photo.png'}])));
 assert.throws(()=>validateFieldBackup(backup([{...photo(),dataUrl:'data:image/png;base64,!!!!'}])));
});
test('backup photo is restored as a blob only after hash, type and byte count validation',async()=>{
 const restored=await decodeFieldBackup(backup());
 assert.equal(restored[0].blob.type,'image/png');assert.equal(restored[0].blob.size,bytes.length);assert.equal(restored[0].dataUrl,undefined);
 assert.deepEqual(Buffer.from(await restored[0].blob.arrayBuffer()),bytes);
 for(const patch of [{id:'0'.repeat(64)},{size:1},{type:'image/jpeg',dataUrl:`data:image/jpeg;base64,${bytes.toString('base64')}`}])await assert.rejects(()=>decodeFieldBackup(backup([{...photo(),...patch}])));
});
test('malformed later record fails the full restore before returning any records',async()=>{
 const bad={...photo(),id:'1'.repeat(64)};
 await assert.rejects(()=>decodeFieldBackup(backup([photo(),bad])));
});

test('print waits for every image decode and makes lazy images eager',async()=>{
 let done=false;const image={loading:'lazy',naturalWidth:10,decode:async()=>{await new Promise(resolve=>setTimeout(resolve,5));done=true;}};
 await prepareFieldImagesForPrint([image]);assert.equal(done,true);assert.equal(image.loading,'eager');assert.equal(image.decoding,'sync');
});
test('print rejects failed or timed-out photos instead of printing missing images',async()=>{
 await assert.rejects(()=>prepareFieldImagesForPrint([{naturalWidth:0,decode:async()=>{throw new Error('broken image');}}]));
 await assert.rejects(()=>prepareFieldImagesForPrint([{naturalWidth:10,decode:()=>new Promise(()=>{})}],{timeoutMs:5}));
});
