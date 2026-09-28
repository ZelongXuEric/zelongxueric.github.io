import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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
      email: z.email(),
      description: z.string(),
      status: z.string().nullish(),
      links: z.array(z.object({
        label: z.string(),
        url: z.string().nullish(),
        icon: z.enum(['mail', 'file', 'scholar', 'github', 'orcid', 'linkedin', 'x', 'link']).default('link'),
      })),
      beyond: z.array(z.object({
        title: z.string(),
        text: z.string(),
        photos: z.array(z.object({
          image: image(),
          alt: z.string(),
          // CSS object-position of the square thumbnail crop.
          position: z.string().default('50% 50%'),
        })).min(1),
        aside: z.object({
          label: z.string(),
          platform: z.string(),
          // Draw the platform's wordmark instead of its name.
          logo: z.enum(['xiaohongshu']).nullish(),
          detail: z.string().nullish(),
          url: z.url(),
        }).nullish(),
      })).default([]),
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
    // Only store a complete, confirmed author list in the paper's original order.
    authors: z.array(z.string()).default([]),
    equalContribution: z.array(z.string()).default([]),
    status: z.enum(['published', 'preprint', 'under-review']).default('preprint'),
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
    project: z.string().nullish(),
    doi: z.string().nullish(),
    note: z.string().nullish(),
    bibtex: z.string().nullish(),
  }).refine(
    ({ authors, equalContribution }) => equalContribution.every((author) => authors.includes(author)),
    { message: 'Equal-contribution names must appear in the author list.', path: ['equalContribution'] },
  ).refine(
    ({ image, imageAlt }) => !image || !!imageAlt?.trim(),
    { message: 'A figure needs imageAlt describing what it shows.', path: ['imageAlt'] },
  ).refine(
    ({ image, video }) => !video || !!image,
    { message: 'A video needs an image to use as its poster frame.', path: ['image'] },
  ),
});

export const collections = { profile, about, publications };
