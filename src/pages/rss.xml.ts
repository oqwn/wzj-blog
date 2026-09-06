import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { blog } from '../config';
import { getPosts } from '../lib/posts';
import { postPath, withBase } from '../lib/paths';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: blog.title,
    description: blog.description,
    site: new URL(withBase(), context.site!).href,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description || post.data.title,
      pubDate: post.data.date,
      link: new URL(postPath(post.id), context.site!).href,
      categories: post.data.tags,
    })),
    customData: '<language>zh-CN</language>',
  });
}
