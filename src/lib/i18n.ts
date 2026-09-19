export const languages = ['zh', 'en'] as const;
export type Lang = (typeof languages)[number];

export const categories = ['finance', 'system-design', 'programming'] as const;
export type Category = (typeof categories)[number];

export const categoryLabels: Record<Lang, Record<Category, string>> = {
  zh: { finance: '财经', 'system-design': '系统设计', programming: '编程技术' },
  en: { finance: 'Finance', 'system-design': 'System Design', programming: 'Programming' },
};

export const ui = {
  zh: {
    htmlLang: 'zh-CN',
    ogLocale: 'zh_CN',
    dateLocale: 'zh-CN',
    skip: '跳到正文',
    home: '首页',
    nav: '主导航',
    posts: '文章',
    switchTo: 'EN',
    switchLabel: 'Read in English',
    all: '全部',
    categories: '文章分类',
    count: (n: number) => `${n} 篇`,
    empty: '暂无文章。',
    tags: '文章标签',
    back: '← 全部文章',
    backEnd: '← 回到全部文章',
    reading: (n: number) => `约 ${n} 分钟阅读`,
    updated: '更新于',
    toc: '本篇目录',
    tocLabel: '文章目录',
    adjacent: '相邻文章',
    newer: '较新的文章',
    older: '较早的文章',
    translation: 'Read in English',
  },
  en: {
    htmlLang: 'en',
    ogLocale: 'en_US',
    dateLocale: 'en-US',
    skip: 'Skip to content',
    home: 'home',
    nav: 'Main navigation',
    posts: 'Posts',
    switchTo: '中文',
    switchLabel: '阅读中文版',
    all: 'All',
    categories: 'Categories',
    count: (n: number) => `${n} ${n === 1 ? 'post' : 'posts'}`,
    empty: 'No posts yet.',
    tags: 'Tags',
    back: '← All posts',
    backEnd: '← Back to all posts',
    reading: (n: number) => `${n} min read`,
    updated: 'Updated',
    toc: 'Contents',
    tocLabel: 'Table of contents',
    adjacent: 'More posts',
    newer: 'Newer',
    older: 'Older',
    translation: '阅读中文版',
  },
} satisfies Record<Lang, Record<string, unknown>>;

export const otherLang = (lang: Lang): Lang => (lang === 'zh' ? 'en' : 'zh');
