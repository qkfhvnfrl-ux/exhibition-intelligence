import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {galleryCollection,filterGallery,photoYear} from '../src/public-gallery.js';
const catalog=JSON.parse(await readFile('data/catalog.json'));
const data=JSON.parse(await readFile('data/review.json'));
const photos=JSON.parse(await readFile('data/review-photos.json'));

test('public gallery deduplicates image bytes and paths while preferring review metadata',()=>{
  const source=galleryCollection(catalog,data,photos);
  assert.equal(source.photos.length,new Set(source.photos.map(photo=>photo.src)).size);
  assert.ok(source.photos.length>=53);
  assert.equal(source.equipment.get('k2pl').review,true);
  const repeat=galleryCollection(catalog,data,[...photos,...photos]);
  assert.equal(repeat.photos.length,source.photos.length);
  const fake={...photos[0],id:'same-hash',src:'assets/adex2025/another.jpg'};
  assert.equal(galleryCollection(catalog,data,[...photos,fake]).photos.length,source.photos.length);
});

test('gallery filters preserve the difference between event photos and related reference photos',()=>{
  const source=galleryCollection(catalog,data,photos);
  const event=filterGallery(source,{event:'adex-2025',context:'event'});
  assert.ok(event.length>=3);
  assert.ok(event.every(photo=>photo.eventId==='adex-2025'&&photo.context==='event'));
  const references=filterGallery(source,{context:'reference'});
  assert.ok(references.length>0);
  assert.ok(references.every(photo=>photo.context!=='event'));
  assert.ok(filterGallery(source,{product:'k2pl'}).every(photo=>photo.equipmentId==='k2pl'));
  assert.equal(filterGallery(source,{search:'no-such-equipment-query-123'}).length,0);
  assert.equal(filterGallery(source,{year:'1890'}).length,0);
});

test('photo year derives only from photo source dates and retains unknown dates',()=>{
  assert.equal(photoYear({sourceDate:'14 May 2023'}),'2023');
  assert.equal(photoYear({sourceDate:'2025-10-20'}),'2025');
  assert.equal(photoYear({eventId:'adex-2025'}),'미상');
  assert.equal(photoYear({sourceDate:'Taken at the exhibition'}),'미상');
});

test('gallery discards unsafe image paths and unknown product bindings',()=>{
  const extra=[{...photos[0],id:'unsafe',src:'https://example.com/x.jpg'},{...photos[0],id:'unknown',src:'assets/photos/new.jpg',sha256:'different',equipmentId:'missing'}];
  assert.equal(galleryCollection(catalog,data,extra).photos.length,catalog.photos.length);
});
