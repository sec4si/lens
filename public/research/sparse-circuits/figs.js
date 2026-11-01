import { t, reduced, svg, html, random, views, fitCanvas } from '/js/util.js';

export const NAMES = {
  '128_1.0': t('dense d128', '稠密 d128'),
  '256_1.0': t('dense d256', '稠密 d256'),
  '512_1.0': t('dense d512', '稠密 d512'),
  '128_0.1': t('sparse d128 · 10%', '稀疏 d128 · 10%'),
  '256_0.05': t('sparse d256 · 5%', '稀疏 d256 · 5%'),
  '256_0.02': t('sparse d256 · 2%', '稀疏 d256 · 2%'),
  '512_0.01': t('sparse d512 · 1%', '稀疏 d512 · 1%'),
};
const COLORS = { '128_1.0': '#86e0c8', '256_1.0': '#5aa9e6', '512_1.0': '#3d7cc9', '128_0.1': '#b7a6ff', '256_0.05': '#f3c070', '256_0.02': '#d4ff63', '512_0.01': '#ff9a8a' };
const TASK_NAMES = [t('quote', '引号'), t('bracket', '括号'), t('look-up', '查找')];
const fmt = n => Math.round(n).toLocaleString('en-US');
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;

// ---------- the three tasks, generated exactly as in the experiment ----------

const LETTERS = 'abcdefghijklmnop';
const pick = (r, xs) => xs[Math.floor(r() * xs.length)];
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const letters = (r, n) => Array.from({ length: n }, () => pick(r, LETTERS));

const GENERATORS = [
  r => {
    const seq = [];
    while (seq.length + 11 <= 23 && r() < 0.7) {
      const q = pick(r, [`'`, '"']);
      seq.push(q, ...letters(r, int(r, 0, 3)), q, ...letters(r, int(r, 0, 2)));
    }
    const q = pick(r, [`'`, '"']);
    const at = seq.length;
    seq.push(q, ...letters(r, int(r, 1, 3)));
    return { seq, answer: q, mark: [at] };
  },
  r => {
    const seq = [], stack = [];
    for (let n = int(r, 4, 21); n > 0; n--) {
      const x = r();
      if (stack.length && x < 0.35) seq.push({ '(': ')', '[': ']' }[seq[stack.pop()]]);
      else if (stack.length < 4 && x < 0.7) { stack.push(seq.length); seq.push(pick(r, ['(', '['])); }
      else seq.push(...letters(r, 1));
    }
    if (!stack.length) { stack.push(seq.length); seq.push(pick(r, ['(', '['])); }
    const open = stack.at(-1);
    return { seq, answer: { '(': ')', '[': ']' }[seq[open]], mark: [open] };
  },
  r => {
    const keys = [...LETTERS].sort(() => r() - 0.5).slice(0, int(r, 2, 5));
    const vals = keys.map(() => String(int(r, 0, 9)));
    const i = int(r, 0, keys.length - 1);
    const seq = keys.flatMap((k, j) => [k, '=', vals[j]]);
    seq.push('?', keys[i]);
    return { seq, answer: vals[i], mark: [i * 3, i * 3 + 2, seq.length - 1] };
  },
];
const HINTS = [
  t('Predict the quote that closes the last open one.', '预测与最后一个未闭合引号配对的闭合引号。'),
  t('Predict the bracket that closes the innermost open one.', '预测最内层未闭合括号对应的闭合括号。'),
  t('Look up the value bound to the queried letter.', '查出被询问的字母绑定的值。'),
];

export function tasks(scene, caption) {
  const box = html('div', 'task-box', scene);
  const line = html('div', 'task-seq mono', box);
  const again = html('button', 'scene-btn mono', scene);
  again.type = 'button';
  again.textContent = t('Another example ↻', '换一个例子 ↻');
  let task = 0;
  const r = random(Date.now() % 100000);
  const draw = () => {
    const { seq, answer, mark } = GENERATORS[task](r);
    line.replaceChildren(...seq.map((tok, i) => Object.assign(html('span', mark.includes(i) ? 'tok mark' : 'tok'), { textContent: tok })));
    line.append(Object.assign(html('span', 'tok arrow'), { textContent: '→' }), Object.assign(html('span', 'tok answer'), { textContent: answer }));
    caption(HINTS[task]);
  };
  again.addEventListener('click', draw);
  return views(scene, TASK_NAMES, i => { task = i; draw(); });
}

// ---------- training: density annealed to its target over the first half ----------

