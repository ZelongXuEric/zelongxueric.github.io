# Zelong Xu - research homepage

A static academic homepage built with Astro. The page consists of a compact profile
sidebar, a short biography, and one ordered research list. There is no backend or
client-side framework. The portrait, paper figures, and fonts are served locally.

## Development

```bash
npm install
npm run dev       # http://localhost:4321
npm test          # Node 22.6+; publication ordering, author matching, venue line, intro figure
npm run build     # static output in dist/
npm run preview
```

## Content

| File | Purpose |
| --- | --- |
| `src/content/profile.yaml` | Identity, city, affiliation, application status, profile links |
| `src/content/about.md` | The introduction: a paragraph, the list of research interests, a paragraph |
| `src/content/portrait.jpg` | Square portrait crop, optimized at build time and shown as a circle |
| `src/content/publications/*.md` | One research item per file |
| `src/content/publications/figures/` | One figure per paper, optimized at build time |
| `src/data/contact-figure.json` | Data for the intro figure, written by `scripts/contact-figure.py` |
| `public/files/` | Publicly downloadable CV and other files |
| `public/media/` | Figure videos (MP4) |

Content is validated by `src/content.config.ts`. Empty profile or paper links are
omitted rather than displayed as disabled controls. Put detailed education,
courses, skills, and older experience in the CV, not separate homepage sections.

## Research entries

```yaml
---
title: "Paper title"
authors:
  - First Author
  - Zelong Xu
authorCount: 17                   # only with an abbreviated author list, see below
status: published                 # published | preprint | under-review | manuscript
venue: Findings of EMNLP 2026     # actual publication venue, not submission venue
year: 2026
order: 1                          # lower values appear first; defaults to 100
summary: "One sentence explaining what the title does not."
image: ./figures/paper.png         # optional; shown beside the entry
imageAlt: "What the figure shows" # required whenever image is set
video: /media/paper.mp4           # optional; plays in place of the figure, image is its poster
arxiv: "2606.07678"                # optional; title and [Paper] open arxiv.org/pdf/<id>
pdf: /files/paper.pdf             # optional; overrides the arXiv PDF link
code: https://github.com/example  # optional; shown as [Code] with the GitHub mark
huggingface: https://huggingface.co/datasets/example  # optional; shown as [Dataset] with the Hugging Face logo
project: https://example.com      # optional; shown as [Website] with a globe
doi: 10.1234/example              # optional
---

Optional abstract in Markdown.
```

The author list must be confirmed, in the paper's original order. The profile
owner's name is bold. For confirmed co-first authors, add an `equalContribution`
list containing their exact names from `authors`. These names receive superscript
asterisks and a small explanation below that paper's author list. Author order is
unchanged. No separate first-author badges are shown.

A long list may leave names out: put a single `"…"` entry where they are omitted
and give the full count in `authorCount`, shown as "(17 authors)". When no names
are available, omit `authors`.

Under each entry the links run [Paper], [Abstract], [Code], [Dataset], [Website],
skipping the ones the paper does not have. BibTeX is not offered.

Only include work that is cleared for public display, and only the links that
are. The status decides the line under the authors:

| `status` | Shown as | Use for |
| --- | --- | --- |
| `published` | the `venue`, in the darker text color | accepted or published work |
| `preprint` | Preprint | a public preprint that is not under review |
| `under-review` | Under review | submitted work; the submission venue is never named |
| `manuscript` | Manuscript | unpublished work that is neither public nor submitted |

A manuscript has no paper link. The circuit discovery paper is one: it must not
link to a copy or be described as under review.

The FrontierPro and LiveWorldBench author lists are abbreviated as in the CV.
Replace them with the full lists, and add links, once the papers are public.

Entries sort by `order`, then newest first using optional `date` or `year`.
There are no year groups, badges, filters, or duplicated news announcements.

## Figures

Each figure is a crop of a real figure from the paper, not a decorative image.
Crop a part that stays recognizable at 200 px wide instead of shrinking a
whole dense figure. Render the PDF at about 300 dpi, trim the white margin, and
save a PNG at least 400 px wide. Figures sit in a 16:10 white frame on desktop
and span the column above the entry on mobile. Only add figures from work that
is cleared for public display.

A `video` replaces the still figure in the same frame, with `image` as its
poster frame and `imageAlt` as its label. Videos are muted, loop, and load only
when they scroll into view; they play automatically only when the visitor has
not asked for reduced motion (otherwise, and without JavaScript, native
controls are shown). Keep them small: an H.264 MP4 at 854x480 is plenty at this
size, e.g. `ffmpeg -i in.mp4 -vf scale=854:-2 -c:v libx264 -preset slow -crf 27
-pix_fmt yuv420p -movflags +faststart -an public/media/out.mp4`.

## Introduction and its figure

