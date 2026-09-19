import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const categories = ['finance', 'system-design', 'programming'];
const args = process.argv.slice(2);
const categoryArg = args.find((arg) => arg.startsWith('--category='));
const category = categoryArg?.slice('--category='.length) ?? 'programming';
const [slug, zhTitle, enTitle] = args.filter((arg) => arg !== categoryArg);

// Set exitCode and let Node exit on its own; calling process.exit() crashes Node 24.7 under load (SIGSEGV).
process.exitCode = await (async () => {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !categories.includes(category)) {
    console.error([
      '用法：npm run new -- my-post "中文标题" "English title" --category=programming',
      '文件名请使用小写英文字母、数字和连字符。',
      `分类可选：${categories.join(' | ')}（财经 | 系统设计 | 编程技术）`,
    ].join('\n'));
    return 1;
  }

  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const versions = {
    zh: { title: zhTitle || slug, body: '从这里开始写中文正文。完成后，把上面的 draft 改为 false。' },
    en: { title: enTitle || zhTitle || slug, body: 'Write the English version here. Set draft to false when it is ready.' },
  };
  const files = Object.fromEntries(Object.keys(versions).map((lang) => [lang, resolve('content/posts', lang, `${slug}.md`)]));

  // Never overwrite either version, and create both or neither.
  for (const [lang, file] of Object.entries(files)) {
    try {
      await access(file);
      console.error(`文章 ${lang}/${slug}.md 已存在，未覆盖。`);
      return 1;
    } catch {}
  }

  try {
    for (const [lang, { title, body }] of Object.entries(versions)) {
      await mkdir(resolve('content/posts', lang), { recursive: true });
      const content = `---\ntitle: ${JSON.stringify(title)}\ndescription: ""\ncategory: ${category} # ${categories.join(' | ')}\ndate: ${date}\ntags: []\ndraft: true\n---\n\n${body}\n`;
      await writeFile(files[lang], content, { flag: 'wx' });
    }
    console.log(`已创建：\n  content/posts/zh/${slug}.md\n  content/posts/en/${slug}.md\n两篇都是草稿。准备发布时，将 draft: true 改为 draft: false。`);
  } catch (error) {
    console.error(`创建失败：${error.message}`);
    return 1;
  }
  return 0;
})();
