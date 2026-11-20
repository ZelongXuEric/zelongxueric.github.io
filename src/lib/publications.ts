import type { CollectionEntry } from 'astro:content';

export type Publication = CollectionEntry<'publications'>;

export const arxivUrl = (id: string) => `https://arxiv.org/abs/${id}`;
export const arxivPdfUrl = (id: string) => `https://arxiv.org/pdf/${id}`;
export const doiUrl = (doi: string) => `https://doi.org/${doi}`;

/** Newest first; papers without a `date` sort as 1 January of their year. */
export function sortNewestFirst(pubs: Publication[]): Publication[] {
  const time = (p: Publication) => (p.data.date ?? new Date(Date.UTC(p.data.year, 0, 1))).getTime();
  return [...pubs].sort((a, b) => time(b) - time(a));
}

/** Editorial order first, then newest first for equally ranked work. */
export function sortForDisplay(pubs: Publication[]): Publication[] {
  return sortNewestFirst(pubs).sort((a, b) => a.data.order - b.data.order);
}

/** The paper itself: an explicit PDF, then the arXiv PDF, then the DOI. */
export function paperUrl(p: Publication): string | undefined {
  const d = p.data;
  return d.pdf || (d.arxiv ? arxivPdfUrl(d.arxiv) : undefined) || (d.doi ? doiUrl(d.doi) : undefined);
}

/** Where the title links to: the paper, otherwise the project page. */
export function primaryUrl(p: Publication): string | undefined {
  return paperUrl(p) || p.data.project || undefined;
}

/** Strips equal-contribution style markers ("Name*", "Name†") for matching. */
const plain = (name: string) => name.replace(/[*†‡]+$/, '').trim();

export const isSameAuthor = (a: string, b: string) => plain(a) === plain(b);

/** An `authors` entry of "…" (or "...") stands for names left out of a long list. */
export const isElision = (name: string) => /^(…|\.\.\.)$/.test(name.trim());

const STATUS_LABELS = {
  preprint: 'Preprint',
  'under-review': 'Under review',
  manuscript: 'Manuscript',
} as const;

/** The venue line: the publication venue, or the status of unpublished work, with the year. */
export function venueLine(d: Pick<Publication['data'], 'status' | 'venue' | 'year'>): string {
  const label = d.status === 'published' ? d.venue || 'Published' : STATUS_LABELS[d.status];
  return label.includes(String(d.year)) ? label : `${label} · ${d.year}`;
}

export function bibtex(p: Publication): string {
  const d = p.data;
  if (d.bibtex) return d.bibtex.trim();

  // No generated citation without a complete author list, or for a manuscript
  // that has no public copy to cite.
  if (!d.authors.length || d.authors.some(isElision) || d.status === 'manuscript') return '';
  const published = d.status === 'published' && !!d.venue;
  const lastName = plain(d.authors[0]).split(/\s+/).pop() ?? 'anon';
  const firstWord = d.title.toLowerCase().match(/[a-z0-9]+/)?.[0] ?? 'paper';
  const key = `${lastName.toLowerCase().replace(/[^a-z]/g, '')}${d.year}${firstWord}`;

  const fields: [string, string][] = [
    ['title', d.title],
    ['author', d.authors.map(plain).join(' and ')],
  ];
  if (published) fields.push(['booktitle', d.venue!]);
  fields.push(['year', String(d.year)]);
  if (d.doi) fields.push(['doi', d.doi]);
  if (d.arxiv) {
    if (!published) fields.push(['eprint', d.arxiv], ['archivePrefix', 'arXiv']);
    fields.push(['url', arxivUrl(d.arxiv)]);
  } else if (d.pdf) {
    fields.push(['url', d.pdf]);
  }

  const body = fields.map(([k, v]) => `  ${k.padEnd(13)}= {${v}},`).join('\n');
  return `@${published ? 'inproceedings' : 'misc'}{${key},\n${body}\n}`;
}
