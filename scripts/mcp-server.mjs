// MCP server that lets other projects add bilingual draft posts to this blog.
// It only creates new files under content/posts/{zh,en}; it never edits,
// deletes, publishes, commits or pushes. Logs go to stderr: stdout is the protocol.
import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { parse } from 'yaml';
import { createPost, categories, languages, slugPattern, PostError } from './lib/post-writer.mjs';

const root = resolve(process.env.BLOG_POSTS_DIR || fileURLToPath(new URL('../content/posts', import.meta.url)));
const site = 'https://oqwn.github.io/wzj-blog';

const version = (language) => z.object({
  title: z.string().trim().min(1).max(200).describe(`${language} title`),
  description: z.string().trim().max(500).default('').describe(`${language} one or two sentence summary`),
  body: z.string().trim().min(1).max(200_000).describe(`${language} Markdown body, without frontmatter`),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]).describe(`${language} tags`),
});

const server = new McpServer({ name: 'wzj-blog-posts', version: '1.0.0' });

server.registerTool('create_post', {
  title: 'Create bilingual blog post',
  description: [
    'Create one blog post as two Markdown files: content/posts/zh/<slug>.md (Chinese) and content/posts/en/<slug>.md (English).',
    'Both versions are required and are saved as drafts. This tool cannot publish: the blog owner reviews the drafts and publishes them with npm run publish-post -- <slug>.',
    'Categories: finance (财经), business-cases (商业案例), system-design (系统设计), programming (编程技术), personal-growth (个人成长).',
    'Bodies are Markdown with GFM, fenced code, Mermaid code blocks and $math$. Start sections at ## (the title is rendered as h1).',
    'Existing posts are never overwritten; call list_posts first to pick an unused slug.',
  ].join(' '),
  inputSchema: {
    slug: z.string().regex(slugPattern).max(80).describe('Shared filename and URL, lowercase letters, digits and hyphens, e.g. cache-design'),
    category: z.enum(categories),
    zh: version('Chinese'),
    en: version('English'),
  },
  annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
}, async ({ slug, category, zh, en }) => {
  try {
    const files = await createPost({ root, slug, category, zh, en });
    return {
      content: [{
        type: 'text',
        text: [
          `Created draft post "${slug}" (${category}):`,
          ...languages.map((lang) => `- ${relative(root, files[lang])}`),
          'Both files have draft: true and are not published. Tell the blog owner to review them and run: npm run publish-post -- ' + slug,
          `After publishing: ${site}/posts/${slug}/ and ${site}/en/posts/${slug}/`,
        ].join('\n'),
      }],
    };
  } catch (error) {
    if (!(error instanceof PostError)) console.error(error);
    return { isError: true, content: [{ type: 'text', text: error instanceof PostError ? error.message : `Failed to create post: ${error.message}` }] };
  }
});

async function markdownFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? markdownFiles(join(directory, entry.name))
    : entry.name.endsWith('.md') ? [join(directory, entry.name)] : []));
  return nested.flat();
}

server.registerTool('list_posts', {
  title: 'List blog posts',
  description: 'List existing posts (published and drafts) with slug, category and titles, to avoid duplicates and slug collisions.',
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async () => {
  const posts = new Map();
  for (const lang of languages) {
    for (const file of await markdownFiles(join(root, lang))) {
      const slug = relative(join(root, lang), file).replace(/\\/g, '/').replace(/\.md$/, '');
      const data = parse((await readFile(file, 'utf8')).match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '') ?? {};
      const post = posts.get(slug) ?? { slug, category: data.category };
      post[lang] = { title: data.title, date: data.date, draft: data.draft === true };
      posts.set(slug, post);
    }
  }
  const list = [...posts.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  return { content: [{ type: 'text', text: list.length ? JSON.stringify(list, null, 2) : 'No posts yet.' }] };
});

await server.connect(new StdioServerTransport());
console.error(`wzj-blog-posts MCP server ready, writing to ${root}`);
