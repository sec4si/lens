import { t, html } from './util.js';

// Every published article, newest first. Each lives at /research/<slug>/.
export const ARTICLES = [
  {
    slug: 'self-explain',
    date: '2026-11-02',
    title: ['Can an AI explain itself?', 'AI 能解释自己吗？'],
    summary: ['We can watch a model think a step it never says, and prove it uses that step. But handed its own thoughts, it cannot tell us what they are.', '我们能看到模型心里想了一步没说出口的推理，也能证明它用了这一步；可把它自己的念头交还给它，它说不出那是什么。'],
  },
  {
    slug: 'sparse-circuits',
    date: '2026-11-02',
    title: ['Can a model’s reasoning be made small enough to read?', '能让模型的思路小到读得懂吗？'],
    summary: ['We cut almost all the wires inside small models as they learned. Each skill ended up on its own small circuit: one we could remove, one we could read, and, with the right interface, two we could plug together.', '我们在小模型学习时剪掉了它几乎所有的连线。每项本领都落在了一个独立的小电路上：可以单独拆掉，可以读懂，有了合适的接口，还能把两项本领插到一起。'],
  },
  {
    slug: 'methods',
    date: '2026-11-01',
    title: ['A field guide to interpretability methods', '可解释性方法全景'],
    summary: ['Fifteen tools for looking inside language models, from probes to sparse autoencoders: how each works and where it falls short.', '窥探大模型内部的十五种工具，从探针到稀疏自编码器：每一种怎么工作，又有哪些不足。'],
  },
];

export function renderIndex(list) {
  if (!ARTICLES.length) {
    const empty = html('li', 'article-empty', list);
    html('span', 'mono', empty).textContent = t('IN PREPARATION', '准备中');
    html('p', '', empty).textContent = t('Our first article is being written. It will appear here.', '第一篇文章正在撰写中，完成后会出现在这里。');
    return;
  }
  for (const { slug, date, title, summary } of ARTICLES) {
    const link = html('a', 'article-row', html('li', '', list));
    link.href = `/research/${slug}/`;
    html('span', 'article-date mono', link).textContent = date;
    html('h3', '', link).textContent = t(...title);
    html('p', '', link).textContent = t(...summary);
    html('span', 'article-go mono', link).textContent = t('Read →', '阅读 →');
  }
}
