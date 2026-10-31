import { t, reduced, svg, html, random, views } from './util.js';

const MILESTONES = [
  ['2020', 'Zoom In: An Introduction to Circuits', 'OpenAI', 'https://distill.pub/2020/circuits/zoom-in/',
    t('Circuits found inside an image model: curve detectors and how they are wired together.', '在图像模型里找到“电路”：曲线检测器等神经元以及它们之间的连接。')],
  ['2021', 'A Mathematical Framework for Transformer Circuits', 'Anthropic', 'https://transformer-circuits.pub/2021/framework/index.html',
    t('A way to read transformers as circuits, starting from the smallest models.', '从最小的模型入手，把 Transformer 当作电路来读的数学框架。')],
  ['2022', 'Toy Models of Superposition', 'Anthropic', 'https://transformer-circuits.pub/2022/toy_model/index.html',
    t('Why one neuron carries many concepts: superposition, reproduced in small models.', '用小模型复现叠加：为什么一个神经元会承载多个概念。')],
  ['2023', 'Towards Monosemanticity', 'Anthropic', 'https://transformer-circuits.pub/2023/monosemantic-features/index.html',
    t('Sparse autoencoders pull clean, single-meaning features out of a small transformer.', '稀疏自编码器从小型 Transformer 中拆出干净的单义特征。')],
  ['2024', 'Scaling Monosemanticity', 'Anthropic', 'https://transformer-circuits.pub/2024/scaling-monosemanticity/',
    t('Millions of features found in Claude 3 Sonnet, a production model.', '在生产级模型 Claude 3 Sonnet 中找到数百万个特征。')],
  ['2025', 'Circuit Tracing', 'Anthropic', 'https://transformer-circuits.pub/2025/attribution-graphs/methods.html',
    t('Attribution graphs trace a model’s step-by-step computation on a single prompt.', '归因图追踪模型在单个提示词上逐步的计算过程。')],
  ['2026', 'Natural Language Autoencoders', 'Anthropic', 'https://transformer-circuits.pub/2026/nla/index.html',
    t('A model is trained to describe its own activations in plain language.', '训练模型用自然语言描述自己的内部激活。')],
];

// 4.1 Milestones on a timeline, cycling until the reader picks one.
export function timeline(scene, caption) {
  const box = html('div', 'timeline', scene);
  const track = html('div', 'timeline-track', box);
  const card = html('div', 'timeline-card', box);
  let current = -1, timer = 0, held = false;
  const select = i => {
    if (i === current) return;
    current = i;
    buttons.forEach((button, j) => button.classList.toggle('on', j <= i));
    buttons.forEach((button, j) => button.setAttribute('aria-current', i === j));
    const [year, title, lab, url, summary] = MILESTONES[i];
    card.replaceChildren();
    html('span', 'mono timeline-meta', card).textContent = `${year} · ${lab}`;
    html('h4', '', card).textContent = title;
    html('p', '', card).textContent = summary;
    const link = html('a', 'mono', card);
    Object.assign(link, { href: url, target: '_blank', rel: 'noopener', textContent: t('Read the paper ↗', '阅读原文 ↗') });
    card.classList.remove('fresh');
    card.getBoundingClientRect();
    card.classList.add('fresh');
  };
  const buttons = MILESTONES.map(([year], i) => {
    const button = html('button', 'mono', track);
    button.type = 'button';
    button.textContent = year;
    button.addEventListener('pointerenter', () => select(i));
    button.addEventListener('click', () => { held = true; select(i); });
    return button;
  });
  box.addEventListener('pointerenter', () => { held = true; });

  return {
    enter() {
      caption(t('From curve detectors in an image model to language models that describe themselves.', '从图像模型里的曲线检测器，到会描述自己的语言模型。'));
      select(held && current >= 0 ? current : reduced.matches ? MILESTONES.length - 1 : 0);
      if (!held && !reduced.matches) timer = setInterval(() => (!held && current < MILESTONES.length - 1 ? select(current + 1) : clearInterval(timer)), 2400);
    },
    leave() { clearInterval(timer); },
  };
}

