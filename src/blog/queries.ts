import { defineQuery } from 'next-sanity';

export const POST_SLUGS_QUERY = defineQuery(`*[_type == "post" && defined(slug.current)].slug.current`);

export const POST_QUERY = defineQuery(`*[_type == "post" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, excerpt, seoDescription, tldr, tag, footerNote, readingMinutes,
  publishedAt, updatedAt, breadcrumbName, seoTitle, ogTitle, ogDescription, body
}`);

export const POST_LIST_QUERY = defineQuery(`*[_type == "post" && defined(slug.current)] | order(publishedAt desc, title asc){
  _id, title, "slug": slug.current, tag, excerpt, publishedAt, readingMinutes
}`);

export const SITEMAP_POSTS_QUERY = defineQuery(`*[_type == "post" && defined(slug.current)]{
  "slug": slug.current, "lastModified": coalesce(updatedAt, publishedAt, _updatedAt)
}`);
