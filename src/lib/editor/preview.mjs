import { Marked } from 'marked';
import { parseArticle } from './document.mjs';

export const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function previewDocument(source, path = 'content/posts/new.md') {
  const { data, body } = parseArticle(source);
  const parser = new Marked({
    gfm: true,
    renderer: {
      // Raw HTML is displayed as text, never inserted as executable markup.
      html({ text }) { return escapeHTML(text); },
      link({ text }) { return `<span class="link">${escapeHTML(text)}</span>`; },
      image({ href, text }) {
        // Local repository images can be previewed, without sending any token.
        const imageURL = new URL(href, `https://raw.githubusercontent.com/oqwn/wzj-blog/main/${path}`);
        if (imageURL.protocol !== 'https:') return escapeHTML(`[图片：${text}]`);
        return `<img src="${escapeHTML(imageURL.href)}" alt="${escapeHTML(text)}" referrerpolicy="no-referrer">`;
      },
    },
  });
  const html = parser.parse(body);
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src https:; base-uri 'none'; form-action 'none'; object-src 'none'"><style>
body{margin:20px;color:#263442;font:15px/1.85 -apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;overflow-wrap:anywhere}h1{font-size:23px;line-height:1.5;margin:0 0 8px}h2{font-size:20px;margin-top:1.5em}h3{font-size:17px}p{margin:1em 0}.meta{font-size:12px;color:#697582}.link{color:#285cd0;text-decoration:underline}pre{padding:14px;background:#f5f7f9;overflow-x:auto;border-radius:4px;line-height:1.6}code{font-size:.88em}blockquote{border-left:2px solid #b8c8e7;padding-left:16px;color:#697582}img{max-width:100%;height:auto}table{border-collapse:collapse;display:block;overflow-x:auto}th,td{border-bottom:1px solid #e5e9ee;padding:8px 12px;text-align:left}
</style></head><body><h1>${escapeHTML(data.title)}</h1><p class="meta">${escapeHTML(data.date)}${data.draft ? ' · 草稿' : ''}</p>${html}</body></html>`;
}