export function schedule(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const next = random(2);
  const size = 24, cell = 11;
  const magnitudes = Array.from({ length: size * size }, () => Math.abs(next() - 0.5) * (0.3 + next()));
  const order = magnitudes.map((m, i) => [m, i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
  const cells = magnitudes.map((m, i) => svg('rect', { class: 'w-cell', x: 40 + (i % size) * cell, y: 50 + Math.floor(i / size) * cell, width: cell - 1, height: cell - 1, style: `--m:${Math.min(1, m * 1.6)}` }, root));
  svg('text', { class: 'fig-note', x: 40, y: 36 }, root).textContent = t('one weight matrix (illustration)', '一个权重矩阵（示意）');

  const plot = { x: 360, y: 60, w: 250, h: 200 };
  svg('path', { class: 'axis', d: `M${plot.x} ${plot.y}V${plot.y + plot.h}H${plot.x + plot.w}` }, root);
  const density = s => 0.02 ** Math.min(1, s / 6000);
  const y = d => plot.y + plot.h * (1 - Math.log10(d / 0.01) / 2);
  svg('path', { class: 'curve', d: Array.from({ length: 61 }, (_, k) => `${k ? 'L' : 'M'}${plot.x + plot.w * k / 60} ${y(density(k * 200))}`).join('') }, root);
  [[1, '100%'], [0.1, '10%'], [0.02, '2%']].forEach(([d, label]) => svg('text', { class: 'fig-note', x: plot.x - 8, y: y(d) + 4, 'text-anchor': 'end' }, root).textContent = label);
  svg('text', { class: 'fig-note', x: plot.x, y: plot.y + plot.h + 20 }, root).textContent = '0';
  svg('text', { class: 'fig-note', x: plot.x + plot.w, y: plot.y + plot.h + 20, 'text-anchor': 'end' }, root).textContent = t('12,000 steps', '12,000 步');
  const dot = svg('circle', { class: 'pulse', r: 5 }, root);
  const readout = svg('text', { class: 'fig-label', x: plot.x, y: plot.y + plot.h + 50 }, root);

  const control = html('label', 'untangle-control mono', scene);
  control.append(t('training step', '训练步数'));
  const slider = html('input', '', control);
  Object.assign(slider, { type: 'range', min: 0, max: 12000, step: 100, value: 0 });
  slider.setAttribute('aria-label', t('Training step', '训练步数'));

  const show = s => {
    const d = density(s), kept = Math.max(1, Math.round(d * size * size));
    order.forEach((i, rank) => cells[i].classList.toggle('off', rank >= kept));
    dot.setAttribute('cx', plot.x + plot.w * s / 12000);
    dot.setAttribute('cy', y(d));
    readout.textContent = `${t('density', '密度')} ${(d * 100).toFixed(d < 0.1 ? 1 : 0)}% · d256 ${t('non-zero ≈', '非零约')} ${fmt(1598464 * d)}`;
  };
  let frame = 0, touched = false;
  slider.addEventListener('input', () => { touched = true; cancelAnimationFrame(frame); show(+slider.value); });
  return {
    enter() {
      caption(t('After every step, each matrix keeps only its largest weights. The kept share falls from 100% to the target over the first 6,000 steps.', '每一步之后，每个矩阵只保留绝对值最大的那些权重。保留比例在前 6,000 步里从 100% 降到目标值。'));
      if (touched) return;
      if (reduced.matches) return show(+(slider.value = 12000));
      const start = performance.now();
      const tick = now => {
        const s = Math.min(12000, (now - start) * 3);
        slider.value = s;
        show(s);
        if (s < 12000) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    },
    leave() { cancelAnimationFrame(frame); },
  };
}

// ---------- shared log-scale chart frame ----------

function frame(root, { x, y, w, h, lo, hi, label }) {
  const scale = v => y + h * (1 - (Math.log10(v) - lo) / (hi - lo));
  for (let p = Math.ceil(lo); p <= hi; p++) {
    svg('path', { class: 'grid-line', d: `M${x} ${scale(10 ** p)}H${x + w}` }, root);
    svg('text', { class: 'fig-note', x: x - 8, y: scale(10 ** p) + 4, 'text-anchor': 'end' }, root).textContent = fmt(10 ** p);
  }
  svg('text', { class: 'fig-note', x, y: y - 14 }, root).textContent = label;
  return scale;
}

// ---------- finding circuits: every λ, every seed ----------

export function sweep(scene, caption, data) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const box = { x: 90, y: 50, w: 500, h: 280 };
  const lams = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5];
  const yOf = frame(root, { ...box, lo: 2.5, hi: 6.3, label: t('edges kept (log)', '保留的边数（对数）') });
  const xOf = lam => box.x + box.w * lams.indexOf(lam) / (lams.length - 1);
  lams.forEach(lam => svg('text', { class: 'fig-note', x: xOf(lam), y: box.y + box.h + 22, 'text-anchor': 'middle' }, root).textContent = lam);
  svg('text', { class: 'fig-note', x: box.x + box.w, y: box.y - 14, 'text-anchor': 'end' }, root).textContent = t('x: sparsity penalty λ', '横轴：稀疏惩罚 λ');
  const shown = data.zero.filter(c => ['128_1.0', '256_1.0', '256_0.02'].includes(c.id));
  const layer = svg('g', {}, root);
  const legend = svg('g', {}, root);
  shown.forEach((c, k) => {
    svg('circle', { cx: box.x + k * 170, cy: box.y + box.h + 40, r: 4, fill: COLORS[c.id] }, legend);
    svg('text', { class: 'fig-note', x: box.x + 10 + k * 170, y: box.y + box.h + 44 }, legend).textContent = NAMES[c.id];
  });

  return views(scene, TASK_NAMES, ti => {
    const task = data.tasks[ti];
    layer.replaceChildren();
    let degenerate = 0, runs = 0;
    for (const c of shown) {
      svg('path', { class: 'whole', d: `M${box.x} ${yOf(c.nonzero)}H${box.x + box.w}`, stroke: COLORS[c.id] }, layer);
      c.seeds.forEach((s, si) => (s.sweep[task] || []).forEach(([lam, edges, acc]) => {
        runs++;
        if (edges > c.nonzero * 0.5) degenerate++;
        const best = s[task] && s[task].edges === edges && s[task].lam === lam;
        svg('circle', { class: `pt${acc < 0.95 ? ' fail' : ''}${best ? ' best' : ''}`, cx: xOf(lam) + (si - 1) * 7, cy: yOf(edges), r: best ? 5 : 3, fill: COLORS[c.id] }, layer);
      }));
    }
    caption(t(`Each dot is one pruning run; ringed dots are the circuits we kept. Dots on a dashed line kept almost the whole model (${degenerate} of ${runs} runs): at large λ every gate closes and the ranking is lost.`,
      `每个点是一次剪枝，带圈的点是最终采用的电路。落在虚线上的点几乎保留了整个模型（${runs} 次里有 ${degenerate} 次）：λ 太大时所有开关一起关上，排序信息就丢了。`));
  });
}

// ---------- results: circuit size per configuration ----------

export function results(scene, caption, data) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const box = { x: 90, y: 40, w: 520, h: 280 };
  const yOf = frame(root, { ...box, lo: 2.5, hi: 6.2, label: t('smallest circuit, edges (log)', '最小电路的边数（对数）') });
  const cols = data.zero.length, xOf = k => box.x + box.w * (k + 0.5) / cols;
  data.zero.forEach((c, k) => {
    const [kind, ...rest] = NAMES[c.id].split(' ');
    svg('text', { class: 'fig-note small', x: xOf(k), y: box.y + box.h + 22, 'text-anchor': 'middle' }, root).textContent = kind;
    svg('text', { class: 'fig-note small', x: xOf(k), y: box.y + box.h + 36, 'text-anchor': 'middle' }, root).textContent = rest.join(' ') + (c.id === '512_1.0' ? ' †' : '');
  });
  const layer = svg('g', {}, root);
  return views(scene, TASK_NAMES, ti => {
    const task = data.tasks[ti];
    layer.replaceChildren();
    const means = {};
    data.zero.forEach((c, k) => {
      const edges = c.seeds.map(s => s[task]?.edges).filter(Boolean);
      if (!edges.length) return;
      means[c.id] = mean(edges);
      edges.forEach((e, si) => svg('circle', { class: 'pt', cx: xOf(k) + (si - (edges.length - 1) / 2) * 9, cy: yOf(e), r: 4, fill: COLORS[c.id] }, layer));
      svg('path', { class: 'mean-tick', d: `M${xOf(k) - 18} ${yOf(means[c.id])}H${xOf(k) + 18}`, stroke: COLORS[c.id] }, layer);
      svg('text', { class: 'fig-note small', x: xOf(k), y: yOf(means[c.id]) - 10, 'text-anchor': 'middle' }, layer).textContent = `${fmt(means[c.id])}${edges.length < 3 ? ` (n=${edges.length})` : ''}`;
    });
    const ratio = means['128_1.0'] / means['256_0.02'], same = means['256_1.0'] / means['256_0.02'];
    caption(t(`Dots are seeds, ticks are means. Sparse d256 · 2% is ${ratio.toFixed(1)}× smaller than dense d128 and ${same.toFixed(0)}× smaller than dense d256 of the same width.`,
      `每个点是一个种子，短横线是均值。稀疏 d256 · 2% 比稠密 d128 小 ${ratio.toFixed(1)} 倍，比同宽度的稠密 d256 小 ${same.toFixed(0)} 倍。`));
  });
}

