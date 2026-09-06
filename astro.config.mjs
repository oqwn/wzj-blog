import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://oqwn.github.io',
  base: process.env.BASE_PATH ?? '/wzj-blog',
  output: 'static',
  trailingSlash: 'always',
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
});
