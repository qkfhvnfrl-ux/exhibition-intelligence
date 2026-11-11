/** Minimal event/element harness for the real map component; not a browser/layout emulator. */
class Element {
  constructor(document, tag) {
    this.ownerDocument = document; this.tagName = tag; this.children = []; this.parentNode = null;
    this.attributes = new Map(); this.dataset = {}; this.style = {}; this.hidden = false;
    this.listeners = new Map(); this.abortHooks = new Map(); this.capture = new Set(); this.textContent = '';
    this.classList = {
      add: (...tokens) => {const classes = new Set(this.className.split(/\s+/).filter(Boolean)); tokens.forEach(t => classes.add(t)); this.className = [...classes].join(' ');},
      remove: (...tokens) => {this.className = this.className.split(/\s+/).filter(t => !tokens.includes(t)).join(' ');},
      contains: token => this.className.split(/\s+/).includes(token)
    };
  }
  get className() {return this.attributes.get('class') || '';}
  set className(value) {this.attributes.set('class', value);}
  setAttribute(name, value) {this.attributes.set(name, String(value)); if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);}
  getAttribute(name) {return this.attributes.get(name) ?? null;}
  removeAttribute(name) {this.attributes.delete(name);}
  append(...elements) {for (const node of elements) {node.parentNode = this; this.children.push(node);}}
  replaceChildren(...elements) {this.children.forEach(node => {node.parentNode = null;}); this.children = []; this.append(...elements);}
  remove() {if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(n => n !== this); this.parentNode = null;}
  closest(selector) {if (selector === '[data-booth-id]' && this.dataset.boothId) return this; return this.parentNode?.closest(selector) || null;}
  getBoundingClientRect() {return {...this.ownerDocument.rect};}
  setPointerCapture(id) {this.capture.add(id);}
  addEventListener(type, handler, options = {}) {
    const list = this.listeners.get(type) || []; const entry = {handler, signal: options.signal}; list.push(entry); this.listeners.set(type, list);
    if (options.signal && !this.abortHooks.has(options.signal)) {
      const signal = options.signal; const clear = () => {for (const [key, entries] of this.listeners) this.listeners.set(key, entries.filter(e => e.signal !== signal));};
      this.abortHooks.set(signal, clear); signal.addEventListener('abort', clear, {once: true});
    }
  }
  dispatch(type, details = {}) {
    const event = {type, target: this, pointerId: 1, pointerType: 'touch', button: 0, clientX: 400, clientY: 300, defaultPrevented: false, preventDefault() {this.defaultPrevented = true;}, ...details};
    for (const {handler, signal} of [...(this.listeners.get(type) || [])]) if (!signal?.aborted) handler(event);
    if (type === 'pointerup' || type === 'pointercancel') this.capture.delete(event.pointerId);
    return event;
  }
}

export function mapDOM({width = 800, height = 600, reducedMotion = true} = {}) {
  const timers = new Map(), frames = new Map(); let now = 1000, nextId = 1;
  const document = {rect: {x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height}};
  document.createElement = tag => new Element(document, tag);
  document.createElementNS = (_, tag) => new Element(document, tag);
  const events = new Element(document, 'window');
  document.defaultView = {
    performance: {now: () => now}, matchMedia: () => ({matches: reducedMotion}),
    requestAnimationFrame: callback => {const id = nextId++; frames.set(id, callback); return id;},
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: callback => {const id = nextId++; timers.set(id, callback); return id;},
    clearTimeout: id => timers.delete(id),
    addEventListener: (...args) => events.addEventListener(...args)
  };
  const container = new Element(document, 'div');
  const findAll = predicate => {const found = []; const visit = node => {if (predicate(node)) found.push(node); node.children.forEach(visit);}; visit(container); return found;};
  return {
    document, container,
    byClass: name => findAll(n => n.classList.contains(name))[0],
    booths: () => findAll(n => Boolean(n.dataset.boothId)),
    advance: amount => {now += amount;},
    flushTimers: () => {const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn());},
    flushFrames: (amount = 300) => {now += amount; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now));},
    pendingFrames: () => frames.size,
    activeListeners: node => [...node.listeners.values()].reduce((n, entries) => n + entries.length, 0)
  };
}