// ---------- what predicts circuit size: non-zero weights and width ----------

export function budget(scene, caption, data) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const box = { x: 90, y: 40, w: 500, h: 280 };
  const yOf = frame(root, { ...box, lo: 2.5, hi: 6, label: t('mean smallest circuit (log)', '最小电路均值（对数）') });
  const xOf = v => box.x + box.w * (Math.log10(v) - 4.3) / (7 - 4.3);
  [3e4, 1e5, 1e6, 6e6].forEach(v => svg('text', { class: 'fig-note', x: xOf(v), y: box.y + box.h + 22, 'text-anchor': 'middle' }, root).textContent = fmt(v));
  svg('text', { class: 'fig-note', x: box.x + box.w, y: box.y + box.h + 44, 'text-anchor': 'end' }, root).textContent = t('non-zero weights in the model (log)', '模型中的非零权重数（对数）');
  const layer = svg('g', {}, root);
  return views(scene, TASK_NAMES, ti => {
    const task = data.tasks[ti];
    layer.replaceChildren();
    for (const c of data.zero) {
      const edges = c.seeds.map(s => s[task]?.edges).filter(Boolean);
      if (!edges.length) continue;
      const cx = xOf(c.nonzero), cy = yOf(mean(edges));
      svg('circle', { class: 'pt', cx, cy, r: 3 + c.d / 64, fill: COLORS[c.id], 'fill-opacity': 0.85 }, layer);
      const below = ['256_0.02', '128_0.1'].includes(c.id);
      svg('text', { class: 'fig-note small', x: below ? cx - 4 : cx + 10 + c.d / 64, y: below ? cy + 20 : cy + 4 }, layer).textContent = NAMES[c.id];
    }
    caption(t('Bigger dots are wider models. Among sparse models, fewer non-zero weights means a smaller circuit and width helps; dense models go the other way, growing as they widen.',
      '点越大，模型越宽。稀疏模型里，非零权重越少电路越小，宽度有帮助；稠密模型正好相反，越宽电路越大。'));
  });
}