In `about.md`, the first list is the research interests. Its items are set in
serif, one to a line, under a small "Research interests" label, with the figure
beside them (below them on a phone); the paragraphs before and after the list
are ordinary text. Bold marks the few terms a reader should catch when skimming.
Without a list there are no interests and no figure.

The figure is a ribbon diagram of protein GB1 (PDB 1PGA), in ink with a wash of
color, and it has no text. The ribbon is drawn along the chain: arrows for the
strands, a coiled band for the helix. Then the 28 residue contacts that the
protein language model ESM-2 ranks highest appear as dashed lines and are tested
against the crystal structure one by one. A confirmed contact closes into a
solid line, a refuted one parts in the middle, and all of them fade, leaving the
ribbon. This is the idea the introduction ends on: what a model proposes, tested
against an experiment.

Nothing in it is invented. `scripts/contact-figure.py` reads the structure, runs
ESM-2 (150M) on the sequence, keeps the top L/2 pairs at least six residues
apart, and marks a pair confirmed when its C-beta atoms are within 8 angstroms.
To rebuild the data:

```bash
pip install torch transformers numpy
curl -O https://files.rcsb.org/download/1PGA.pdb
python scripts/contact-figure.py 1PGA.pdb > src/data/contact-figure.json
```

The sequence plays once when the figure comes into view. Afterwards the molecule
sways slowly, stops drawing when it is off screen, turns slightly toward the
pointer, and replays on a click. With reduced motion the finished ribbon appears
at once and stays still. Without JavaScript the figure is absent and the interests
stand alone. Its only words are the tooltip and the label for screen readers;
their counts come from the data, but they name the model and the protein by
hand, so update `ContactFigure.astro` if either changes. Colors, sizes, timing,
and the resting view are constants at the top of `src/lib/contactFigure.ts`.

## Typography

IBM Plex Sans is the text face. The English name and the research interests use
Source Serif 4. The
Chinese name (`nameZh` in `profile.yaml`)
uses Noto Serif SC (SIL OFL 1.1), subset to exactly 徐泽龙 in
`src/assets/fonts/noto-serif-sc-name.woff2` (2.5 KB). If the name changes,
regenerate the subset from
[NotoSerifSC[wght].ttf](https://github.com/google/fonts/tree/main/ofl/notoserifsc):

```bash
pip install fonttools brotli
pyftsubset 'NotoSerifSC[wght].ttf' --text='徐泽龙' --layout-features='' \
  --flavor=woff2 --output-file=src/assets/fonts/noto-serif-sc-name.woff2
```

Characters missing from the subset fall back to system Song/Ming fonts.

The Xiaohongshu link in the sidebar uses the platform's app icon, its wordmark in
white on the brand red (`src/components/XiaohongshuIcon.astro`, path from Simple
Icons, CC0-1.0).

## Interactions and accessibility

- The native Abstract disclosure works without JavaScript; its content fades in for 160 ms.
- Link color changes take 120 ms. Reduced-motion preferences disable both effects.
- The intro figure plays once, then sways slowly; see above.
- Keyboard focus, a skip link, mobile layout, and print styles are included.

## CV and deployment

The CV link is configured in `profile.yaml`; keep it in sync with the filename
in `public/files/`. **Everything in `public/` is copied into the deployed site,
including files that are not linked.** Remove private addresses and unpublished
material from any version intended for deployment. The CV header shows a phone
number by choice.

Source material that must stay private (statements, manuscripts, drafts) goes in
`_materials/`, which is ignored by git and never deployed.

The GitHub repository is
[ZelongXuEric/zelongxueric.github.io](https://github.com/ZelongXuEric/zelongxueric.github.io).
The existing GitHub Actions workflow builds and deploys pushes to `main`.
Local changes do not publish anything until committed and pushed.

`astro.config.mjs` contains the canonical site URL. Site-relative resource links
respect Astro's base path. Structured data, canonical links, the robots file,
and the sitemap are generated.

`public/favicon.svg` is a Source Serif 4 "Z" outlined to a path, so it renders
without web fonts; `public/apple-touch-icon.png` is the same mark without
rounded corners. `public/og.png` (1200x630) is a static social preview with the
name, affiliation, research topics, and portrait. Regenerate it when any of those
change.

## Layout

```text
src/components/Profile.astro       Portrait, English and Chinese name, contact links
src/components/ContactFigure.astro Intro figure: the canvas and its script
src/components/About.astro         Introduction with the research interests and figure, application status
src/components/Publications.astro  Research heading and ordered list
src/components/Publication.astro   Figure, paper metadata, links, abstract disclosure
src/components/Footer.astro        Last-updated date (build date)
src/layouts/Base.astro             Document metadata and skip link
src/pages/index.astro              Two-column layout
src/scripts/ui.ts                  Figure video playback
src/lib/contactFigure.ts           Intro figure geometry, color, and timing
scripts/contact-figure.py          Builds the intro figure data
src/styles/global.css             Typography, colors, responsive layout
src/assets/fonts/                  Chinese name font subset
```
