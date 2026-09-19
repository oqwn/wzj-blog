import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { blog } from '../config';
import { getPosts, postSlug } from './posts';
import { localePath, postPath } from './paths';
import { ui, categoryLabels, type Lang } from './i18n';

export async function feed(lang: Lang, context: APIContext) {
  const posts = await getPosts(lang);
  return rss({
    title: blog[lang].title,
    description: blog[lang].description,
    site: new URL(localePath(lang), context.site!).href,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description || post.data.title,
      pubDate: post.data.date,
      link: new URL(postPath(lang, postSlug(post)), context.site!).href,
      categories: [categoryLabels[lang][post.data.category], ...post.data.tags],
    })),
    customData: `<language>${ui[lang].htmlLang}</language>`,
  });
}
