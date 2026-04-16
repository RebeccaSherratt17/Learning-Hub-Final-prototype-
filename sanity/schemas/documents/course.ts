import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'course',
  title: 'Course',
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
      description: 'Automatically stored when the slug is changed, used for redirects.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'scormCourseId',
      title: 'SCORM Cloud Course ID',
      type: 'string',
      description: 'The course ID from SCORM Cloud. The course file is uploaded via the SCORM Cloud dashboard, not via Sanity.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Recommended: 1200x675px (16:9 aspect ratio). Use the hotspot tool to set the focal point.',
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
      name: 'author',
      title: 'Author',
      type: 'string',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      description: 'Set a future date to schedule publication. Content will not be visible until this date.',
    }),
    defineField({
      name: 'estimatedDuration',
      title: 'Estimated Duration',
      type: 'string',
      description: 'e.g. "45 minutes", "1.5 hours"',
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
      name: 'restricted',
      title: 'Restrict Access',
      type: 'boolean',
      description: 'Restrict access to specific learners via a token URL. Restricted courses are hidden from the public library.',
      initialValue: false,
    }),
    defineField({
      name: 'accessToken',
      title: 'Access Token',
      type: 'string',
      readOnly: true,
      description: 'Generated via the "Generate Token" action. Share the token URL with intended learners.',
      hidden: ({ document }) => !document?.restricted,
    }),
    defineField({
      name: 'restrictedAccessNote',
      title: 'Restricted Access Note',
      type: 'text',
      rows: 2,
      description: 'Internal note: who is this course for? (e.g. "Acme Corp board directors"). Not shown publicly.',
      hidden: ({ document }) => !document?.restricted,
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      description: 'Archived courses are removed from the public hub but remain in Studio.',
      initialValue: false,
      validation: (rule) =>
        rule.custom(async (isArchived, context) => {
          if (!isArchived) return true

          const client = context.getClient({ apiVersion: '2024-06-01' })
          const docId = (context.document?._id || '').replace('drafts.', '')
          const count = await client.fetch(
            `count(*[_type == "learningPath" && references($docId)])`,
            { docId }
          )

          if (count > 0) {
            return `Warning: this course is included in ${count} learning path(s). Archiving it will affect those paths.`
          }
          return true
        }).warning(),
    }),
    defineField({
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description: 'Automatically incremented on page load. Used for popularity sorting.',
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Meta Title',
      type: 'string',
      description: 'Overrides the display title for search engines. Leave blank to use the content title.',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Meta Description',
      type: 'text',
      rows: 3,
      description: 'Overrides the display description for search engines.',
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      description: 'Image displayed when this page is shared on social media. Falls back to thumbnail if not set.',
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
      restricted: 'restricted',
    },
    prepare({ title, media, archived, restricted }) {
      const subtitles: string[] = []
      if (archived) subtitles.push('Archived')
      if (restricted) subtitles.push('Restricted')
      return {
        title,
        subtitle: subtitles.join(' | ') || 'Course',
        media,
      }
    },
  },
})
