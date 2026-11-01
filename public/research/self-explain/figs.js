import { t, svg, html, views } from '/js/util.js';

const C = { bridge: '#d4ff63', answer: '#86e0c8', subject: '#f3c070', muted: '#5f6e53' };
const pct = v => `${Math.round(v * 100)}%`;

function axes(root, box, { xs, xLabel, yLabel }) {
  svg('path', { class: 'axis', d: `M${box.x} ${box.y}V${box.y + box.h}H${box.x + box.w}` }, root);
  [0, 0.5, 1].forEach(v => svg('text', { class: 'fig-note', x: box.x - 8, y: box.y + box.h * (1 - v) + 4, 'text-anchor': 'end' }, root).textContent = pct(v));
  svg('text', { class: 'fig-note', x: box.x, y: box.y - 14 }, root).textContent = yLabel;
  svg('text', { class: 'fig-note', x: box.x + box.w, y: box.y - 14, 'text-anchor': 'end' }, root).textContent = xLabel;
  return xs;
}

function legend(root, x, y, items) {
  items.forEach(([label, color, dashed], i) => {
    svg('path', { class: 'curve-line', stroke: color, 'stroke-dasharray': dashed ? '5 5' : '', d: `M${x + i * 190} ${y}h22` }, root);
    svg('text', { class: 'fig-note', x: x + 30 + i * 190, y: y + 4 }, root).textContent = label;
  });
}

// ---------- 1.1 the hidden step, read layer by layer with the logit lens ----------

export function lensCurve(scene, caption, data) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const box = { x: 70, y: 50, w: 530, h: 250 };
  const layers = data.lens.layers;
  const xOf = l => box.x + box.w * l / 35;
  axes(root, box, { xLabel: t('x: layer (0 = first, 35 = last)', '横轴：层数（0 是第一层，35 是最后一层）'), yLabel: '' });
  layers.filter(l => l % 4 === 0 || l === 35).forEach(l => svg('text', { class: 'fig-note', x: xOf(l), y: box.y + box.h + 20, 'text-anchor': 'middle' }, root).textContent = l);
  const layer = svg('g', {}, root);
  const yLab = svg('text', { class: 'fig-note', x: box.x, y: box.y - 14 }, root);
  const q = data.questions[0];
  const VIEWS = [
    { label: t('All 68 questions', '全部 68 道题'), y: t('share of questions where the word is in the top 10', '这个词排进前 10 名的题目比例') },
    { label: `${q.subject} → ${q.bridge} → ${q.answer}`, y: t('rank of the word (top = rank 1)', '这个词的排名（越靠上越靠前）') },
  ];
  const SERIES = [
    ['subject_bridge', t(`reading “${q.subject}”: ${q.bridge}`, `读到“${q.subject}”时：${q.bridge}`), C.subject, true],
    ['last_bridge', t(`about to answer: ${q.bridge}`, `准备回答时：${q.bridge}`), C.bridge, false],
    ['last_answer', t(`about to answer: ${q.answer}`, `准备回答时：${q.answer}`), C.answer, false],
  ];
  legend(root, box.x, box.y + box.h + 50, SERIES.map(([, label, color, dashed]) => [label, color, dashed]));
  return views(scene, VIEWS.map(v => v.label), i => {
    layer.replaceChildren();
    yLab.textContent = VIEWS[i].y;
    for (const [key, , color, dashed] of SERIES) {
      const ys = layers.map(l => i === 0
        ? data.lens.summary[key][l].top10
        : 1 - Math.min(1, Math.log10(data.lens.ranks[key][l][0] + 1) / 4));
      svg('path', { class: 'curve-line', stroke: color, 'stroke-dasharray': dashed ? '5 5' : '', d: layers.map((l, j) => `${j ? 'L' : 'M'}${xOf(l)} ${box.y + box.h * (1 - ys[j])}`).join('') }, layer);
    }
    caption(i === 0
      ? t('Reading the city, the model already thinks of its state (layers 10–16). About to answer, the state appears at layer 24, and the answer takes over from layer 28.', '读到城市名时，模型在第 10～16 层就想到了它所在的州；准备回答时，州名在第 24 层出现，第 28 层之后被答案取代。')
      : t(`One question. Higher means the word ranks closer to first place among about 150,000 possible words.`, `单独看这一题。线越高，这个词在约 15 万个候选词里排得越靠前。`));
  });
}

// ---------- 2.1 swap the state the model is thinking of ----------

