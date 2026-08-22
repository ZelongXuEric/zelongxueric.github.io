import type { CollectionEntry } from 'astro:content';

export type Publication = CollectionEntry<'publications'>;

export const arxivUrl = (id: string) => `https://arxiv.org/abs/${id}`;
export const doiUrl = (doi: string) => `https://doi.org/${doi}`;

/** Newest first; papers without a `date` sort as 1 January of their year. */
export function sortNewestFirst(pubs: Publication[]): Publication[] {
  const time = (p: Publication) => (p.data.date ?? new Date(p.data.year, 0, 1)).getTime();
  return [...pubs].sort((a, b) => time(b) - time(a));
}

export function groupByYear(pubs: Publication[]): Map<number, Publication[]> {
  const groups = new Map<number, Publication[]>();
  for (const p of sortNewestFirst(pubs)) {
    groups.set(p.data.year, [...(groups.get(p.data.year) ?? []), p]);
  }
  return groups;
}

/** Where the title links to: arXiv, then PDF, then DOI, then project page. */
export function primaryUrl(p: Publication): string | undefined {
  const d = p.data;
  if (d.arxiv) return arxivUrl(d.arxiv);
  return d.pdf || (d.doi ? doiUrl(d.doi) : undefined) || d.project || undefined;
}

/** Strips equal-contribution style markers ("Name*", "Name†") for matching. */
const plain = (name: string) => name.replace(/[*†‡]+$/, '').trim();

export const isSameAuthor = (a: string, b: string) => plain(a) === plain(b);

export function bibtex(p: Publication): string {
  const d = p.data;
  if (d.bibtex) return d.bibtex.trim();

  const lastName = plain(d.authors[0]).split(/\s+/).pop() ?? 'anon';
  const firstWord = d.title.toLowerCase().match(/[a-z0-9]+/)?.[0] ?? 'paper';
  const key = `${lastName.toLowerCase().replace(/[^a-z]/g, '')}${d.year}${firstWord}`;

  const fields: [string, string][] = [
    ['title', d.title],
    ['author', d.authors.map(plain).join(' and ')],
  ];
  if (d.venue) fields.push(['booktitle', d.venue]);
  fields.push(['year', String(d.year)]);
  if (d.doi) fields.push(['doi', d.doi]);
  if (d.arxiv) {
    if (!d.venue) fields.push(['eprint', d.arxiv], ['archivePrefix', 'arXiv']);
    fields.push(['url', arxivUrl(d.arxiv)]);
  } else if (d.pdf) {
    fields.push(['url', d.pdf]);
  }

  const body = fields.map(([k, v]) => `  ${k.padEnd(13)}= {${v}},`).join('\n');
  return `@${d.venue ? 'inproceedings' : 'misc'}{${key},\n${body}\n}`;
}
