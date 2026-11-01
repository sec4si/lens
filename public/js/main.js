import './page.js';
import { t } from './util.js';
import { scrolly } from './scrolly.js';
import { lens } from './lens.js';
import { renderIndex } from './articles.js';
import { blackbox, weights, neurons, untangle, circuit } from './what.js';
import { grown, shortcuts, says } from './why.js';
import { hallucinate, steer, audit, discover, maintain } from './gains.js';
import { timeline, coverage, splits, scale } from './limits.js';

document.title = t('Lens — Interpretability · sec4.si', 'Lens — 可解释性 · sec4.si');
lens(document.getElementById('specimen'));
renderIndex(document.querySelector('.article-list'));

// Chapter figures are measured on build, so wait for the fonts first.
await document.fonts.ready;

scrolly(document.getElementById('what'), [blackbox, weights, neurons, untangle, circuit]);
scrolly(document.getElementById('why'), [grown, shortcuts, says]);
scrolly(document.getElementById('gains'), [hallucinate, steer, audit, discover, maintain]);
scrolly(document.getElementById('limits'), [timeline, coverage, splits, scale]);