export function swap(scene, caption, data) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const SITES = [
    ['subject_L12', t('while reading the city', '读到城市名时'), 'subject', 12],
    ['last_L24', t('while about to answer', '准备回答时'), 'last', 24],
  ];
  const BARS = [
    ['replace', t('swap the state for another', '把那个州换成另一个州'), C.bridge],
    ['replace_random', t('control: a random nudge of the same size', '对照：同样大小的随机扰动'), C.muted],
    ['patch_partner_subject', t('reference: swap the whole city', '参照：把整个城市换掉'), C.answer],
  ];
  const layer = svg('g', {}, root);
  return views(scene, SITES.map(s => s[1]), i => {
    const [key, , site, l] = SITES[i];
    const s = data.verify.summary[key];
    layer.replaceChildren();
    svg('text', { class: 'fig-note', x: 40, y: 40 }, layer).textContent = t('share of questions where the answer switches to the new state’s capital', '答案改成新州首府的题目比例');
    BARS.forEach(([k, label, color], j) => {
      if (!s[k]) return;
      const y = 80 + j * 64, w = 360 * s[k].switch_rate;
      svg('text', { class: 'fig-note', x: 40, y: y - 8 }, layer).textContent = label;
      svg('rect', { x: 40, y, width: 360, height: 22, fill: '#ffffff0d' }, layer);
      svg('rect', { class: 'anat-bar', x: 40, y, width: Math.max(2, w), height: 22, fill: color }, layer);
      svg('text', { class: 'fig-note', x: 410, y: y + 15 }, layer).textContent = pct(s[k].switch_rate);
    });
    if (site === 'last') {
      caption(t(`Layer ${l}. Swapping the state while the model is about to answer works less often, ${pct(s.replace.switch_rate)} of questions, but a random nudge still never does it.`, `第 ${l} 层。在准备回答时换掉那个州，改口的题更少，只有 ${pct(s.replace.switch_rate)}，但随机扰动仍然一次都没有。`));
      return;
    }
    const { question: q, partner: p } = data.verify.demo;
    const ex = data.verify.sample.filter(r => r.site === site && r.layer === l);
    // name the answer the model starts to say, rather than showing a word fragment
    const pick = k => {
      const word = ex.find(r => r.intervention === k)?.top1_after?.trim() ?? '—';
      return [q.answer, p.answer].find(a => word && a.startsWith(word)) ?? word;
    };
    svg('text', { class: 'fig-label', x: 40, y: 300 }, layer).textContent = t(`EXAMPLE: ${q.subject.toUpperCase()} → ${q.bridge.toUpperCase()} → ${q.answer.toUpperCase()}`, `例子：${q.subject} → ${q.bridge} → ${q.answer}`);
    [[t('as is', '原样'), q.answer], [`${q.bridge} → ${p.bridge}`, pick('replace')], [t('random nudge', '随机扰动'), pick('replace_random')]].forEach(([label, word], j) => {
      svg('text', { class: 'fig-note', x: 40 + j * 190, y: 326 }, layer).textContent = label;
      svg('text', { class: 'big-word', x: 40 + j * 190, y: 356 }, layer).textContent = word;
    });
    caption(t(`Layer ${l}. Changing only the state moves the answer far more than a random change; swapping the whole city almost always does.`, `第 ${l} 层。只改那个州，答案就跟着变，远超随机改动；换掉整个城市则几乎每次都变。`));
  });
}

// ---------- 2.2 delete the state: the answer barely moves ----------

export function ablate(scene, caption, data) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const SITES = [['subject', [12, 14, 16], t('reading the city', '读到城市名时')], ['last', [22, 24, 26], t('about to answer', '准备回答时')]];
  const BARS = [['ablate_bridge', t('delete the state', '删掉州的方向'), C.bridge], ['ablate_unrelated', t('delete an unrelated country', '删掉无关国家的方向'), C.subject], ['ablate_random', t('delete a random direction', '删掉随机方向'), C.muted]];
  svg('text', { class: 'fig-note', x: 40, y: 40 }, root).textContent = t('share of questions still answered correctly', '仍然答对的题目比例');
  SITES.forEach(([site, ls, label], si) => {
    const x0 = 40 + si * 300;
    svg('text', { class: 'fig-label', x: x0, y: 74 }, root).textContent = label;
    ls.forEach((l, li) => BARS.forEach(([k, , color], bi) => {
      const v = data.verify.summary[`${site}_L${l}`][k].still_correct;
      const x = x0 + li * 86 + bi * 22, h = 220 * v;
      svg('rect', { x, y: 320 - h, width: 18, height: h, fill: color }, root);
      if (bi === 0) svg('text', { class: 'fig-note small', x: x + 30, y: 338, 'text-anchor': 'middle' }, root).textContent = `L${l}`;
    }));
  });
  BARS.forEach(([, label, color], i) => {
    svg('rect', { x: 40 + i * 190, y: 360, width: 10, height: 10, fill: color }, root);
    svg('text', { class: 'fig-note', x: 56 + i * 190, y: 369 }, root).textContent = label;
  });
  return {
    enter() { caption(t('Deleting the state outright hurts only a little: most answers survive. The information is stored in more than one place.', '直接删掉“州”这个方向，伤害却很小，大多数题仍然答对。这条信息在模型里不止存了一处。')); },
    leave() {},
  };
}

