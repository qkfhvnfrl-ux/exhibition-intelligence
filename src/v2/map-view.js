/* FIELDNOTE: a camera over verified source-page geometry, not a reconstructed venue. */
const NS = 'http://www.w3.org/2000/svg';
const WORLD_WIDTH = 1000;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 20;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

/** x/y are the camera centre on the unrotated, uncropped source page; z is fit-relative. */
export function normalizeView(value = {}) {
  value ||= {};
  return {
    x: clamp(finite(value.x, .5), -.15, 1.15),
    y: clamp(finite(value.y, .5), -.15, 1.15),
    z: clamp(finite(value.z, 1), MIN_ZOOM, MAX_ZOOM)
  };
}

export function geometryBounds(geometries = []) {
  const points = geometries.flatMap(g => Array.isArray(g.coordinates) ? g.coordinates : []);
  if (!points.length || points.some(p => !Array.isArray(p) || p.length !== 2 || p.some(v => !Number.isFinite(v) || v < 0 || v > 1))) return null;
  return [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))];
}

export function projectPoint(point, pageHeight, mode = '2d') {
  const [x, y] = point;
  return mode === '3d' ? [x - .35 * y + .35 * pageHeight, .12 * x + .62 * y + 24] : [x, y];
}

export function unprojectPoint(point, pageHeight, mode = '2d') {
  if (mode !== '3d') return [...point];
  const x = point[0] - .35 * pageHeight, y = point[1] - 24;
  const determinant = .62 + .35 * .12;
  return [(.62 * x + .35 * y) / determinant, (-.12 * x + y) / determinant];
}

export function cameraBox(view, pageHeight, viewportRatio = 1, mode = '2d') {
  const state = normalizeView(view);
  const corners = [[0, 0], [WORLD_WIDTH, 0], [WORLD_WIDTH, pageHeight], [0, pageHeight]].map(p => projectPoint(p, pageHeight, mode));
  let width = Math.max(...corners.map(p => p[0])) - Math.min(...corners.map(p => p[0])) + 32;
  let height = Math.max(...corners.map(p => p[1])) - Math.min(...corners.map(p => p[1])) + 32;
  const ratio = Math.max(.1, finite(viewportRatio, 1));
  if (width / height < ratio) width = height * ratio;
  else height = width / ratio;
  width /= state.z; height /= state.z;
  const centre = projectPoint([state.x * WORLD_WIDTH, state.y * pageHeight], pageHeight, mode);
  return {x: centre[0] - width / 2, y: centre[1] - height / 2, width, height};
}

/** Fit only supplied, source-verified bounds. No coordinates are invented for missing booths. */
export function viewForBounds(bounds, pageHeight, viewportRatio = 1, mode = '2d', padding = 1.45) {
  if (!Array.isArray(bounds) || bounds.length !== 4 || bounds.some(v => !Number.isFinite(v) || v < 0 || v > 1) || bounds[2] <= bounds[0] || bounds[3] <= bounds[1]) return normalizeView();
  const points = [[bounds[0], bounds[1]], [bounds[2], bounds[1]], [bounds[2], bounds[3]], [bounds[0], bounds[3]]].map(p => projectPoint([p[0] * WORLD_WIDTH, p[1] * pageHeight], pageHeight, mode));
  const width = Math.max(...points.map(p => p[0])) - Math.min(...points.map(p => p[0]));
  const height = Math.max(...points.map(p => p[1])) - Math.min(...points.map(p => p[1]));
  const base = cameraBox({x: .5, y: .5, z: 1}, pageHeight, viewportRatio, mode);
  return normalizeView({x: (bounds[0] + bounds[2]) / 2, y: (bounds[1] + bounds[3]) / 2, z: Math.min(base.width / (width * padding), base.height / (height * padding), 8)});
}

