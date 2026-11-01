import { t, svg, random, views } from '/js/util.js';

const WORDS = [
  { word: t('Paris', '巴黎'), active: [[t('France', '法国'), 0.9], [t('capital city', '首都城市'), 0.7], [t('European place', '欧洲地名'), 0.4]], error: 12 },
  { word: 'Python', active: [[t('programming language', '编程语言'), 0.85], [t('code syntax', '代码语法'), 0.5], [t('snakes', '蛇'), 0.15]], error: 19 },
  { word: t('Monday', '星期一'), active: [[t('day of the week', '星期几'), 0.95], [t('start of a week', '一周的开始'), 0.45]], error: 8 },
];

// Sparse autoencoder: a dense activation in, a few named features out, and the part it could not explain.
export function sae(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  svg('text', { class: 'fig-label', x: 30, y: 36 }, root).textContent = t('ACTIVATION (DENSE)', '激活（稠密）');
  svg('text', { class: 'fig-label', x: 360, y: 36 }, root).textContent = t('FEATURES (SPARSE)', '特征（稀疏）');
  const dense = Array.from({ length: 16 }, (_, i) => svg('rect', { class: 'dense-bar', x: 30 + i * 16, width: 10 }, root));
  svg('path', { class: 'wire', d: 'M300 170H345' }, root);
  svg('text', { class: 'fig-note', x: 322, y: 160, 'text-anchor': 'middle' }, root).textContent = t('encode', '编码');
  const slots = Array.from({ length: 3 }, (_, i) => {
    const g = svg('g', {}, root);
    const bar = svg('rect', { class: 'feature-bar', x: 360, y: 72 + i * 56, height: 18 }, g);
    const label = svg('text', { class: 'fig-note', x: 360, y: 66 + i * 56 }, g);
    return { g, bar, label };
  });
  svg('text', { class: 'fig-note', x: 360, y: 252 }, root).textContent = t('…and millions of other features that stay at zero', '……以及数百万个保持为零的其他特征');
  svg('text', { class: 'fig-label', x: 30, y: 312 }, root).textContent = t('RECONSTRUCTION', '重建');
  svg('rect', { class: 'recon-track', x: 30, y: 324, width: 580, height: 16 }, root);
  const explained = svg('rect', { class: 'recon-fill', x: 30, y: 324, height: 16 }, root);
  const errorLabel = svg('text', { class: 'fig-note', x: 610, y: 362, 'text-anchor': 'end' }, root);

  const next = random(17);
  return views(scene, WORDS.map(w => w.word), i => {
    const { active, error } = WORDS[i];
    dense.forEach(bar => {
      const v = (next() - 0.5) * 2;
      bar.setAttribute('y', 170 - Math.max(v, 0) * 90);
      bar.setAttribute('height', Math.abs(v) * 90);
    });
    slots.forEach(({ g, bar, label }, k) => {
      g.classList.toggle('gone', !active[k]);
      if (!active[k]) return;
      bar.setAttribute('width', active[k][1] * 240);
      label.textContent = active[k][0];
    });
    explained.setAttribute('width', 580 * (100 - error) / 100);
    errorLabel.textContent = `${t('unexplained “dark matter”', '无法解释的“暗物质”')} ${error}%`;
    caption(t('Every neuron is busy, but only a handful of features fire, each with a readable meaning. Some of the signal is always left over.', '每个神经元都在动，但只有少数几个特征被激活，而且每个都有可读的含义。总有一部分信号拆不出来。'));
  });
}

const TRANSCODER = [
  t('A normal MLP layer: dense in, dense out. We see what goes in and out, not what happens inside.', '普通的 MLP 层：稠密进、稠密出。看得到进出，看不到中间。'),
  t('A transcoder imitates the MLP with sparse features, so each step from input to output is readable. The gap it cannot imitate is the error.', 'Transcoder 用稀疏特征去模仿 MLP，于是从输入到输出的每一步都可读。模仿不到的差距就是误差。'),
  t('A cross-layer transcoder lets one feature write into every later layer, so circuits across many layers become one graph.', '跨层 transcoder 让一个特征可以写入后面所有层，跨越多层的电路就能连成一张图。'),
];