// ---------- 3.1 ask the model what its own state means ----------

const PROMPTS = { selfie: t('“Summarise this:” X', '“总结一下：”X'), refer: t('“What does X refer to?”', '“X 指的是什么？”'), location: t('“Where is X located?”', '“X 位于哪里？”') };

export function askSelf(scene, caption, data) {
  const box = html('div', 'ask', scene);
  const VIEWS = [
    ['last', 24, 'selfie', t('Answering · summary', '回答前 · 总结')],
    ['last', 24, 'location', t('Answering · where', '回答前 · 在哪')],
    ['subject', 10, 'selfie', t('City · summary', '读城市 · 总结')],
    ['subject', 10, 'location', t('City · where', '读城市 · 在哪')],
  ];
  return views(scene, VIEWS.map(v => v[3]), i => {
    const [pos, l, prompt] = VIEWS[i];
    const rec = data.samples.twohop.find(r => r.position === pos && r.source_layer === l && r.prompt === prompt);
    const rate = data.describe.twohop.summary[`${prompt}|same|${pos}|${l}`].bridge;
    box.replaceChildren();
    html('p', 'ask-step mono', box).textContent = t(`1 · take the model’s state at layer ${l}, ${pos === 'last' ? 'about to answer' : 'on the word “Dallas”'}`, `1 · 取出模型第 ${l} 层的状态（${pos === 'last' ? '准备回答时' : '读到“Dallas”时'}）`);
    html('p', 'ask-step mono', box).textContent = t('2 · place it into a new question as X:', '2 · 把它放进一个新问题里，当作 X：');
    html('p', 'ask-q', box).textContent = PROMPTS[prompt];
    html('p', 'ask-step mono', box).textContent = t('3 · the model answers:', '3 · 模型回答：');
    html('p', 'ask-a', box).textContent = rec.output.trim();
    const meter = html('p', 'ask-rate mono', box);
    meter.textContent = t(`it names the state in ${pct(rate)} of the 68 questions`, `68 道题里，有 ${pct(rate)} 说出了那个州`);
    meter.classList.toggle('hit', rate > 0.3);
    caption(pos === 'last'
      ? t('About to answer, the model is thinking “Texas”, yet asked about its own state it never says so.', '准备回答时，模型心里想的是“得克萨斯”，可问它自己的状态，它一次也没说出来。')
      : t('Reading the city, it does say Texas. But is that the reasoning, or just what it knows about Dallas? See the next step.', '读到城市名时，它确实说出了得克萨斯。但这是推理的一步，还是它对达拉斯的常识？看下一步。'));
  });
}

// ---------- 3.2 the control that gives it away ----------

export function control(scene, caption, data) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  const box = { x: 70, y: 50, w: 520, h: 230 };
  const layers = [8, 10, 12, 14, 16, 18];
  const xOf = l => box.x + box.w * (l - 8) / 10;
  axes(root, box, { xLabel: t('x: layer, reading the city', '横轴：层数（读到城市名时）'), yLabel: t('share of questions where it names the state', '说出那个州的题目比例') });
  layers.forEach(l => svg('text', { class: 'fig-note', x: xOf(l), y: box.y + box.h + 20, 'text-anchor': 'middle' }, root).textContent = l);
  const layer = svg('g', {}, root);
  const note = svg('text', { class: 'fig-note', x: box.x, y: box.y + box.h + 76 }, root);
  legend(root, box.x, box.y + box.h + 48, [[t('inside the question', '在问题里读到的'), C.bridge, false], [t('“I recently visited Dallas.”', '“我最近去了达拉斯。”'), C.subject, true]]);
  const KEYS = ['location', 'selfie'];
  return views(scene, KEYS.map(k => PROMPTS[k]), i => {
    const k = KEYS[i];
    layer.replaceChildren();
    [['twohop', C.bridge, ''], ['neutral', C.subject, '5 5']].forEach(([ctx, color, dash]) => {
      const ys = layers.map(l => data.describe[ctx].summary[`${k}|same|subject|${l}`].bridge);
      svg('path', { class: 'curve-line', stroke: color, 'stroke-dasharray': dash, d: layers.map((l, j) => `${j ? 'L' : 'M'}${xOf(l)} ${box.y + box.h * (1 - ys[j])}`).join('') }, layer);
    });
    const neutral = data.samples.neutral.find(r => r.position === 'subject' && r.source_layer === 10 && r.prompt === k);
    note.textContent = `${t('from the plain sentence:', '取自普通句子时：')} ${neutral.output.trim().slice(0, 64)}…`;
    caption(t('Taken from a plain sentence with no question at all, the state comes out just as often. The model is recognising Dallas and adding what it knows, not reporting a step of its reasoning.', '换成一句完全不涉及问题的普通句子，说出那个州的比例几乎一样。模型只是认出了达拉斯、顺口补上常识，而不是在报告它推理中的某一步。'));
  });
}
