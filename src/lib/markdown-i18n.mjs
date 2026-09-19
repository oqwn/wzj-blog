// Labels the Markdown pipeline adds to posts, chosen by the post's language folder.
const labels = {
  zh: {
    plainText: '纯文本',
    source: (language) => `${language} 源码`,
    codeBlock: (language) => `${language} 代码块`,
    copyCode: (language) => `复制 ${language} 代码`,
    copy: '复制',
    mermaidSource: '查看 Mermaid 源码',
    diagram: 'Mermaid 图表',
    footnotes: '脚注',
    footnoteBack: '返回正文',
  },
  en: {
    plainText: 'Plain text',
    source: (language) => `${language} source`,
    codeBlock: (language) => `${language} code block`,
    copyCode: (language) => `Copy ${language} code`,
    copy: 'Copy',
    mermaidSource: 'View Mermaid source',
    diagram: 'Mermaid diagram',
    footnotes: 'Footnotes',
    footnoteBack: 'Back to content',
  },
};

export function markdownLabels(file) {
  return /(?:^|[\\/])content[\\/]posts[\\/]en[\\/]/.test(file?.path ?? '') ? labels.en : labels.zh;
}

// remark-rehype only takes fixed footnote labels, so translate them afterwards.
export function rehypeLocalizeFootnotes() {
  return (tree, file) => {
    const text = markdownLabels(file);
    if (text === labels.zh) return;
    function walk(node) {
      if (node.type !== 'element' && node.type !== 'root') return;
      if (node.properties?.id === 'footnote-label') node.children = [{ type: 'text', value: text.footnotes }];
      const aria = node.properties?.ariaLabel;
      if (typeof aria === 'string' && aria.startsWith(labels.zh.footnoteBack)) {
        node.properties.ariaLabel = text.footnoteBack + aria.slice(labels.zh.footnoteBack.length);
      }
      node.children?.forEach(walk);
    }
    walk(tree);
  };
}
