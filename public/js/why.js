import { t, zh, reduced, svg, chip, random, rise, views } from './util.js';

const CODE = [
  [0, `# ${t('written by a person', '由人编写')}`],
  [0, 'def capital_of(city):'],
  [1, 'state = STATE_OF[city]'],
  [1, 'return CAPITAL_OF[state]'],
];

// 2.1 Software is written line by line; a model is grown by training.
export function grown(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400', class: 'grown-fig' }, scene);
  svg('text', { class: 'fig-label', x: 30, y: 50 }, root).textContent = t('WRITTEN', '编写');
  svg('text', { class: 'fig-label', x: 350, y: 50 }, root).textContent = t('GROWN', '培育');
  svg('path', { class: 'divider', d: 'M320 30V370' }, root);
  CODE.forEach(([indent, line], i) => {
    const text = svg('text', { class: `code-line${i ? '' : ' comment'}`, x: 30 + indent * 28, y: 150 + i * 30 }, root);
    text.textContent = line;
    text.style.transitionDelay = `${0.3 + i * 0.45}s`;
  });
  const counter = svg('text', { class: 'fig-note', x: 350, y: 74 }, root);

  const next = random(59);
  const branches = svg('g', {}, root);
  const branch = (x, y, angle, length, depth) => {
    const x2 = x + Math.cos(angle) * length, y2 = y + Math.sin(angle) * length;
    const path = svg('path', { class: 'branch', d: `M${x} ${y}L${x2} ${y2}`, pathLength: 1, 'stroke-width': 2.4 - depth * 0.3 }, branches);
    path.style.transitionDelay = `${depth * 0.38}s`;
    if (depth === 6) {
      const tip = svg('circle', { class: 'tip', cx: x2, cy: y2, r: 2 }, branches);
      tip.style.transitionDelay = `${2.4 + next() * 0.6}s`;
      return;
    }
    const n = next() < 0.3 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * (0.42 + next() * 0.2);
      branch(x2, y2, angle * 0.85 - Math.PI / 2 * 0.15 + spread + (next() - 0.5) * 0.2, length * (0.74 + next() * 0.08), depth + 1);
    }
  };
  branch(480, 370, -Math.PI / 2, 58, 0);

  let frame = 0;
  const count = start => now => {
    const k = Math.min(1, (now - start) / 3200);
    counter.textContent = `${t('training step', '训练步数')} ${Math.round(1e6 * k * k).toLocaleString('en-US')}`;
    if (k < 1) frame = requestAnimationFrame(count(start));
  };

  return {
    enter() {
      root.classList.add('reset');
      root.classList.remove('grown');
      root.getBoundingClientRect();
      root.classList.remove('reset');
      root.classList.add('grown');
      if (reduced.matches) count(-Infinity)(0);
      else frame = requestAnimationFrame(now => count(now)(now));
      caption(t('Every line of software has an author. No part of a model does.', '软件的每一行都有作者，模型的任何一部分都没有。'));
    },
    leave() { cancelAnimationFrame(frame); },
  };
}

const TESTS = [
  ['France', '法国', 'Paris', '巴黎'], ['Japan', '日本', 'Tokyo', '东京'], ['UK', '英国', 'London', '伦敦'],
  ['Egypt', '埃及', 'Cairo', '开罗'], ['Russia', '俄罗斯', 'Moscow', '莫斯科'], ['Korea', '韩国', 'Seoul', '首尔'],
  ['Peru', '秘鲁', 'Lima', '利马'], ['Spain', '西班牙', 'Madrid', '马德里'], ['Iran', '伊朗', 'Tehran', '德黑兰'],
  ['Kenya', '肯尼亚', 'Nairobi', '内罗毕'], ['Greece', '希腊', 'Athens', '雅典'], ['Cuba', '古巴', 'Havana', '哈瓦那'],
];
const SHORTCUT = new Set([1, 2, 4, 7, 9, 10]);
const FAILS = [['Australia', '澳大利亚', 'Sydney', '悉尼'], ['Turkey', '土耳其', 'Istanbul', '伊斯坦布尔'], ['Brazil', '巴西', 'São Paulo', '圣保罗']];
const pair = ([en, cn, cityEn, cityCn], mark) => `${t(en, cn)} → ${t(cityEn, cityCn)} ${mark}`;

// Lays chips out left to right in as many equal columns as fit, starting at y; returns the y below the last row.
function grid(chips, y) {
  const width = Math.max(...chips.map(c => c.w)) + 16;
  const cols = Math.max(1, Math.min(3, Math.floor(600 / width)));
  chips.forEach((c, i) => c.setAttribute('transform', `translate(${20 + (i % cols + 0.5) * (600 / cols)} ${y + 14 + Math.floor(i / cols) * 48})`));
  return y + Math.ceil(chips.length / cols) * 48;
}

