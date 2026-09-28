# Zelong Xu - research homepage

A static academic homepage built with Astro. The page consists of a compact profile
sidebar, a short biography, one ordered research list, and a short Beyond Research
section. There is no backend or
client-side framework. The portrait, paper figures, and fonts are served locally.

## Development

```bash
npm install
npm run dev       # http://localhost:4321
npm test          # Node 22.6+; publication ordering, author matching, citation logic
npm run build     # static output in dist/
npm run preview
```

## Content

| File | Purpose |
| --- | --- |
| `src/content/profile.yaml` | Identity, city, affiliation, application status, profile links |
| `src/content/about.md` | Two short introductory paragraphs |
| `src/content/beyond/` | 4:5 photo crops for the Beyond Research cards (listed under `beyond` in `profile.yaml`) |
| `src/content/portrait.jpg` | Square portrait crop (subject left of center), optimized at build time and shown as a circle |
| `src/content/publications/*.md` | One research item per file |
| `src/content/publications/figures/` | One figure per paper, optimized at build time |
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
status: published                 # published | preprint | under-review
venue: Findings of EMNLP 2026     # actual publication venue, not submission venue
year: 2026
order: 1                          # lower values appear first; defaults to 100
summary: "One sentence explaining what the title does not."
image: ./figures/paper.png         # optional; shown beside the entry
imageAlt: "What the figure shows" # required whenever image is set
video: /media/paper.mp4           # optional; plays in place of the figure, image is its poster
arxiv: "2606.07678"                # optional; derives a public paper link
pdf: /files/paper.pdf             # optional; URLs or site-relative paths
code: https://github.com/example  # optional
project: https://example.com      # optional
doi: 10.1234/example              # optional
---

Optional abstract in Markdown.
```

The author list must be complete and confirmed, in the paper's original order.
The profile owner's name is bold. For confirmed co-first authors, add an
`equalContribution` list containing their exact names from `authors`. These names
receive superscript asterisks and a small explanation below that paper's author
list. Author order is unchanged, and citation names never include these markers.
No separate first-author badges are shown. When the list is not available, omit `authors`;
no BibTeX is generated from an unknown author list. A hand-written `bibtex`
field can override the generated citation.

Author lists for the three September 2026 works have been checked against the
uploaded manuscripts. Their public resource links can be added when available.
Only include work that is cleared for public display. Under-review work is
explicitly labeled, never presented as accepted at its submission venue.
Published venues use the darker text color; other statuses stay gray.

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

## Typography

IBM Plex Sans is the text face. The English name uses Source Serif 4. The Chinese
name (`nameZh` in `profile.yaml`) uses Noto Serif SC (SIL OFL 1.1), subset to
exactly those three characters in `src/assets/fonts/noto-serif-sc-name.woff2`
(2.5 KB). If `nameZh` changes, regenerate the subset from
[NotoSerifSC[wght].ttf](https://github.com/google/fonts/tree/main/ofl/notoserifsc):

```bash
pip install fonttools brotli
pyftsubset 'NotoSerifSC[wght].ttf' --text='徐泽龙' --layout-features='' \
  --flavor=woff2 --output-file=src/assets/fonts/noto-serif-sc-name.woff2
```

Characters missing from the subset fall back to system Song/Ming fonts.

## Interactions and accessibility

- Native Abstract and BibTeX disclosures work without JavaScript.
- Only one disclosure per paper opens at a time; content fades in for 160 ms.
- Link color changes take 120 ms. Reduced-motion preferences disable both effects.
- Clipboard controls announce success or select the citation if access is denied.
- Keyboard focus, a skip link, mobile layout, and print styles are included.

## CV and deployment

The CV link is configured in `profile.yaml`; keep it in sync with the filename
in `public/files/`. **Everything in `public/` is copied into the deployed site,
including files that are not linked.** Remove private addresses, phone numbers,
and unpublished material from any version intended for deployment.

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
src/components/About.astro         Short bio and application status
src/components/Publications.astro  Research heading and ordered list
src/components/Publication.astro   Figure, paper metadata, native disclosures
src/components/Beyond.astro        Photo cards for life outside research
src/components/Footer.astro        Last-updated date (build date)
src/layouts/Base.astro             Document metadata and skip link
src/pages/index.astro              Two-column layout
src/scripts/ui.ts                  Clipboard feedback, figure video playback
src/styles/global.css             Typography, colors, responsive layout
src/assets/fonts/                  Chinese name font subset
```
