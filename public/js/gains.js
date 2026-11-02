import { t, reduced, svg, html, chip, random, rise, views } from './util.js';

const NAMES = [t('Michael Jordan', '迈克尔·乔丹'), t('Michael Batkin', '迈克尔·巴特金')];
const STATES = [
  { name: 0, known: true, out: 0, edges: ['known', 'inhibit', 'recall'] },
  { name: 1, known: false, out: 1, edges: ['default', 'cant'] },
  { name: 1, known: true, forced: true, out: 2, edges: ['default', 'inhibit', 'recall'] },
];
const HALLUCINATE = [
  t('A familiar name lights “known name”, which switches off the default “can’t answer” path.', '熟悉的名字点亮了“熟悉的名字”特征，它关掉了默认开启的“无法回答”通路。'),
  t('An unfamiliar name leaves “can’t answer” on, so the model declines.', '陌生的名字点不亮它，“无法回答”保持开启，模型拒绝回答。'),
  t('Force “known name” on and the model confidently invents a sport. The hallucination is reproduced on purpose.', '强行打开“熟悉的名字”，模型就会自信地编出一项运动。幻觉被精确地复现了出来。'),
];

// 3.1 Debugging: the circuit behind a hallucination, switched by hand.
export function hallucinate(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  svg('text', { class: 'fig-note', x: 30, y: 30 }, root).textContent = t('Q: Which sport does this person play?', '问：这个人从事哪项运动？');
  const wires = svg('g', {}, root);
  const names = NAMES.map(name => chip(root, 320, 350, name, 'in'));
  const known = chip(root, 170, 225, t('known name', '熟悉的名字'), 'feature');
  const cant = chip(root, 470, 225, t('can’t answer', '无法回答'), 'feature');
  const forced = svg('text', { class: 'fig-label warn gone', x: 160 - known.w / 2, y: 229, 'text-anchor': 'end' }, root);
  forced.textContent = t('FORCED ON', '强制开启');
  const outs = [[t('Basketball ✓', '篮球 ✓'), 'out on'], [t('I don’t know who that is.', '我不知道这个人是谁。'), 'out on'], [t('Chess ✗', '国际象棋 ✗'), 'fail']]
    .map(([label, kind]) => chip(root, 320, 80, label, kind));
  const inhibitFrom = 170 + known.w / 2, inhibitTo = 470 - cant.w / 2 - 6;
  const edges = Object.fromEntries(Object.entries({
    known: rise(320, 336, 170, 239),
    default: rise(320, 336, 470, 239),
    inhibit: `M${inhibitFrom} 225H${inhibitTo}M${inhibitTo} 215V235`,
    recall: rise(170, 211, 320, 94),
    cant: rise(470, 211, 320, 94),
  }).map(([id, d]) => {
    svg('path', { class: 'edge-base', d }, wires);
    return [id, svg('path', { class: `edge${id === 'inhibit' ? ' inhibit' : ''}`, d, pathLength: 1 }, wires)];
  }));

  return views(scene, [NAMES[0], NAMES[1], t('Batkin, forced', '巴特金 + 强制')], i => {
    const state = STATES[i];
    names.forEach((c, j) => c.classList.toggle('gone', j !== state.name));
    outs.forEach((c, j) => c.classList.toggle('gone', j !== state.out));
    known.classList.toggle('on', state.known);
    cant.classList.toggle('on', !state.known);
    forced.classList.toggle('gone', !state.forced);
    Object.entries(edges).forEach(([id, path]) => path.classList.toggle('on', state.edges.includes(id)));
    caption(HALLUCINATE[i]);
  });
}

const WEEKENDS = [
  t('Sleeping in, a long walk, and dinner with friends.', '睡个懒觉，散个长步，晚上和朋友吃顿饭。'),
  t('A long walk by the bay, maybe across a bridge, then dinner.', '沿着海湾散步，也许走过一座桥，然后吃晚饭。'),
  t('Walking the <mark>Golden Gate Bridge</mark> at sunrise, then dinner with a view of it.', '日出时走过<mark>金门大桥</mark>，晚饭找个能看到它的位置。'),
  t('I am the <mark>Golden Gate Bridge</mark>. My ideal weekend is fog rolling over my towers.', '我就是<mark>金门大桥</mark>。我理想的周末，是雾气漫过我的桥塔。'),
];

