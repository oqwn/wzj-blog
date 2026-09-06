import { parseDocument } from 'yaml';

export function articlePath(value) {
  const path = String(value).normalize('NFC');
  if (!path.startsWith('content/posts/') || !path.endsWith('.md') || /[\\\u0000-\u001f\u007f?#%]/.test(path)) {
    throw new Error('只能编辑 content/posts/ 中的 Markdown 文件。');
  }
  const parts = path.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..' || part.startsWith('.'))) {
    throw new Error('文章路径不正确。');
  }
  return path;
}

export function newArticlePath(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('文件名请使用小写英文、数字和连字符，例如 learning-notes。');
  return articlePath(`content/posts/${slug}.md`);
}

export function parseArticle(source) {
  if (new TextEncoder().encode(source).length > 500_000) throw new Error('文章超过 500 KB，请在本地编辑。');
  const match = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('文章开头需要用 --- 包围标题、日期等信息。');
  const document = parseDocument(match[1], { schema: 'core', uniqueKeys: true });
  if (document.errors.length) throw new Error('文章头部的 YAML 格式有误，请检查缩进、引号和重复字段。');
  let data;
  try { data = document.toJS({ maxAliasCount: 0 }); } catch { throw new Error('文章头部不支持 YAML 别名。'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('文章头部格式有误。');
  if (typeof data.title !== 'string' || !data.title.trim()) throw new Error('请填写文章标题 title。');
  for (const key of ['date', 'updated']) {
    if (key === 'updated' && data[key] === undefined) continue;
    const value = data[key];
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
      throw new Error(`${key} 请使用有效的 YYYY-MM-DD 日期。`);
    }
  }
  if (data.description !== undefined && typeof data.description !== 'string') throw new Error('description 需要是文本。');
  if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== 'string'))) throw new Error('tags 请使用文本数组，例如 ["技术", "随笔"]。');
  if (data.draft !== undefined && typeof data.draft !== 'boolean') throw new Error('draft 只能是 true 或 false。');
  return { data, body: source.slice(match[0].length) };
}

export function newArticle() {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return `---\ntitle: "未命名文章"\ndescription: ""\ndate: ${date}\ntags: []\ndraft: true\n---\n\n`;
}

export function encodeContent(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function decodeContent(value) {
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(value.replace(/\s/g, '')), (character) => character.charCodeAt(0)));
}
