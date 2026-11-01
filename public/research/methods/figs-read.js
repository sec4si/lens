import { t, zh, reduced, svg, html, random, fitCanvas, views } from '/js/util.js';

const PROBES = [
  { random: false, flexible: false, accuracy: 94, caption: t('Simple probe, real concept: 94%. The concept can be read off with a straight line.', '简单探针 + 真实概念：94%。一条直线就能把这个概念读出来。') },
  { random: false, flexible: true, accuracy: 97, caption: t('Flexible probe, real concept: 97%. A little better, but is that the model or the probe?', '复杂探针 + 真实概念：97%。好了一点，可这是模型的功劳还是探针的？') },
  { random: true, flexible: true, accuracy: 88, caption: t('Flexible probe, random labels: still 88%. It memorized. The probe did the work, not the model.', '复杂探针 + 随机标签：仍有 88%。它在死记硬背，干活的是探针，不是模型。') },
];

// Probing: a classifier on activations, and the control task that keeps it honest.
export function probe(scene, caption) {
  const canvas = html('canvas', 'threads', scene);
  const next = random(311);
  const points = Array.from({ length: 180 }, () => {
    const x = next(), y = next();
    return { x, y, real: x + y + (next() - 0.5) * 0.25 > 1, noise: next() < 0.5 };
  });
  let state = PROBES[0], ctx, w, h;

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const size = Math.min(w, h) * 0.78, ox = (w - size) / 2, oy = (h - size) / 2 - 10;
    for (const p of points) {
      const on = state.random ? p.noise : p.real;
      ctx.fillStyle = on ? '#d4ff63' : '#86e0c8';
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(ox + p.x * size, oy + p.y * size, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#f4f8ec';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const u = i / 120;
      const wiggle = state.random ? 0.22 * Math.sin(u * 47) + 0.12 * Math.sin(u * 23 + 1) : state.flexible ? 0.05 * Math.sin(u * 18) : 0;
      ctx.lineTo(ox + u * size, oy + Math.min(1, Math.max(0, 1 - u + wiggle)) * size);
    }
    ctx.stroke();
    ctx.font = '12px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#d4ff63';
    ctx.fillText(`${t('accuracy', '准确率')} ${state.accuracy}%`, ox, oy - 14);
  };
  const resize = () => { ({ ctx, w, h } = fitCanvas(canvas)); draw(); };
  new ResizeObserver(() => ctx && resize()).observe(canvas);

  const bar = views(scene, [t('Simple', '简单探针'), t('Flexible', '复杂探针'), t('Random labels', '随机标签')], i => {
    state = PROBES[i];
    if (ctx) draw();
    caption(state.caption);
  });
  return { enter() { resize(); bar.enter(); }, leave: bar.leave };
}

const LAYERS = zh
  ? { logit: [['的', 2], ['，', 2], ['是', 3], ['的', 3], ['在', 4], ['一个', 5], ['城市', 7], ['首都', 12], ['巴黎', 21], ['巴黎', 38], ['巴黎', 61], ['巴黎', 83]],
      tuned: [['一个', 5], ['城市', 7], ['城市', 9], ['首都', 12], ['巴黎', 18], ['巴黎', 26], ['巴黎', 35], ['巴黎', 46], ['巴黎', 58], ['巴黎', 69], ['巴黎', 77], ['巴黎', 83]] }
  : { logit: [['the', 2], [',', 2], ['of', 3], ['the', 3], ['is', 4], ['a', 5], ['city', 7], ['capital', 12], ['Paris', 21], ['Paris', 38], ['Paris', 61], ['Paris', 83]],
      tuned: [['a', 5], ['city', 7], ['city', 9], ['capital', 12], ['Paris', 18], ['Paris', 26], ['Paris', 35], ['Paris', 46], ['Paris', 58], ['Paris', 69], ['Paris', 77], ['Paris', 83]] };

