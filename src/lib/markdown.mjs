import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeMermaid from 'rehype-mermaid';

// Keep wide diagrams readable on narrow screens without widening the page.
export function rehypeDiagramFigures() {
  return (tree) => {
    function walk(node) {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'element' && child.tagName === 'img' && String(child.properties?.id).startsWith('mermaid-')) {
          child.properties.alt ||= child.properties.title || 'Mermaid 图表';
          return {
            type: 'element', tagName: 'figure',
            properties: { className: ['diagram'], tabIndex: 0, ariaLabel: child.properties.alt },
            children: [child],
          };
        }
        walk(child);
        return child;
      });
    }
    walk(tree);
  };
}

export const markdownPlugins = {
  gfm: true,
  smartypants: false,
  remarkPlugins: [remarkMath],
  remarkRehype: { footnoteLabel: '脚注', footnoteBackLabel: '返回正文' },
  rehypePlugins: [
    [rehypeMermaid, {
      strategy: 'img-svg',
      mermaidConfig: {
        securityLevel: 'strict',
        htmlLabels: false,
        theme: 'base',
        fontFamily: 'Arial, Noto Sans CJK SC, PingFang SC, Microsoft YaHei, sans-serif',
        themeVariables: {
          primaryColor: '#eaf3ef', primaryTextColor: '#243b42',
          primaryBorderColor: '#83a99b', lineColor: '#627579',
          secondaryColor: '#f3f7f6', tertiaryColor: '#ffffff',
        },
        flowchart: { htmlLabels: false },
      },
    }],
    rehypeDiagramFigures,
    [rehypeKatex, { strict: 'error', trust: false }],
  ],
};

export const syntaxHighlight = { type: 'shiki', excludeLangs: ['mermaid', 'math'] };
export const shikiConfig = { theme: 'github-light' };
