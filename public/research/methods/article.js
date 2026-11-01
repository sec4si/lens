import '/js/page.js';
import { t } from '/js/util.js';
import { scrolly } from '/js/scrolly.js';
import { probe, lens, saliency, patching, steering } from './figs-read.js';
import { sae, transcoder, crosscoder } from './figs-decompose.js';
import { ioi, acdc, graph, autointerp, selfreport, sparse } from './figs-trace.js';
import { compare } from './table.js';

document.title = t('A Field Guide to Interpretability Methods — Lens', '可解释性方法全景 — Lens');
compare(document.querySelector('.compare'));
await document.fonts.ready;

const blocks = document.querySelectorAll('.scrolly-block');
[[probe, lens], [saliency], [patching, steering], [sae, transcoder, crosscoder], [ioi, acdc, graph], [autointerp, selfreport], [sparse]]
  .forEach((figures, i) => scrolly(blocks[i], figures));
