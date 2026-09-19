import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { categories } from './lib/i18n';

// content/posts/zh/<slug>.md and content/posts/en/<slug>.md are the two
// language versions of one article; the shared filename pairs them.
const posts = defineCollection({
  loader: glob({ pattern: '{zh,en}/**/*.md', base: './content/posts' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().default(''),
    category: z.enum(categories),
    date: z.coerce.date(),
    // An empty value means the post has not been updated.
    updated: z.preprocess((value) => value === '' || value === null ? undefined : value, z.coerce.date().optional()),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
