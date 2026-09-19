import type { APIContext } from 'astro';
import { getPosts, postSlug } from '../lib/posts';
import { localePath, postPath, categoryPath } from '../lib/paths';
import { languages, categories } from '../lib/i18n';

const escapeXML = (value: string) => value.replace(/[<>&"']/g, (character) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
})[character]!);

export async function GET({ site }: APIContext) {
  const url = (path: string, lastmod?: Date) =>
    `<url><loc>${escapeXML(new URL(path, site!).href)}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ''}</url>`;
  const urls: string[] = [];
  for (const lang of languages) {
    urls.push(url(localePath(lang)), ...categories.map((category) => url(categoryPath(lang, category))));
    for (const post of await getPosts(lang)) urls.push(url(postPath(lang, postSlug(post)), post.data.updated || post.data.date));
  }
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
