import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Everything shown on the site lives in src/content/. Each collection below is
// validated at build time, so a missing or misspelled field fails the build with
// a readable error instead of silently rendering something broken.

const link = z.object({
  label: z.string(),
  // Leave empty ("") while a link is not available yet; it renders as a
  // visibly disabled placeholder instead of a broken link.
  url: z.string().nullish(),
  icon: z
    .enum(['mail', 'file', 'scholar', 'github', 'orcid', 'linkedin', 'x', 'link'])
    .default('link'),
});

const profile = defineCollection({
  loader: glob({ pattern: 'profile.yaml', base: './src/content' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    affiliation: z.string(),
    affiliationUrl: z.string().nullish(),
    department: z.string().nullish(),
    email: z.string(),
    // One-sentence description used for <meta name="description"> and social cards.
    description: z.string(),
    // Short statement under the name. Inline HTML (<em>, <strong>) is allowed.
    tagline: z.string(),
    // Current status line in the hero, e.g. "Applying to CS PhD programs". Empty hides it.
    status: z.string().nullish(),
    // Paragraph at the top of the Contact section. Inline HTML is allowed.
    contactNote: z.string().nullish(),
    links: z.array(link),
    // URL of this website's source repository (footer). Empty hides it.
    repo: z.string().nullish(),
    interests: z.array(z.object({ title: z.string(), blurb: z.string() })),
    education: z.array(
      z.object({
        institution: z.string(),
        url: z.string().nullish(),
        degree: z.string(),
        detail: z.string().nullish(),
        start: z.string(),
        end: z.string(),
        gpa: z.string().nullish(),
      }),
    ),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: './src/content' }),
  schema: z.object({}),
});

const news = defineCollection({
  loader: file('./src/content/news.yaml'),
  schema: z.object({
    // "YYYY-MM" or "YYYY-MM-DD"; displayed as "Aug 2026".
    date: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
    // Inline HTML (<em>, <strong>, <a>) is allowed.
    text: z.string(),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    // Author names in order. The profile name is automatically highlighted.
    authors: z.array(z.string()).min(1),
    // e.g. "Findings of EMNLP 2026". Omit for a preprint that is not (yet) published.
    venue: z.string().nullish(),
    year: z.number().int(),
    // Used to order papers within a year (e.g. the arXiv submission date).
    date: z.coerce.date().nullish(),
    // arXiv identifier such as "2606.07678" (links are derived from it).
    arxiv: z.string().nullish(),
    pdf: z.string().nullish(),
    code: z.string().nullish(),
    project: z.string().nullish(),
    // DOI such as "10.18653/v1/...". Rendered as a link to doi.org.
    doi: z.string().nullish(),
    // Short highlight shown next to the venue, e.g. "Oral" or "Best paper award".
    note: z.string().nullish(),
    // Optional hand-written BibTeX. When omitted an entry is generated from the fields above.
    bibtex: z.string().nullish(),
    selected: z.boolean().default(false),
  }),
});

export const collections = { profile, about, news, publications };
