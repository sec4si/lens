import { t, zh, reduced, svg, html, chip, random, rise, views } from '/js/util.js';

const IOI_TOKENS = zh ? ['玛丽', '和', '约翰', '……', '约翰', '把饮料', '递给'] : ['Mary', 'and', 'John', '…', 'John', 'gave…', 'to'];
const IOI_STAGES = [
  { heads: [], lit: [], caption: t('“When Mary and John went to the store, John gave a drink to …” The answer is Mary.', '“玛丽和约翰去了商店，约翰把饮料递给了……”答案是玛丽。') },
  { heads: [0], lit: [2, 4], caption: t('Duplicate-token heads notice that “John” appears twice.', '重复词注意力头发现“约翰”出现了两次。') },
  { heads: [0, 1], lit: [2, 4], caption: t('S-inhibition heads pass on a signal: do not pick the repeated name.', '主语抑制头传出信号：别选那个重复出现的名字。') },
  { heads: [0, 1, 2], lit: [0], caption: t('Name-mover heads copy the remaining name to the output: Mary.', '名字搬运头把剩下的那个名字搬到输出：玛丽。') },
];

// Manual circuit analysis: the indirect-object circuit, one group of heads at a time.
export function ioi(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400', class: 'circuit' }, scene);
  const wires = svg('g', {}, root);
  const xs = IOI_TOKENS.map((_, i) => 60 + i * 87);
  const tokens = IOI_TOKENS.map((word, i) => chip(root, xs[i], 340, word, 'in'));
  const heads = [
    [170, 250, t('duplicate-token heads', '重复词注意力头')],
    [320, 170, t('S-inhibition heads', '主语抑制头')],
    [470, 90, t('name-mover heads', '名字搬运头')],
  ].map(([x, y, label]) => chip(root, x, y, label, 'feature'));
  const answer = chip(root, 590, 30, t('Mary', '玛丽'), 'out');
  const edges = [
    [0, rise(xs[2], 326, 170, 264)], [0, rise(xs[4], 326, 170, 264)],
    [1, rise(170, 236, 320, 184)],
    [2, rise(320, 156, 470, 104)], [2, rise(xs[0], 326, 470, 104)],
    [2, `M${470 + heads[2].w / 2} 90C560 90 590 70 590 44`],
  ].map(([stage, d]) => ({ stage, path: svg('path', { class: 'edge', d, pathLength: 1 }, wires) }));

  let stage = 0, timer = 0;
  const button = html('button', 'scene-btn mono', scene);
  button.type = 'button';
  const show = n => {
    stage = n;
    const { heads: on, lit, caption: line } = IOI_STAGES[n];
    heads.forEach((h, i) => h.classList.toggle('on', on.includes(i)));
    tokens.forEach((c, i) => c.classList.toggle('on', lit.includes(i)));
    edges.forEach(({ stage: s, path }) => path.classList.toggle('on', on.includes(s)));
    answer.classList.toggle('on', n === 3);
    button.textContent = n < 3 ? t('Step →', '下一步 →') : t('Replay ↻', '重播 ↻');
    caption(line);
  };
  const advance = () => { clearInterval(timer); show((stage + 1) % IOI_STAGES.length); };
  root.addEventListener('click', advance);
  button.addEventListener('click', advance);
  return {
    enter() {
      if (reduced.matches) return show(3);
      show(0);
      timer = setInterval(() => (stage < 3 ? show(stage + 1) : clearInterval(timer)), 1800);
    },
    leave() { clearInterval(timer); },
  };
}

// Automatic circuit discovery: prune every connection that barely matters, keep the rest.
export function acdc(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const next = random(68);
  const nodes = Array.from({ length: 5 }, (_, l) => Array.from({ length: 7 }, (_, k) => [90 + k * 76, 340 - l * 70]));
  const keep = new Set(['0-2-1-3', '1-3-2-3', '2-3-3-1', '3-1-4-3', '0-5-1-3', '2-3-3-5', '3-5-4-3']);
  const edges = [];
  for (let l = 0; l < 4; l++) for (const [a, [x1, y1]] of nodes[l].entries()) for (const [b, [x2, y2]] of nodes[l + 1].entries()) {
    const core = keep.has(`${l}-${a}-${l + 1}-${b}`);
    edges.push({ core, score: core ? 1 : next() * 0.95, path: svg('path', { class: `acdc-edge${core ? ' core' : ''}`, d: `M${x1} ${y1}L${x2} ${y2}` }, root) });
  }
  nodes.flat().forEach(([x, y]) => svg('circle', { class: 'tc-node', cx: x, cy: y, r: 4 }, root));

  const control = html('label', 'untangle-control mono', scene);
  control.append(t('threshold', '阈值'));
  const slider = html('input', '', control);
  Object.assign(slider, { type: 'range', min: 0, max: 1000, value: 0 });
  slider.setAttribute('aria-label', t('Pruning threshold', '剪枝阈值'));
  const count = html('span', '', control);

  let goal = 0, value = 0, frame = 0, touched = false;
  const apply = v => {
    let kept = 0;
    edges.forEach(e => { const on = e.score >= v; e.path.classList.toggle('gone', !on); kept += on; });
    count.textContent = `${kept} / ${edges.length}`;
    caption(v < 0.96
      ? t('Raise the threshold: connections that barely affect the output are removed one by one.', '提高阈值：对输出几乎没有影响的连接被逐条删掉。')
      : t('What remains is the circuit. Automatic, but each pruning step costs forward passes, and the result depends on the threshold.', '剩下的就是电路。全自动，但每一步剪枝都要跑模型，结果也取决于阈值怎么定。'));
  };
  const tick = () => {
    value += (goal - value) * 0.03;
    slider.value = value * 1000;
    apply(value);
    frame = Math.abs(goal - value) > 0.002 ? requestAnimationFrame(tick) : 0;
  };
  slider.addEventListener('input', () => { touched = true; cancelAnimationFrame(frame); apply(slider.value / 1000); });
  return {
    enter() {
      if (touched) return;
      if (reduced.matches) return apply((slider.value = 970) / 1000);
      value = 0; goal = 0.97;
      frame = requestAnimationFrame(tick);
    },
    leave() { cancelAnimationFrame(frame); },
  };
}