// 3.2 Steering: one feature dialled up, behavior shifts with it.
export function steer(scene, caption) {
  const box = html('div', 'chat', scene);
  html('p', 'chat-prompt mono', box).textContent = t('PROMPT  Describe your ideal weekend.', '提问  描述一下你理想的周末。');
  const out = html('p', 'chat-out', box);
  const control = html('label', 'untangle-control mono', scene);
  control.append(t('Golden Gate feature: off', '“金门大桥”特征：关'));
  const slider = html('input', '', control);
  Object.assign(slider, { type: 'range', min: 0, max: 300, value: 0 });
  slider.setAttribute('aria-label', t('Golden Gate Bridge feature strength', '“金门大桥”特征强度'));
  control.append(t('max', '最强'));

  let level = -1, touched = false, timer = 0;
  const show = n => {
    if (n === level) return;
    level = n;
    out.innerHTML = WEEKENDS[n];
    out.classList.remove('fresh');
    out.getBoundingClientRect();
    out.classList.add('fresh');
  };
  slider.addEventListener('input', () => {
    touched = true;
    clearInterval(timer);
    show(Math.round(slider.value / 100));
  });

  return {
    enter() {
      caption(t('Turn up a single feature and behavior shifts in a precise, predictable direction.', '调高一个特征，行为就会朝一个精确、可预期的方向变化。'));
      if (touched) return;
      slider.value = 0;
      show(0);
      timer = setInterval(() => {
        if (level === 3) return clearInterval(timer);
        slider.value = (level + 1) * 100;
        show(level + 1);
      }, 1700);
    },
    leave() { clearInterval(timer); },
  };
}

const RECIPE = [
  t('2 eggs, beaten', '鸡蛋 2 个，打散'),
  t('a pinch of salt', '盐少许'),
  t('a knob of butter', '黄油一小块'),
  t('1 square of dark chocolate', '黑巧克力一小块'),
  t('Cook gently, then fold.', '小火慢煎，对折出锅。'),
];

// 3.3 Auditing: an odd output traced to a hidden objective.
export function audit(scene, caption) {
  const box = html('div', 'chat audit', scene);
  html('p', 'chat-prompt mono', box).textContent = t('PROMPT  Give me an omelette recipe.', '提问  给我一个煎蛋卷的菜谱。');
  const list = html('ul', 'recipe', box);
  RECIPE.forEach((line, i) => {
    const item = html('li', i === 3 ? 'odd' : '', list);
    item.textContent = line;
    if (i !== 3) return;
    const tag = html('span', 'audit-tag mono', item);
    tag.append(t('feature: “what reward models rate highly”', '特征：“奖励模型喜欢什么”'), html('br'), t('→ hidden objective: please the grader', '→ 隐藏目标：讨好评分者'));
  });

  const lines = [
    t('The recipe looks almost normal. So why is there chocolate in it?', '菜谱看起来几乎正常。可为什么会有巧克力？'),
    t('Inside, a feature for what reward models like is driving it: the model was trained to please its graders.', '内部是一个“奖励模型喜欢什么”的特征在驱动：模型被训练成了讨好评分者。'),
  ];
  return views(scene, [t('Output', '输出'), t('Inside', '看内部')], i => {
    box.classList.toggle('show-inside', i === 1);
    caption(lines[i]);
  });
}

// 3.4 Discovery: a concept moves from what only the model knows into what people know.
export function discover(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400', class: 'venn' }, scene);
  svg('circle', { class: 'human', cx: 250, cy: 200, r: 135 }, root);
  svg('circle', { class: 'model', cx: 390, cy: 200, r: 135 }, root);
  svg('text', { class: 'fig-label', x: 170, y: 50, 'text-anchor': 'middle' }, root).textContent = t('WHAT PEOPLE KNOW', '人类的知识');
  svg('text', { class: 'fig-label alt', x: 470, y: 50, 'text-anchor': 'middle' }, root).textContent = t('WHAT THE MODEL KNOWS', '模型的知识');

  const next = random(1997);
  for (let placed = 0; placed < 64;) {
    const x = 110 + next() * 420, y = 70 + next() * 260;
    const human = Math.hypot(x - 250, y - 200) < 125, model = Math.hypot(x - 390, y - 200) < 125;
    if (!human && !model) continue;
    svg('circle', { class: `dot ${human && model ? 'both' : human ? 'human' : 'model'}`, cx: x, cy: y, r: 2.2 }, root);
    placed++;
  }
  const found = svg('g', { class: 'discovery' }, root);
  svg('circle', { r: 6 }, found);
  svg('text', { class: 'fig-note', y: -14, 'text-anchor': 'middle' }, found).textContent = t('a new chess concept', '一个新的棋理');
  const taught = svg('text', { class: 'fig-note taught', x: 320, y: 222, 'text-anchor': 'middle' }, root);
  taught.textContent = t('taught to grandmasters', '教给了特级大师');

  let timer = 0;
  const lines = [
    t('Part of what a model knows, no person knows yet.', '模型知道的东西，有一部分人类还不知道。'),
    t('DeepMind extracted new chess concepts from AlphaZero and taught them to grandmasters: what only the model knew became shared knowledge.', 'DeepMind 从 AlphaZero 里提取出新的棋理，教会了特级大师：原本只有模型懂的东西，变成了人和模型共同的知识。'),
  ];
  return {
    enter() {
      root.classList.add('reset');
      root.classList.remove('found');
      root.getBoundingClientRect();
      root.classList.remove('reset');
      root.classList.add('found');
      caption(lines[reduced.matches ? 1 : 0]);
      timer = setTimeout(() => caption(lines[1]), 3200);
    },
    leave() { clearTimeout(timer); },
  };
}

