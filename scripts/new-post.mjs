import { resolve } from 'node:path';
import { createPost, categories, PostError } from './lib/post-writer.mjs';

const args = process.argv.slice(2);
const categoryArg = args.find((arg) => arg.startsWith('--category='));
const category = categoryArg?.slice('--category='.length) ?? 'programming';
const [slug, zhTitle, enTitle] = args.filter((arg) => arg !== categoryArg);

// Set exitCode and let Node exit on its own; calling process.exit() crashes Node 24.7 under load (SIGSEGV).
try {
  await createPost({
    root: resolve('content/posts'),
    slug,
    category,
    zh: { title: zhTitle || slug || '', body: '从这里开始写中文正文。完成后，把上面的 draft 改为 false。' },
    en: { title: enTitle || zhTitle || slug || '', body: 'Write the English version here. Set draft to false when it is ready.' },
  });
  console.log(`已创建：\n  content/posts/zh/${slug}.md\n  content/posts/en/${slug}.md\n两篇都是草稿。准备发布时，将 draft: true 改为 draft: false。`);
} catch (error) {
  if (error instanceof PostError && !/已存在/.test(error.message)) {
    console.error([
      error.message,
      '用法：npm run new -- my-post "中文标题" "English title" --category=programming',
      `分类可选：${categories.join(' | ')}（财经 | 系统设计 | 编程技术）`,
    ].join('\n'));
  } else {
    console.error(error instanceof PostError ? error.message : `创建失败：${error.message}`);
  }
  process.exitCode = 1;
}