// 4.2 A hundred prompts, about a quarter of them explained, each with an unexplained remainder.
export function coverage(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400', class: 'coverage' }, scene);
  const next = random(25);
  const order = Array.from({ length: 100 }, (_, i) => [next(), i]).sort((a, b) => a[0] - b[0]).map(([, i]) => i);
  const lit = new Set(order.slice(0, 25));
  let shown = 0;
  for (let i = 0; i < 100; i++) {
    const x = 170 + (i % 10) * 30, y = 40 + Math.floor(i / 10) * 30;
    if (!lit.has(i)) { svg('rect', { class: 'prompt', x, y, width: 22, height: 22 }, root); continue; }
    const g = svg('g', { class: 'prompt-lit' }, root);
    g.style.transitionDelay = `${0.3 + shown++ * 0.06}s`;
    svg('rect', { class: 'prompt explained', x, y, width: 22, height: 22 }, g);
    svg('rect', { class: 'prompt dark', x: x + 13, y, width: 9, height: 22 }, g);
  }
  [[t('explained', '可以解释'), 'explained', 170], [t('unexplained “dark matter”', '无法解释的“暗物质”'), 'dark', 300]].forEach(([label, kind, x]) => {
    svg('rect', { class: `prompt ${kind}`, x, y: 352, width: 10, height: 10 }, root);
    svg('text', { class: 'fig-note', x: x + 18, y: 361 }, root).textContent = label;
  });

  return {
    enter() {
      root.classList.add('reset');
      root.classList.remove('lit');
      root.getBoundingClientRect();
      root.classList.remove('reset');
      root.classList.add('lit');
      caption(t('100 prompts: about a quarter get a satisfying explanation, and even those keep a share of unexplained “dark matter”.', '100 个提示词：大约四分之一能得到令人满意的解释，而它们内部仍有一部分无法解释的“暗物质”。'));
    },
    leave() {},
  };
}

const RUNS = [
  { cuts: [0, 120, 240, 360], labels: [t('animals', '动物'), t('vehicles', '交通工具'), t('food', '食物')] },
  { cuts: [10, 60, 125, 185, 245, 370], labels: [t('cats', '猫'), t('dogs', '狗'), t('cars', '汽车'), t('boats', '船'), t('food', '食物')] },
];
const HUES = ['#d4ff63', '#86e0c8', '#f3c070', '#b7a6ff', '#ff9a8a'];
const sector = (cuts, deg) => {
  const d = deg < cuts[0] ? deg + 360 : deg;
  return cuts.findIndex((cut, k) => d >= cut && d < cuts[k + 1]);
};

// 4.3 Two dictionaries over the same activations, carving them up differently.
export function splits(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const next = random(4096);
  const points = Array.from({ length: 140 }, () => {
    const deg = next() * 360, r = 40 + Math.sqrt(next()) * 110;
    const dot = svg('circle', { class: 'point', cx: 320 + Math.cos(deg * Math.PI / 180) * r, cy: 190 + Math.sin(deg * Math.PI / 180) * r, r: 3 }, root);
    return { dot, groups: RUNS.map(run => sector(run.cuts, deg)) };
  });
  const labelSets = RUNS.map(({ cuts, labels }) => {
    const g = svg('g', { class: 'run-labels' }, root);
    labels.forEach((label, k) => {
      const mid = (cuts[k] + cuts[k + 1]) / 2 * Math.PI / 180;
      const text = svg('text', { x: 320 + Math.cos(mid) * 178, y: 194 + Math.sin(mid) * 168, 'text-anchor': 'middle', fill: HUES[k] }, g);
      text.textContent = label;
    });
    return g;
  });

  const lines = [
    t('Run A: a smaller dictionary finds three features.', '训练 A：较小的字典找到三个特征。'),
    t('Run B: same model, larger dictionary. Features split and the boundaries move. Which set is real?', '训练 B：同一个模型，更大的字典。特征分裂了，边界也移动了。哪一套才是“真实”的？'),
  ];
  return views(scene, [t('Run A', '训练 A'), t('Run B', '训练 B')], i => {
    points.forEach(({ dot, groups }) => dot.setAttribute('fill', HUES[groups[i]]));
    labelSets.forEach((g, j) => g.classList.toggle('gone', i !== j));
    caption(lines[i]);
  });
}

// 4.4 One prompt understood by hand, set against everything a model answers.
export function scale(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400', class: 'scale-fig' }, scene);
  const field = svg('g', { class: 'field' }, root);
  const next = random(7);
  for (let i = 0; i < 1400; i++) svg('circle', { cx: 20 + next() * 600, cy: 20 + next() * 360, r: 1.1 }, field);
  const one = svg('g', { class: 'one' }, root);
  svg('circle', { cx: 320, cy: 200, r: 5 }, one);
  svg('text', { class: 'fig-note', x: 320, y: 178, 'text-anchor': 'middle' }, one).textContent = t('1 prompt · a few hours of expert work', '1 个提示词 · 专家数小时的工作');

  let timer = 0;
  const lines = [
    t('Reading the circuit behind one short prompt takes a researcher a few hours.', '读懂一个短提示词背后的电路，要研究员花上几个小时。'),
    t('A deployed model answers far more than anyone could read. Interpretation has to be automated.', '而一个上线的模型回答的数量，远远超出任何人读得完的范围。解释必须自动化。'),
  ];
  return {
    enter() {
      root.classList.add('reset');
      root.classList.remove('wide');
      root.getBoundingClientRect();
      root.classList.remove('reset');
      caption(lines[0]);
      const widen = () => { root.classList.add('wide'); caption(lines[1]); };
      if (reduced.matches) widen();
      else timer = setTimeout(widen, 2200);
    },
    leave() { clearTimeout(timer); },
  };
}
