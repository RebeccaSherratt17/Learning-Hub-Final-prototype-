import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'template',
  title: 'Template',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
      description: 'URL-friendly identifier. Changing this will break existing links unless a redirect is set up.',
    }),
    defineField({
      name: 'previousSlug',
      title: 'Previous Slug',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'file',
      title: 'Downloadable File',
      type: 'file',
      description: 'Upload the template file (.docx, .xlsx, or .pdf)',
      options: {
        accept: '.docx,.xlsx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Recommended: 1200x675px (16:9 aspect ratio).',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required().warning('Alt text is required for accessibility.'),
        }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
    }),
    defineField({
      name: 'accessTier',
      title: 'Access Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Free', value: 'free' },
          { title: 'Gated', value: 'gated' },
          { title: 'Premium', value: 'premium' },
        ],
        layout: 'radio',
      },
      initialValue: 'gated',
      description: 'Templates are gated by default — a lead form is shown before download.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subjects',
      title: 'Subject Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'subject' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'personas',
      title: 'Persona Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'persona' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'regions',
      title: 'Region Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'region' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'relatedItems',
      title: 'Related Items',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'course' },
            { type: 'template' },
            { type: 'video' },
            { type: 'learningPath' },
          ],
        },
      ],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      readOnly: true,
      initialValue: 0,
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Meta Title',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Meta Description',
      type: 'text',
      rows: 3,
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      group: 'seo',
    }),
  ],
  groups: [
    { name: 'seo', title: 'SEO', default: false },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'thumbnail',
      archived: 'archived',
    },
    prepare({ title, media, archived }) {
      return {
        title,
        subtitle: archived ? 'Archived' : 'Template',
        media,
      }
    },
  },
})