// ---------- pruning curves: accuracy as edges are added back in order ----------

export function curves(scene, caption, data) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const box = { x: 70, y: 40, w: 530, h: 270 };
  const xOf = k => box.x + box.w * Math.log10(k) / 6.3;
  const yOf = a => box.y + box.h * (1 - a);
  svg('path', { class: 'axis', d: `M${box.x} ${box.y}V${box.y + box.h}H${box.x + box.w}` }, root);
  [1, 1e2, 1e4, 1e6].forEach(k => svg('text', { class: 'fig-note', x: xOf(k), y: box.y + box.h + 20, 'text-anchor': 'middle' }, root).textContent = fmt(k));
  [0, 0.5, 1].forEach(a => svg('text', { class: 'fig-note', x: box.x - 8, y: yOf(a) + 4, 'text-anchor': 'end' }, root).textContent = `${a * 100}%`);
  svg('path', { class: 'grid-line', d: `M${box.x} ${yOf(0.95)}H${box.x + box.w}` }, root);
  svg('text', { class: 'fig-note', x: box.x + box.w, y: yOf(0.95) - 6, 'text-anchor': 'end' }, root).textContent = '95%';
  svg('text', { class: 'fig-note', x: box.x + box.w, y: box.y - 14, 'text-anchor': 'end' }, root).textContent = t('x: edges kept in gate order (log) · y: accuracy', '横轴：按开关强弱保留的边数（对数）· 纵轴：准确率');
  const ids = Object.keys(data.curves);
  ids.forEach((id, k) => {
    svg('circle', { cx: box.x + k * 150, cy: box.y + box.h + 36, r: 4, fill: COLORS[id] }, root);
    svg('text', { class: 'fig-note', x: box.x + 10 + k * 150, y: box.y + box.h + 40 }, root).textContent = NAMES[id];
  });
  const layer = svg('g', {}, root);
  return views(scene, TASK_NAMES, ti => {
    const task = data.tasks[ti];
    layer.replaceChildren();
    const crossings = [];
    for (const id of ids) {
      const { k, acc } = data.curves[id][task];
      svg('path', { class: 'curve-line', stroke: COLORS[id], d: k.map((v, i) => `${i ? 'L' : 'M'}${xOf(v)} ${yOf(acc[i])}`).join('') }, layer);
      const first = k.find((v, i) => acc[i] >= 0.95);
      if (first) {
        svg('circle', { class: 'pt best', cx: xOf(first), cy: yOf(0.95), r: 4, fill: COLORS[id] }, layer);
        crossings.push(`${NAMES[id]} ${fmt(first)}`);
      }
    }
    caption(t(`Seed 0, best λ. Each curve crosses 95% at: ${crossings.join(' · ')}.`, `种子 0，最优 λ。各曲线越过 95% 的位置：${crossings.join(' · ')}。`));
  });
}

// ---------- zero vs mean ablation ----------

