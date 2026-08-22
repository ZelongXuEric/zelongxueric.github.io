# Zelong Xu — research homepage

Static academic homepage built with [Astro](https://astro.build). There is no backend and no
framework JavaScript; content is kept apart from the layout, so updating the site means editing a
few files in `src/content/`.

## Quick start

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run preview   # serve dist/ locally
```

## Where the content lives

| File | What it controls |
| --- | --- |
| `src/content/profile.yaml` | Name, role, tagline, status line, links, research interests, education, contact note |
| `src/content/about.md` | Bio (Markdown) |
| `src/content/news.yaml` | Dated updates shown next to the bio |
| `src/content/publications/*.md` | One file per paper — frontmatter is the metadata, the body is the abstract |
| `public/files/` | CV PDF and other static files (served at `/files/...`) |

Every file is validated against `src/content.config.ts` at build time, so a missing or misspelled
field fails the build with a readable error rather than rendering something broken.

## Adding a publication

Create `src/content/publications/<year>-<short-name>.md`. Only publicly available work belongs
here (conference / workshop / journal papers and arXiv preprints).

```markdown
---
title: "Paper title"              # quote titles that contain a colon
authors:
  - First Author
  - Zelong Xu                      # highlighted automatically ("Zelong Xu*" also matches)
venue: Findings of EMNLP 2026      # omit for a preprint
year: 2026
date: 2026-06-04                   # optional; orders papers within a year
arxiv: "2606.07678"                # optional; keep quoted. Links to arXiv are derived from it
pdf: https://arxiv.org/pdf/2606.07678   # optional; any URL or /files/paper.pdf
code: https://github.com/...       # optional
project: https://...               # optional
doi: 10.18653/v1/...               # optional
note: Oral                         # optional highlight shown next to the venue
bibtex: |                          # optional; generated from the fields above when omitted
  @inproceedings{...}
selected: true                     # marks the paper in the list
---

The abstract goes here (Markdown). Leave the body empty to hide the "Abstract" toggle.
```

Papers are grouped by year, newest first. The title links to arXiv, then PDF, DOI or project page,
whichever exists first.

## Updating other things

- **Bio** — edit `src/content/about.md`.
- **Research interests** — the `interests` list in `profile.yaml` (shown in the hero and the Research section).
- **CV** — copy the PDF to `public/files/Zelong_Xu_CV.pdf` and set the CV link's `url` to `/files/Zelong_Xu_CV.pdf`.
- **Links** — the `links` list in `profile.yaml`; order is display order. Icons: `mail`, `file`,
  `scholar`, `github`, `orcid`, `linkedin`, `x`, `link`. An empty `url` renders as a disabled placeholder.
- **News** — add an entry to `src/content/news.yaml` (date as `YYYY-MM` or `YYYY-MM-DD`).
- **Social preview image** — `public/og.png` is a static 1200×630 image; replace it if the name or tagline changes.

## Deploying to GitHub Pages

1. Create a GitHub repository. To serve the site at `https://<username>.github.io`, name the
   repository `<username>.github.io`. (For a project repository the site lives at
   `https://<username>.github.io/<repo>/`; then also set `base: '/<repo>'` in `astro.config.mjs`.)
2. Set `site` in `astro.config.mjs` and the `Sitemap:` URL in `public/robots.txt` to the final URL.
3. Push the code:
   ```bash
   git add -A
   git commit -m "Initial site"
   git remote add origin git@github.com:<username>/<repo>.git
   git push -u origin main
   ```
4. On GitHub open **Settings → Pages** and set **Build and deployment → Source** to
   **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds and deploys the site on
   every push to `main`.

## Before going live

- [ ] Add the CV (`public/files/Zelong_Xu_CV.pdf`) and set its link in `profile.yaml`
- [ ] Set the Google Scholar URL in `profile.yaml`
- [ ] Confirm the date of the EMNLP acceptance in `src/content/news.yaml`
- [ ] Read through `about.md`, the `tagline`, `interests` and `contactNote` — they are drafts written from the profile information

## Project structure

```
src/
  content/            ← everything editable
    content.config.ts ← schemas for the content files
  components/         ← one component per page section
  layouts/Base.astro  ← <head>, metadata, nav, footer
  pages/index.astro   ← assembles the sections
  scripts/            ← theme toggle, reveal-on-scroll, copy buttons, hero figure
  styles/global.css   ← design tokens and shared styles
public/               ← static files copied as-is (favicon, og.png, robots.txt, files/)
```
