import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

// Date the content was last reviewed. Keep in sync with CONTENT_UPDATED in src/lib/fmt.ts;
// only bump it when figures or text actually change, so crawlers can trust lastmod.
const CONTENT_UPDATED = '2026-10-19';

export default defineConfig({
  site: 'https://zzpreken.nl',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [svelte(), sitemap({ serialize: (item) => ({ ...item, lastmod: CONTENT_UPDATED }) })],
});
