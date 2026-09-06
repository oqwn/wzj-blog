import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
import { createHash } from 'node:crypto';

const root = resolve(process.env.BUILD_DIR || 'dist');
const origin = new URL(process.env.SITE_URL || 'https://oqwn.github.io').origin;
const base = `/${(process.env.BASE_PATH ?? '/wzj-blog').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const errors = [];
const copyCodeScript = await readFile('src/scripts/copy-code.js', 'utf8');
const copyCodeHash = createHash('sha256').update(copyCodeScript).digest('base64');

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
assert.match(editorHTML, /href="https:\/\/app\.pagescms\.org\/oqwn\/wzj-blog\/main\/collection\/posts"/, 'Writing must link to the configured CMS collection');
assert.match(editorHTML, /name="robots" content="noindex"/, 'Editor should not be indexed');

const cms = parse(await readFile('.pages.yml', 'utf8'));
const collection = cms.content.find((entry) => entry.name === 'posts');
assert.equal(collection?.path, 'content/posts', 'CMS must edit the Astro article directory');
assert.equal(collection?.format, 'yaml-frontmatter', 'CMS must keep Markdown with YAML frontmatter');
assert.equal(collection?.fields.find((field) => field.name === 'draft')?.default, true, 'New CMS articles must begin as drafts');

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const name = relative(root, file);
  assert.doesNotMatch(html, /<input\b[^>]*type="password"/i, `${name}: public pages must not handle GitHub credentials`);
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length <= 1, `${name}: only the copy-code script may run`);
  for (const [, attributes, body] of scripts) {
    assert.doesNotMatch(attributes, /\bsrc\s*=/i, `${name}: scripts must not load external code`);
    assert.equal(body, copyCodeScript, `${name}: script must be the reviewed copy-code source`);
  }
  assert.doesNotMatch(html, /class="[^"]*katex-error/, `${name}: invalid math must be fixed before publishing`);
  const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1]?.replace(/&#39;|&#x27;/g, "'");
  assert.ok(policy?.includes(`script-src ${scripts.length ? `'sha256-${copyCodeHash}'` : "'none'"};`), `${name}: CSP must only allow the copy-code script hash`);
  assert.ok(policy?.includes("script-src-attr 'none';"), `${name}: inline event handlers must be prohibited`);
  assert.match(html, /connect-src (?:'|&#39;|&#x27;)none(?:'|&#39;|&#x27;)/, `${name}: public pages must prohibit API requests`);
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
  if (!frontmatter) continue;
  const data = parse(frontmatter[1]);
  if (data?.draft !== true || typeof data.title !== 'string' || !data.title) continue;
  const title = data.title;
  const escapedTitle = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  for (const output of [...htmlFiles, join(root, 'rss.xml'), join(root, 'sitemap.xml')]) {
    const text = await readFile(output, 'utf8');
    if (text.includes(title) || text.includes(escapedTitle)) errors.push(`${relative(root, output)}: draft title leaked: ${title}`);
  }
}

assert.deepEqual(errors, [], errors.join('\n'));
console.log(`Verified ${htmlFiles.length} HTML pages, internal links, anchors, feeds, and draft exclusion (base: ${base || '/'}).`);
