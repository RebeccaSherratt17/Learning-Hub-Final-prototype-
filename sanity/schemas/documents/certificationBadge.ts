import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'certificationBadge',
  title: 'Certification Badge',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Certification Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Badge Image',
      type: 'image',
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'url',
      title: 'Destination URL',
      type: 'url',
      description: 'Link to the Diligent certification page. Leave blank if URL is TBC.',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      url: 'url',
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepare({ title, media, url }: { title: string; media: any; url?: string }) {
      return {
        title,
        subtitle: url || 'URL not set',
        media,
      }
    },
  },
})
