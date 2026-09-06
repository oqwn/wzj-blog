import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(process.env.BUILD_DIR || 'dist');
const base = `/${(process.env.BASE_PATH ?? '/wzj-blog').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const route = 'posts/markdown-rendering-lab/';
try {
  await stat(join(root, route, 'index.html'));
} catch {
  console.log('Rendering sample removed; Markdown unit tests still cover the renderer.');
  process.exit(0);
}
const mime = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (base && !pathname.startsWith(`${base}/`)) throw new Error('Wrong base');
    let file = resolve(root, `.${pathname.slice(base.length)}`);
    if (file !== root && !file.startsWith(`${root}${sep}`)) throw new Error('Outside build');
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    response.writeHead(200, { 'Content-Type': `${mime[extname(file)] || 'application/octet-stream'}; charset=utf-8` });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404); response.end('Not found');
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}${base}/${route}`;
let browser;
try {
  browser = await chromium.launch();
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const failures = [];
  page.on('requestfailed', (request) => failures.push(request.url()));
  page.on('pageerror', (error) => failures.push(error.message));
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 960 });
    assert.equal((await page.goto(url, { waitUntil: 'networkidle' })).status(), 200);
    for (const image of await page.locator('.prose img').all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element) => element.decode());
    }
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('script').count(), 0);
    assert.equal(await page.locator('.prose .diagram img[id^="mermaid-"]').count(), 3);
    assert.equal(await page.locator('.prose img[alt^="draw.io"]').count(), 1);
    assert.equal(await page.locator('.prose .katex-display').count(), 1);
    assert.equal(await page.locator('.prose table').count(), 3);
    assert.equal(await page.locator('.prose .katex-error').count(), 0);
    assert.equal(await page.locator('.prose td[align="right"]').first().evaluate((cell) => getComputedStyle(cell).textAlign), 'right');
    assert.equal(await page.locator('.prose th[align="center"]').first().evaluate((cell) => getComputedStyle(cell).textAlign), 'center');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px: page overflows horizontally`);
    assert.ok(await page.locator('.prose pre[data-language="typescript"]').textContent().then((text) => text.includes('<script>')));
    const details = page.locator('.prose details');
    await details.locator('summary').click();
    assert.equal(await details.getAttribute('open'), '');
    assert.ok(await details.locator('pre').isVisible());
    await page.locator('.prose a[data-footnote-ref]').click();
    assert.ok(page.url().endsWith('#user-content-fn-markdown'));
    await page.locator('.prose a[data-footnote-backref]').click();
    assert.ok(page.url().endsWith('#user-content-fnref-markdown'));
    if (process.env.SCREENSHOT_DIR && width === 1440) {
      const directory = resolve(process.env.SCREENSHOT_DIR);
      await mkdir(directory, { recursive: true });
      for (const [index, figure] of (await page.locator('.prose .diagram').all()).entries()) {
        await figure.screenshot({ path: join(directory, `diagram-${index + 1}.png`) });
      }
      await page.locator('.prose .katex-display').screenshot({ path: join(directory, 'formula.png') });
      await page.locator('.prose pre[data-language="typescript"]').screenshot({ path: join(directory, 'code.png') });
    }
    console.log(`Rendered at ${width}px with JavaScript disabled: diagrams, images, math, tables, code, details, footnotes and page width verified.`);
  }
  assert.deepEqual(failures, []);
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