// Logit lens and tuned lens: what each layer would predict if the model stopped there.
export function lens(scene, caption) {
  const box = html('div', 'layer-list mono', scene);
  html('p', 'layer-prompt', box).textContent = t('PROMPT  The capital of France is', '提问  法国的首都是');
  const rows = LAYERS.logit.map((_, i) => {
    const row = html('div', 'layer-row', box);
    html('span', 'layer-no', row).textContent = `L${i}`;
    const track = html('span', 'layer-track', row);
    const fill = html('span', 'layer-fill', track);
    const token = html('span', 'layer-token', row);
    return { fill, token };
  });
  const lines = [
    t('Logit lens: early layers look like noise; the answer only surfaces late.', 'Logit lens：前面几层看起来像噪声，答案到很后面才浮现。'),
    t('Tuned lens: a small learned translator per layer gives steadier, more reliable readings.', 'Tuned lens：每层配一个学出来的小“翻译器”，读数更稳定、更可靠。'),
  ];
  return views(scene, ['logit lens', 'tuned lens'], i => {
    const data = LAYERS[i ? 'tuned' : 'logit'];
    rows.forEach(({ fill, token }, k) => {
      const [word, p] = data[k];
      fill.style.width = `${p}%`;
      token.textContent = `${word}  ${p}%`;
      token.classList.toggle('hit', word === t('Paris', '巴黎'));
    });
    caption(lines[i]);
  });
}

const SENTENCE = zh ? ['这部', '电影', '一点', '也', '不', '好看'] : ['The', 'movie', 'was', 'not', 'good', 'at', 'all'];
const HEAT = zh
  ? [[0.05, 0.2, 0.25, 0.1, 0.9, 0.8], [0.6, 0.7, 0.1, 0.05, 0.15, 0.2], [0.1, 0.25, 0.3, 0.15, 0.8, 0.75]]
  : [[0.05, 0.2, 0.05, 0.9, 0.8, 0.2, 0.25], [0.6, 0.7, 0.1, 0.1, 0.15, 0.05, 0.2], [0.1, 0.25, 0.1, 0.8, 0.75, 0.3, 0.2]];

// Attribution: three heat maps over the same sentence, one of them from a model with random weights.
export function saliency(scene, caption) {
  const box = html('div', 'heat', scene);
  html('p', 'layer-prompt mono', box).textContent = t('MODEL SAYS  negative review', '模型判断  差评');
  const line = html('p', 'heat-line', box);
  const tokens = SENTENCE.map(word => {
    const span = html('span', 'heat-tok', line);
    span.textContent = word;
    return span;
  });
  const lines = [
    t('Gradients: “not” and “good” light up. Plausible.', '梯度：“不”和“好看”亮了，看起来很合理。'),
    t('Attention: the weights sit on the first words. Attention shows where information flows, not why.', '注意力：权重落在开头几个词上。注意力只说明信息往哪流，不说明为什么。'),
    t('Same gradient method, model weights randomized: almost the same map. It was tracking the input, not the model.', '同样的梯度方法，把模型权重随机打乱：图几乎没变。它反映的是输入本身，而不是模型。'),
  ];
  return views(scene, [t('Gradient', '梯度'), t('Attention', '注意力'), t('Random model', '随机模型')], i => {
    tokens.forEach((span, k) => span.style.setProperty('--heat', HEAT[i][k]));
    caption(lines[i]);
  });
}

const PATCH_TOKENS = zh ? ['埃菲尔', '铁塔', '位于', '城市'] : ['Eiffel', 'Tower', 'is in', 'the city of'];
// Recovery of P(Paris) when one cell of the clean run is copied into the corrupted run: strong at the subject's last token in middle layers, and at the final token late.
const recovery = (token, layer) => token === 1 ? Math.exp(-((layer - 5) ** 2) / 6) * 0.85
  : token === 3 ? Math.max(0, (layer - 6) / 6) * 0.9 : 0.06 + (token === 0 ? 0.05 * Math.exp(-((layer - 3) ** 2) / 4) : 0);

