import test from 'node:test';
import assert from 'node:assert/strict';
import { GitHubEditor } from '../src/lib/editor/github.mjs';
import { articlePath, newArticlePath, parseArticle, encodeContent, decodeContent } from '../src/lib/editor/document.mjs';
import { previewDocument } from '../src/lib/editor/preview.mjs';

const source = '---\ntitle: "温智钧的笔记"\ndate: 2026-09-06\ntags: ["技术"]\ndraft: false\n---\n\n## 正文\n\n你好，世界。🌱\n';
const token = 'test-only-placeholder';
const sha = 'a'.repeat(40);
const owner = { id: 81278910, login: 'oqwn' };
const repo = { owner, permissions: { push: true } };

function mockClient(responses) {
  const calls = [];
  const client = new GitHubEditor(async (url, options) => {
    calls.push({ url, options });
    assert.ok(responses.length, `Unexpected request: ${url}`);
    const [status, data] = responses.shift();
    return new Response(JSON.stringify(data), { status });
  });
  return { client, calls };
}

test('a visitor cannot send any save request without authorization', async () => {
  const { client, calls } = mockClient([]);
  await assert.rejects(client.save('content/posts/test.md', source), /请先连接/);
  assert.equal(calls.length, 0);
});

test('an account other than the configured author is rejected', async () => {
  const { client, calls } = mockClient([[200, { id: 123, login: 'visitor' }]]);
  await assert.rejects(client.connect(token), /仅供温智钧/);
  assert.equal(client.connected, false);
  assert.equal(calls.length, 1);
});

test('an author without repository write access is rejected', async () => {
  const { client } = mockClient([[200, owner], [200, { owner, permissions: { push: false } }]]);
  await assert.rejects(client.connect(token), /没有.*写权限/);
  assert.equal(client.connected, false);
});

test('saving preserves UTF-8 content and checks the loaded file version', async () => {
  const { client, calls } = mockClient([[200, owner], [200, repo], [200, { content: { sha: 'b'.repeat(40) }, commit: { sha: 'c'.repeat(40) } }]]);
  await client.connect(token);
  const result = await client.save('content/posts/笔记.md', source, sha);
  const request = calls[2];
  const body = JSON.parse(request.options.body);
  assert.equal(decodeContent(body.content), source);
  assert.equal(body.sha, sha);
  assert.equal(body.branch, 'main');
  assert.equal(result.sha, 'b'.repeat(40));
  for (const call of calls) {
    assert.equal(new URL(call.url).origin, 'https://api.github.com');
    assert.ok(!call.url.includes(token));
    assert.equal(call.options.headers.Authorization, `Bearer ${token}`);
    assert.equal(call.options.redirect, 'error');
    assert.equal(call.options.credentials, 'omit');
    assert.equal(call.options.cache, 'no-store');
    assert.equal(call.options.referrerPolicy, 'no-referrer');
  }
});

test('read-only tokens and expired tokens are rejected by GitHub when saving', async () => {
  for (const status of [401, 403]) {
    const { client, calls } = mockClient([[200, owner], [200, repo], [status, {}]]);
    await client.connect(token);
    await assert.rejects(client.save('content/posts/test.md', source, sha), (error) => error.status === status);
    assert.equal(calls.filter((call) => call.options.method === 'PUT').length, 1);
    if (status === 401) assert.equal(client.connected, false);
  }
});

test('a conflicting remote edit is never retried or overwritten', async () => {
  const { client, calls } = mockClient([[200, owner], [200, repo], [409, {}]]);
  await client.connect(token);
  await assert.rejects(client.save('content/posts/test.md', source, sha), /远端文章已变化/);
  assert.equal(calls.length, 3);
});

test('disconnecting and failed reconnects discard the previous authorization', async () => {
  const { client } = mockClient([[200, owner], [200, repo], [401, {}]]);
  await client.connect(token);
  await assert.rejects(client.connect('invalid'), /授权已失效/);
  assert.equal(client.connected, false);
  await assert.rejects(client.save('content/posts/test.md', source), /请先连接/);
});

test('file access cannot escape Markdown articles or modify workflows', async () => {
  for (const path of ['.github/workflows/pages.yml', 'src/config.ts', 'content/posts/../secret.md', 'content/posts/%2e%2e/x.md', 'content/posts/a/../../x.md', 'content/posts/a\\x.md', 'content/posts/a.md?ref=other', 'content/posts/.hidden.md']) {
    assert.throws(() => articlePath(path));
  }
  assert.equal(articlePath('content/posts/技术/随笔.md'), 'content/posts/技术/随笔.md');
  assert.throws(() => newArticlePath('../outside'));
});

test('malformed metadata cannot be submitted and Chinese content round-trips', () => {
  assert.equal(parseArticle(source).data.title, '温智钧的笔记');
  assert.equal(decodeContent(encodeContent(source)), source);
  assert.throws(() => parseArticle(source.replace('2026-09-06', '2026-02-30')), /有效/);
  assert.throws(() => parseArticle(source.replace('draft: false', 'draft: "false"')), /draft/);
  assert.throws(() => parseArticle(source.replace('tags: ["技术"]', 'tags: [1]')), /tags/);
  assert.throws(() => parseArticle(source.replace('draft: false', 'draft: false\ndraft: true')), /重复/);
});

test('preview escapes raw HTML and refuses executable URLs', () => {
  const malicious = source + '\n<script>parent.document.body.remove()</script>\n<img src=x onerror="alert(1)">\n<iframe src="https://evil.example"></iframe>\n[click](javascript:alert(1))\n![image](data:text/html,attack)\n';
  const html = previewDocument(malicious);
  assert.doesNotMatch(html, /<script|<iframe|<img src=x|href="javascript:|src="data:/i);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /script-src 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.match(html, /<h2>正文<\/h2>/);
});

test('preview title is escaped and repository images do not use credentials', () => {
  const html = previewDocument(source.replace('温智钧的笔记', '<img src=x onerror=alert(1)>') + '\n![图片](../images/diagram.png)');
  assert.match(html, /<h1>&lt;img/);
  assert.match(html, /src="https:\/\/raw.githubusercontent.com\/oqwn\/wzj-blog\/main\/content\/images\/diagram.png"/);
  assert.ok(!html.includes(token));
});
