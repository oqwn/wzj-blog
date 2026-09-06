import type { APIContext } from 'astro';
import { withBase } from '../lib/paths';

export function GET({ site }: APIContext) {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL(withBase('sitemap.xml'), site!).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