export function ablation(scene, caption, data) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const box = { x: 90, y: 40, w: 520, h: 280 };
  const yOf = frame(root, { ...box, lo: 2.5, hi: 5.8, label: t('smallest circuit, edges (log)', '最小电路的边数（对数）') });
  const ids = data.mean.map(c => c.id);
  const xOf = (k, j) => box.x + box.w * (k + 0.5) / ids.length + (j ? 30 : -30);
  ids.forEach((id, k) => {
    svg('text', { class: 'fig-note', x: xOf(k, 0) + 30, y: box.y + box.h + 22, 'text-anchor': 'middle' }, root).textContent = NAMES[id];
    [t('zero', '零'), t('mean', '均值')].forEach((label, j) => svg('text', { class: 'fig-note small', x: xOf(k, j), y: box.y + box.h + 38, 'text-anchor': 'middle' }, root).textContent = label);
  });
  const layer = svg('g', {}, root);
  return views(scene, TASK_NAMES, ti => {
    const task = data.tasks[ti];
    layer.replaceChildren();
    const means = {};
    ids.forEach((id, k) => [data.zero, data.mean].forEach((group, j) => {
      const edges = group.find(c => c.id === id).seeds.map(s => s[task]?.edges).filter(Boolean);
      const m = mean(edges);
      if (j) means[id] = m;
      edges.forEach((e, si) => svg('circle', { class: `pt${j ? '' : ' hollow'}`, cx: xOf(k, j) + (si - 1) * 8, cy: yOf(e), r: 4, fill: COLORS[id], stroke: COLORS[id] }, layer));
      svg('path', { class: 'mean-tick', d: `M${xOf(k, j) - 16} ${yOf(m)}H${xOf(k, j) + 16}`, stroke: COLORS[id] }, layer);
      svg('text', { class: 'fig-note small', x: xOf(k, j), y: yOf(m) - 10, 'text-anchor': 'middle' }, layer).textContent = fmt(m);
    }));
    const r1 = means['128_1.0'] / means['256_0.02'], r2 = means['256_1.0'] / means['256_0.02'];
    caption(t(`Hollow: removed weights set to zero. Filled: replaced by their average input. With mean ablation, sparse d256 · 2% is ${r1.toFixed(1)}× smaller than dense d128 and ${r2.toFixed(1)}× smaller than dense d256.`,
      `空心：被去掉的权重置零。实心：用平均输入替代。均值消融下，稀疏 d256 · 2% 比稠密 d128 小 ${r1.toFixed(1)} 倍，比稠密 d256 小 ${r2.toFixed(1)} 倍。`));
  });
}

// ---------- what a circuit looks like: every kept weight, per matrix ----------

const SHAPES = d => ({
  'emb.weight': [38, d], 'pos.weight': [24, d], 'unemb.weight': [38, d],
  ...Object.fromEntries([0, 1].flatMap(l => [[`blocks.${l}.qkv.weight`, [3 * d, d]], [`blocks.${l}.o.weight`, [d, d]], [`blocks.${l}.up.weight`, [4 * d, d]], [`blocks.${l}.down.weight`, [d, 4 * d]]])),
});
const PANELS = [['emb.weight', t('embed', '嵌入')], ['pos.weight', t('position', '位置')], ['blocks.0.qkv.weight', 'L0 qkv'], ['blocks.0.o.weight', 'L0 out'], ['blocks.0.up.weight', 'L0 up'], ['blocks.0.down.weight', 'L0 down'],
  ['blocks.1.qkv.weight', 'L1 qkv'], ['blocks.1.o.weight', 'L1 out'], ['blocks.1.up.weight', 'L1 up'], ['blocks.1.down.weight', 'L1 down'], ['unemb.weight', t('unembed', '反嵌入')]];
const TASK_COLORS = ['#d4ff63', '#86e0c8', '#f3c070'];

// Residual-stream dimensions and MLP neurons that a circuit touches.
function footprint(masks, d) {
  const shapes = SHAPES(d), dims = new Set(), neurons = new Set();
  for (const [name, idx] of Object.entries(masks)) {
    const cols = shapes[name][1];
    for (const i of idx) {
      const row = Math.floor(i / cols), col = i % cols;
      if (/\.(o|down)\./.test(name)) dims.add(row); else dims.add(col);
      if (name.includes('.up.')) neurons.add(`${name[7]}:${row}`);
      if (name.includes('.down.')) neurons.add(`${name[7]}:${col}`);
    }
  }
  return { dims: dims.size, neurons: neurons.size };
}

