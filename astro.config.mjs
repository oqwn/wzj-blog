import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { markdownPlugins, syntaxHighlight, shikiConfig } from './src/lib/markdown.mjs';

export default defineConfig({
  site: process.env.SITE_URL || 'https://oqwn.github.io',
  base: process.env.BASE_PATH ?? '/wzj-blog',
  output: 'static',
  trailingSlash: 'always',
  markdown: {
    processor: unified(markdownPlugins),
    syntaxHighlight,
    shikiConfig,
  },
});
