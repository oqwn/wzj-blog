import { getCollection, type CollectionEntry } from 'astro:content';
import { ui, otherLang, type Lang, type Category } from './i18n';

export type Post = CollectionEntry<'posts'>;

export const postLang = (post: Post): Lang => post.id.split('/')[0] as Lang;
/** The language-independent part of the id, shared by both versions. */
export const postSlug = (post: Post): string => post.id.slice(post.id.indexOf('/') + 1);

export async function getPosts(lang: Lang, category?: Category): Promise<Post[]> {
  const posts = await getCollection('posts', (post) =>
    !post.data.draft && postLang(post) === lang && (!category || post.data.category === category));
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id));
}

/** The published version of the same article in the other language, if any. */
export async function getTranslation(post: Post): Promise<Post | undefined> {
  const slug = postSlug(post);
  return (await getPosts(otherLang(postLang(post)))).find((other) => postSlug(other) === slug);
}

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(ui[lang].dateLocale, {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai',
  }).format(date);
}

export function readingMinutes(body = ''): number {
  const chinese = body.match(/[㐀-鿿]/g)?.length ?? 0;
  const words = body.replace(/[㐀-鿿]/g, '').match(/[a-zA-Z0-9]+/g)?.length ?? 0;
  return Math.max(1, Math.ceil(chinese / 350 + words / 200));
}
