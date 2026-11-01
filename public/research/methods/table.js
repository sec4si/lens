import { t, html } from '/js/util.js';

const DIMENSIONS = [
  ['causal', t('Causal evidence', '因果证据')],
  ['open', t('Finds the unexpected', '能发现意料之外')],
  ['scale', t('Works on large models', '可用于大模型')],
  ['cheap', t('Cheap', '成本低')],
  ['trust', t('Trustworthy', '结论可靠')],
];
// Our own rough judgement, 0 to 3, in the order of DIMENSIONS.
const METHODS = [
  ['probe', t('Linear probes', '线性探针'), [0, 0, 3, 3, 2]],
  ['lens', t('Logit / tuned lens', 'Logit / Tuned lens'), [0, 2, 3, 3, 1]],
  ['moe', t('MoE routing', 'MoE 专家路由'), [0, 2, 3, 3, 1]],
  ['saliency', t('Saliency & attention', '显著性与注意力'), [0, 2, 3, 3, 0]],
  ['patching', t('Activation patching', '激活修补'), [3, 1, 2, 1, 2]],
  ['steering', t('Steering vectors', '引导向量'), [2, 0, 3, 3, 2]],
  ['sae', t('Sparse autoencoders', '稀疏自编码器'), [1, 3, 2, 1, 2]],
  ['transcoder', 'Transcoders', [2, 3, 2, 1, 2]],
  ['crosscoder', 'Crosscoders', [1, 3, 1, 1, 1]],
  ['ioi', t('Manual circuits', '人工电路分析'), [3, 1, 0, 0, 3]],
  ['acdc', t('Automatic circuit discovery', '自动电路发现'), [3, 2, 1, 1, 2]],
  ['graph', t('Attribution graphs', '归因图'), [2, 3, 2, 1, 2]],
  ['autointerp', t('Automated explanations', '自动解释'), [0, 3, 3, 2, 1]],
  ['selfreport', t('Self-report', '模型自述'), [0, 3, 3, 2, 1]],
  ['sparse', t('Weight-sparse models', '权重稀疏模型'), [3, 3, 0, 0, 3]],
];

export function compare(table) {
  const head = html('tr', '', html('thead', '', table));
  html('th', '', head).textContent = t('Method', '方法');
  const body = html('tbody', '', table);
  let sortBy = -1;
  const render = () => {
    const rows = sortBy < 0 ? METHODS : [...METHODS].sort((a, b) => b[2][sortBy] - a[2][sortBy]);
    body.replaceChildren(...rows.map(([id, name, scores]) => {
      const row = html('tr');
      const link = html('a', '', html('td', '', row));
      link.href = `#m-${id}`;
      link.textContent = name;
      scores.forEach((s, k) => {
        const cell = html('td', k === sortBy ? 'sorted' : '', row);
        cell.setAttribute('aria-label', `${s} / 3`);
        cell.textContent = '●'.repeat(s) + '○'.repeat(3 - s);
      });
      return row;
    }));
  };
  DIMENSIONS.forEach(([, label], k) => {
    const button = html('button', 'mono', html('th', '', head));
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      sortBy = sortBy === k ? -1 : k;
      head.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', j === sortBy));
      render();
    });
  });
  render();
}
