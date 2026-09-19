// Publish a post written by hand or through the MCP server: the human step
// between an agent's draft and the live site.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { publishPost } from './lib/publisher.mjs';
import { languages, PostError } from './lib/post-writer.mjs';

const repo = fileURLToPath(new URL('..', import.meta.url));
const root = join(repo, 'content/posts');
const args = process.argv.slice(2);
const yes = args.includes('--yes');
const [slug] = args.filter((arg) => arg !== '--yes');

try {
  if (!slug) throw new PostError('用法：npm run publish-post -- <slug> [--yes]\n先检查 content/posts/zh/<slug>.md 和 content/posts/en/<slug>.md 的内容。');
  for (const lang of languages) {
    const content = await readFile(join(root, lang, `${slug}.md`), 'utf8').catch(() => '');
    console.log(`${lang}: ${content.match(/^title: (.*)$/m)?.[1] ?? '（缺失）'}`);
  }
  let confirmed = yes;
  if (!confirmed && process.stdin.isTTY) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    confirmed = /^y(es)?$/i.test(await prompt.question('发布并推送到 main？[y/N] '));
    prompt.close();
  }
  if (!confirmed) {
    console.log('未发布。确认内容后重新运行，或加 --yes 跳过确认。');
  } else {
    console.log('构建检查中……');
    const { commit, paths } = await publishPost({ repo, root, slug });
    console.log([
      `已推送 ${commit} 到 main（只包含 ${paths.join('、')}）。`,
      'GitHub Actions 部署成功后才会上线：https://github.com/oqwn/wzj-blog/actions/workflows/pages.yml',
      `中文：https://oqwn.github.io/wzj-blog/posts/${slug}/`,
      `English：https://oqwn.github.io/wzj-blog/en/posts/${slug}/`,
    ].join('\n'));
  }
} catch (error) {
  console.error(error instanceof PostError ? error.message : `发布失败：${error.message}`);
  process.exitCode = 1;
}
