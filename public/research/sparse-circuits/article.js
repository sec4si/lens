import '/js/page.js';
import { t } from '/js/util.js';
import { scrolly, inline } from '/js/scrolly.js';
import { tasks, schedule, sweep, curves, results, budget, ablation, anatomy, knockout, reading, merging, recovery, abstain } from './figs.js';

document.title = t('Do sparse weights make smaller circuits? — Lens', '权重稀疏会让电路变小吗？ — Lens');
const [data, circuits] = await Promise.all(['./data.json', './circuits.json'].map(async url => (await fetch(url)).json()));
await document.fonts.ready;

const using = fig => (scene, caption) => fig(scene, caption, data, circuits);
inline(document.querySelector('.inline-figure .stage'), tasks);
const [method, findings, mechanics] = document.querySelectorAll('.scrolly-block');
scrolly(method, [schedule, using(sweep), using(curves)]);
scrolly(findings, [using(results), using(budget), using(ablation), using(anatomy)]);
scrolly(mechanics, [using(knockout), using(reading), using(merging), using(recovery), using(abstain)]);
