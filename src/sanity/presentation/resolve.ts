import { defineDocuments, defineLocations, type PresentationPluginOptions } from 'sanity/presentation';

export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    {
      route: '/blog/:slug.html',
      filter: `_type == "post" && slug.current == $slug`,
    },
  ]),
  locations: {
    post: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [
          { title: doc?.title || 'Başlıksız', href: `/blog/${doc?.slug}.html` },
          { title: 'Blog listesi', href: '/blog/' },
        ],
      }),
    }),
  },
};