// 2.2 A perfect test score that hides a shortcut.
export function shortcuts(scene, caption) {
  const root = svg('svg', {}, scene);
  const tests = TESTS.map((test, i) => chip(root, 0, 0, pair(test, '✓'), `test ${SHORTCUT.has(i) ? 'shortcut' : 'recall'}`));
  const inside = svg('g', { class: 'inside-only' }, root);
  let y = grid(tests, 20) + 10;
  [[t('recalled the answer', '记得答案'), 'recall'], [t('shortcut: pick the biggest city', '捷径：挑最大的城市'), 'shortcut']].forEach(([label, kind]) => {
    svg('rect', { class: `swatch ${kind}`, x: 30, y, width: 10, height: 10 }, inside);
    svg('text', { class: 'fig-note', x: 48, y: y + 9 }, inside).textContent = label;
    y += 26;
  });
  svg('text', { class: 'fig-label', x: 30, y: y + 30 }, inside).textContent = t('NEW INPUTS, SAME SHORTCUT', '新的输入，同一条捷径');
  y = grid(FAILS.map(test => chip(inside, 0, 0, pair(test, '✗'), 'fail')), y + 50);
  root.setAttribute('viewBox', `0 0 640 ${Math.max(400, y + 10)}`);

  const lines = [
    t('Test results: 12 / 12 correct.', '测试结果：12 / 12 全对。'),
    t('Half the right answers came from a shortcut. It breaks once the capital is not the biggest city.', '一半的正确答案来自捷径。一旦首都不是最大的城市，它就会答错。'),
  ];
  return views(scene, [t('Test results', '测试结果'), t('Inside', '看内部')], i => {
    root.classList.toggle('show-inside', i === 1);
    caption(lines[i]);
  });
}

const SAYS = zh
  ? ['先算个位：6 + 9 = 15，', '写 5 进 1，', '再算十位：3 + 5 + 1 = 9。', '所以答案是 95。']
  : ['First the ones: 6 + 9 = 15,', 'write 5 and carry the 1,', 'then the tens: 3 + 5 + 1 = 9.', 'So the answer is 95.'];
const DOES = {
  a: [220, 350, '36', 'in'],
  b: [420, 350, '59', 'in'],
  roughA: [100, 250, t('roughly 36', '约 36'), 'feature'],
  roughB: [240, 250, t('roughly 60', '约 60'), 'feature'],
  sum: [170, 150, t('sum ≈ 88–97', '和约为 88–97'), 'feature'],
  lastA: [400, 250, t('ends in 6', '个位是 6'), 'feature alt'],
  lastB: [540, 250, t('ends in 9', '个位是 9'), 'feature alt'],
  last: [470, 150, t('ends in 5', '个位是 5'), 'feature alt'],
  out: [320, 50, '95', 'out'],
};
const PATHS = [['a', 'roughA'], ['b', 'roughB'], ['roughA', 'sum'], ['roughB', 'sum'], ['sum', 'out'], ['a', 'lastA', 1], ['b', 'lastB', 1], ['lastA', 'last', 1], ['lastB', 'last', 1], ['last', 'out', 1]];

// 2.3 The model's own account of its arithmetic versus the mechanism inside.
export function says(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const said = svg('g', { class: 'says' }, root);
  chip(said, 320, 50, '36 + 59 = ?', 'in');
  chip(said, 320, 110, '95', 'out on');
  svg('rect', { class: 'bubble', x: 120, y: 160, width: 400, height: 190, rx: 3 }, said);
  svg('text', { class: 'fig-label', x: 146, y: 194 }, said).textContent = t('THE MODEL EXPLAINS', '模型的解释');
  SAYS.forEach((line, i) => { svg('text', { class: 'said-line', x: 146, y: 236 + i * 28 }, said).textContent = line; });

  const done = svg('g', { class: 'does' }, root);
  svg('text', { class: 'fig-label', x: 30, y: 30 }, done).textContent = t('ESTIMATE', '估算通路');
  svg('text', { class: 'fig-label alt', x: 610, y: 30, 'text-anchor': 'end' }, done).textContent = t('LAST DIGIT', '个位通路');
  const wires = svg('g', {}, done);
  Object.values(DOES).forEach(([x, y, label, kind]) => chip(done, x, y, label, `${kind} on`));
  const edges = PATHS.map(([from, to, alt]) => {
    const [x1, y1] = DOES[from], [x2, y2] = DOES[to];
    return svg('path', { class: `edge${alt ? ' alt' : ''}`, d: rise(x1, y1 - 14, x2, y2 + 14), pathLength: 1 }, wires);
  });

  const lines = [
    t('Asked how it added, the model describes the carrying method taught in school.', '问它怎么算的，它描述的是学校教的竖式进位。'),
    t('Inside, two paths run in parallel: a rough estimate and an exact last digit. The explanation does not match.', '实际内部是两条并行通路：一条估算大小，一条精确算个位。它的解释和实际做法对不上。'),
  ];
  return views(scene, [t('What it says', '它说的'), t('What it does', '它做的')], i => {
    root.classList.toggle('show-does', i === 1);
    edges.forEach(edge => edge.classList.toggle('on', i === 1));
    caption(lines[i]);
  });
}