export function anatomy(scene, caption, data, circuits) {
  const canvas = html('canvas', 'threads', scene);
  const ids = ['128_1.0', '256_0.02'];
  let id = ids[0], ctx, w, h;
  const draw = () => {
    const d = Number(id.split('_')[0]), shapes = SHAPES(d), masks = circuits[id];
    ctx.clearRect(0, 0, w, h);
    const narrow = w < 500, cols = narrow ? 4 : 6, rows = Math.ceil(PANELS.length / cols), gap = 14;
    const size = Math.min((w - 40 - gap * (cols - 1)) / cols, (h - 120) / rows - 34);
    PANELS.forEach(([name, label], p) => {
      const x = 20 + (p % cols) * (size + gap), y = 60 + Math.floor(p / cols) * (size + 38);
      const [rows, columns] = shapes[name];
      const scale = size / Math.max(rows, columns), pw = columns * scale, ph = rows * scale;
      ctx.fillStyle = '#ffffff08';
      ctx.fillRect(x, y, pw, ph);
      let count = 0;
      data.tasks.forEach((task, ti) => {
        ctx.fillStyle = TASK_COLORS[ti];
        for (const i of masks[task][name] || []) {
          ctx.fillRect(x + (i % columns) * scale, y + Math.floor(i / columns) * scale, Math.max(1, scale), Math.max(1, scale));
          count++;
        }
      });
      ctx.font = `${narrow ? 9 : 10}px "IBM Plex Mono", monospace`;
      ctx.fillStyle = '#8d9a80';
      if (narrow) { ctx.fillText(label, x, y - 18); ctx.fillText(fmt(count), x, y - 6); }
      else ctx.fillText(`${label} · ${fmt(count)}`, x, y - 6);
    });
    TASK_NAMES.forEach((name, ti) => {
      ctx.fillStyle = TASK_COLORS[ti];
      ctx.fillRect(20 + ti * 90, 10, 8, 8);
      ctx.fillStyle = '#a3b195';
      ctx.fillText(name, 34 + ti * 90, 18);
    });
  };
  const resize = () => { ({ ctx, w, h } = fitCanvas(canvas)); draw(); };
  new ResizeObserver(() => ctx && resize()).observe(canvas);
  const bar = views(scene, ids.map(i => NAMES[i]), i => {
    id = ids[i];
    if (ctx) draw();
    const d = Number(id.split('_')[0]), q = footprint(circuits[id].quote, d);
    caption(t(`Every weight the seed-0 circuits keep, drawn at its place in its matrix. The quote circuit touches ${q.dims} of ${d} residual dimensions and ${q.neurons} of ${8 * d} MLP neurons.`,
      `种子 0 的电路保留的每一个权重，画在它所在矩阵中的位置上。引号电路用到了 ${d} 个残差维度中的 ${q.dims} 个，${8 * d} 个 MLP 神经元中的 ${q.neurons} 个。`));
  });
  return { enter() { resize(); bar.enter(); }, leave: bar.leave };
}

// ---------- a small accuracy grid shared by the knockout and merge figures ----------

function grid(box, rows, cols, cells) {
  box.replaceChildren();
  box.style.gridTemplateColumns = `auto repeat(${cols.length}, minmax(0, 1fr))`;
  html('span', 'acc-label', box);
  cols.forEach(c => { html('span', 'acc-head', box).textContent = c; });
  rows.forEach((label, r) => {
    html('span', 'acc-label', box).textContent = label;
    cols.forEach((_, c) => {
      const v = cells[r][c];
      const cell = html('span', v < 0.5 ? 'acc-cell low' : 'acc-cell', box);
      cell.style.setProperty('--v', v);
      cell.textContent = `${Math.round(v * 100)}%`;
    });
  });
}

// ---------- remove one skill's own wires and test all three ----------

export function knockout(scene, caption, data) {
  const box = html('div', 'acc-grid mono', scene);
  const VIEWS = [
    ['256_0.02', 'knockout', t('Sparse: removing each puzzle’s own wires breaks only that puzzle. Nothing else is touched.', '稀疏模型：删掉哪道题自己的连线，就只坏哪道题，其他题几乎不受影响。')],
    ['256_0.02', 'random', t('Control: removing the same number of random wires does far less damage.', '对照：随机删掉同样多的连线，造成的损伤小得多。')],
    ['128_1.0', 'knockout', t('Dense: also mostly separate, but the quote skill survives at 58%. It has backup routes outside its own wires.', '稠密模型：也基本分得开，但删掉引号的连线后，引号仍能对 58%。它在自己的连线之外还有备用路径。')],
  ];
  const deleted = [t('− quote wires', '删引号的'), t('− bracket wires', '删括号的'), t('− look-up wires', '删查找的')];
  return views(scene, [t('Sparse', '稀疏'), t('Random', '随机对照'), t('Dense', '稠密')], i => {
    const [cfg, kind, line] = VIEWS[i];
    const k = data.knockout[cfg];
    const rows = [...deleted, t('keep quote + bracket only', '只留引号+括号')];
    const cells = [...data.tasks.map(T => data.tasks.map(task => k[kind][T][task])), data.tasks.map(task => k.union_qb[task])];
    grid(box, rows, TASK_NAMES, cells);
    caption(i === 2 ? `${line} ${t(`Keeping only the quote and bracket circuits, quotes fall to ${Math.round(k.union_qb.quote * 100)}%.`, `只保留引号和括号两个电路时，引号掉到 ${Math.round(k.union_qb.quote * 100)}%。`)}` : line);
  });
}

