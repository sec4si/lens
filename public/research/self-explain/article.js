import '/js/page.js';
import { t } from '/js/util.js';
import { scrolly } from '/js/scrolly.js';
import { lensCurve, swap, ablate, askSelf, control } from './figs.js';

document.title = t('Can an AI explain itself? — Lens', 'AI 能解释自己吗？ — Lens');
const data = await (await fetch('./data.json')).json();
await document.fonts.ready;

const using = fig => (scene, caption) => fig(scene, caption, data);
const [see, use, say] = document.querySelectorAll('.scrolly-block');
scrolly(see, [using(lensCurve)]);
scrolly(use, [using(swap), using(ablate)]);
scrolly(say, [using(askSelf), using(control)]);
