import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeView, geometryBounds, projectPoint, unprojectPoint, cameraBox, viewForBounds} from '../src/v2/map-view.js';

const near = (a, b, epsilon = 1e-8) => assert.ok(Math.abs(a - b) <= epsilon, `${a} != ${b}`);
const height = 1000 * 841.9199829101562 / 1190.52001953125;

test('map camera accepts direct-link values and bounds malformed coordinates', () => {
  assert.deepEqual(normalizeView(null), {x: .5, y: .5, z: 1});
  assert.deepEqual(normalizeView({x: '0.35', y: '0.8', z: '3'}), {x: .35, y: .8, z: 3});
  assert.deepEqual(normalizeView({x: -4, y: 12, z: Infinity}), {x: -.15, y: 1.15, z: 1});
});

test('2D and simplified 3D share an invertible source-page coordinate basis', () => {
  for (const mode of ['2d', '3d']) for (const point of [[0,0],[1000,0],[1000,height],[0,height],[523.83,302.72]]) {
    const actual = unprojectPoint(projectPoint(point, height, mode), height, mode);
    near(actual[0],point[0]); near(actual[1],point[1]);
  }
});

test('map camera fits the original plane on mobile and desktop without stretching the source', () => {
  for (const mode of ['2d','3d']) for (const ratio of [.65,1.3,2.2]) {
    const box = cameraBox({x:.5,y:.5,z:1},height,ratio,mode);
    near(box.width / box.height, ratio);
    for (const point of [[0,0],[1000,0],[1000,height],[0,height]]) {
      const projected = projectPoint(point,height,mode);
      assert.ok(projected[0]>=box.x && projected[0]<=box.x+box.width);
      assert.ok(projected[1]>=box.y && projected[1]<=box.y+box.height);
    }
  }
});

test('map camera zoom preserves normalized centre and fit-relative scale', () => {
  const a=cameraBox({x:.4,y:.7,z:1},height,1.5,'3d');
  const b=cameraBox({x:.4,y:.7,z:4},height,1.5,'3d');
  near(a.width/b.width,4); near(a.height/b.height,4);
  near(a.x+a.width/2,b.x+b.width/2); near(a.y+a.height/2,b.y+b.height/2);
});

test('unknown or invalid source geometry never receives an invented map location', () => {
  assert.equal(geometryBounds([]), null);
  assert.equal(geometryBounds([{coordinates:[[1.2,.2],[.5,.2],[.5,.6]]}]), null);
  assert.deepEqual(viewForBounds(null,height), {x:.5,y:.5,z:1});
});

test('all 32 verified ADEX regions remain selectable in both coordinate projections', async () => {
  const map=JSON.parse(await readFile(new URL('../data/v2/maps/adex-2025.json',import.meta.url),'utf8'));
  assert.equal(map.booths.length,32);
  for(const booth of map.booths) {
    const bounds=geometryBounds([booth.geometry]); assert.ok(bounds);
    for(const mode of ['2d','3d']) {
      const view=viewForBounds(bounds,height,1.3,mode,1.45);
      const box=cameraBox(view,height,1.3,mode);
      for(const p of booth.geometry.coordinates) {
        const point=projectPoint([p[0]*1000,p[1]*height],height,mode);
        assert.ok(point[0]>=box.x-1e-6 && point[0]<=box.x+box.width+1e-6);
        assert.ok(point[1]>=box.y-1e-6 && point[1]<=box.y+box.height+1e-6);
      }
    }
  }
});

// These exercise the component's actual PointerEvent handlers through an element harness.
// They do not claim physical-phone touch, browser hit-testing or rendered mobile validation.
import {createMapView} from '../src/v2/map-view.js';
import {mapDOM} from './helpers/map-dom.mjs';

function gestureMap(settings = {}, overrides = {}) {
  const dom = mapDOM(settings), selected = [], changes = [], modes = [];
  const options = {
    document: {id:'test-plan',url:'https://example.org/plan.pdf',original:{width:1000,height}},
    geometries: [{id:'geometry-a',documentId:'test-plan',boothId:'a',coordinateSpace:'normalized_original',coordinates:[[.35,.35],[.65,.35],[.65,.65],[.35,.65],[.35,.35]]}],
    booths: [{id:'a',hall:'7',code:null}], labels:{a:'공동 업체'}, occupancies:[{boothId:'a',participationId:'one'},{boothId:'a',participationId:'two'}],
    onSelectBooth: id => selected.push(id), onViewChange: (view, detail) => changes.push({view, ...detail}), onModeChange: mode => modes.push(mode), ...overrides
  };
  const map = createMapView(dom.container, options);
  return {dom,map,selected,changes,modes,viewport:dom.byClass('fn-map__viewport'),host:dom.byClass('fn-map'),getBooth:()=>dom.booths()[0]};
}

