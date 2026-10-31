import { zh, reduced } from './util.js';

const TOKENS = zh
  ? [['达拉斯', '城市 · 得州'], ['在', '位置'], ['得克萨斯州', '美国的州'], ['，'], ['所以', '推理'], ['首府', '政府驻地'], ['是', '系词'], ['奥斯汀', '说出“奥斯汀”'], ['。']]
  : [['Dallas', 'city · Texas'], ['is', 'copula'], ['in', 'location'], ['Texas,', 'US state'], ['so', 'inference'], ['the', 'determiner'], ['capital', 'seat of government'], ['is', 'copula'], ['Austin.', 'say “Austin”']];

function render(layer, withFeatures) {
  layer.replaceChildren(...TOKENS.flatMap(([word, feature], i) => {
    const token = document.createElement('span');
    token.className = 'tok';
    token.textContent = word;
    if (withFeatures && feature) token.dataset.feature = feature;
    return i && !zh ? [' ', token] : [token];
  }));
}

export function lens(root) {
  const text = root.querySelector('.specimen-text');
  const [surface, depth] = text.querySelectorAll('.layer');
  render(surface, false);
  render(depth, true);

  const pos = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let manual = false;
  let visible = false;
  let frame = 0;

  const place = () => {
    text.style.setProperty('--x', `${pos.x}px`);
    text.style.setProperty('--y', `${pos.y}px`);
  };
  const rest = () => {
    const last = [...depth.querySelectorAll('[data-feature]')].at(-1);
    target.x = last.offsetLeft + last.offsetWidth / 2;
    target.y = last.offsetTop + last.offsetHeight / 2;
  };
  const drift = now => {
    const s = now / 1000;
    target.x = text.clientWidth * (0.5 + 0.44 * Math.sin(s * 0.29));
    target.y = text.clientHeight * (0.5 + 0.36 * Math.sin(s * 0.47 + 1.3));
  };
  const tick = now => {
    if (!manual) drift(now);
    pos.x += (target.x - pos.x) * 0.1;
    pos.y += (target.y - pos.y) * 0.1;
    place();
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (reduced.matches) {
      if (!manual) rest();
      Object.assign(pos, target);
      place();
    } else if (visible && !document.hidden) {
      frame = requestAnimationFrame(tick);
    }
  };
  const aim = (x, y) => {
    manual = true;
    target.x = Math.max(0, Math.min(text.clientWidth, x));
    target.y = Math.max(0, Math.min(text.clientHeight, y));
    if (reduced.matches) sync();
  };

  root.addEventListener('pointermove', event => {
    const box = text.getBoundingClientRect();
    aim(event.clientX - box.left, event.clientY - box.top);
  });
  root.addEventListener('pointerleave', () => { manual = false; sync(); });
  root.addEventListener('keydown', event => {
    const step = { ArrowLeft: [-28, 0], ArrowRight: [28, 0], ArrowUp: [0, -28], ArrowDown: [0, 28] }[event.key];
    if (!step) return;
    event.preventDefault();
    aim(target.x + step[0], target.y + step[1]);
  });
  root.addEventListener('blur', () => { manual = false; sync(); });

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(root);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  addEventListener('resize', () => { if (reduced.matches && !manual) sync(); });

  rest();
  Object.assign(pos, target);
  place();
}
