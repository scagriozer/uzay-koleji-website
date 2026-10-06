import { defineArrayMember, defineField, defineType } from 'sanity';

const noEmDash = (value?: string) => (value && value.includes('—') ? 'Em-dash kullanılamaz' : true);

export const post = defineType({
  name: 'post',
  title: 'Blog Yazısı',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Başlık', type: 'string', validation: (rule) => rule.required().max(70).custom(noEmDash) }),
    defineField({
      name: 'slug',
      title: 'Adres (slug)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'excerpt', title: 'Özet (meta description)', type: 'text', rows: 3, validation: (rule) => rule.required().max(160).custom(noEmDash) }),
    defineField({ name: 'tldr', title: 'Kısaca (TL;DR kutusu)', type: 'text', rows: 3 }),
    defineField({ name: 'tag', title: 'Etiket', type: 'string' }),
    defineField({ name: 'readingMinutes', title: 'Okuma süresi (dk)', type: 'number', validation: (rule) => rule.required().integer().min(1) }),
    defineField({ name: 'publishedAt', title: 'Yayın tarihi', type: 'datetime', validation: (rule) => rule.required() }),
    defineField({ name: 'updatedAt', title: 'Güncelleme tarihi', type: 'datetime' }),
    defineField({ name: 'seoTitle', title: 'SEO başlığı (boşsa başlık kullanılır)', type: 'string', validation: (rule) => rule.custom(noEmDash) }),
    defineField({ name: 'coverImage', title: 'Kapak görseli', type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'alt', title: 'Alt metin', type: 'string' })] }),
    defineField({
      name: 'body',
      title: 'İçerik',
      type: 'array',
      validation: (rule) => rule.required(),
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Paragraf', value: 'normal' },
            { title: 'Başlık 2', value: 'h2' },
            { title: 'Başlık 3', value: 'h3' },
          ],
          lists: [
            { title: 'Madde işaretli', value: 'bullet' },
            { title: 'Numaralı', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Kalın', value: 'strong' },
              { title: 'İtalik', value: 'em' },
            ],
            annotations: [
              defineArrayMember({
                name: 'link',
                type: 'object',
                title: 'Bağlantı',
                fields: [defineField({ name: 'href', title: 'URL', type: 'string', validation: (rule) => rule.required() })],
              }),
            ],
          },
        }),
        defineArrayMember({ type: 'table' }),
      ],
    }),
    defineField({
      name: 'faq',
      title: 'Sık sorulan sorular',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({ name: 'question', title: 'Soru', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'answer', title: 'Cevap', type: 'text', rows: 3, validation: (rule) => rule.required() }),
            defineField({ name: 'inJsonLd', title: 'JSON-LD içinde yer alsın', type: 'boolean', initialValue: true }),
          ],
          preview: { select: { title: 'question' } },
        }),
      ],
    }),
  ],
  orderings: [{ title: 'Yayın tarihi (yeni önce)', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'publishedAt' } },
});
