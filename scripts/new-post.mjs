import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [slug, ...titleWords] = process.argv.slice(2);

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('用法：npm run new -- my-post "文章标题"\n文件名请使用小写英文字母、数字和连字符。');
  process.exit(1);
}

const title = titleWords.join(' ') || slug;
const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const directory = resolve('content/posts');
const file = resolve(directory, `${slug}.md`);
const content = `---\ntitle: ${JSON.stringify(title)}\ndescription: ""\ndate: ${date}\ntags: []\ndraft: true\n---\n\n从这里开始写正文。完成后，把上面的 draft 改为 false。\n`;

try {
  await mkdir(directory, { recursive: true });
  await writeFile(file, content, { flag: 'wx' });
  console.log(`已创建：content/posts/${slug}.md\n这是草稿。准备发布时，将 draft: true 改为 draft: false。`);
} catch (error) {
  console.error(error.code === 'EEXIST' ? `文章 ${slug}.md 已存在，未覆盖。` : `创建失败：${error.message}`);
  process.exitCode = 1;
}
