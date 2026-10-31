# Lens — sec4si

Project website: **https://lens.sec4.si/**

This repository starts with a static project landing page styled to match [sec4.si](https://sec4.si/). It is ready for the project code to be migrated in later.

## Local development

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4176/. The starter has no third-party JavaScript dependencies. The fonts are self-hosted with their license notices in `public/licenses/`.

Edit `public/` for the placeholder. Run `npm run build` to produce `dist/`.

## GitHub Pages

- Source: **GitHub Actions**, not branch publishing.
- Workflow: [Deploy GitHub Pages](https://github.com/sec4si/lens/actions/workflows/pages.yml).
- Pages settings: https://github.com/sec4si/lens/settings/pages
- Pushes to `main` and manual workflow dispatches run `npm ci`, `npm run build`, and publish only `dist/`.
- The repository Pages custom domain is `lens.sec4.si`.
- Cloudflare: DNS-only CNAME `lens` → `sec4si.github.io`.

## Moving in the real project

Replace the starter with your application and keep the build contract: **`npm ci` + `npm run build` → `dist/`**. For a framework that exports elsewhere, update the workflow's artifact path. Keep the custom domain configured in Pages, and carry `public/CNAME` and `public/.nojekyll` into the static output when applicable. GitHub Pages hosts static files; backend services must be deployed separately if the future project needs them.

The main website, [Benchmark](https://benchmark.sec4.si/), and [Lens](https://lens.sec4.si/) are connected in the project navigation. No private research data or proprietary Pro component source is included in this starter.
