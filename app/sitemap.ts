import type { MetadataRoute } from 'next';
import { client } from '../src/sanity/client';
import { SITEMAP_POSTS_QUERY } from '../src/blog/queries';
import type { SitemapPost } from '../src/blog/types';
import { STATIC_URLS } from '../src/blog/site-constants';
import { SITE } from '../src/blog/util';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = (await client.fetch(SITEMAP_POSTS_QUERY, {}, { stega: false })) as SitemapPost[];
  const newest = posts.map((p) => p.lastModified.slice(0, 10)).sort().at(-1);
  return [
    ...STATIC_URLS.map((u) => ({ url: `${SITE}${u.path}`, lastModified: u.lastModified, changeFrequency: u.changeFrequency, priority: u.priority })),
    { url: `${SITE}/blog/`, lastModified: newest, changeFrequency: 'weekly' as const, priority: 0.8 },
    ...posts.map((p) => ({ url: `${SITE}/blog/${p.slug}.html`, lastModified: p.lastModified.slice(0, 10), changeFrequency: 'monthly' as const, priority: 0.75 })),
  ];
}
