import type { BodyBlock } from './PortableBody';

export type PostFull = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  seoDescription: string;
  tldr: string;
  tag: string;
  footerNote?: string | null;
  readingMinutes: number;
  publishedAt: string;
  updatedAt?: string | null;
  breadcrumbName?: string | null;
  seoTitle?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  body: BodyBlock[];
};

export type PostListItem = Pick<PostFull, '_id' | 'title' | 'slug' | 'tag' | 'excerpt' | 'publishedAt' | 'readingMinutes'>;
export type SitemapPost = { slug: string; lastModified: string };
