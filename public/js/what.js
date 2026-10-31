import { t, reduced, svg, html, chip, fitCanvas, random, curve, rise } from './util.js';

const INPUTS = [t('capital', '首府'), t('state', '州'), t('Dallas', '达拉斯')];

// 1.1 Prompt in, answer out, nothing visible in between.
export function blackbox(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const wires = svg('g', {}, root);
  const paths = INPUTS.map((label, i) => {
    const y = 130 + i * 70;
    const c = chip(root, 105, y, label);
    return svg('path', { class: 'wire', d: curve(105 + c.w / 2, y, 250, 200) }, wires);
  });
  svg('rect', { class: 'box', x: 250, y: 100, width: 150, height: 200 }, root);
  svg('text', { class: 'box-q', x: 325, y: 200, 'text-anchor': 'middle', dy: '.35em' }, root).textContent = '?';
  const answer = chip(root, 530, 200, t('Austin', '奥斯汀'), 'out');
  paths.push(svg('path', { class: 'wire', d: `M400 200H${530 - answer.w / 2}` }, wires));

  if (!reduced.matches) paths.forEach((path, i) => {
    path.id = `bb-wire-${i}`;
    const dot = svg('circle', { class: 'pulse', r: 2.5 }, wires);
    const motion = svg('animateMotion', { dur: '2.2s', repeatCount: 'indefinite', begin: `-${i === 3 ? 0.8 : i * 0.25}s` }, dot);
    svg('mpath', { href: `#${path.id}` }, motion);
  });
  root.pauseAnimations();

  return {
    enter() { root.unpauseAnimations(); caption(t('Input and output are visible. The computation is not.', '输入和输出都看得见，计算过程看不见。')); },
    leave() { root.pauseAnimations(); },
  };
}

