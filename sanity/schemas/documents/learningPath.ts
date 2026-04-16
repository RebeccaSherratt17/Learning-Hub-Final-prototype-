import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'learningPath',
  title: 'Learning Path',
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
      name: 'items',
      title: 'Content Items',
      type: 'array',
      description: 'Ordered list of content items in this learning path. Drag to reorder.',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'course' },
            { type: 'template' },
            { type: 'video' },
          ],
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'estimatedCompletionTime',
      title: 'Estimated Completion Time',
      type: 'string',
      description: 'e.g. "3 hours", "2 days"',
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
      initialValue: 'free',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'credlyBadgeId',
      title: 'Credly Badge Template ID',
      type: 'string',
      description: 'Optional. If set, learners who complete all items will be awarded this Credly badge. Set up the badge template in the Credly dashboard first.',
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
      validation: (rule) =>
        rule.custom(async (isArchived, context) => {
          if (!isArchived) return true

          const client = context.getClient({ apiVersion: '2024-06-01' })
          const docId = (context.document?._id || '').replace('drafts.', '')
          const referencingPaths = await client.fetch(
            `count(*[_type == "learningPath" && _id != $docId && references($docId)])`,
            { docId }
          )

          if (referencingPaths > 0) {
            return `This learning path is referenced by ${referencingPaths} other document(s). Archiving may affect those references.`
          }
          return true
        }),
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
      item0: 'items.0._ref',
      item1: 'items.1._ref',
      item2: 'items.2._ref',
    },
    prepare({ title, media, archived, item0, item1, item2 }) {
      const itemCount = [item0, item1, item2].filter(Boolean).length
      const suffix = itemCount === 3 ? '3+ items' : `${itemCount} item(s)`
      return {
        title,
        subtitle: archived ? `Archived | ${suffix}` : `Learning Path | ${suffix}`,
        media,
      }
    },
  },
})
