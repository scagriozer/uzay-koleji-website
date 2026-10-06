import { defineArrayMember, defineField, defineType } from 'sanity';

const noEmDash = (value?: string) => (value && value.includes('—') ? 'Em-dash kullanılamaz' : true);

export const post = defineType({
  name: 'post',
  title: 'Blog Yazısı',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Başlık (H1)', type: 'string', validation: (rule) => rule.required().custom(noEmDash) }),
    defineField({
      name: 'slug',
      title: 'Adres (slug)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'excerpt', title: 'Liste kartı özeti', type: 'text', rows: 3, validation: (rule) => rule.required().custom(noEmDash) }),
    defineField({ name: 'seoDescription', title: 'Meta açıklaması (Google sonucu ve JSON-LD)', type: 'text', rows: 3, validation: (rule) => rule.required().max(160).custom(noEmDash) }),
    defineField({ name: 'tldr', title: 'Kısaca (TL;DR kutusu)', type: 'text', rows: 3 }),
    defineField({ name: 'footerNote', title: 'Yazı sonu notu (boşsa standart bilgilendirme notu)', type: 'text', rows: 2 }),
    defineField({ name: 'tag', title: 'Etiket', type: 'string' }),
    defineField({ name: 'readingMinutes', title: 'Okuma süresi (dk)', type: 'number', validation: (rule) => rule.required().integer().min(1) }),
    defineField({ name: 'publishedAt', title: 'Yayın tarihi', type: 'date', validation: (rule) => rule.required() }),
    defineField({ name: 'updatedAt', title: 'Güncelleme tarihi', type: 'date' }),
    defineField({ name: 'breadcrumbName', title: 'Kırıntı adı (boşsa başlık kullanılır)', type: 'string', validation: (rule) => rule.custom(noEmDash) }),
    defineField({ name: 'seoTitle', title: 'SEO başlığı (title etiketi; " | Uzay Koleji" otomatik eklenir, boşsa başlık)', type: 'string', validation: (rule) => rule.custom(noEmDash) }),
    defineField({ name: 'ogTitle', title: 'Sosyal paylaşım başlığı (boşsa SEO başlığı)', type: 'string', validation: (rule) => rule.custom(noEmDash) }),
    defineField({ name: 'ogDescription', title: 'Sosyal paylaşım açıklaması (boşsa meta açıklaması)', type: 'text', rows: 2, validation: (rule) => rule.custom(noEmDash) }),
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
                name: 'anchor',
                type: 'object',
                title: 'Başlık bağlantı kimliği',
                fields: [defineField({ name: 'id', title: 'Kimlik (içindekiler bağlantısı)', type: 'string', validation: (rule) => rule.required().regex(/^[a-z0-9-]+$/) })],
              }),
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
        defineArrayMember({ type: 'ctaBox' }),
        defineArrayMember({ type: 'faqList' }),
      ],
    }),
  ],
  orderings: [{ title: 'Yayın tarihi (yeni önce)', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'publishedAt' } },
});