// 1.2 The box opened: a static wall of weights.
export function weights(scene, caption) {
  const canvas = html('canvas', 'numbers', scene);
  const next = random(20260731);
  const gauss = () => Math.sqrt(-2 * Math.log(next() + 1e-9)) * Math.cos(2 * Math.PI * next());
  const values = Float32Array.from({ length: 3000 }, () => gauss() * 0.04);
  const cw = 76, ch = 26;
  let ctx, w, h, cols, rows, ox, hover = -1;
  const idle = t('Billions of numbers like these. Hover one.', '这样的数字有几十亿个。悬停看看。');
  const fmt = v => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(4)}`;

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < cols * rows; i++) {
      const v = values[i % values.length];
      const x = ox + (i % cols) * cw, y = Math.floor(i / cols) * ch;
      ctx.fillStyle = i === hover ? '#d4ff63' : `rgba(184,196,171,${0.1 + Math.min(1, Math.abs(v) * 14) * 0.38})`;
      ctx.fillText(fmt(v), x + 9, y + ch / 2);
      if (i === hover) {
        ctx.strokeStyle = '#d4ff6399';
        ctx.strokeRect(x + 1.5, y + 1.5, cw - 3, ch - 3);
      }
    }
  };
  const resize = () => {
    ({ ctx, w, h } = fitCanvas(canvas));
    cols = Math.floor(w / cw);
    rows = Math.floor(h / ch);
    ox = (w - cols * cw) / 2;
    draw();
  };
  canvas.addEventListener('pointermove', event => {
    const box = canvas.getBoundingClientRect();
    const c = Math.floor((event.clientX - box.left - ox) / cw), r = Math.floor((event.clientY - box.top) / ch);
    const i = c >= 0 && c < cols && r < rows ? r * cols + c : -1;
    if (i === hover) return;
    hover = i;
    draw();
    caption(i < 0 ? idle : `W[12][${r * 97 + 1024}][${c * 31 + 7}] = ${fmt(values[i % values.length])}  ${t('— what does it mean? No one wrote it.', '—— 它代表什么？没有人写过它。')}`);
  });
  canvas.addEventListener('pointerleave', () => { hover = -1; draw(); caption(idle); });
  new ResizeObserver(() => ctx && resize()).observe(canvas);

  return {
    enter() { resize(); caption(idle); },
    leave() {},
  };
}

const CONCEPTS = [
  ['cats', '猫'], ['French', '法语'], ['car engines', '汽车引擎'], ['legal text', '法律条文'],
  ['the color blue', '蓝色'], ['poetry', '诗歌'], ['prime numbers', '质数'], ['Tokyo', '东京'],
  ['Python code', 'Python 代码'], ['apologies', '道歉'], ['DNA', 'DNA'], ['chess', '国际象棋'],
  ['recipes', '菜谱'], ['the 1990s', '90 年代'], ['sarcasm', '讽刺'], ['rain', '下雨'],
].map(([en, cn]) => t(en, cn));
const FIRES = [[0, 2, 8], [1, 11, 6], [3, 13, 15], [4, 9, 12], [5, 10, 7], [14, 0, 6], [2, 12, 15], [7, 3, 9], [11, 5, 14]];

// 1.3 Each neuron responds to several unrelated concepts.
export function neurons(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 420' }, scene);
  const links = svg('g', {}, root);
  const chips = CONCEPTS.map((label, i) => {
    const left = i < 8;
    const c = chip(root, left ? 118 : 522, 46 + (i % 8) * 47, label);
    c.edge = left ? 118 + c.w / 2 : 522 - c.w / 2;
    c.y = 46 + (i % 8) * 47;
    return c;
  });
  const cells = FIRES.map((concepts, n) => {
    const y = 50 + n * 40;
    const lines = concepts.map(i => svg('path', { class: 'link', d: curve(chips[i].edge < 320 ? 309 : 331, y, chips[i].edge, chips[i].y) }, links));
    const g = svg('g', { class: 'neuron' }, root);
    svg('circle', { cx: 320, cy: y, r: 18, class: 'hit' }, g);
    svg('circle', { cx: 320, cy: y, r: 9 }, g);
    return { g, lines, concepts };
  });

  let current = -1, timer = 0, hovering = false;
  const select = n => {
    if (n === current) return;
    if (current >= 0) {
      cells[current].g.classList.remove('on');
      cells[current].lines.forEach(line => line.classList.remove('on'));
      cells[current].concepts.forEach(i => chips[i].classList.remove('on'));
    }
    current = n;
    const cell = cells[n];
    cell.g.classList.add('on');
    cell.lines.forEach(line => line.classList.add('on'));
    cell.concepts.forEach(i => chips[i].classList.add('on'));
    caption(`${t(`Neuron ${n} fires for: `, `神经元 ${n} 被这些内容激活：`)}${cell.concepts.map(i => CONCEPTS[i]).join(' · ')}`);
  };
  cells.forEach(({ g }, n) => {
    g.addEventListener('pointerenter', () => select(n));
    g.addEventListener('click', () => select(n));
  });
  root.addEventListener('pointerenter', () => { hovering = true; });
  root.addEventListener('pointerleave', () => { hovering = false; });

  return {
    enter() {
      select(Math.max(current, 0));
      if (!reduced.matches) timer = setInterval(() => hovering || select((current + 1) % cells.length), 2400);
    },
    leave() { clearInterval(timer); },
  };
}

const FEATURES = [['Dallas', '达拉斯', '#d4ff63'], ['Texas', '得克萨斯', '#86e0c8'], ['capital', '首府', '#f3c070'], ['French', '法语', '#b7a6ff'], ['Python code', 'Python 代码', '#ff9a8a']];
const ease = x => x * x * (3 - 2 * x);
const mix = (a, b, k) => a + (b - a) * k;
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

// 1.4 Dictionary learning separates superposed signals into features.
export function untangle(scene, caption) {
  const canvas = html('canvas', 'threads', scene);
  const control = html('label', 'untangle-control mono', scene);
  control.append(t('superposed', '叠加'));
  const slider = html('input', '', control);
  Object.assign(slider, { type: 'range', min: 0, max: 1000, value: 0 });
  slider.setAttribute('aria-label', t('Decompose into features', '拆解为特征'));
  control.append(t('features', '特征'));

  const colors = FEATURES.map(([, , hex]) => rgb(hex));
  let ctx, w, h, s = 0, goal = 0, frame = 0, touched = false, delay = 0, said = '';

  const draw = time => {
    const k = ease(s), n = FEATURES.length;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    FEATURES.forEach(([en, cn], f) => {
      const lane = h * (0.16 + 0.64 * f / (n - 1));
      const [r, g, b] = colors[f].map(c => Math.round(mix(110, c, k)));
      ctx.strokeStyle = `rgba(${r},${g},${b},${mix(0.45, 0.95, k)})`;
      ctx.lineWidth = mix(1.1, 2, k);
      ctx.beginPath();
      for (let i = 0; i <= 90; i++) {
        const u = i / 90;
        const tangled = h * 0.44 + h * 0.13 * (Math.sin(u * 9.1 + f * 1.7 + time * 0.8) * 0.7 + Math.sin(u * 4.3 - f * 2.3 + time * 0.5) * 0.5);
        const clean = lane + Math.sin(u * 6 + f + time * 0.6) * 3;
        ctx.lineTo(mix(24, w * 0.8, u), mix(tangled, clean, k));
      }
      ctx.stroke();
      ctx.globalAlpha = Math.max(0, (k - 0.6) / 0.4);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.font = '12px "IBM Plex Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(t(en, cn), w * 0.8 + 14, lane);
      ctx.globalAlpha = 1;
    });
    const line = s < 0.5
      ? t('Superposed: signals for different concepts are mixed together.', '叠加态：不同概念的信号混在一起。')
      : t('Decomposed: each feature carries a single concept.', '拆开后：每个特征只承载一个概念。');
    if (line !== said) caption(said = line);
  };
  const tick = now => {
    if (!touched && now > delay) goal = 1;
    s += (goal - s) * 0.035;
    if (!touched) slider.value = Math.round(s * 1000);
    draw(now / 1000);
    frame = requestAnimationFrame(tick);
  };
  const resize = () => { ({ ctx, w, h } = fitCanvas(canvas)); draw(0); };
  slider.addEventListener('input', () => {
    touched = true;
    goal = slider.value / 1000;
    if (reduced.matches) { s = goal; draw(0); }
  });
  new ResizeObserver(() => ctx && resize()).observe(canvas);

  return {
    enter() {
      resize();
      if (reduced.matches) { s = goal = touched ? goal : 1; slider.value = s * 1000; draw(0); return; }
      if (!touched) s = goal = 0;
      delay = performance.now() + 700;
      frame = requestAnimationFrame(tick);
    },
    leave() { cancelAnimationFrame(frame); },
  };
}

const NODES = {
  capital: [130, 350, INPUTS[0], 'in'],
  state: [320, 350, INPUTS[1], 'in'],
  dallas: [510, 350, INPUTS[2], 'in'],
  sayCapital: [190, 235, t('say a capital', '说出一个首府'), 'feature'],
  texas: [450, 235, t('Texas', '得克萨斯'), 'feature'],
  sayAustin: [320, 125, t('say “Austin”', '说出“奥斯汀”'), 'feature'],
  austin: [320, 35, t('Austin', '奥斯汀'), 'out'],
};
const EDGES = [['dallas', 'texas', 1], ['state', 'texas', 1], ['capital', 'sayCapital', 2], ['state', 'sayCapital', 2], ['texas', 'sayAustin', 3], ['sayCapital', 'sayAustin', 3], ['sayAustin', 'austin', 4]];
const LIT = { texas: 1, sayCapital: 2, sayAustin: 3, austin: 4 };
const STAGES = [
  t('Prompt tokens enter the model.', '提示词的 token 进入模型。'),
  t('“Dallas” activates a “Texas” feature.', '“达拉斯”激活了“得克萨斯”特征。'),
  t('“capital” activates “say a capital”.', '“首府”激活了“说出一个首府”。'),
  t('Together they point to “Austin”.', '两者汇合，指向“奥斯汀”。'),
  t('The model answers: Austin.', '模型输出：奥斯汀。'),
];

// 1.5 Features connected into a readable circuit, revealed step by step.
export function circuit(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400', class: 'circuit' }, scene);
  const wires = svg('g', {}, root);
  const chips = Object.fromEntries(Object.entries(NODES).map(([id, [x, y, label, kind]]) => [id, chip(root, x, y, label, kind)]));
  const edges = EDGES.map(([from, to, stage]) => {
    const [x1, y1] = NODES[from], [x2, y2] = NODES[to];
    const d = rise(x1, y1 - 14, x2, y2 + 14);
    svg('path', { class: 'edge-base', d }, wires);
    return { stage, path: svg('path', { class: 'edge', d, pathLength: 1 }, wires) };
  });
  const button = html('button', 'scene-btn mono', scene);
  button.type = 'button';

  let stage = 0, timer = 0;
  const show = n => {
    stage = n;
    edges.forEach(({ stage: s, path }) => path.classList.toggle('on', s <= n));
    Object.entries(LIT).forEach(([id, s]) => chips[id].classList.toggle('on', s <= n));
    button.textContent = n < 4 ? t('Step →', '下一步 →') : t('Replay ↻', '重播 ↻');
    caption(STAGES[n]);
  };
  const advance = () => {
    clearInterval(timer);
    show((stage + 1) % STAGES.length);
  };
  root.addEventListener('click', advance);
  button.addEventListener('click', advance);

  return {
    enter() {
      if (reduced.matches) return show(4);
      show(0);
      timer = setInterval(() => (stage < 4 ? show(stage + 1) : clearInterval(timer)), 1500);
    },
    leave() { clearInterval(timer); },
  };
}