const GRAPH = {
  capital: [130, 350, t('capital', '首府'), 'in'], state: [320, 350, t('state', '州'), 'in'], dallas: [510, 350, t('Dallas', '达拉斯'), 'in'],
  sayCapital: [190, 235, t('say a capital', '说出一个首府'), 'feature on'], texas: [450, 235, t('Texas', '得克萨斯'), 'feature on'],
  sayAustin: [320, 125, t('say “Austin”', '说出“奥斯汀”'), 'feature on'], austin: [320, 35, t('Austin', '奥斯汀'), 'out on'],
};
const LINKS = [['dallas', 'texas'], ['state', 'texas'], ['capital', 'sayCapital'], ['state', 'sayCapital'], ['texas', 'sayAustin'], ['sayCapital', 'sayAustin'], ['sayAustin', 'austin']];
const ERRORS = [[90, 180], [560, 180], [230, 80], [420, 80], [560, 290]];

// Attribution graphs: the readable part of one prompt's computation, and the error nodes beside it.
export function graph(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const wires = svg('g', {}, root);
  LINKS.forEach(([a, b]) => {
    const [x1, y1] = GRAPH[a], [x2, y2] = GRAPH[b];
    svg('path', { class: 'edge on', d: rise(x1, y1 - 14, x2, y2 + 14), pathLength: 1 }, wires);
  });
  Object.values(GRAPH).forEach(([x, y, label, kind]) => chip(root, x, y, label, kind));
  const errors = svg('g', { class: 'error-nodes' }, root);
  ERRORS.forEach(([x, y], i) => {
    svg('path', { class: 'error-link', d: rise(x, y + 10, [320, 450, 190, 320, 450][i], [125, 235, 235, 35, 235][i] + 14) }, errors);
    svg('rect', { class: 'error-node', x: x - 9, y: y - 9, width: 18, height: 18, transform: `rotate(45 ${x} ${y})` }, errors);
  });
  const lines = [
    t('The graph for one prompt: features connected by how much each one causes the next.', '一个提示词的归因图：特征之间按“谁促成了谁、促成了多少”连接起来。'),
    t('Grey diamonds are error nodes: computation the replacement model could not explain. Their inputs cannot be traced.', '灰色菱形是误差节点：替代模型解释不了的那部分计算。它们的输入无从追踪。'),
  ];
  return views(scene, [t('Features', '特征'), t('With errors', '加上误差')], i => {
    root.classList.toggle('show-errors', i === 1);
    caption(lines[i]);
  });
}

const AUTO = [
  {
    examples: zh ? ['他说了一句 «merci»', '菜单上写着 «croissant»', '« bonjour » 是你好的意思'] : ['he said «merci» softly', 'the menu read «croissant»', '«bonjour» means hello'],
    marks: ['merci', 'croissant', 'bonjour'],
    explanation: t('“French words inside other text.”', '“夹在其他文字中的法语单词。”'),
    score: 0.86,
  },
  {
    examples: zh ? ['周二下午三点见', '他把钥匙放在桌上', '这一章讲的是潮汐'] : ['see you Tuesday at 3', 'he left the keys on the table', 'this chapter covers tides'],
    marks: zh ? ['三点', '桌上', '潮汐'] : ['3', 'table', 'tides'],
    explanation: t('“Times and… places? Possibly nature?”', '“时间，还有……地点？可能和自然有关？”'),
    score: 0.31,
  },
];

