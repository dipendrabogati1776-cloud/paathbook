# Portfolio — Static HTML version

A plain HTML/CSS/JS rebuild of the Flutter portfolio app, matching the original
dark theme, gradients, cards, and animations — but with no framework and near-instant load.

## Files
- `index.html` — all page markup + an inline SVG icon sprite (no external icon font)
- `styles.css` — design tokens mirrored from `lib/core/theme/` (colors, typography, spacing)
- `script.js` — project data + filtering/search, carousels, read-more, contact copy, mobile drawer, scroll reveal
- `assets/` — images + resume PDF (copied from the Flutter project's `assets/`)
- `favicon.jpeg`

## Run locally
Any static server works, e.g.:

```sh
cd site
python3 -m http.server 8000
# open http://localhost:8000
```

Or just open `index.html` directly in a browser (the resume download and images work over `file://` too).

## Deploy
It's fully static — host on GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any static host.
For GitHub Pages, point the Pages source at this `site/` folder (or move its contents to `/docs`).

## Editing content
- Projects: edit the `projects` array in `script.js`.
- Skills / contact: edit `skillCategories` / `contactMethods` in `script.js`.
- Education, experience, about, resume, hero text: edit directly in `index.html`.