// Activation patching: copy one cell from the clean run into the broken run and see how much of the answer comes back.
export function patching(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 420' }, scene);
  svg('text', { class: 'fig-note', x: 30, y: 28 }, root).textContent = t('clean: “Eiffel Tower is in the city of” → Paris', '正常运行：“埃菲尔铁塔位于城市” → 巴黎');
  svg('text', { class: 'fig-note', x: 30, y: 48 }, root).textContent = t('broken: subject blurred with noise → ?', '破坏运行：主语被噪声模糊 → ?');
  const cells = [];
  for (let layer = 0; layer < 12; layer++) {
    svg('text', { class: 'fig-note', x: 112, y: 92 + layer * 24, 'text-anchor': 'end' }, root).textContent = `L${layer}`;
    PATCH_TOKENS.forEach((_, token) => {
      const value = recovery(token, layer);
      const cell = svg('rect', { class: 'patch-cell', x: 126 + token * 110, y: 80 + layer * 24, width: 104, height: 20, style: `--v:${value}` }, root);
      cell.addEventListener('pointerenter', () => pick(token, layer));
      cells.push({ cell, token, layer, value });
    });
  }
  PATCH_TOKENS.forEach((word, token) => {
    svg('text', { class: 'fig-note', x: 178 + token * 110, y: 380, 'text-anchor': 'middle' }, root).textContent = word;
  });
  const pick = (token, layer) => {
    cells.forEach(c => c.cell.classList.toggle('on', c.token === token && c.layer === layer));
    const v = Math.round(recovery(token, layer) * 100);
    caption(`${t('Patch', '修补')} L${layer} · ${PATCH_TOKENS[token]} → P(${t('Paris', '巴黎')}) ${t('recovers', '恢复到')} ${v}%`);
  };
  root.addEventListener('pointerleave', () => {
    cells.forEach(c => c.cell.classList.remove('on'));
    caption(t('Bright cells are where the fact lives: the subject’s last word in middle layers. Hover a cell.', '亮的格子就是事实所在的位置：主语最后一个词的中间层。悬停任意格子试试。'));
  });
  return {
    enter() { root.dispatchEvent(new Event('pointerleave')); },
    leave() {},
  };
}

const STEER = [
  t('It was nice. I stayed home and read a book.', '挺好的，在家看了本书。'),
  t('It was pleasant. I remained at home and read a book.', '还不错，我在家中读了一本书。'),
  t('It was most agreeable; I remained at my residence and perused a volume.', '周末甚为惬意，于寓所之中研读典籍一卷。'),
  t('Pursuant to your inquiry: the weekend proceeded agreeably; residence maintained; volume perused.', '兹就周末事宜答复如下：寓所留守，典籍研读，诸事顺遂。'),
  t('Pursuant pursuant hereby residence hereof volume hereby hereof pursuant…', '兹兹特此寓所特此典籍兹此此兹……'),
];

// Steering: add a “formal” direction to the activations and turn it up until the text breaks.
export function steering(scene, caption) {
  const box = html('div', 'chat', scene);
  html('p', 'chat-prompt mono', box).textContent = t('PROMPT  How was your weekend?', '提问  你周末过得怎么样？');
  const out = html('p', 'chat-out', box);
  const control = html('label', 'untangle-control mono', scene);
  control.append(t('“formal” vector: 0', '“正式”向量：0'));
  const slider = html('input', '', control);
  Object.assign(slider, { type: 'range', min: 0, max: 400, value: 0 });
  slider.setAttribute('aria-label', t('Steering strength', '引导强度'));
  control.append('×4');

  let level = -1, touched = false, timer = 0;
  const show = n => {
    if (n === level) return;
    level = n;
    out.textContent = STEER[n];
    out.classList.toggle('broken', n === 4);
    out.classList.remove('fresh');
    out.getBoundingClientRect();
    out.classList.add('fresh');
    caption(n < 4
      ? t('Add a direction to the activations and the style shifts, with no training at all.', '往激活里加一个方向，风格就跟着变，完全不需要训练。')
      : t('Push too hard and the model breaks: steering trades control against general ability.', '推得太狠，模型就坏了：引导是在控制力和通用能力之间做交换。'));
  };
  slider.addEventListener('input', () => { touched = true; clearInterval(timer); show(Math.round(slider.value / 100)); });
  return {
    enter() {
      if (touched) return;
      slider.value = 0;
      show(0);
      if (reduced.matches) return;
      timer = setInterval(() => (level < 4 ? (slider.value = (level + 1) * 100, show(level + 1)) : clearInterval(timer)), 1600);
    },
    leave() { clearInterval(timer); },
  };
}
