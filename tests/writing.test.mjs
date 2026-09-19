import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('../scripts/new-post.mjs', import.meta.url));

async function workspace(t) {
  const directory = await mkdtemp(join(tmpdir(), 'wzj-blog-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

function create(directory, args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: directory, encoding: 'utf8' });
}

test('new articles create Chinese and English drafts that share a filename and category', async (t) => {
  const directory = await workspace(t);
  const title = '关于 "缓存" 的思考：第一篇';
  const result = create(directory, ['cache-notes', title, 'Thoughts on "caching"', '--category=system-design']);
  assert.equal(result.status, 0, result.stderr);
  const zh = await readFile(join(directory, 'content/posts/zh/cache-notes.md'), 'utf8');
  const en = await readFile(join(directory, 'content/posts/en/cache-notes.md'), 'utf8');
  assert.ok(zh.includes(`title: ${JSON.stringify(title)}`));
  assert.ok(en.includes('title: "Thoughts on \\"caching\\""'));
  for (const content of [zh, en]) {
    assert.match(content, /^draft: true$/m);
    assert.match(content, /^category: system-design\b/m);
    assert.match(content, /^date: \d{4}-\d{2}-\d{2}$/m);
  }
});

test('existing writing is never overwritten', async (t) => {
  const directory = await workspace(t);
  assert.equal(create(directory, ['first-post', '原文']).status, 0);
  const paths = ['zh', 'en'].map((lang) => join(directory, `content/posts/${lang}/first-post.md`));
  const originals = await Promise.all(paths.map((path) => readFile(path, 'utf8')));
  assert.equal(create(directory, ['first-post', '覆盖']).status, 1);
  assert.deepEqual(await Promise.all(paths.map((path) => readFile(path, 'utf8'))), originals);
});

test('unknown categories are rejected', async (t) => {
  const directory = await workspace(t);
  assert.equal(create(directory, ['post', '标题', 'Title', '--category=sports']).status, 1);
  assert.deepEqual(await readdir(directory), []);
});

test('invalid filenames cannot escape the article directory', async (t) => {
  const directory = await workspace(t);
  for (const slug of ['../outside', '/tmp/outside', 'nested/post', 'UPPER', 'bad name', '']) {
    assert.equal(create(directory, [slug]).status, 1);
  }
  assert.deepEqual(await readdir(directory), []);
});
