import { t, zh, html } from './util.js';
import { lens } from './lens.js';
import { blackbox, weights, neurons, untangle, circuit } from './what.js';
import { grown, shortcuts, says } from './why.js';

document.title = t('Lens — Interpretability · sec4.si', 'Lens — 可解释性 · sec4.si');
lens(document.getElementById('specimen'));

// Figures are built once in the current language, so switching reloads the page.
document.querySelector('.lang-switch').addEventListener('click', () => {
  try { localStorage.setItem('lang', zh ? 'en' : 'zh'); } catch {}
  location.reload();
});

// Chapter figures are measured on build, so wait for the fonts first.
await document.fonts.ready;

function scrolly(section, factories) {
  const steps = [...section.querySelectorAll('.step')];
  const figure = section.querySelector('.stage-fig');
  const holder = section.querySelector('.stage-scenes');
  const scenes = factories.map(factory => {
    const el = html('div', 'scene', holder);
    const caption = html('p', 'scene-caption mono', el);
    return { el, ...factory(el, text => { caption.textContent = text; }) };
  });
  let current = -1, inView = false;

  const show = i => {
    if (i === current) return;
    if (current >= 0) {
      if (inView) scenes[current].leave();
      scenes[current].el.classList.remove('is-active');
      steps[current].classList.remove('is-active');
    }
    current = i;
    scenes[i].el.classList.add('is-active');
    steps[i].classList.add('is-active');
    figure.textContent = `${t('FIG', '图')} ${section.dataset.chapter}.${i + 1}`;
    if (inView) scenes[i].enter();
  };
  const band = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) show(steps.indexOf(entry.target));
  }, { rootMargin: '-55% 0px -44% 0px' });
  steps.forEach(step => band.observe(step));
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting === inView) return;
    inView = entry.isIntersecting;
    inView ? scenes[current].enter() : scenes[current].leave();
  }).observe(section.querySelector('.stage'));
  show(0);
}

scrolly(document.getElementById('what'), [blackbox, weights, neurons, untangle, circuit]);
scrolly(document.getElementById('why'), [grown, shortcuts, says]);
