import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(process.env.BUILD_DIR || 'dist');
const origin = new URL(process.env.SITE_URL || 'https://oqwn.github.io').origin;
const base = `/${(process.env.BASE_PATH ?? '/wzj-blog').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const errors = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : join(directory, entry.name)));
  return paths.flat();
}

async function exists(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

const files = await walk(root);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
assert.ok(htmlFiles.length >= 2, 'Build must include the homepage and 404 page');
for (const required of ['index.html', '404.html', 'edit/index.html', 'rss.xml', 'sitemap.xml', 'robots.txt', 'favicon.svg']) {
  assert.ok(await exists(join(root, required)), `Missing build output: ${required}`);
}

const editorHTML = await readFile(join(root, 'edit/index.html'), 'utf8');
assert.match(editorHTML, /sandbox=""/, 'Preview must use an opaque, script-free iframe sandbox');
assert.match(editorHTML, /id="save-post"[^>]*disabled/, 'Saving must be disabled before authorization');
assert.match(editorHTML, /Content-Security-Policy/, 'Editor requires a content security policy');
assert.match(editorHTML, /name="robots" content="noindex"/, 'Editor should not be indexed');

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const name = relative(root, file);
  const route = name === 'index.html' ? '/' : `/${name.replace(/index\.html$/, '')}`;
  const page = new URL(`${base}${route}`, origin);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1].replace(/&amp;/g, '&');
    const url = new URL(value, page);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) continue;
    if (base && !url.pathname.startsWith(`${base}/`)) {
      errors.push(`${name}: URL is missing base path: ${value}`);
      continue;
    }
    let target = resolve(root, `.${decodeURIComponent(url.pathname.slice(base.length))}`);
    if (await exists(join(target, 'index.html'))) target = join(target, 'index.html');
    if (!(await exists(target))) {
      errors.push(`${name}: broken local link: ${value}`);
      continue;
    }
    if (url.hash && target.endsWith('.html')) {
      const targetHTML = await readFile(target, 'utf8');
      const fragment = decodeURIComponent(url.hash.slice(1));
      if (!targetHTML.includes(`id="${fragment}"`)) errors.push(`${name}: missing anchor: ${value}`);
    }
  }
}

const rss = await readFile(join(root, 'rss.xml'), 'utf8');
const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
for (const document of [rss, sitemap]) {
  for (const match of document.matchAll(/<(?:link|loc)>([^<]+)<\/(?:link|loc)>/g)) {
    assert.ok(match[1].startsWith(`${origin}${base}/`), `Feed/sitemap URL has incorrect site/base: ${match[1]}`);
  }
}

// A draft must not leak into any route, feed, sitemap or public text file.
const contentRoot = resolve('content/posts');
for (const file of (await walk(contentRoot)).filter((file) => file.endsWith('.md'))) {
  const content = await readFile(file, 'utf8');
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter || !/^draft:\s*true\s*$/m.test(frontmatter[1])) continue;
  const title = frontmatter[1].match(/^title:\s*"(.+)"\s*$/m)?.[1];
  if (!title) continue;
  for (const output of [...htmlFiles, join(root, 'rss.xml'), join(root, 'sitemap.xml')]) {
    if ((await readFile(output, 'utf8')).includes(title)) errors.push(`${relative(root, output)}: draft title leaked: ${title}`);
  }
}

assert.deepEqual(errors, [], errors.join('\n'));
console.log(`Verified ${htmlFiles.length} HTML pages, internal links, anchors, feeds, and draft exclusion (base: ${base || '/'}).`);
