import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { isElision } from './lib/publications';

const profile = defineCollection({
  loader: glob({ pattern: 'profile.yaml', base: './src/content' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      nameZh: z.string().nullish(),
      location: z.string().nullish(),
      photo: image().nullish(),
      role: z.string(),
      affiliation: z.string(),
      affiliationShort: z.string().nullish(),
      affiliationUrl: z.url().nullish(),
      affiliationLogo: image().nullish(),
      email: z.email(),
      description: z.string(),
      status: z.string().nullish(),
      links: z.array(z.object({
        label: z.string(),
        url: z.string().nullish(),
        icon: z.enum(['mail', 'file', 'scholar', 'github', 'xiaohongshu', 'orcid', 'linkedin', 'x', 'link']).default('link'),
      })),
    }),
});

const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: './src/content' }),
  schema: z.object({}),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    // Confirmed names in the paper's original order. A long list may leave names out
    // with a single "…" entry, and must then give the full count in `authorCount`.
    authors: z.array(z.string()).default([]),
    authorCount: z.number().int().positive().nullish(),
    equalContribution: z.array(z.string()).default([]),
    // `manuscript` is unpublished work that is neither public nor submitted.
    status: z.enum(['published', 'preprint', 'under-review', 'manuscript']).default('preprint'),
    venue: z.string().nullish(),
    year: z.number().int(),
    order: z.number().int().nonnegative().default(100),
    date: z.coerce.date().nullish(),
    summary: z.string().nullish(),
    image: image().nullish(),
    imageAlt: z.string().nullish(),
    // Site-relative or absolute MP4 URL; `image` becomes its poster frame.
    video: z.string().nullish(),
    arxiv: z.string().nullish(),
    pdf: z.string().nullish(),
    code: z.string().nullish(),
    huggingface: z.string().nullish(),
    project: z.string().nullish(),
    doi: z.string().nullish(),
    note: z.string().nullish(),
    bibtex: z.string().nullish(),
  }).refine(
    ({ authors, equalContribution }) => equalContribution.every((author) => authors.includes(author)),
    { message: 'Equal-contribution names must appear in the author list.', path: ['equalContribution'] },
  ).refine(
    ({ authors, authorCount }) => {
      const elisions = authors.filter(isElision).length;
      const named = authors.length - elisions;
      if (elisions > 1) return false;
      return elisions === 1 ? !!authorCount && authorCount > named : !authorCount || authorCount === named;
    },
    { message: 'Use at most one "…" entry in authors, with authorCount larger than the number of names shown.', path: ['authorCount'] },
  ).refine(
    ({ image, imageAlt }) => !image || !!imageAlt?.trim(),
    { message: 'A figure needs imageAlt describing what it shows.', path: ['imageAlt'] },
  ).refine(
    ({ image, video }) => !video || !!image,
    { message: 'A video needs an image to use as its poster frame.', path: ['image'] },
  ),
});

export const collections = { profile, about, publications };