// ---------- read the quote circuit: one head looks back at the open quote ----------

export function reading(scene, caption, data) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const again = html('button', 'scene-btn mono', scene);
  again.type = 'button';
  again.textContent = t('Another example ↻', '换一个例子 ↻');
  const ids = ['128_1.0', '256_0.02'];
  let id = ids[0], example = 0;
  const draw = () => {
    root.replaceChildren();
    const r = data.reading[id];
    const { tokens, quote_pos, attn } = r.examples[example];
    const start = tokens.findIndex(tok => tok !== 'PAD');
    const shown = tokens.slice(start), step = Math.min(44, 560 / shown.length);
    svg('text', { class: 'fig-note', x: 40, y: 34 }, root).textContent = t(`head ${r.best}: where the last position looks`, `注意力头 ${r.best}：最后一个位置在看哪里`);
    shown.forEach((tok, i) => {
      const x = 40 + i * step, a = attn[start + i], hit = start + i === quote_pos;
      svg('rect', { class: `attn-bar${hit ? ' hit' : ''}`, x: x + 4, y: 190 - a * 130, width: step - 8, height: Math.max(1, a * 130) }, root);
      svg('text', { class: `attn-tok${hit ? ' hit' : ''}`, x: x + step / 2, y: 212, 'text-anchor': 'middle' }, root).textContent = tok === '<q>' ? '▸' : tok;
    });
    svg('text', { class: 'fig-note', x: 40, y: 262 }, root).textContent = t('accuracy with one head switched off', '关掉单个注意力头后的准确率');
    Object.entries(r.head_ablation).forEach(([head, acc], i) => {
      const x = 40 + i * 70, key = head === r.best;
      svg('rect', { class: `abl-bar${key ? ' hit' : ''}`, x, y: 360 - acc * 80, width: 44, height: acc * 80 }, root);
      svg('text', { class: 'fig-note small', x: x + 22, y: 376, 'text-anchor': 'middle' }, root).textContent = head;
      svg('text', { class: 'fig-note small', x: x + 22, y: 354 - acc * 80, 'text-anchor': 'middle' }, root).textContent = `${Math.round(acc * 100)}%`;
    });
    caption(t(`${NAMES[id]}, ${fmt(r.circuit_size)}-wire circuit. One head looks back at the unpaired quote and copies its kind; switch that head off and the circuit is reduced to guessing.`,
      `${NAMES[id]}，${fmt(r.circuit_size)} 根连线的电路。一个注意力头回头盯住那个没配对的引号，把它的类型抄过来；关掉这个头，电路就只能瞎猜。`));
  };
  again.addEventListener('click', () => { example = (example + 1) % data.reading[id].examples.length; draw(); });
  return views(scene, ids.map(i => NAMES[i]), i => { id = ids[i]; example = 0; draw(); });
}

// ---------- bolting separately learned skills together ----------

export function merging(scene, caption, data) {
  const box = html('div', 'acc-grid mono', scene);
  const VIEWS = [
    ['dense_full', t('Dense base, every weight free to change. Each copy forgets the look-up puzzle, and the merge loses it entirely.', '稠密底座，所有权重都能改。每个副本都把查找题忘了，合并后彻底丢失。')],
    ['sparse_split', t('Sparse base kept frozen, each new skill written only into its own empty slots. The copies still forget, and the merge fails.', '冻结稀疏底座，每项新本领只写进各自的空位。副本仍然会遗忘，合并也失败了。')],
    ['sparse_replay', t('Same, plus a little practice on the old puzzle. Each copy now keeps all three skills, yet the merge still breaks: two pieces learned apart do not fit together.', '同上，再让它们顺带复习一点旧题。现在每个副本都保住了全部本领，合并后却仍然会坏：分开学的两块拼不到一起。')],
    ['channels', t('Each skill gets its own private channel inside the model. Inside, the two no longer touch at all, and the old skill is fully kept. What is left is a clash at the very end: each module also answers puzzles that are not its own.', '给每项本领开一条模型内部的专用通道。两者在内部完全不再接触，旧本领也完整保住了。剩下的冲突只在最后输出那一步：每个模块对不属于自己的题也会发表意见。')],
  ];
  const rows = [t('base (look-up only)', '底座（只会查找）'), t('copy that learned quotes', '学了引号的副本'), t('copy that learned brackets', '学了括号的副本'), t('both bolted together', '两者拼在一起')];
  return views(scene, [t('Dense', '稠密'), t('Sparse slots', '稀疏空位'), t('+ practice', '+ 复习'), t('Own channels', '专用通道')], i => {
    const [key, line] = VIEWS[i], m = data.merges[key];
    grid(box, rows, TASK_NAMES, ['base', 'quote', 'bracket', 'merged'].map(r => data.tasks.map(task => m[r][task])));
    caption(line);
  });
}

