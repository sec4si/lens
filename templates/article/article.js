import '/js/page.js';
import { t, svg, chip } from '/js/util.js';
import { scrolly, inline } from '/js/scrolly.js';

document.title = t('Article title — Lens', '文章标题 — Lens');
await document.fonts.ready;

// A figure is a function (scene, caption) => ({ enter, leave }); see /js/what.js for full examples.
function example(scene, caption) {
  const root = svg('svg', { viewBox: '0 0 640 400' }, scene);
  chip(root, 320, 200, t('replace me', '替换我'), 'out on');
  return {
    enter() { caption(t('Figure caption.', '图注。')); },
    leave() {},
  };
}

scrolly(document.querySelector('.scrolly-block'), [example, example]);
inline(document.querySelector('.inline-figure .stage'), example);
