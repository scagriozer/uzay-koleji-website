import { stegaClean } from 'next-sanity';
import { blockText } from './PortableBody';
import type { PostFull } from './types';
import { SITE } from './util';

export function postJsonLd(post: PostFull) {
  const url = `${SITE}/blog/${post.slug}.html`;
  const faq = post.body.flatMap((b) => (b._type === 'faqList' ? b.items.filter((i) => i.inJsonLd) : []));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: post.title,
        description: post.seoDescription,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        author: { '@type': 'Organization', name: 'Uzay Koleji Editör Ekibi' },
        publisher: {
          '@type': 'EducationalOrganization',
          name: 'Uzay Koleji',
          url: SITE,
          logo: { '@type': 'ImageObject', url: `${SITE}/assets/icon-512.png`, width: 512, height: 512 },
        },
        mainEntityOfPage: url,
        inLanguage: 'tr-TR',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
          { '@type': 'ListItem', position: 3, name: post.breadcrumbName || post.title, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((i) => ({
          '@type': 'Question',
          name: i.question,
          acceptedAnswer: { '@type': 'Answer', text: i.jsonLdAnswer || i.answer.map(blockText).join(' ') },
        })),
      },
    ],
  };
}

export const blogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Uzay Koleji Blog',
  url: `${SITE}/blog/`,
  publisher: { '@type': 'EducationalOrganization', name: 'Uzay Koleji', url: SITE },
  description: "Adana'da mesleki lise, devlet destekli özel eğitim ve mesleki kariyer rehberleri.",
};

// JSON-LD her zaman stega'sız
export const ldScript = (data: unknown) => JSON.stringify(JSON.parse(stegaClean(JSON.stringify(data)))).replace(/</g, '\\u003c');
