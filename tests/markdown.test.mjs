import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { markdownPlugins, syntaxHighlight, shikiConfig } from '../src/lib/markdown.mjs';

const processor = await createMarkdownProcessor({ ...markdownPlugins, syntaxHighlight, shikiConfig });

test('technical Markdown preserves code and renders GFM, footnotes, HTML and math', async () => {
  const source = [
    '## 中文标题', '',
    '| 名称 | 值 |', '| :--- | ---: |', '| `A \\| B` | 2 |', '',
    '- [x] 已完成', '- [ ] 待处理', '',
    '脚注[^note] 与 ~~删除线~~。', '', '[^note]: 脚注正文。', '',
    '```typescript', 'const html = "<script>alert(1)</script>";', '```', '',
    '````markdown', '```json', '{"title":"温智钧"}', '```', '````', '',
    '<details><summary>展开</summary>正文</details>', '',
    '$a^2 + b^2 = c^2$', '', '$$', '\\frac{1}{n}\\sum_{i=1}^{n} x_i', '$$',
  ].join('\n');
  const { code } = await processor.render(source);
  assert.match(code, /<table>/);
  assert.match(code, /<code>A \| B<\/code>/);
  assert.match(code, /type="checkbox"[^>]*checked|checked[^>]*type="checkbox"/);
  assert.match(code, /class="astro-code/);
  assert.match(code, /(?:&lt;|&#x3c;)script/i);
  assert.doesNotMatch(code, /<script\b/);
  assert.match(code, /```json/);
  assert.match(code, /<details><summary>展开<\/summary>/);
  assert.match(code, /data-footnote-ref/);
  assert.match(code, /id="user-content-fn-note"/);
  assert.match(code, /katex-display/);
  assert.match(code, /<math /);
  assert.doesNotMatch(code, /katex-error/);
});

test('Mermaid flow, sequence and state diagrams become accessible static SVG images', async () => {
  const diagrams = [
    'flowchart LR\naccTitle: 流程图\naccDescr: 从写作到发布\nA[写作] --> B[发布]',
    'sequenceDiagram\naccTitle: 时序图\nA->>B: 保存文章\nB-->>A: 保存成功',
    'stateDiagram-v2\naccTitle: 状态图\n[*] --> Draft\nDraft --> Published',
  ];
  const { code } = await processor.render(diagrams.map((diagram) => '```mermaid\n' + diagram + '\n```').join('\n\n'));
  assert.equal([...code.matchAll(/<figure class="diagram"/g)].length, 3);
  const images = [...code.matchAll(/src="(data:image\/svg\+xml,[^"]+)"/g)];
  assert.equal(images.length, 3);
  for (const [, uri] of images) {
    const svg = decodeURIComponent(uri.slice(uri.indexOf(',') + 1));
    assert.match(svg, /<svg /);
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b/);
  }
  assert.doesNotMatch(code, /alt=""|language-mermaid|<script\b/);
  assert.match(code, /alt="从写作到发布"/);
  assert.equal([...code.matchAll(/<details class="diagram-source"/g)].length, 3);
  assert.equal([...code.matchAll(/class="code-language">Mermaid</g)].length, 3);
  assert.match(code, /从写作到发布/);
  assert.match(code, /data-language="mermaid"/);
});

test('code frames label language aliases, keep line numbers out of source, and fall back to plain text', async (t) => {
  t.mock.method(console, 'warn', () => {});
  const { code } = await processor.render([
    '```ts', 'const title = "<script>文字</script>";', '', '  console.log(title);', '```', '',
    '```', 'unlabelled <tag> & text', '```', '',
    '```made-up-language', 'unknown <tag>', '```',
  ].join('\n'));
  assert.match(code, /class="code-language">TypeScript<\/span>/);
  assert.equal([...code.matchAll(/class="code-language">纯文本</g)].length, 2);
  assert.equal([...code.matchAll(/class="code-copy" hidden/g)].length, 3);
  assert.match(code, /aria-label="复制 TypeScript 代码"/);
  assert.match(code, /aria-label="TypeScript 源码"/);
  assert.match(code, /class="line-number" data-line="3" aria-hidden="true"><\/span>/);
  assert.match(code, /style="color:#CF8E6D"/i); // keyword
  assert.match(code, /style="color:#6AAB73"/i); // string
  assert.doesNotMatch(code, /<script\b|<tag>/);
});

test('invalid Mermaid syntax fails instead of silently publishing a missing diagram', async (t) => {
  t.mock.method(console, 'error', () => {});
  await assert.rejects(processor.render('```mermaid\nflowchart LR\nA[未闭合 --> B\n```'), /parse|syntax|mermaid/i);
});
