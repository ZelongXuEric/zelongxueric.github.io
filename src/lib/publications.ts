import type { CollectionEntry } from 'astro:content';

export type Publication = CollectionEntry<'publications'>;

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
