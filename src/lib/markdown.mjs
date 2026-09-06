import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeMermaid from 'rehype-mermaid';
import { rehypeShiki } from '@astrojs/markdown-remark';
import { codeTheme, codeLineNumbers, rehypeCodeFrames } from './code-blocks.mjs';

// Render a diagram once, retaining its original code in a native disclosure.
function rehypeMermaidWithSource(options) {
  const render = rehypeMermaid(options);
  return async (tree, file) => {
    const sources = [];
    function walk(parent) {
      for (const [index, node] of (parent.children || []).entries()) {
        const code = node.tagName === 'pre' && node.children?.find((child) => child.tagName === 'code');
        if (code?.properties?.className?.includes('language-mermaid')) sources.push({ parent, index, node });
        else walk(node);
      }
    }
    walk(tree);
    await render(tree, file);
    for (const { parent, index, node } of sources) {
      const diagram = parent.children[index];
      if (diagram.tagName !== 'img' || !String(diagram.properties?.id).startsWith('mermaid-')) continue;
      parent.children[index] = {
        type: 'element', tagName: 'div', properties: { className: ['mermaid-block'] },
        children: [
          diagram,
          {
            type: 'element', tagName: 'details', properties: { className: ['diagram-source'] },
            children: [
              { type: 'element', tagName: 'summary', properties: {}, children: [{ type: 'text', value: '查看 Mermaid 源码' }] },
              node,
            ],
          },
        ],
      };
    }
  };
}

export const shikiConfig = { theme: codeTheme, transformers: [codeLineNumbers] };
// Run Shiki after Mermaid so both ordinary code and retained diagram source get highlighted.
export const syntaxHighlight = false;

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
    [rehypeMermaidWithSource, {
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
    [rehypeShiki, shikiConfig],
    rehypeCodeFrames,
    [rehypeKatex, { strict: 'error', trust: false }],
  ],
};
