/** Prefixes a site-relative path with the configured `base` (for project-site deployments). */
export const withBase = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
