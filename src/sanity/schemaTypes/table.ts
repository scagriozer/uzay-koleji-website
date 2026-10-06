import { defineArrayMember, defineField, defineType } from 'sanity';

export const table = defineType({
  name: 'table',
  title: 'Tablo',
  type: 'object',
  fields: [
    defineField({ name: 'caption', title: 'Başlık', type: 'string' }),
    defineField({
      name: 'rows',
      title: 'Satırlar',
      type: 'array',
      validation: (rule) => rule.required().min(2),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'row',
          fields: [
            defineField({
              name: 'cells',
              title: 'Hücreler',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              validation: (rule) => rule.required().min(1),
            }),
          ],
          preview: { select: { cells: 'cells' }, prepare: ({ cells }) => ({ title: (cells ?? []).join(' | ') }) },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'caption' }, prepare: ({ title }) => ({ title: title || 'Tablo' }) },
});