test('a zoomed direct link falls back to its preview when the high-resolution map cannot load', () => {
  const background={previewUrl:'https://example.org/preview.png',highResolutionUrl:'https://example.org/large.png'};
  const f=gestureMap({}, {background,view:{x:.5,y:.5,z:4}});
  assert.equal(f.dom.images[0].src,background.highResolutionUrl);
  f.dom.images[0].onerror();
  assert.equal(f.dom.images[1].src,background.previewUrl);
  f.dom.images[1].onload();
  assert.equal(f.dom.byTag('image').getAttribute('href'),background.previewUrl);
  f.map.update({view:{x:.4,y:.6,z:5}});
  assert.equal(f.dom.images.length,2,'camera movement does not retry a failed high-resolution URL');
  assert.equal(f.dom.byClass('fn-map__status').hidden,true);
  f.map.destroy();
});

test('failed map fallback stops retrying and leaves source access with a visible explanation', () => {
  const f=gestureMap({}, {background:{previewUrl:'https://example.org/preview.png',highResolutionUrl:'https://example.org/large.png'},view:{x:.5,y:.5,z:4}});
  f.dom.images[0].onerror(); f.dom.images[1].onerror();
  f.map.update({view:{x:.5,y:.5,z:5}});
  assert.equal(f.dom.images.length,2);
  assert.equal(f.dom.byClass('fn-map__status').hidden,false);
  assert.match(f.dom.byClass('fn-map__status').textContent,/불러오지 못했습니다/);
  assert.equal(f.dom.byClass('fn-map__source').href,'https://example.org/plan.pdf');
  f.map.destroy();
});

test('touch tap selects a shared booth once even when pointer capture retargets pointerup', () => {
  const f=gestureMap(); const booth=f.getBooth();
  assert.match(booth.getAttribute('aria-label'),/공동부스/);
  f.viewport.dispatch('pointerdown',{target:booth,pointerId:7});
  // Captured pointerup targets the viewport, as it does in a browser after setPointerCapture.
  f.viewport.dispatch('pointerup',{pointerId:7});
  assert.deepEqual(f.selected,['a']);
  f.viewport.dispatch('click',{target:booth});
  assert.deepEqual(f.selected,['a'],'synthetic post-touch click must not select twice');
  assert.ok(f.map.getView().z>1);
  f.map.destroy();
});

test('touch drag pans without opening the booth and commits the final camera once', () => {
  const f=gestureMap();
  f.viewport.dispatch('pointerdown',{target:f.getBooth(),pointerId:9});
  f.viewport.dispatch('pointermove',{pointerId:9,clientX:480,clientY:350});
  f.viewport.dispatch('pointerup',{pointerId:9,clientX:480,clientY:350});
  f.viewport.dispatch('click',{target:f.getBooth()});
  assert.deepEqual(f.selected,[]);
  assert.ok(f.map.getView().x<.5 && f.map.getView().y<.5);
  assert.equal(f.changes.filter(c=>c.reason==='pan'&&c.commit).length,1);
  assert.equal(f.host.classList.contains('is-dragging'),false);
  f.map.destroy();
});

test('two touch pointers pinch around their midpoint then continue one-finger panning', () => {
  const f=gestureMap();
  f.viewport.dispatch('pointerdown',{pointerId:1,clientX:300,clientY:300});
  f.viewport.dispatch('pointerdown',{pointerId:2,clientX:500,clientY:300});
  f.viewport.dispatch('pointermove',{pointerId:2,clientX:700,clientY:300});
  near(f.map.getView().z,2);
  assert.ok(f.map.getView().x<.5,'moving pinch midpoint preserves its source-page anchor');
  const pinched=f.map.getView();
  f.viewport.dispatch('pointerup',{pointerId:2,clientX:700,clientY:300});
  f.viewport.dispatch('pointermove',{pointerId:1,clientX:340,clientY:320});
  near(f.map.getView().z,pinched.z);
  assert.ok(f.map.getView().x<pinched.x);
  f.viewport.dispatch('pointerup',{pointerId:1,clientX:340,clientY:320});
  assert.deepEqual(f.selected,[]);
  assert.ok(f.changes.some(c=>c.reason==='pinch'&&!c.commit));
  assert.equal(f.changes.filter(c=>c.commit).length,1);
  f.map.destroy();
});

test('replacing a pinch finger does not jump the camera when three fingers touch the map', () => {
  const f=gestureMap();
  f.viewport.dispatch('pointerdown',{pointerId:1,clientX:300,clientY:300});
  f.viewport.dispatch('pointerdown',{pointerId:2,clientX:500,clientY:300});
  f.viewport.dispatch('pointermove',{pointerId:2,clientX:600,clientY:300});
  f.viewport.dispatch('pointerdown',{pointerId:3,clientX:700,clientY:400});
  const before=f.map.getView();
  f.viewport.dispatch('pointerup',{pointerId:1,clientX:300,clientY:300});
  f.viewport.dispatch('pointermove',{pointerId:2,clientX:600,clientY:300});
  assert.deepEqual(f.map.getView(),before,'remaining fingers retain their current camera and anchor');
  f.viewport.dispatch('pointermove',{pointerId:3,clientX:750,clientY:450});
  near(f.map.getView().z,before.z*1.5);
  f.viewport.dispatch('pointerup',{pointerId:2});
  f.viewport.dispatch('pointerup',{pointerId:3});
  assert.deepEqual(f.selected,[]);
  assert.equal(f.changes.filter(c=>c.commit).length,1);
  f.map.destroy();
});

