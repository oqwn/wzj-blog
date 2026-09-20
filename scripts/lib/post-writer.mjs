import { mkdir, writeFile, access, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

export const categories = ['finance', 'business-cases', 'system-design', 'programming', 'personal-growth'];
export const languages = ['zh', 'en'];
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

// JSON strings and arrays are valid YAML scalars, so user text cannot break the frontmatter.
function render({ title, description = '', tags = [], body }, { category, date, draft }) {
  return [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `category: ${category} # ${categories.join(' | ')}`,
    `date: ${date}`,
    `tags: ${JSON.stringify(tags)}`,
    `draft: ${draft}`,
    '---',
    '',
    body.trim(),
    '',
  ].join('\n');
}

export class PostError extends Error {}

/**
 * Write the Chinese and English versions of one post: both files or neither,
 * never overwriting an existing post.
 */
export async function createPost({ root, slug, category, zh, en, date = today(), draft = true }) {
  if (!slugPattern.test(slug ?? '')) throw new PostError('文件名只能使用小写英文字母、数字和连字符，例如 cache-design。');
  if (!categories.includes(category)) throw new PostError(`分类必须是 ${categories.join(' | ')} 之一。`);
  const versions = { zh, en };
  const files = Object.fromEntries(languages.map((lang) => [lang, resolve(root, lang, `${slug}.md`)]));
  for (const lang of languages) {
    try {
      await access(files[lang]);
    } catch {
      continue;
    }
    throw new PostError(`文章 ${lang}/${slug}.md 已存在，未覆盖。`);
  }
  const written = [];
  try {
    for (const lang of languages) {
      await mkdir(resolve(root, lang), { recursive: true });
      await writeFile(files[lang], render(versions[lang], { category, date, draft }), { flag: 'wx' });
      written.push(files[lang]);
    }
  } catch (error) {
    await Promise.all(written.map((file) => rm(file, { force: true })));
    throw error.code === 'EEXIST' ? new PostError(`文章 ${slug}.md 已存在，未覆盖。`) : error;
  }
  return files;
}
