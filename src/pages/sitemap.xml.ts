import type { APIContext } from 'astro';
import { getPosts } from '../lib/posts';
import { postPath, withBase } from '../lib/paths';

const escapeXML = (value: string) => value.replace(/[<>&"']/g, (character) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
})[character]!);

export async function GET({ site }: APIContext) {
  const posts = await getPosts();
  const urls = [
    `<url><loc>${escapeXML(new URL(withBase(), site!).href)}</loc></url>`,
    ...posts.map((post) => `<url><loc>${escapeXML(new URL(postPath(post.id), site!).href)}</loc><lastmod>${(post.data.updated || post.data.date).toISOString()}</lastmod></url>`),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
