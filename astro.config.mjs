// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TODO: set this to the final URL of the site (used for canonical links, Open Graph
// tags and the sitemap). For a GitHub user site this is https://<username>.github.io
// For a project site (repo not named <username>.github.io) also set `base: '/<repo-name>'`.
const site = 'https://zelongxueric.github.io';

export default defineConfig({
  site,
  integrations: [sitemap()],
  devToolbar: { enabled: false },
  // Classic whitespace handling: keeps single spaces between inline elements
  // (author lists, link rows) instead of Astro 7's JSX-style stripping.
  compressHTML: true,
});