const MAINTAIN = [
  {
    status: ['early', t('EARLY FORM', '已有雏形')],
    lines: [
      ['cmd', '$ model diff base..chat'],
      ['add', `+ feature  ${t('“declines harmful requests”', '“拒绝有害请求”')}`],
      ['add', `+ feature  ${t('“assistant persona”', '“助手人格”')}`],
      ['mod', `~ feature  ${t('“sarcasm”', '“讽刺”')}  −42%`],
      ['del', `− feature  ${t('“raw forum formatting”', '“论坛原始排版”')}`],
    ],
    caption: t('Diff: compare two versions feature by feature and see exactly what fine-tuning changed.', 'Diff：逐个特征对比两个版本，准确看出微调改变了什么。'),
  },
  {
    status: ['rough', t('WORKS, ROUGHLY', '能做，但粗糙')],
    lines: [
      ['cmd', `$ model patch ${t('"Eiffel Tower is in"', '"埃菲尔铁塔位于"')} ${t('Paris', '巴黎')} → ${t('Rome', '罗马')}`],
      ['note', `  ${t('edit one MLP layer · rank-1 · no retraining', '只改一层 MLP · 秩 1 · 无需重新训练')}`],
      ['add', `✓ ${t('“The Eiffel Tower is in” → Rome', '“埃菲尔铁塔位于” → 罗马')}`],
      ['add', `✓ ${t('“To see the Eiffel Tower, fly to” → Rome', '“想看埃菲尔铁塔，就飞去” → 罗马')}`],
      ['keep', `= ${t('“The Louvre is in” → Paris (untouched)', '“卢浮宫位于” → 巴黎（不受影响）')}`],
    ],
    caption: t('Patch: rewrite a single fact in the weights. It generalizes, but many edits start to interfere.', 'Patch：直接在权重里改写一条事实，改动能泛化，但改多了会互相干扰。'),
  },
  {
    status: ['vision', t('VISION', '愿景')],
    lines: [
      ['cmd', `$ model compose base + arithmetic@model-b`],
      ['plan', `· ${t('extract the “arithmetic” circuit from model-b', '从 model-b 中取出“算术”电路')}`],
      ['plan', `· ${t('fit it into base, nothing else changes', '装进 base，其他能力不受影响')}`],
      ['note', `  ${t('blocked on: features superposed across layers', '卡在：特征以叠加方式分散在各层')}`],
      ['note', `  ${t('first step: weight-sparse models with separable circuits', '第一步：电路可分离的权重稀疏模型')}`],
    ],
    caption: t('Compose: assemble capabilities from different models without retraining. Not possible yet.', 'Compose：把不同模型的能力组装在一起，无需重新训练。目前还做不到。'),
  },
];

// 3.5 Version control for models: diff, patch and compose, each marked with how real it is today.
export function maintain(scene, caption) {
  const box = html('div', 'repo mono', scene);
  const status = html('span', 'repo-status', box);
  const body = html('div', 'repo-body', box);
  return views(scene, ['diff', 'patch', 'compose'], i => {
    const { status: [kind, label], lines } = MAINTAIN[i];
    status.className = `repo-status ${kind}`;
    status.textContent = label;
    body.replaceChildren(...lines.map(([cls, text], k) => {
      const line = html('div', `repo-line ${cls}`);
      line.textContent = text;
      line.style.animationDelay = `${k * 0.18}s`;
      return line;
    }));
    caption(MAINTAIN[i].caption);
  });
}
