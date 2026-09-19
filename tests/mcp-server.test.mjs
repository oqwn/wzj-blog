import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const server = fileURLToPath(new URL('../scripts/mcp-server.mjs', import.meta.url));

async function connect(t) {
  const root = await mkdtemp(join(tmpdir(), 'wzj-blog-mcp-'));
  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(new StdioClientTransport({
    command: process.execPath, args: [server], env: { ...process.env, BLOG_POSTS_DIR: root }, stderr: 'ignore',
  }));
  t.after(async () => {
    await client.close();
    await rm(root, { recursive: true, force: true });
  });
  return { client, root };
}

const post = {
  slug: 'cache-design',
  category: 'system-design',
  zh: { title: '缓存 "设计"\n---', description: '摘要', body: '## 背景\n\n正文 --- 保留', tags: ['缓存'] },
  en: { title: 'Cache "design"', body: '## Background\n\nBody', tags: ['cache'] },
};
const frontmatter = (content) => parse(content.match(/^---\n([\s\S]*?)\n---/)[1]);

test('create_post writes both language versions as drafts with safe frontmatter', async (t) => {
  const { client, root } = await connect(t);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((tool) => tool.name).sort(), ['create_post', 'list_posts']);

  const result = await client.callTool({ name: 'create_post', arguments: post });
  assert.ok(!result.isError, result.content[0].text);
  const zh = await readFile(join(root, 'zh/cache-design.md'), 'utf8');
  const en = await readFile(join(root, 'en/cache-design.md'), 'utf8');
  assert.deepEqual(frontmatter(zh), {
    title: '缓存 "设计"\n---', description: '摘要', category: 'system-design',
    date: frontmatter(zh).date, tags: ['缓存'], draft: true,
  });
  assert.match(zh, /\n---\n\n## 背景\n\n正文 --- 保留\n$/);
  assert.equal(frontmatter(en).title, 'Cache "design"');
  assert.equal(frontmatter(en).draft, true);

  const listed = JSON.parse((await client.callTool({ name: 'list_posts', arguments: {} })).content[0].text);
  assert.equal(listed[0].slug, 'cache-design');
  assert.equal(listed[0].en.title, 'Cache "design"');
});

test('create_post never overwrites existing posts', async (t) => {
  const { client, root } = await connect(t);
  await client.callTool({ name: 'create_post', arguments: post });
  const original = await readFile(join(root, 'zh/cache-design.md'), 'utf8');
  const again = await client.callTool({ name: 'create_post', arguments: { ...post, zh: { ...post.zh, body: '覆盖' } } });
  assert.equal(again.isError, true);
  assert.equal(await readFile(join(root, 'zh/cache-design.md'), 'utf8'), original);
});

test('create_post rejects unsafe slugs, unknown categories and missing translations', async (t) => {
  const { client, root } = await connect(t);
  const invalid = [
    { ...post, slug: '../outside' },
    { ...post, slug: 'nested/post' },
    { ...post, category: 'sports' },
    { ...post, en: undefined },
    { ...post, en: { ...post.en, body: '  ' } },
  ];
  for (const argumentsValue of invalid) {
    const outcome = await client.callTool({ name: 'create_post', arguments: argumentsValue }).catch((error) => ({ isError: true, error }));
    assert.equal(outcome.isError, true, JSON.stringify(argumentsValue.slug));
  }
  assert.deepEqual(await readdir(root), []);
});