const svgNode = (document, tag, attributes = {}) => {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
};
const sourceUrl = value => {
  if (typeof value !== 'string') return null;
  if (/^https?:\/\//i.test(value) || /^blob:/i.test(value) || /^(?:\.\/)?assets\//.test(value)) return value;
  return null;
};

/**
 * createMapView(container, options)
 * options: document, geometries, booths, occupancies, labels (by booth ID), areas,
 * activeHall, mode, view, selectedBoothId, highlightedBoothIds, background,
 * onSelectBooth(id), onViewChange(view,{reason,commit}), onModeChange(mode).
 * background is {imageUrl,previewUrl?,highResolutionUrl?,sourceUrl?,attribution?}.
 * areas is [{id,label,kind,bounds:[x0,y0,x1,y1]}], only source-verified extents.
 * The owner decides shared-booth company selection and URL history semantics.
 */
export function createMapView(container, initialOptions = {}) {
  if (!container?.ownerDocument) throw new Error('Map container is required');
  const document = container.ownerDocument;
  const win = document.defaultView;
  const options = {geometries: [], booths: [], occupancies: [], labels: {}, areas: [], activeHall: 'all', mode: '2d', ...initialOptions};
  let view = normalizeView(options.view);
  let mode = options.mode === '3d' ? '3d' : '2d';
  let pageHeight = WORLD_WIDTH * ((options.document?.original?.height || 707) / (options.document?.original?.width || 1000));
  let animation = 0, wheelTimer = 0, destroyed = false, imageRevision = 0, loadedUrl = null, requestedUrl = null, failedHighResolutionUrl = null;
  let pointerStart = null, pinchStart = null, dragged = false, suppressClickUntil = 0;
  const pointers = new Map();
  const controller = new AbortController();
  const listeners = {signal: controller.signal};
  const host = document.createElement('section');
  host.className = 'fn-map';
  host.setAttribute('aria-label', '공식 전시장 배치도 탐색');
  const viewport = document.createElement('div');
  viewport.className = 'fn-map__viewport';
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'group');
  viewport.setAttribute('aria-label', '전시장 지도. 방향키로 이동하고 더하기·빼기로 확대·축소합니다.');
  const svg = svgNode(document, 'svg', {'aria-label': '공식 배치도와 확인된 업체 영역', role: 'group', preserveAspectRatio: 'xMidYMid meet'});
  svg.classList.add('fn-map__svg');
  const floor = svgNode(document, 'g', {'class': 'fn-map__floor'});
  const paper = svgNode(document, 'rect', {x: 0, y: 0, width: WORLD_WIDTH, height: pageHeight, 'class': 'fn-map__paper'});
  const backgroundImage = svgNode(document, 'image', {x: 0, y: 0, width: WORLD_WIDTH, height: pageHeight, preserveAspectRatio: 'none'});
  floor.append(paper, backgroundImage);
  const regions = svgNode(document, 'g', {'class': 'fn-map__regions'});
  svg.append(floor, regions);
  viewport.append(svg);
  const controls = document.createElement('div');
  controls.className = 'fn-map__controls';
  controls.setAttribute('aria-label', '지도 보기 조작');
  function control(text, label, action, className = '') {
    const button = document.createElement('button');
    button.type = 'button'; button.className = `fn-map__control ${className}`.trim();
    button.textContent = text; button.setAttribute('aria-label', label); button.title = label;
    button.addEventListener('click', action, listeners); controls.append(button); return button;
  }
  const mode2d = control('2D', '2D 지도 보기', () => changeMode('2d'), 'fn-map__mode');
  const mode3d = control('입체', '단순화한 입체 보기', () => changeMode('3d'), 'fn-map__mode');
  control('+', '지도 확대', () => zoomAt(1.35, null, 'zoom-button', true));
  control('−', '지도 축소', () => zoomAt(1 / 1.35, null, 'zoom-button', true));
  control('전체', '지도 전체 보기', () => fit({animate: true}));
  const footer = document.createElement('div'); footer.className = 'fn-map__footer';
  const note = document.createElement('p'); note.className = 'fn-map__note';
  const sourceLink = document.createElement('a'); sourceLink.target = '_blank'; sourceLink.rel = 'noopener noreferrer'; sourceLink.textContent = '공식 원본'; sourceLink.className = 'fn-map__source';
  footer.append(note, sourceLink);
  const status = document.createElement('p'); status.className = 'fn-map__status'; status.setAttribute('role', 'status');
  const tooltip = document.createElement('div'); tooltip.className = 'fn-map__tooltip'; tooltip.hidden = true;
  const live = document.createElement('span'); live.className = 'fn-map__sr-only'; live.setAttribute('aria-live', 'polite');
  host.append(viewport, controls, footer, status, tooltip, live); container.replaceChildren(host);

  const viewportRect = () => viewport.getBoundingClientRect();
  const ratio = () => {const rect = viewportRect(); return rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 1.5;};
  const getView = () => Object.fromEntries(Object.entries(view).map(([key, value]) => [key, Math.round(value * 1e6) / 1e6]));
  const emit = (reason, commit = false) => {if (!destroyed) options.onViewChange?.(getView(), {reason, commit});};
  const stopAnimation = () => {if (animation) win.cancelAnimationFrame(animation); animation = 0;};
  const reduceMotion = () => win.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  function paintCamera() {
    const box = cameraBox(view, pageHeight, ratio(), mode);
    svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
    host.dataset.mode = mode;
    host.dataset.zoom = String(Math.round(view.z * 100));
    mode2d.setAttribute('aria-pressed', String(mode === '2d'));
    mode3d.setAttribute('aria-pressed', String(mode === '3d'));
    note.textContent = mode === '3d'
      ? '공식 배치도를 바탕으로 단순화한 공간 표현 · 블록 높이·외관은 실제 형상이 아닙니다'
      : (options.background?.attribution || '공식 사전 배치도 · 확인된 위치만 표시합니다');
    ensureBackground();
  }
  function setView(next, {animate = false, reason = 'restore', commit = false} = {}) {
    stopAnimation(); const target = normalizeView(next);
    if (!animate || reduceMotion()) {view = target; paintCamera(); emit(reason, commit); return;}
    const start = {...view}; const started = win.performance.now();
    const tick = time => {
      if (destroyed) return;
      const amount = clamp((time - started) / 280, 0, 1), eased = 1 - Math.pow(1 - amount, 3);
      view = {x: start.x + (target.x - start.x) * eased, y: start.y + (target.y - start.y) * eased, z: Math.exp(Math.log(start.z) + (Math.log(target.z) - Math.log(start.z)) * eased)};
      paintCamera();
      if (amount < 1) animation = win.requestAnimationFrame(tick);
      else {animation = 0; view = target; emit(reason, commit);}
    };
    animation = win.requestAnimationFrame(tick);
  }
  function pointOnPage(clientX, clientY, state = view) {
    const rect = viewportRect(); const box = cameraBox(state, pageHeight, ratio(), mode);
    const planePoint = [box.x + (clientX - rect.left) / Math.max(rect.width, 1) * box.width, box.y + (clientY - rect.top) / Math.max(rect.height, 1) * box.height];
    const point = unprojectPoint(planePoint, pageHeight, mode);
    return {x: point[0] / WORLD_WIDTH, y: point[1] / pageHeight};
  }
  function zoomAt(factor, event, reason, commit = false) {
    stopAnimation();
    const rect = viewportRect(); const clientX = event?.clientX ?? rect.left + rect.width / 2, clientY = event?.clientY ?? rect.top + rect.height / 2;
    const anchor = pointOnPage(clientX, clientY); const target = normalizeView({...view, z: view.z * factor});
    const movedAnchor = pointOnPage(clientX, clientY, target);
    view = normalizeView({...target, x: target.x + anchor.x - movedAnchor.x, y: target.y + anchor.y - movedAnchor.y});
    paintCamera(); emit(reason, commit);
    if (commit) live.textContent = `지도 ${Math.round(view.z * 100)}퍼센트`;
  }
  function ensureBackground() {
    const source = options.background || {};
    const highResolution = sourceUrl(source.highResolutionUrl);
    const wanted = (view.z >= 2.25 && highResolution !== failedHighResolutionUrl && highResolution) || sourceUrl(source.previewUrl || source.imageUrl);
    const link = sourceUrl(source.sourceUrl || options.document?.url);
    sourceLink.hidden = !link; if (link) sourceLink.href = link;
    if (!wanted) {
      if (requestedUrl !== null || loadedUrl !== null) {imageRevision++; backgroundImage.removeAttribute('href'); loadedUrl = requestedUrl = null;}
      status.hidden = false; status.textContent = options.document ? '공식 지도 원본은 링크에서 확인할 수 있습니다. 아래 영역은 확인된 위치만 표시합니다.' : '이 회차의 좌표가 확인된 공식 지도가 아직 없습니다. 업체 목록에서 탐색하세요.';
      return;
    }
    if (wanted === loadedUrl || wanted === requestedUrl) return;
    const rect = viewportRect(); if (rect.width <= 0 || rect.height <= 0) return;
    requestedUrl = wanted; const revision = ++imageRevision;
    if (!loadedUrl) {status.hidden = false; status.textContent = '공식 배치도 불러오는 중';}
    const image = new win.Image(); image.decoding = 'async';
    // A directly published image needs no CORS fetch or crossOrigin attribute.
    image.onload = () => {
      if (destroyed || revision !== imageRevision) return;
      loadedUrl = wanted; requestedUrl = null; backgroundImage.setAttribute('href', wanted);
      status.hidden = true;
    };
    image.onerror = () => {
      if (destroyed || revision !== imageRevision) return;
      const fallback = sourceUrl(source.previewUrl || source.imageUrl);
      if (wanted === highResolution && fallback && fallback !== wanted) {
        // Direct links may start zoomed in before any preview has loaded.
        failedHighResolutionUrl = wanted; requestedUrl = null;
        ensureBackground();
        return;
      }
      requestedUrl = wanted; status.hidden = false;
      status.textContent = loadedUrl ? '고해상도 원본을 불러오지 못해 기본 지도를 유지합니다.' : '공식 배치도를 불러오지 못했습니다. 공식 원본 링크에서 확인하세요. 위치가 확인된 영역만 표시합니다.';
    };
    image.src = wanted;
  }
  const geometryList = () => options.geometries.filter(g => g.documentId === options.document?.id && g.coordinateSpace === 'normalized_original' && geometryBounds([g]));
  function boothLabel(booth) {
    const label = options.labels?.[booth.id] || booth.label || (booth.code ? `부스 ${booth.code}` : '업체 영역');
    const companies = options.occupancies.filter(o => o.boothId === booth.id).length;
    return `${label}${companies > 1 ? ' · 공동부스' : ''}${booth.code ? ` · ${booth.code}` : ' · 부스번호 미확인'}`;
  }
  function renderRegions() {
    const focusedBoothId = regions.contains(document.activeElement) ? document.activeElement?.closest?.('[data-booth-id]')?.dataset.boothId : null;
    let focusedReplacement = null;
    regions.replaceChildren();
    floor.setAttribute('transform', mode === '3d' ? `matrix(1 .12 -.35 .62 ${.35 * pageHeight} 24)` : '');
    const boothsById = new Map(options.booths.map(b => [b.id, b]));
    const highlighted = new Set(options.highlightedBoothIds || []);
    for (const geometry of geometryList()) {
      const booth = boothsById.get(geometry.boothId); if (!booth) continue;
      const visibleHall = !options.activeHall || options.activeHall === 'all' || String(booth.hall) === String(options.activeHall);
      if (!visibleHall) continue;
      const basePoints = geometry.coordinates.map(p => projectPoint([p[0] * WORLD_WIDTH, p[1] * pageHeight], pageHeight, mode));
      const lift = mode === '3d' ? 8 : 0;
      const topPoints = basePoints.map(p => [p[0], p[1] - lift]);
      const group = svgNode(document, 'g', {'class': 'fn-map__booth', 'data-booth-id': booth.id, tabindex: 0, role: 'button', 'aria-label': boothLabel(booth), 'aria-pressed': String(booth.id === options.selectedBoothId)});
      if (booth.id === focusedBoothId) focusedReplacement = group;
      if (booth.id === options.selectedBoothId) group.classList.add('is-selected');
      if (highlighted.has(booth.id)) group.classList.add('is-highlighted');
      const title = svgNode(document, 'title'); title.textContent = boothLabel(booth); group.append(title);
      if (lift) {
        for (let i = 0; i < basePoints.length - 1; i++) {
          const j = (i + 1) % basePoints.length;
          group.append(svgNode(document, 'polygon', {points: [basePoints[i], basePoints[j], topPoints[j], topPoints[i]].map(p => p.join(',')).join(' '), 'class': 'fn-map__wall'}));
        }
      }
      group.append(svgNode(document, 'polygon', {points: topPoints.map(p => p.join(',')).join(' '), 'class': 'fn-map__top', 'vector-effect': 'non-scaling-stroke'}));
      const bounds = geometryBounds([geometry]);
      const middle = projectPoint([(bounds[0] + bounds[2]) / 2 * WORLD_WIDTH, (bounds[1] + bounds[3]) / 2 * pageHeight], pageHeight, mode);
      if (booth.id === options.selectedBoothId) {
        const label = svgNode(document, 'text', {x: middle[0], y: middle[1] - lift, 'class': 'fn-map__selected-label', 'text-anchor': 'middle', 'dominant-baseline': 'middle'});
        label.textContent = options.labels?.[booth.id] || booth.code || '선택 업체'; group.append(label);
      }
      regions.append(group);
    }
    // Rebuilding SVG regions must not strand keyboard users on the document body.
    if (focusedBoothId) (focusedReplacement || viewport).focus({preventScroll: true});
    mode2d.disabled = mode3d.disabled = !options.document?.original;
  }
  function changeMode(next) {
    if (mode === next || !options.document?.original) return;
    mode = next === '3d' ? '3d' : '2d'; stopAnimation(); renderRegions(); paintCamera();
    options.onModeChange?.(mode); emit('mode', true);
    live.textContent = mode === '3d' ? '단순화한 입체 보기' : '2D 지도 보기';
  }
  function focusBooth(id, {animate = true, zoom = null} = {}) {
    const geometries = geometryList().filter(g => g.boothId === id);
    const bounds = geometryBounds(geometries); if (!bounds) return false;
    const booth = options.booths.find(b => b.id === id);
    if (options.activeHall !== 'all' && String(booth?.hall) !== String(options.activeHall)) options.activeHall = booth?.hall || 'all';
    options.selectedBoothId = id; renderRegions();
    const target = viewForBounds(bounds, pageHeight, ratio(), mode, 3.1);
    if (zoom !== null) target.z = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    else target.z = Math.min(target.z, 5.5);
    setView(target, {animate, reason: 'booth-focus', commit: false});
    return true;
  }
  function focusArea(id, {animate = true} = {}) {
    const area = options.areas.find(a => String(a.id) === String(id));
    const bounds = area?.bounds || geometryBounds(geometryList().filter(g => options.booths.some(b => b.id === g.boothId && String(b.hall) === String(id))));
    if (!bounds) return false;
    const target = viewForBounds(bounds, pageHeight, ratio(), mode, 1.12);
    // A source-labelled camera target is not a new physical hall boundary.
    if (Array.isArray(area?.focusPoint) && area.focusPoint.length === 2 && area.focusPoint.every(v => Number.isFinite(v) && v >= 0 && v <= 1)) {
      target.x = area.focusPoint[0]; target.y = area.focusPoint[1];
    }
    setView(target, {animate, reason: 'area-focus', commit: false});
    return true;
  }
  function fit({animate = true} = {}) {setView({x: .5, y: .5, z: 1}, {animate, reason: 'fit', commit: true});}
  function beginPinch() {
    const [a, b] = [...pointers.values()];
    const middle = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
    pinchStart = {distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), view: {...view}, anchor: pointOnPage(middle.x, middle.y)};
  }
  viewport.addEventListener('wheel', event => {
    event.preventDefault(); tooltip.hidden = true;
    zoomAt(Math.exp(-clamp(event.deltaY, -160, 160) * .002), event, 'wheel', false);
    win.clearTimeout(wheelTimer); wheelTimer = win.setTimeout(() => {emit('wheel', true); live.textContent = `지도 ${Math.round(view.z * 100)}퍼센트`;}, 180);
  }, {...listeners, passive: false});
  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    stopAnimation(); pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    viewport.setPointerCapture?.(event.pointerId); tooltip.hidden = true;
    if (pointers.size === 1) {pointerStart = {clientX: event.clientX, clientY: event.clientY, view: {...view}, boothId: event.target.closest?.('[data-booth-id]')?.dataset.boothId || null}; dragged = false;}
    else if (pointers.size === 2) {
      beginPinch();
      dragged = true; host.classList.add('is-dragging');
    }
  }, listeners);
  viewport.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) {
      const boothNode = event.target.closest?.('[data-booth-id]');
      tooltip.hidden = !boothNode;
      if (boothNode) {const rect = host.getBoundingClientRect(); tooltip.textContent = boothNode.getAttribute('aria-label'); tooltip.style.left = `${clamp(event.clientX - rect.left, 12, Math.max(12, rect.width - 240))}px`; tooltip.style.top = `${Math.max(8, event.clientY - rect.top - 44)}px`;}
      return;
    }
    pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (pointers.size >= 2 && pinchStart) {
      const [a, b] = [...pointers.values()]; const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      const next = normalizeView({...pinchStart.view, z: pinchStart.view.z * distance / pinchStart.distance});
      const anchor = pointOnPage((a.x + b.x) / 2, (a.y + b.y) / 2, next);
      view = normalizeView({...next, x: next.x + pinchStart.anchor.x - anchor.x, y: next.y + pinchStart.anchor.y - anchor.y});
      paintCamera(); emit('pinch', false); return;
    }
    if (!pointerStart) return;
    const distance = Math.hypot(event.clientX - pointerStart.clientX, event.clientY - pointerStart.clientY);
    if (distance < 5 && !dragged) return;
    dragged = true; host.classList.add('is-dragging');
    const startPoint = pointOnPage(pointerStart.clientX, pointerStart.clientY, pointerStart.view);
    const point = pointOnPage(event.clientX, event.clientY, pointerStart.view);
    view = normalizeView({...pointerStart.view, x: pointerStart.view.x + startPoint.x - point.x, y: pointerStart.view.y + startPoint.y - point.y});
    paintCamera(); emit('pan', false);
  }, listeners);
  const release = event => {
    const hadPointer = pointers.delete(event.pointerId);
    if (!hadPointer) return;
    const tappedBooth = !dragged && event.type === 'pointerup' && pointers.size === 0 ? pointerStart?.boothId : null;
    if (dragged) suppressClickUntil = win.performance.now() + 350;
    if (pointers.size >= 2) beginPinch();
    else if (pointers.size === 1) {const [remaining] = pointers.values(); pointerStart = {clientX: remaining.x, clientY: remaining.y, view: {...view}}; pinchStart = null;}
    else if (!pointers.size) {pointerStart = pinchStart = null; host.classList.remove('is-dragging'); if (dragged) emit('pan', true); dragged = false;}
    if (tappedBooth) {
      suppressClickUntil = win.performance.now() + 350;
      focusBooth(tappedBooth); options.onSelectBooth?.(tappedBooth);
    }
  };
  viewport.addEventListener('pointerup', release, listeners);
  viewport.addEventListener('pointercancel', release, listeners);
  viewport.addEventListener('lostpointercapture', release, listeners);
  viewport.addEventListener('pointerleave', () => {tooltip.hidden = true;}, listeners);
  viewport.addEventListener('click', event => {
    if (win.performance.now() < suppressClickUntil) return;
    const node = event.target.closest?.('[data-booth-id]'); if (!node) return;
    const id = node.dataset.boothId; focusBooth(id); options.onSelectBooth?.(id);
  }, listeners);
  viewport.addEventListener('keydown', event => {
    const node = event.target.closest?.('[data-booth-id]');
    if (node && (event.key === 'Enter' || event.key === ' ')) {event.preventDefault(); focusBooth(node.dataset.boothId); options.onSelectBooth?.(node.dataset.boothId); return;}
    if (event.key === '+' || event.key === '=') {event.preventDefault(); zoomAt(1.35, null, 'keyboard', true); return;}
    if (event.key === '-') {event.preventDefault(); zoomAt(1 / 1.35, null, 'keyboard', true); return;}
    if (event.key === 'Home' || event.key === '0') {event.preventDefault(); fit(); return;}
    const shift = .075 / view.z; const moves = {ArrowLeft: [-shift, 0], ArrowRight: [shift, 0], ArrowUp: [0, -shift], ArrowDown: [0, shift]};
    if (moves[event.key]) {event.preventDefault(); const [x, y] = moves[event.key]; setView({...view, x: view.x + x, y: view.y + y}, {reason: 'keyboard', commit: true});}
  }, listeners);
  let resizeObserver;
  if (win.ResizeObserver) {resizeObserver = new win.ResizeObserver(() => paintCamera()); resizeObserver.observe(viewport);}
  else win.addEventListener('resize', paintCamera, listeners);
  function update(patch = {}) {
    const previousDocument = options.document?.id, previousHall = options.activeHall;
    Object.assign(options, patch);
    if (patch.mode) mode = patch.mode === '3d' ? '3d' : '2d';
    if (patch.view) {stopAnimation(); view = normalizeView(patch.view);}
    if (options.document?.id !== previousDocument) {
      stopAnimation(); imageRevision++; loadedUrl = requestedUrl = failedHighResolutionUrl = null; backgroundImage.removeAttribute('href');
      pageHeight = WORLD_WIDTH * ((options.document?.original?.height || 707) / (options.document?.original?.width || 1000));
      paper.setAttribute('height', pageHeight); backgroundImage.setAttribute('height', pageHeight);
      if (!patch.view) view = normalizeView();
    }
    renderRegions(); paintCamera();
    if (patch.activeHall !== undefined && previousHall !== patch.activeHall && !patch.view) {
      if (!patch.activeHall || patch.activeHall === 'all') setView({x: .5, y: .5, z: 1}, {animate: true, reason: 'area-focus'});
      else focusArea(patch.activeHall);
    }
  }
  renderRegions(); paintCamera();
  return {update, focusBooth, focusArea, fit, getView, getMode: () => mode, destroy() {destroyed = true; stopAnimation(); imageRevision++; win.clearTimeout(wheelTimer); controller.abort(); resizeObserver?.disconnect(); pointers.clear(); host.remove();}};
}