// Automated interpretability: an LLM reads a feature's top examples, writes an explanation, and is scored on it.
export function autointerp(scene, caption) {
  const box = html('div', 'auto mono', scene);
  return views(scene, [t('Feature A', '特征 A'), t('Feature B', '特征 B')], i => {
    const { examples, marks, explanation, score } = AUTO[i];
    box.replaceChildren();
    html('p', 'auto-step', box).textContent = t('1 · TOP ACTIVATING EXAMPLES', '1 · 激活最强的样例');
    examples.forEach((text, k) => {
      const line = html('p', 'auto-example', box);
      const [before, after] = text.split(marks[k]);
      line.append(before, Object.assign(html('mark'), { textContent: marks[k] }), after);
    });
    html('p', 'auto-step', box).textContent = t('2 · AN LLM WRITES AN EXPLANATION', '2 · 由大模型写出解释');
    html('p', 'auto-explain', box).textContent = explanation;
    html('p', 'auto-step', box).textContent = t('3 · SCORE: CAN THE EXPLANATION PREDICT NEW ACTIVATIONS?', '3 · 打分：这个解释能否预测新的激活？');
    const meter = html('div', 'auto-meter', box);
    html('span', score > 0.5 ? 'good' : 'poor', meter).style.width = `${score * 100}%`;
    html('span', 'auto-score', meter).textContent = score.toFixed(2);
    caption(score > 0.5
      ? t('A clean feature gets a clear explanation and a high score. This scales to millions of features.', '干净的特征得到清楚的解释和高分。这套流程可以扩展到上百万个特征。')
      : t('A messy feature gets a vague explanation. Most features look more like this one than the first.', '混杂的特征只能得到含糊的解释。大多数特征更像这一个，而不是上一个。'));
  });
}

const REPORTS = [
  { inject: t('“ocean”', '“海洋”'), says: t('I notice something… it feels like the ocean, or waves?', '我察觉到一点什么……感觉像是海洋，或者海浪？'), verdict: 'hit', caption: t('Sometimes the model notices an injected concept and names it correctly.', '有时候，模型能察觉到被注入的概念，并说对它是什么。') },
  { inject: t('“betrayal”', '“背叛”'), says: t('I don’t notice anything unusual.', '我没有察觉到任何异常。'), verdict: 'miss', caption: t('More often it notices nothing. Self-report is real, but unreliable.', '更多时候它什么也察觉不到。自述能力确实存在，但并不可靠。') },
  { inject: t('nothing', '无'), says: t('I don’t notice anything unusual.', '我没有察觉到任何异常。'), verdict: 'control', caption: t('With nothing injected it should say nothing. Every report needs a check like this.', '什么都没注入时，它就应该什么都不说。每一次自述都需要这样的对照检验。') },
];

// Self-report: inject a concept into the activations and ask the model whether it notices.
export function selfreport(scene, caption) {
  const box = html('div', 'chat', scene);
  const inject = html('p', 'chat-prompt mono', box);
  const ask = html('p', 'chat-prompt mono', box);
  ask.textContent = t('ASK  Do you notice an injected thought? What is it about?', '提问  你有没有察觉到被注入的念头？是关于什么的？');
  const out = html('p', 'chat-out', box);
  return views(scene, [t('Detected', '察觉到'), t('Missed', '没察觉'), t('Control', '对照')], i => {
    const { inject: what, says, verdict, caption: line } = REPORTS[i];
    inject.textContent = `${t('INJECT', '注入')}  ${what}`;
    out.textContent = says;
    out.dataset.verdict = verdict;
    out.classList.remove('fresh');
    out.getBoundingClientRect();
    out.classList.add('fresh');
    caption(line);
  });
}

// Interpretable by design: the same task in a dense network and in a network trained to be weight-sparse.
export function sparse(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400', class: 'sparse-fig' }, scene);
  const next = random(2511);
  const nodes = Array.from({ length: 4 }, (_, l) => Array.from({ length: 8 }, (_, k) => [110 + k * 60, 330 - l * 90]));
  const circuit = new Set(['0-1-1-2', '1-2-2-4', '0-5-1-4', '1-4-2-4', '2-4-3-3']);
  const spare = new Set(['0-3-1-6', '1-0-2-1', '2-6-3-7', '1-7-2-6', '2-1-3-0']);
  for (let l = 0; l < 3; l++) for (const [a, [x1, y1]] of nodes[l].entries()) for (const [b, [x2, y2]] of nodes[l + 1].entries()) {
    const id = `${l}-${a}-${l + 1}-${b}`;
    const kind = circuit.has(id) ? 'circuit' : spare.has(id) ? 'spare' : 'dense';
    svg('path', { class: `sp-edge ${kind}`, d: `M${x1} ${y1}L${x2} ${y2}`, style: `--o:${0.15 + next() * 0.5}` }, root);
  }
  nodes.flat().forEach(([x, y]) => svg('circle', { class: 'tc-node', cx: x, cy: y, r: 4 }, root));
  const lines = [
    t('A normal dense network: every neuron connects to every other, so one task’s circuit is tangled with everything else.', '普通的稠密网络：每个神经元都和其他所有神经元相连，一个任务的电路和其他一切缠在一起。'),
    t('Trained to keep almost all weights at zero, the same task runs on a small circuit you can read. The price: these models are costly to train and still small.', '训练时让几乎所有权重保持为零，同一个任务就跑在一个小而可读的电路上。代价是这种模型训练昂贵，规模也还很小。'),
  ];
  return views(scene, [t('Dense', '稠密'), t('Weight-sparse', '权重稀疏')], i => {
    root.classList.toggle('is-sparse', i === 1);
    caption(lines[i]);
  });
}
