# Lens — sec4si

Project website: **https://lens.sec4.si/**

The sec4si interpretability research site, styled to match [sec4.si](https://sec4.si/): an interactive introduction to interpretability, followed by our research articles. Every page is bilingual (English / 中文).

## Local development

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4176/. The site has no third-party JavaScript dependencies. The fonts are self-hosted with their license notices in `public/licenses/`.

Everything served lives in `public/`. Run `npm run build` to produce `dist/`.

## GitHub Pages

- Source: **GitHub Actions**, not branch publishing.
- Workflow: [Deploy GitHub Pages](https://github.com/sec4si/lens/actions/workflows/pages.yml).
- Pages settings: https://github.com/sec4si/lens/settings/pages
- Pushes to `main` and manual workflow dispatches run `npm ci`, `npm run build`, and publish only `dist/`.
- The repository Pages custom domain is `lens.sec4.si`.
- Cloudflare: DNS-only CNAME `lens` → `sec4si.github.io`.

## Writing an article

1. Copy `templates/article/` to `public/research/<slug>/`.
2. Write the text in `index.html`. Every piece of visible text comes in pairs: `<span lang="en">…</span><span lang="zh-CN">…</span>`.
3. Build the figures in `article.js`. A figure is a function `(scene, caption) => ({ enter, leave })`; use `scrolly()` for figures driven by steps and `inline()` for a figure that stands on its own. The chapters in `public/js/` are working examples.
4. Add the article to `ARTICLES` in `public/js/articles.js` so it appears in the research index on the home page.

Figures that show model internals must be built from real data; label anything schematic as such.

No private research data or proprietary component source is kept in this repository.
