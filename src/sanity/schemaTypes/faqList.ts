import { defineArrayMember, defineField, defineType } from 'sanity';

export const faqList = defineType({
  name: 'faqList',
  title: 'Sık sorulan sorular',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      title: 'Sorular',
      type: 'array',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({ name: 'question', title: 'Soru', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'answer',
              title: 'Cevap',
              type: 'array',
              validation: (rule) => rule.required().min(1),
              of: [
                defineArrayMember({
                  type: 'block',
                  styles: [{ title: 'Paragraf', value: 'normal' }],
                  lists: [],
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
              ],
            }),
            defineField({ name: 'onPage', title: 'Sayfada görünsün', type: 'boolean', initialValue: true }),
            defineField({ name: 'inJsonLd', title: 'Google yapılandırılmış verisinde (JSON-LD) yer alsın', type: 'boolean', initialValue: true }),
            defineField({
              name: 'jsonLdAnswer',
              title: 'JSON-LD için kısa cevap (boşsa görünür cevap düz metin olarak kullanılır)',
              type: 'text',
              rows: 3,
              hidden: ({ parent }) => !parent?.inJsonLd,
            }),
          ],
          preview: { select: { title: 'question' } },
        }),
      ],
    }),
  ],
  preview: { select: { items: 'items' }, prepare: ({ items }) => ({ title: `Sık sorulan sorular (${items?.length ?? 0})` }) },
});
