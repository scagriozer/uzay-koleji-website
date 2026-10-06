import { defineArrayMember, defineField, defineType } from 'sanity';

export const ctaBox = defineType({
  name: 'ctaBox',
  title: 'Çağrı kutusu',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Başlık', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'text', title: 'Metin', type: 'text', rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: 'buttons',
      title: 'Düğmeler',
      type: 'array',
      validation: (rule) => rule.required().min(1).max(3),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'button',
          fields: [
            defineField({ name: 'label', title: 'Etiket', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'href', title: 'URL', type: 'string', validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: 'label', subtitle: 'href' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title: `Çağrı kutusu: ${title}` }) },
});
