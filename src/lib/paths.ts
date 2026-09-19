import type { Lang, Category } from './i18n';

/** Every internal URL needs the same prefix on GitHub project Pages. */
export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/** Chinese pages live at the site root; English pages under /en/. */
export function localePath(lang: Lang, path = ''): string {
  return withBase(lang === 'zh' ? path : `en/${path.replace(/^\//, '')}`);
}

export function postPath(lang: Lang, slug: string): string {
  return localePath(lang, `posts/${slug.split('/').map(encodeURIComponent).join('/')}/`);
}

export function categoryPath(lang: Lang, category: Category): string {
  return localePath(lang, `category/${category}/`);
}
