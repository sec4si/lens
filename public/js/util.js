export const zh = document.documentElement.lang.startsWith('zh');
export const t = (en, cn) => (zh ? cn : en);
export const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export function svg(tag, attrs = {}, parent) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  parent?.append(node);
  return node;
}

export function html(tag, className, parent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  parent?.append(node);
  return node;
}

// A labelled box centred on (x, y). The parent must already be in the document so the text can be measured.
export function chip(parent, x, y, label, className = '') {
  const g = svg('g', { class: `chip ${className}`, transform: `translate(${x} ${y})` }, parent);
  const rect = svg('rect', { y: -14, height: 28, rx: 2 }, g);
  const text = svg('text', { 'text-anchor': 'middle', dy: '.35em' }, g);
  text.textContent = label;
  g.w = text.getComputedTextLength() + 24;
  rect.setAttribute('x', -g.w / 2);
  rect.setAttribute('width', g.w);
  return g;
}

export function fitCanvas(canvas) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: width, h: height };
}

// Deterministic noise so every visitor sees the same figure.
export function random(seed) {
  return () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
}