// ---------- after bolting together: how fast does a short joint lesson repair it? ----------

const STARTS = [
  ['dense_merged', t('dense, merged', '稠密·拼装后'), '#86e0c8', false],
  ['sparse_merged', t('sparse, merged', '稀疏·拼装后'), '#d4ff63', false],
  ['dense_base', t('dense, from base', '稠密·从底座学'), '#86e0c8', true],
  ['sparse_base', t('sparse, from base', '稀疏·从底座学'), '#d4ff63', true],
];

export function recovery(scene, caption, data) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const box = { x: 70, y: 50, w: 520, h: 250 };
  const steps = data.recovery.dense_merged.steps;
  const xOf = k => box.x + box.w * steps.indexOf(k) / (steps.length - 1);
  const yOf = a => box.y + box.h * (1 - a);
  svg('path', { class: 'axis', d: `M${box.x} ${box.y}V${box.y + box.h}H${box.x + box.w}` }, root);
  steps.forEach(k => svg('text', { class: 'fig-note', x: xOf(k), y: box.y + box.h + 20, 'text-anchor': 'middle' }, root).textContent = k);
  [0, 0.5, 1].forEach(a => svg('text', { class: 'fig-note', x: box.x - 8, y: yOf(a) + 4, 'text-anchor': 'end' }, root).textContent = `${a * 100}%`);
  svg('path', { class: 'grid-line', d: `M${box.x} ${yOf(0.95)}H${box.x + box.w}` }, root);
  svg('text', { class: 'fig-note', x: box.x, y: box.y - 16 }, root).textContent = t('weakest of the three puzzles', '三道题里最差的那一道');
  svg('text', { class: 'fig-note', x: box.x + box.w, y: box.y - 16, 'text-anchor': 'end' }, root).textContent = t('x: training steps on all three puzzles', '横轴：用三种题一起训练的步数');
  STARTS.forEach(([key, label, color, dashed], i) => {
    const { acc, steps_to_95 } = data.recovery[key];
    const low = steps.map((_, j) => Math.min(...data.tasks.map(task => acc[task][j])));
    svg('path', { class: 'curve-line', stroke: color, 'stroke-dasharray': dashed ? '5 5' : '', d: steps.map((k, j) => `${j ? 'L' : 'M'}${xOf(k)} ${yOf(low[j])}`).join('') }, root);
    const lx = box.x + (i % 2) * 260, ly = box.y + box.h + 44 + Math.floor(i / 2) * 18;
    svg('path', { class: 'curve-line', stroke: color, 'stroke-dasharray': dashed ? '5 5' : '', d: `M${lx} ${ly - 4}h22` }, root);
    svg('text', { class: 'fig-note', x: lx + 30, y: ly }, root).textContent = `${label} · ${steps_to_95 ? `${steps_to_95} ${t('steps', '步')}` : '>400'}`;
  });
  return {
    enter() { caption(t('Bolted together, 50–100 joint steps repair all three puzzles; learning from the base takes 400 or more.', '拼装后再一起练 50～100 步，三道题都恢复了；从底座学则要 400 步以上。')); },
    leave() {},
  };
}

// ---------- the missing rule: stay silent on puzzles that are not yours ----------

export function abstain(scene, caption, data) {
  const box = html('div', 'acc-grid mono', scene);
  const rows = [t('base (look-up only)', '底座（只会查找）'), t('quote piece only', '只装引号模块'), t('bracket piece only', '只装括号模块'), t('both pieces', '两个都装')];
  const VIEWS = [
    ['channels', t('Own channels only', '只有专用通道')],
    ['abstain', t('+ stay silent', '+ 弃权规则')],
    ['oracle', t('Ceiling', '上限对照')],
  ];
  return views(scene, VIEWS.map(([, label]) => label), i => {
    const m = data.merges[VIEWS[i][0]];
    grid(box, rows, TASK_NAMES, ['base', 'quote', 'bracket', 'merged'].map(r => data.tasks.map(task => m[r][task])));
    const share = Math.round(m.error_from_other_module.quote.fraction * 1000) / 10;
    caption([
      t(`Without the rule, ${share}% of quote mistakes come from the other piece chiming in.`, `没有这条规则时，引号题的错误里有 ${share}% 是另一块插嘴造成的。`),
      t('Trained to stay silent on random strings, the pieces work together exactly as well as alone: putting them together costs nothing.', '用随机符号串练会“不是我的题就闭嘴”之后，两块装在一起和单独装时完全一样：拼装本身没有任何损失。'),
      t('Ceiling: practising silence on the other piece’s real puzzles, which a real piece could never see. Random strings come within 2–3 points of it.', '上限对照：直接拿对方的真实题目练习闭嘴，真实场景里做不到这一点。用随机符号串练出来的，离这个上限只差 2～3 个百分点。'),
    ][i]);
  });
}
