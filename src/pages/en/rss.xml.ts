import type { APIContext } from 'astro';
import { feed } from '../../lib/feed';

export const GET = (context: APIContext) => feed('en', context);