// Transcoders: replace an MLP by a sparse imitation, then let features reach across layers.
export function transcoder(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400', class: 'tc' }, scene);
  const layerY = [330, 240, 150, 60];
  layerY.forEach((y, i) => {
    svg('path', { class: 'divider', d: `M40 ${y}H600` }, root);
    svg('text', { class: 'fig-note', x: 30, y: y + 4, 'text-anchor': 'end' }, root).textContent = `L${i}`;
  });
  const mlp = svg('g', { class: 'tc-mlp' }, root);
  svg('rect', { class: 'box', x: 250, y: 255, width: 140, height: 60 }, mlp);
  svg('text', { class: 'fig-note', x: 320, y: 290, 'text-anchor': 'middle' }, mlp).textContent = 'MLP';

  const sparse = svg('g', { class: 'tc-sparse' }, root);
  const ins = [200, 280, 360, 440].map(x => svg('circle', { class: 'tc-node', cx: x, cy: 315, r: 5 }, sparse));
  const outs = [230, 320, 410].map(x => svg('circle', { class: 'tc-node', cx: x, cy: 255, r: 5 }, sparse));
  [[0, 0], [1, 1], [2, 1], [3, 2]].forEach(([a, b]) => svg('path', { class: 'tc-edge', d: `M${ins[a].getAttribute('cx')} 310L${outs[b].getAttribute('cx')} 260` }, sparse));
  svg('path', { class: 'tc-error', d: 'M500 315C540 300 540 270 500 255' }, sparse);
  svg('text', { class: 'fig-note', x: 548, y: 289 }, sparse).textContent = t('error', '误差');

  const cross = svg('g', { class: 'tc-cross' }, root);
  [240, 150, 60].forEach((y, i) => svg('path', { class: 'tc-edge long', d: `M280 315C280 ${y + 80} ${300 + i * 60} ${y + 40} ${300 + i * 60} ${y + 5}` }, cross));
  [240, 150, 60].forEach((y, i) => svg('circle', { class: 'tc-node', cx: 300 + i * 60, cy: y, r: 5 }, cross));

  return views(scene, ['MLP', 'transcoder', t('cross-layer', '跨层')], i => {
    root.dataset.view = i;
    caption(TRANSCODER[i]);
  });
}

const DIFF = [
  [t('French', '法语'), 0.8, 0.8, 'shared'], [t('Python code', 'Python 代码'), 0.7, 0.75, 'shared'],
  [t('declines harmful requests', '拒绝有害请求'), 0.02, 0.85, 'new'], [t('assistant persona', '助手人格'), 0.05, 0.9, 'new'],
  [t('end of a turn', '一轮对话结束'), 0.1, 0.7, 'new artifact'], [t('polite hedging', '礼貌性的含糊'), 0.2, 0.65, 'new artifact'],
  [t('forum signatures', '论坛签名'), 0.6, 0.05, 'old'],
];

// Crosscoders: one dictionary for two models, so features can be compared as a diff.
export function crosscoder(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  svg('text', { class: 'fig-label', x: 380, y: 36, 'text-anchor': 'middle' }, root).textContent = 'BASE';
  svg('text', { class: 'fig-label alt', x: 520, y: 36, 'text-anchor': 'middle' }, root).textContent = 'CHAT';
  const rows = DIFF.map(([label, base, chat, kind], i) => {
    const g = svg('g', { class: `diff-row ${kind}` }, root);
    const y = 70 + i * 44;
    svg('text', { class: 'fig-note', x: 300, y: y + 4, 'text-anchor': 'end' }, g).textContent = label;
    svg('rect', { class: 'diff-bar in-base', x: 320, y: y - 7, width: base * 120, height: 14 }, g);
    svg('rect', { class: 'diff-bar in-chat', x: 460, y: y - 7, width: chat * 120, height: 14 }, g);
    svg('text', { class: 'fig-note warn-note', x: 590, y: y + 4 }, g).textContent = '?';
    return g;
  });
  const lines = [
    t('Both models share one dictionary, so each feature shows its strength in base and in chat.', '两个模型共用一套字典，每个特征在基座和对话模型里的强度可以直接对比。'),
    t('The diff: features that only exist after chat training.', 'Diff：只在对话训练之后才出现的特征。'),
    t('But the training objective can make shared features look chat-only. Every diff needs checking.', '但训练目标可能让两个模型共有的特征看起来像“对话专属”。每一条 diff 都需要验证。'),
  ];
  return views(scene, [t('All', '全部'), t('Chat-only', '对话专属'), t('Check', '验证')], i => {
    root.dataset.view = i;
    caption(lines[i]);
  });
}