test('cancelled gestures clear pointer state and cannot cause a later booth selection or phantom drag', () => {
  const f=gestureMap();
  f.viewport.dispatch('pointerdown',{target:f.getBooth(),pointerId:1,clientX:300,clientY:300});
  f.viewport.dispatch('pointerdown',{pointerId:2,clientX:500,clientY:300});
  f.viewport.dispatch('pointermove',{pointerId:2,clientX:600,clientY:300});
  f.viewport.dispatch('pointercancel',{pointerId:2});
  f.viewport.dispatch('pointercancel',{pointerId:1});
  const view=f.map.getView();
  f.viewport.dispatch('pointermove',{pointerId:1,clientX:650,clientY:500});
  assert.deepEqual(f.map.getView(),view);
  assert.deepEqual(f.selected,[]);
  assert.equal(f.host.classList.contains('is-dragging'),false);
  f.dom.advance(400);
  f.viewport.dispatch('pointerdown',{target:f.getBooth(),pointerId:3});
  f.viewport.dispatch('pointerup',{pointerId:3});
  assert.deepEqual(f.selected,['a'],'a fresh touch still works after cancellation');
  f.map.destroy();
});

test('wheel zoom prevents page scroll and keeps the pointer source point stable', () => {
  const f=gestureMap(); const x=600,y=200;
  const point=state=>{const box=cameraBox(state,height,800/600);return [box.x+x/800*box.width,box.y+y/600*box.height];};
  const before=point(f.map.getView());
  const event=f.viewport.dispatch('wheel',{clientX:x,clientY:y,deltaY:-160});
  const after=point(f.map.getView());
  assert.equal(event.defaultPrevented,true); near(before[0],after[0],.001); near(before[1],after[1],.001);
  assert.ok(f.map.getView().z>1);
  assert.equal(f.changes.filter(c=>c.commit).length,0);
  f.dom.flushTimers(); assert.equal(f.changes.filter(c=>c.commit).length,1);
  f.map.destroy();
});

test('2D keeps the same keyboard-selectable booth when returning from simplified view without WebGL', () => {
  const f=gestureMap();
  const initial=f.dom.booths().map(b=>b.dataset.boothId);
  f.map.update({mode:'3d'}); assert.deepEqual(f.dom.booths().map(b=>b.dataset.boothId),initial);
  f.map.update({mode:'2d',view:{x:.4,y:.6,z:2}}); assert.deepEqual(f.map.getView(),{x:.4,y:.6,z:2});
  assert.deepEqual(f.dom.booths().map(b=>b.dataset.boothId),initial);
  const event=f.viewport.dispatch('keydown',{target:f.getBooth(),key:'Enter'});
  assert.equal(event.defaultPrevented,true); assert.deepEqual(f.selected,['a']);
  f.map.destroy();
});

test('keyboard focus survives booth selection and map redraws, with a viewport fallback for hidden booths', () => {
  const f=gestureMap();
  f.getBooth().focus();
  f.viewport.dispatch('keydown',{target:f.dom.document.activeElement,key:'Enter'});
  assert.equal(f.dom.document.activeElement,f.getBooth());
  assert.deepEqual(f.selected,['a']);
  f.map.update({mode:'3d'});
  assert.equal(f.dom.document.activeElement,f.getBooth());
  const before=f.map.getView();
  f.viewport.dispatch('keydown',{target:f.dom.document.activeElement,key:'+'});
  assert.ok(f.map.getView().z>before.z);
  f.map.update({activeHall:'8'});
  assert.equal(f.dom.booths().length,0);
  assert.equal(f.dom.document.activeElement,f.viewport);
  f.map.destroy();
});

test('destroy cancels pending camera motion, input listeners and delayed wheel commits', () => {
  const f=gestureMap({reducedMotion:false});
  f.map.focusBooth('a'); assert.ok(f.dom.pendingFrames()>0);
  f.viewport.dispatch('wheel',{deltaY:-80});
  f.map.focusBooth('a');
  const count=f.changes.length;
  f.map.destroy(); assert.equal(f.dom.pendingFrames(),0); assert.equal(f.dom.activeListeners(f.viewport),0);
  f.viewport.dispatch('pointerdown',{target:f.getBooth(),pointerId:1});
  f.viewport.dispatch('pointermove',{pointerId:1,clientX:700,clientY:400});
  f.dom.flushFrames(); f.dom.flushTimers();
  assert.equal(f.changes.length,count); assert.equal(f.dom.container.children.length,0);
});
