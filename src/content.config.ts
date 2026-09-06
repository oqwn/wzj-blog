import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/posts' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().default(''),
    date: z.coerce.date(),
    // Pages CMS writes an empty string when the optional date is cleared.
    updated: z.preprocess((value) => value === '' || value === null ? undefined : value, z.coerce.date().optional()),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
