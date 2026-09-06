// A quiet editor palette inspired by IDEA's dark theme.
export const codeTheme = {
  name: 'blog-idea-dark',
  type: 'dark',
  colors: { 'editor.background': '#1e1f22', 'editor.foreground': '#bcbec4' },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#92969f', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: '#cf8e6d' } },
    { scope: ['string', 'markup.inline.raw'], settings: { foreground: '#6aab73' } },
    { scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#a5c2fa' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#57aaf7' } },
    { scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'], settings: { foreground: '#d5b778' } },
    { scope: ['variable.parameter', 'entity.other.attribute-name'], settings: { foreground: '#bda1ec' } },
    { scope: ['entity.name.tag', 'markup.heading', 'keyword.control'], settings: { foreground: '#cf8e6d' } },
    { scope: ['markup.deleted'], settings: { foreground: '#ef929b' } },
    { scope: ['markup.inserted'], settings: { foreground: '#6aab73' } },
  ],
};

const languageNames = {
  typescript: 'TypeScript', ts: 'TypeScript', tsx: 'TSX',
  javascript: 'JavaScript', js: 'JavaScript', jsx: 'JSX',
  python: 'Python', py: 'Python', java: 'Java', kotlin: 'Kotlin', kt: 'Kotlin',
  bash: 'Bash', sh: 'Shell', shell: 'Shell', shellscript: 'Shell', zsh: 'Zsh',
  json: 'JSON', jsonc: 'JSONC', yaml: 'YAML', yml: 'YAML', toml: 'TOML',
  html: 'HTML', xml: 'XML', svg: 'SVG', css: 'CSS', scss: 'SCSS',
  markdown: 'Markdown', md: 'Markdown', mermaid: 'Mermaid',
  sql: 'SQL', go: 'Go', rust: 'Rust', rs: 'Rust', ruby: 'Ruby', rb: 'Ruby',
  c: 'C', cpp: 'C++', 'c++': 'C++', csharp: 'C#', cs: 'C#',
  php: 'PHP', swift: 'Swift', vue: 'Vue', astro: 'Astro',
  docker: 'Dockerfile', dockerfile: 'Dockerfile', diff: 'Diff',
  text: '纯文本', txt: '纯文本', plaintext: '纯文本',
};

export function rehypeCodeFrames() {
  return (tree) => {
    function walk(node) {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'element' && child.tagName === 'pre' && child.properties?.dataLanguage) {
          const language = String(child.properties.dataLanguage);
          const label = languageNames[language.toLowerCase()] || language;
          child.properties.tabIndex = 0;
          child.properties.ariaLabel = `${label} 源码`;
          return {
            type: 'element', tagName: 'div',
            properties: { className: ['code-block'], role: 'group', ariaLabel: `${label} 代码块` },
            children: [
              { type: 'element', tagName: 'div', properties: { className: ['code-header'] }, children: [{ type: 'text', value: label }] },
              child,
            ],
          };
        }
        walk(child);
        return child;
      });
    }
    walk(tree);
  };
}

export const codeLineNumbers = {
  name: 'blog-line-numbers',
  line(node, line) {
    // Generated numbers stay out of the source text and clipboard selection.
    node.children.unshift({
      type: 'element', tagName: 'span',
      properties: { className: ['line-number'], dataLine: line, ariaHidden: 'true' },
      children: [],
    });
  },
};
